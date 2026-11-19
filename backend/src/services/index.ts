import repositories from "../repositories/index.js";
import { VehicleService } from "./vehicle.service.js";
import { VehicleTelemetryService } from "./vehicle_telemetry.service.js";

const services = {
  vehicleService: new VehicleService(
    repositories.vehicleRepository,
    repositories.vehicleTelemetryRepository,
  ),
  vehicleTelemetryService: new VehicleTelemetryService(
    repositories.vehicleTelemetryRepository,
    repositories.vehicleRepository,
  ),
};

export default services;
