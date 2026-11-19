import { createClient } from "redis";
import { env } from "./env.js";

const redis = createClient({ url: env.REDIS_URL });
redis.on("error", (err) => console.error("redis error", err));
await redis.connect();

export default redis;
