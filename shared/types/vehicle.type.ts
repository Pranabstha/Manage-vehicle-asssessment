import type { VehicleTelemetry } from "./vehicle_telemetry.type.js";

export interface Vehicle {
  id: number;
  registration: string;
  name: string;
  created_at: string;
}

export interface VehicleInput {
  registration: string;
  name: string;
}

export interface VehicleWithTelemetry extends Vehicle {
  latest_telemetry: VehicleTelemetry | null;
}
