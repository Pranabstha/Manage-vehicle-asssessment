export const TELEMETRY_TOPIC = "vehicle_telemetry";
export const KAFKA_CLIENT_ID = "manage_vehicle_backend";
export const CONSUMER_GROUP = "manage_vehicle_backend";
export const LATEST_TELEMETRY_KEY = "vehicle_latest_telemetry";

// Postgres error codes.
export const UNIQUE_VIOLATION = "23505";
export const FOREIGN_KEY_VIOLATION = "23503";

export const DEFAULT_HISTORY_RANGE_MS = 60 * 60 * 1000;
export const DEFAULT_HISTORY_LIMIT = 100;
