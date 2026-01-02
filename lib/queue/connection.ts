import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "http://localhost:6357", {
  maxRetriesPerRequest: null,
});

export default connection;
