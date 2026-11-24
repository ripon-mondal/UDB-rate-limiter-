
import { randomUUID } from "crypto";
import redisClient from "../config/redis.js";

// Lua script: Execute all rate-limit operations atomically.
const slidingWindowScript = `
    local key = KEYS[1]

    local window = tonumber(ARGV[1])
    local maxRequests = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local requestId = ARGV[4]

    -- Step 1: Remove expired requests
    local windowStart = now - window

    redis.call(
        "ZREMRANGEBYSCORE",
        key,
        "-inf",
        windowStart
    )

    -- Step 2: Count valid requests
    local count = redis.call("ZCARD", key)

    -- Step 3: Check request limit
    if count >= maxRequests then

        local oldest = redis.call(
            "ZRANGE",
            key,
            0,
            0,
            "WITHSCORES"
        )

        local retryAfter = 0

        if #oldest > 0 then
            retryAfter = math.ceil(
                (tonumber(oldest[2]) + window - now) / 1000
            )
        end

        return {0, 0, retryAfter}
    end

    -- Step 4: Add current request
    redis.call(
        "ZADD",
        key,
        now,
        requestId
    )

    -- Step 5: Set automatic expiration
    redis.call("PEXPIRE", key, window)

    local updatedCount = count + 1
    local remaining = maxRequests - updatedCount

    return {1, remaining, 0}
`;

// Main rate limiter service
export const checkRateLimit = async ({
    clientId,
    maxRequests,
    windowSeconds
}) => {

    const now = Date.now();

    const windowMs = windowSeconds * 1000;

    const redisKey = `rate_limit:${clientId}`;

    const requestId = `${now}:${randomUUID()}`;

    console.log("Redis connected:", redisClient.isOpen);
    console.log("Redis database:", redisClient.options.database);
    console.log("Rate limit key:", redisKey);

    const result = await redisClient.eval(
        slidingWindowScript,
        {
            keys: [redisKey],
            arguments: [
                String(windowMs),
                String(maxRequests),
                String(now),
                requestId
            ]
        }
    );
    console.log("Redis script result:", result);

    const [allowed, remaining, retryAfter] = result;

    return {
        allowed: Number(allowed) === 1,
        remaining: Number(remaining),
        retryAfter: Number(retryAfter)
    };
};
