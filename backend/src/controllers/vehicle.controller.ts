import type { Request, Response } from "express";
import { z } from "zod";
import { BadRequestError, ValidationFailedError } from "../utils/errors.js";
import type { VehicleInput } from "../../../shared/types/vehicle.type.js";
import { MAX_NAME_LENGTH, MAX_REGISTRATION_LENGTH } from "../../../shared/limits.js";
import type { VehicleService } from "../services/vehicle.service.js";

export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  list = async (_req: Request, res: Response) => {
    res.json(await this.service.list());
  };

  get = async (req: Request<{ id: string }>, res: Response) => {
    res.json(await this.service.get(parseId(req.params.id)));
  };

  create = async (req: Request, res: Response) => {
    const vehicle = await this.service.create(parseVehicleInput(req.body));
    res.status(201).json(vehicle);
  };

  update = async (req: Request<{ id: string }>, res: Response) => {
    const vehicle = await this.service.update(
      parseId(req.params.id),
      parseVehicleInput(req.body),
    );
    res.json(vehicle);
  };

  delete = async (req: Request<{ id: string }>, res: Response) => {
    await this.service.delete(parseId(req.params.id));
    res.status(204).end();
  };
}

const idSchema = z.string().regex(/^\d+$/).transform(Number).pipe(z.int32().positive());

const vehicleInputSchema = z.object({
  registration: z
    .string({ error: "registration is required" })
    .trim()
    .min(1, "registration is required")
    .max(MAX_REGISTRATION_LENGTH, `registration must be at most ${MAX_REGISTRATION_LENGTH} characters`)
    .toUpperCase(),
  name: z
    .string({ error: "name is required" })
    .trim()
    .min(1, "name is required")
    .max(MAX_NAME_LENGTH, `name must be at most ${MAX_NAME_LENGTH} characters`),
});

export function parseId(value: string): number {
  const result = idSchema.safeParse(value);
  if (!result.success) {
    throw new BadRequestError("Vehicle id must be a positive integer.");
  }
  return result.data;
}

export function parseVehicleInput(body: unknown): VehicleInput {
  const result = vehicleInputSchema.safeParse(body ?? {});
  if (!result.success) {
    throw new ValidationFailedError(z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}
