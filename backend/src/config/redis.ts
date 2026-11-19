import { createClient } from "redis";
import { env } from "./env.js";

// One shared client; top-level await connects before any importer uses it.
const redis = createClient({ url: env.REDIS_URL });
redis.on("error", (err) => console.error("redis error", err));
await redis.connect();

export default redis;
