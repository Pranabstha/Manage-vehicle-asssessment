import type { VehicleTelemetry } from "../../../shared/types/vehicle_telemetry.type.js";
import db from "../config/db.js";
import redis from "../config/redis.js";

const LATEST_KEY = "vehicle_latest_telemetry";
const FOREIGN_KEY_VIOLATION = "23503";

export function isForeignKeyViolation(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === FOREIGN_KEY_VIOLATION;
}

export class VehicleTelemetryRepository {
  async insert(telemetry: VehicleTelemetry): Promise<void> {
    await db("vehicle_telemetry")
      .insert(telemetry)
      .onConflict(["vehicle_id", "ts"])
      .ignore();
  }

  // ponytail: last write wins; relies on the producer keying messages by vehicle_id so Kafka keeps per-vehicle order.
  async cacheLatest(telemetry: VehicleTelemetry): Promise<void> {
    await redis.hSet(
      LATEST_KEY,
      String(telemetry.vehicle_id),
      JSON.stringify(telemetry),
    );
  }
}
