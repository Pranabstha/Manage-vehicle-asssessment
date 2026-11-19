import express from "express";
import consumers from "./consumers/index.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { NotFoundError } from "./utils/errors.js";
import { requestLogger } from "./middlewares/request_logger.middleware.js";
import apiRouter from "./routes/index.js";

const app = express();

app.use(express.json());

app.use("/api", requestLogger, apiRouter);

app.use((req) => {
  throw new NotFoundError(`Route ${req.method} ${req.path} not found`);
});

app.use(errorHandler);

app.listen(env.BACKEND_PORT, () => {
  console.log(`backend listening on port ${env.BACKEND_PORT}`);
});

consumers.vehicleTelemetryConsumer.start().catch((err) => {
  console.error("telemetry consumer failed", err);
  process.exit(1);
});

// Leaving the consumer group cleanly lets a restarted backend resume at once instead of waiting
// for Kafka's session timeout. Node as PID 1 in Docker also ignores SIGTERM without a handler.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, async () => {
    await consumers.vehicleTelemetryConsumer.stop();
    process.exit(0);
  });
}
