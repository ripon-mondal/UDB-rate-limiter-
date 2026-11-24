
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL
});

// Handle Redis connection errors
redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

// Connect to Redis
export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis Connected Successfully!");
    } catch (error) {
        console.error("Redis Connection Failed:", error);
        process.exit(1);
    }
};

export default redisClient;
