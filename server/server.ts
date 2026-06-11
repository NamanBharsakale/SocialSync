import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import socialAuthRouter from "./routes/socialAuthRoutes.js";

const app = express();

//db connection
await connectDB()

//global error handler
app.use((err:any,_req:Request,res:Response,_next: NextFunction)=>{
    console.error(err)
    res.status(500).send(err?.response?.data?.message)
})

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use("/api/auth",authRouter)
app.use("/api/oauth",socialAuthRouter)



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});