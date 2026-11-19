import type { Request, Response } from "express";
import { z } from "zod";
import { MAX_HISTORY_LIMIT } from "../../../shared/limits.js";
import { BadRequestError } from "../utils/errors.js";
import { DEFAULT_HISTORY_LIMIT, DEFAULT_HISTORY_RANGE_MS } from "../utils/constants.js";
import type { VehicleTelemetryService } from "../services/vehicle_telemetry.service.js";
import { parseId } from "./vehicle.controller.js";

export class VehicleTelemetryController {
  constructor(private readonly service: VehicleTelemetryService) {}

  history = async (req: Request<{ id: string }>, res: Response) => {
    const id = parseId(req.params.id);
    const to = parseDate(req.query.to) ?? new Date();
    const from =
      parseDate(req.query.from) ??
      new Date(to.getTime() - DEFAULT_HISTORY_RANGE_MS);
    if (from > to) {
      throw new BadRequestError("from must not be after to.");
    }
    const { limit, offset } = parsePage(req.query.limit, req.query.offset);
    const page = await this.service.history(id, from, to, limit, offset);
    res.json({ ...page, limit, offset });
  };
}

// The offset is required: a time without one would be read in the server's time zone.
const dateSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .optional();

function parseDate(value: unknown): Date | undefined {
  const result = dateSchema.safeParse(value);
  if (!result.success) {
    throw new BadRequestError("from and to must be ISO dates with a time zone offset.");
  }
  return result.data;
}

const pageSchema = z.object({
  limit: z.coerce.number().pipe(z.int().min(1).max(MAX_HISTORY_LIMIT)).default(DEFAULT_HISTORY_LIMIT),
  offset: z.coerce.number().pipe(z.int().min(0)).default(0),
});

export function parsePage(limit: unknown, offset: unknown): { limit: number; offset: number } {
  const result = pageSchema.safeParse({ limit, offset });
  if (!result.success) {
    throw new BadRequestError(
      `limit must be an integer from 1 to ${MAX_HISTORY_LIMIT}, and offset an integer of 0 or more.`,
    );
  }
  return result.data;
}
