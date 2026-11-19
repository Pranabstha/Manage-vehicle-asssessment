import { VehicleRepository } from "./vehicle.repository.js";
import { VehicleTelemetryRepository } from "./vehicle_telemetry.repository.js";

const repositories = {
  vehicleRepository: new VehicleRepository(),
  vehicleTelemetryRepository: new VehicleTelemetryRepository(),
};

export default repositories;
