import services from "../services/index.js";
import { VehicleController } from "./vehicle.controller.js";
import { VehicleTelemetryController } from "./vehicle_telemetry.controller.js";

const controllers = {
  vehicleController: new VehicleController(services.vehicleService),
  vehicleTelemetryController: new VehicleTelemetryController(
    services.vehicleTelemetryService,
  ),
};

export default controllers;
