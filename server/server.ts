import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import socialAuthRouter from "./routes/socialAuthRoutes.js";
import accountRouter from "./routes/accountRoutes.js";
import postRouter from "./routes/postRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import { initScheduler } from "./services/scheduleService.js";

const app = express();
app.set("trust proxy", 1);

const normalizeOrigin = (value?: string) => value?.replace(/\/$/, "");
const allowedOrigins = new Set(
    [
        normalizeOrigin(process.env.FRONTEND_URL),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ].filter((origin): origin is string => Boolean(origin))
);

// Middleware — must come before routes
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(normalizeOrigin(origin) ?? origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin ${origin}`));
    }
}));
app.use(express.json());


const port = process.env.PORT || 3000;

app.get('/', (_req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use("/api/auth", authRouter);
app.use("/api/oauth", socialAuthRouter);
app.use('/api/accounts', accountRouter);
app.use("/api/posts", postRouter);
app.use("/api/activity", activityRouter);

// Global error handler — must be LAST, after all routes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled server error:", err);

    const isProduction = process.env.NODE_ENV === "production";
    const message = isProduction
        ? "Internal server error"
        : (err?.message || "Internal server error");

    res.status(500).json({ message });
});

//initialize scheduler
initScheduler();

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});