import { Kafka, Partitioners } from "kafkajs";
import type { Vehicle } from "../shared/types/vehicle.type.ts";
import type { VehicleTelemetry } from "../shared/types/vehicle_telemetry.type.ts";
import { DEPOTS, KAFKA_CLIENT_ID, MAX_SPEED, TELEMETRY_TOPIC } from "./constants.ts";
import { env } from "./env.ts";

interface Position {
  lat: number;
  lon: number;
  heading: number; // degrees, 0 = north
  speed: number; // km/h
}

const positions = new Map<number, Position>();

function nextPosition(vehicleId: number): Position {
  const depot = DEPOTS[(vehicleId - 1) % DEPOTS.length];
  const prev = positions.get(vehicleId) ?? { ...depot, heading: Math.random() * 360, speed: 0 };

  const speed = Math.min(MAX_SPEED, Math.max(0, prev.speed + (Math.random() - 0.5) * 20));
  const heading = (prev.heading + (Math.random() - 0.5) * 40 + 360) % 360;
  const km = (speed * env.INTERVAL_MS) / 3_600_000;
  const rad = (heading * Math.PI) / 180;
  // One degree of latitude is about 111 km; a degree of longitude shrinks with cos(latitude).
  const lat = prev.lat + (km * Math.cos(rad)) / 111;
  const lon = prev.lon + (km * Math.sin(rad)) / (111 * Math.cos((prev.lat * Math.PI) / 180));

  const next = { lat, lon, heading, speed };
  positions.set(vehicleId, next);
  return next;
}

// Reload vehicles each tick to catch any added or removed in the UI.
async function fetchVehicleIds(): Promise<number[]> {
  const res = await fetch(`${env.BACKEND_URL}/api/vehicles`);
  if (!res.ok) {
    throw new Error(`GET /api/vehicles returned ${res.status}`);
  }
  const vehicles: Vehicle[] = await res.json();
  return vehicles.map((vehicle) => vehicle.id);
}

const kafka = new Kafka({ clientId: KAFKA_CLIENT_ID, brokers: env.KAFKA_BROKERS.split(",") });
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

async function tick(): Promise<void> {
  const ts = new Date().toISOString();
  const messages = (await fetchVehicleIds()).map((vehicleId) => {
    const { lat, lon, speed } = nextPosition(vehicleId);
    const telemetry: VehicleTelemetry = {
      vehicle_id: vehicleId,
      ts,
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      speed: Number(speed.toFixed(1)),
    };
    // Keyed by vehicle so its messages stay in order.
    return { key: String(vehicleId), value: JSON.stringify(telemetry) };
  });
  if (messages.length > 0) {
    await producer.send({ topic: TELEMETRY_TOPIC, messages });
  }
  console.log(`published ${messages.length} telemetry messages`);
}

await producer.connect();
console.log(`publishing to ${TELEMETRY_TOPIC} every ${env.INTERVAL_MS}ms`);

// setTimeout waits for each run to finish. setInterval doesn't.
async function loop(): Promise<void> {
  try {
    await tick();
  } catch (err) {
    console.warn("tick failed:", (err as Error).message);
  }
  setTimeout(loop, env.INTERVAL_MS);
}
loop();

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, async () => {
    await producer.disconnect();
    process.exit(0);
  });
}
