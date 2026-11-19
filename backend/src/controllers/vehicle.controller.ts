import type { Request, Response } from "express";
import {
  BadRequestError,
  type ExtractedErrorsType,
  ValidationFailedError,
} from "../utils/errors.js";
import type { VehicleInput } from "../../../shared/types/vehicle.type.js";
import { MAX_ID } from "../utils/constants.js";
import { VehicleService } from "../services/vehicle.service.js";

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

const MAX_REGISTRATION_LENGTH = 20;
const MAX_NAME_LENGTH = 100;

function parseId(value: string): number {
  const id = Number(value);
  if (!/^\d+$/.test(value) || id < 1 || id > MAX_ID) {
    throw new BadRequestError("Vehicle id must be a positive integer.");
  }
  return id;
}

function parseVehicleInput(body: unknown): VehicleInput {
  const { registration, name } = (body ?? {}) as Record<string, unknown>;
  const errors: ExtractedErrorsType = {};

  if (typeof registration !== "string" || registration.trim() === "") {
    errors.registration = ["registration is required"];
  } else if (registration.trim().length > MAX_REGISTRATION_LENGTH) {
    errors.registration = [
      `registration must be at most ${MAX_REGISTRATION_LENGTH} characters`,
    ];
  }
  if (typeof name !== "string" || name.trim() === "") {
    errors.name = ["name is required"];
  } else if (name.trim().length > MAX_NAME_LENGTH) {
    errors.name = [`name must be at most ${MAX_NAME_LENGTH} characters`];
  }
  if (Object.keys(errors).length > 0) {
    throw new ValidationFailedError(errors);
  }

  return {
    registration: (registration as string).trim().toUpperCase(),
    name: (name as string).trim(),
  };
}
