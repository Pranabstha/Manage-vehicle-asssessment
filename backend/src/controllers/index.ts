import services from "../services/index.js";
import { VehicleController } from "./vehicle.controller.js";

const controllers = {
  vehicleController: new VehicleController(services.vehicleService),
};

export default controllers;
