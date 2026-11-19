import repositories from "../repositories/index.js";
import { VehicleService } from "./vehicle.service.js";
import { VehicleTelemetryService } from "./vehicle_telemetry.service.js";

const services = {
  vehicleService: new VehicleService(repositories.vehicleRepository),
  vehicleTelemetryService: new VehicleTelemetryService(
    repositories.vehicleTelemetryRepository,
  ),
};

export default services;
