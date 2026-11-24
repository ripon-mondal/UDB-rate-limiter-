
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectRedis } from "./config/redis.js";

import testRoutes from "./routes/test.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Rate Limiter API is running!"
    });
});

// API routes
app.use("/api", testRoutes);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {

    try {

        await connectRedis();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {

        console.error("Server startup failed:", error);
        process.exit(1);

    }

};

startServer();
