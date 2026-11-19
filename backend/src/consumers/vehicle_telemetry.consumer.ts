import { type Consumer, Kafka } from "kafkajs";
import { z } from "zod";
import type { VehicleTelemetry } from "../../../shared/types/vehicle_telemetry.type.js";
import { env } from "../config/env.js";
import { CONSUMER_GROUP, KAFKA_CLIENT_ID, TELEMETRY_TOPIC } from "../utils/constants.js";
import type { VehicleTelemetryService } from "../services/vehicle_telemetry.service.js";

export class VehicleTelemetryConsumer {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;

  constructor(private readonly service: VehicleTelemetryService) {
    this.kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS.split(","),
    });
    this.consumer = this.kafka.consumer({ groupId: CONSUMER_GROUP });
  }

  async start(): Promise<void> {
    // subscribe() fails if the topic doesn't exist yet.
    const admin = this.kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: TELEMETRY_TOPIC }] });
    await admin.disconnect();

    await this.consumer.connect();
    // A new group otherwise starts at the latest offset and loses messages sent before it joined.
    await this.consumer.subscribe({ topic: TELEMETRY_TOPIC, fromBeginning: true });
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

// A message Postgres rejects would be retried forever and block the partition, so check it here.
const telemetrySchema = z.object({
  vehicle_id: z.int32().positive(),
  ts: z.iso.datetime({ offset: true }).transform((ts) => new Date(ts).toISOString()),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speed: z.number().nonnegative(),
});

export function parseTelemetry(value: Buffer | null): VehicleTelemetry | null {
  try {
    const result = telemetrySchema.safeParse(JSON.parse(String(value)));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
