import type {
  Vehicle,
  VehicleInput,
} from "../../../shared/types/vehicle.type.js";
import db from "../config/db.js";

// pg returns TIMESTAMPTZ as Date; res.json() turns it into the ISO string the shared Vehicle type describes.
export interface VehicleRow extends Omit<Vehicle, "created_at"> {
  created_at: Date;
}

const UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === UNIQUE_VIOLATION;
}

export class VehicleRepository {
  findAll(): Promise<VehicleRow[]> {
    return db<VehicleRow>("vehicles").orderBy("id");
  }

  findById(id: number): Promise<VehicleRow | undefined> {
    return db<VehicleRow>("vehicles").where({ id }).first();
  }

  async create(input: VehicleInput): Promise<VehicleRow> {
    const [vehicle] = await db<VehicleRow>("vehicles")
      .insert(input)
      .returning("*");
    return vehicle;
  }

  async update(id: number, input: VehicleInput): Promise<VehicleRow | undefined> {
    const [vehicle] = await db<VehicleRow>("vehicles")
      .where({ id })
      .update(input)
      .returning("*");
    return vehicle;
  }

  async delete(id: number): Promise<boolean> {
    const deletedCount = await db<VehicleRow>("vehicles").where({ id }).delete();
    return deletedCount === 1;
  }
}
