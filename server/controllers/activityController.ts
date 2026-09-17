import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// Get all activity
// GET /api/activity
export const getActivity = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const activity = await prisma.activityLog.findMany({
            where: {
                userId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
            include: {
                relatedPost: {
                    select: {
                        content: true,
                    },
                },
            },
        });

        res.json(activity);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error",
        });
    }
};