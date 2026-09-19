import { Router } from "express";
import { loginUser, registerUser, forgotPassword, resetPassword } from "../controllers/authController.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const authRouter = Router();

authRouter.use(authRateLimiter);
authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);

export default authRouter;



















