import services from "../services/index.js";
import { VehicleTelemetryConsumer } from "./vehicle_telemetry.consumer.js";

const consumers = {
  vehicleTelemetryConsumer: new VehicleTelemetryConsumer(
    services.vehicleTelemetryService,
  ),
};

export default consumers;
