import type { VehicleTelemetry } from "../../../shared/types/vehicle_telemetry.type.js";
import db from "../config/db.js";
import redis from "../config/redis.js";
import { FOREIGN_KEY_VIOLATION, LATEST_TELEMETRY_KEY } from "../utils/constants.js";

export function isForeignKeyViolation(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === FOREIGN_KEY_VIOLATION;
}

export interface VehicleTelemetryRow extends Omit<VehicleTelemetry, "ts"> {
  ts: Date;
}

export class VehicleTelemetryRepository {
  async insert(telemetry: VehicleTelemetry): Promise<void> {
    await db("vehicle_telemetry")
      .insert(telemetry)
      .onConflict(["vehicle_id", "ts"])
      .ignore();
  }

  // Last write wins. Safe only while the producer keys messages by vehicle_id, so each vehicle stays in order.
  async cacheLatest(telemetry: VehicleTelemetry): Promise<void> {
    await redis.hSet(
      LATEST_TELEMETRY_KEY,
      String(telemetry.vehicle_id),
      JSON.stringify(telemetry),
    );
  }

  // ts is unique per vehicle (primary key), so the order is stable and offset pages don't overlap.
  findHistory(
    vehicleId: number,
    from: Date,
    to: Date,
    limit: number,
    offset: number,
  ): Promise<VehicleTelemetryRow[]> {
    return historyQuery(vehicleId, from, to)
      .orderBy("ts", "desc")
      .limit(limit)
      .offset(offset);
  }

  async countHistory(vehicleId: number, from: Date, to: Date): Promise<number> {
    const result = await historyQuery(vehicleId, from, to).count({ count: "*" }).first();
    // pg returns count(*) as a string because it is a bigint.
    return Number(result?.count ?? 0);
  }

  async findAllLatest(): Promise<Map<number, VehicleTelemetry>> {
    const hash = await redis.hGetAll(LATEST_TELEMETRY_KEY);
    return new Map(
      Object.entries(hash).map(([id, json]) => [Number(id), JSON.parse(json)]),
    );
  }

  async deleteLatest(vehicleId: number): Promise<void> {
    await redis.hDel(LATEST_TELEMETRY_KEY, String(vehicleId));
  }
}

function historyQuery(vehicleId: number, from: Date, to: Date) {
  return db<VehicleTelemetryRow>("vehicle_telemetry")
    .where("vehicle_id", vehicleId)
    .whereBetween("ts", [from, to]);
}
