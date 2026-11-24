
import { checkRateLimit } from "../services/rateLimiter.service.js";

export const rateLimiter = (options = {}) => {

    const maxRequests = options.maxRequests ?? 5;
    const windowSeconds = options.windowSeconds ?? 60;

    return async (req, res, next) => {

        try {

            // Identify the client
            const clientId = req.ip;

            // Check rate limit using Redis
            const result = await checkRateLimit({
                clientId,
                maxRequests,
                windowSeconds
            });

            // Set rate limit headers
            res.setHeader("X-RateLimit-Limit", maxRequests);

            res.setHeader(
                "X-RateLimit-Remaining",
                result.remaining
            );

            // Reject request if limit exceeded
            if (!result.allowed) {

                res.setHeader(
                    "Retry-After",
                    result.retryAfter
                );

                return res.status(429).json({
                    success: false,
                    message: "Too many requests. Please try again later.",
                    limit: maxRequests,
                    remaining: result.remaining,
                    retryAfter: result.retryAfter
                });
            }

            // Allow request
            next();

        } catch (error) {

            console.error("Rate Limiter Error:", error);

            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    };
};
