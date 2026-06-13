import { Router } from "express";
import { loginUser, registerUser, forgotPassword, resetPassword } from "../controllers/authController.js";


const authRouter = Router();

authRouter.post('/register',registerUser)
authRouter.post('/login',loginUser)
authRouter.post('/forgot-password',forgotPassword)
authRouter.post('/reset-password/:token',resetPassword)


export default authRouter;



















