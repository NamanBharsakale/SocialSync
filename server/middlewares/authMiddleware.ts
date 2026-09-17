import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) {
                throw new Error(
                    "JWT_SECRET environment variable is not set"
                );
            }

            const decoded: any = jwt.verify(
                token,
                jwtSecret
            );

            const user = await prisma.user.findUnique({
                where: {
                    id: decoded.id,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    zernioProfileId: true,
                    resetPasswordToken: true,
                    resetPasswordExpires: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                res.status(401).json({
                    message:
                        "Not authorized, user no longer exists",
                });
                return;
            }

            req.user = user;

            next();
        } catch (error: any) {
            res.status(401).json({
                message:
                    error?.message ||
                    "Not authorized, token failed",
            });
        }
    } else {
        res.status(401).json({
            message: "Not authorized, no token",
        });
    }
};