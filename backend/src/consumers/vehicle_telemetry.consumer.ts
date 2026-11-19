import { type Consumer, Kafka } from "kafkajs";
import type { VehicleTelemetry } from "../../../shared/types/vehicle_telemetry.type.js";
import { env } from "../config/env.js";
import { MAX_ID } from "../utils/constants.js";
import { VehicleTelemetryService } from "../services/vehicle_telemetry.service.js";

const TOPIC = "vehicle_telemetry";
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export class VehicleTelemetryConsumer {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;

  constructor(private readonly service: VehicleTelemetryService) {
    this.kafka = new Kafka({
      clientId: "manage_vehicle_backend",
      brokers: env.KAFKA_BROKERS.split(","),
    });
    this.consumer = this.kafka.consumer({ groupId: "manage_vehicle_backend" });
  }

  async start(): Promise<void> {
    // Subscribing fails if the topic is missing, and the backend can start before the generator publishes.
    const admin = this.kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: TOPIC }] });
    await admin.disconnect();

    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPIC });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const telemetry = parseTelemetry(message.value);
        if (!telemetry) {
          console.warn("skipping invalid telemetry message", String(message.value));
          return;
        }
        await this.service.record(telemetry);
      },
    });
  }

  stop(): Promise<void> {
    return this.consumer.disconnect();
  }
}

// A message Postgres rejects would be retried forever and block its partition, so validate everything the DB checks.
function parseTelemetry(value: Buffer | null): VehicleTelemetry | null {
  try {
    const { vehicle_id, ts, lat, lon, speed } = JSON.parse(String(value));
    // ISO 8601 only: Date.parse also accepts loose strings like "1" (read as the year 2001).
    const time = typeof ts === "string" && ISO_DATE_TIME.test(ts) ? Date.parse(ts) : NaN;
    if (
      Number.isInteger(vehicle_id) &&
      vehicle_id >= 1 &&
      vehicle_id <= MAX_ID &&
      !Number.isNaN(time) &&
      Number.isFinite(lat) &&
      Math.abs(lat) <= 90 &&
      Number.isFinite(lon) &&
      Math.abs(lon) <= 180 &&
      Number.isFinite(speed) &&
      speed >= 0
    ) {
      // Normalised to UTC so Postgres and the Redis cache store the same string.
      return { vehicle_id, ts: new Date(time).toISOString(), lat, lon, speed };
    }
  } catch {
    // not JSON; fall through
  }
  return null;
}
