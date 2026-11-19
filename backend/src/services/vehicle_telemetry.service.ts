import type { VehicleTelemetry } from "../../../shared/types/vehicle_telemetry.type.js";
import { NotFoundError } from "../utils/errors.js";
import { VehicleRepository } from "../repositories/vehicle.repository.js";
import {
  isForeignKeyViolation,
  type VehicleTelemetryRow,
  VehicleTelemetryRepository,
} from "../repositories/vehicle_telemetry.repository.js";

export class VehicleTelemetryService {
  constructor(
    private readonly repository: VehicleTelemetryRepository,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async history(
    vehicleId: number,
    from: Date,
    to: Date,
    limit: number,
    offset: number,
  ): Promise<{ items: VehicleTelemetryRow[]; total: number }> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new NotFoundError("Vehicle not found.");
    const [items, total] = await Promise.all([
      this.repository.findHistory(vehicleId, from, to, limit, offset),
      this.repository.countHistory(vehicleId, from, to),
    ]);
    return { items, total };
  }

  async record(telemetry: VehicleTelemetry): Promise<void> {
    try {
      await this.repository.insert(telemetry);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        console.warn(`skipping telemetry for unknown vehicle ${telemetry.vehicle_id}`);
        return;
      }
      throw err; // kafkajs retries the message
    }
    await this.repository.cacheLatest(telemetry);
  }
}
