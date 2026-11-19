// Defaults match the ports docker-compose exposes on the host.
export const env = {
  KAFKA_BROKERS: process.env.KAFKA_BROKERS ?? "localhost:9094",
  BACKEND_URL: process.env.BACKEND_URL ?? "http://localhost:8000",
  INTERVAL_MS: Number(process.env.INTERVAL_MS ?? 5000),
};
