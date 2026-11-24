
import express from "express";

import { testController } from "../controllers/test.controller.js";

import { rateLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

// Apply rate limiter to this route
router.get(
    "/test",
    rateLimiter({
        maxRequests: 5,
        windowSeconds: 60
    }),
    testController
);

export default router;
