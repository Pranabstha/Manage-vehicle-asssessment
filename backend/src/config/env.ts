function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

// defaults are the host ports docker-compose exposes
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  BACKEND_PORT: Number(process.env.BACKEND_PORT ?? 8000),
  DB_HOST: process.env.DB_HOST ?? "localhost",
  DB_PORT: Number(process.env.DB_PORT ?? 5433),
  DB_USER: required("DB_USER"),
  DB_PASSWORD: required("DB_PASSWORD"),
  DB_NAME: required("DB_NAME"),
  KAFKA_BROKERS: process.env.KAFKA_BROKERS ?? "localhost:9094",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
};
