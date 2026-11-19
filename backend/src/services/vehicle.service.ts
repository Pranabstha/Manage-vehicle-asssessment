import { NotFoundError, ValidationFailedError } from "../utils/errors.js";
import type { VehicleInput } from "../../../shared/types/vehicle.type.js";
import type { VehicleTelemetry } from "../../../shared/types/vehicle_telemetry.type.js";
import {
  isUniqueViolation,
  type VehicleRow,
  VehicleRepository,
} from "../repositories/vehicle.repository.js";
import { VehicleTelemetryRepository } from "../repositories/vehicle_telemetry.repository.js";

type VehicleWithTelemetryRow = VehicleRow & { latest_telemetry: VehicleTelemetry | null };

export class VehicleService {
  constructor(
    private readonly repository: VehicleRepository,
    private readonly telemetryRepository: VehicleTelemetryRepository,
  ) {}

  async list(): Promise<VehicleWithTelemetryRow[]> {
    const [vehicles, latest] = await Promise.all([
      this.repository.findAll(),
      this.telemetryRepository.findAllLatest(),
    ]);
    return vehicles.map((vehicle) => ({
      ...vehicle,
      latest_telemetry: latest.get(vehicle.id) ?? null,
    }));
  }

  async get(id: number): Promise<VehicleRow> {
    const vehicle = await this.repository.findById(id);
    if (!vehicle) throw new NotFoundError("Vehicle not found.");
    return vehicle;
  }

  async create(input: VehicleInput): Promise<VehicleRow> {
    try {
      return await this.repository.create(input);
    } catch (err) {
      throw toDuplicateError(err);
    }
  }

  async update(id: number, input: VehicleInput): Promise<VehicleRow> {
    let vehicle: VehicleRow | undefined;
    try {
      vehicle = await this.repository.update(id, input);
    } catch (err) {
      throw toDuplicateError(err);
    }
    if (!vehicle) throw new NotFoundError("Vehicle not found.");
    return vehicle;
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError("Vehicle not found.");
    // The FK cascade clears Postgres history but not Redis.
    await this.telemetryRepository.deleteLatest(id);
  }
}

function toDuplicateError(err: unknown): unknown {
  if (isUniqueViolation(err)) {
    return new ValidationFailedError({
      registration: ["registration already used"],
    });
  }
  return err;
}
