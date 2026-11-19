import { Router } from "express";
import controllers from "../controllers/index.js";

const vehicleRouter = Router();

vehicleRouter
  .post("/", controllers.vehicleController.create)
  .put("/:id", controllers.vehicleController.update)
  .delete("/:id", controllers.vehicleController.delete)
  .get("/", controllers.vehicleController.list)
  .get("/:id", controllers.vehicleController.get)
  .get("/:id/telemetry", controllers.vehicleTelemetryController.history);

export default vehicleRouter;
