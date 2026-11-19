import type { VehicleTelemetry } from "../../../shared/types/vehicle_telemetry.type.js";
import {
  isForeignKeyViolation,
  VehicleTelemetryRepository,
} from "../repositories/vehicle_telemetry.repository.js";

export class VehicleTelemetryService {
  constructor(private readonly repository: VehicleTelemetryRepository) {}

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
