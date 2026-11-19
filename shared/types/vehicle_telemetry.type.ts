export interface VehicleTelemetry {
  vehicle_id: number;
  ts: string;
  lat: number;
  lon: number;
  speed: number;
}

export interface VehicleTelemetryPage {
  items: VehicleTelemetry[];
  total: number;
  limit: number;
  offset: number;
}
