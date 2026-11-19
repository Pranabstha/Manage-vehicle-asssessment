import { fileURLToPath } from "node:url";
import type { Knex } from "knex";
import { env } from "./env.js";

const development: Knex.Config = {
  client: "pg",
  connection: {
    port: env.DB_PORT,
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
  // Directories are relative to this file, because the knex CLI changes into this folder.
  // From src/config/ (tsx) and dist/backend/src/config/ (build) both land on sibling folders.
  migrations: {
    directory: fileURLToPath(new URL("../../migrations", import.meta.url)),
    extension: "ts",
    loadExtensions: [".ts"],
  },
  seeds: {
    directory: fileURLToPath(new URL("../../seeds", import.meta.url)),
    extension: "ts",
    loadExtensions: [".ts"],
  },
};

// Picked by NODE_ENV. Production (the Docker image) differs only in env var values.
const config: { [key: string]: Knex.Config } = {
  development,
  production: development,
};

export default config;
