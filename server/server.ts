import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import socialAuthRouter from "./routes/socialAuthRoutes.js";
import accountRouter from "./routes/accountRoutes.js";
import postRouter from "./routes/postRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import { initScheduler } from "./services/scheduleService.js";

const app = express();

// Middleware — must come before routes
app.use(cors());
app.use(express.json());

//db connection
await connectDB();

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
    console.error(err);
    res.status(500).json({ message: err?.message || "Internal server error" });
});

//initialize scheduler
initScheduler();

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});