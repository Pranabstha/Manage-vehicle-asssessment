import knex from "knex";
import { env } from "./env.js";
import knexConfig from "./knex.js";

// One Knex instance (and connection pool) for the app; ES modules are evaluated once.
const db = knex(knexConfig[env.NODE_ENV]);
export default db;
