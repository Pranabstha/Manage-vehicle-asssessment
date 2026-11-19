import knex from "knex";
import { env } from "./env.js";
import knexConfig from "./knex.js";

const db = knex(knexConfig[env.NODE_ENV]);
export default db;
