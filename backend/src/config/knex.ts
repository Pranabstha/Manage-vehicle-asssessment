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
  // The knex CLI changes into this folder, so resolve paths from this file.
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

const config: { [key: string]: Knex.Config } = {
  development,
  production: development,
};

export default config;
