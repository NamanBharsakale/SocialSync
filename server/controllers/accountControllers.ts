import { Response } from 'express';
import zernio from "../config/zernio.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { prisma } from "../config/prisma.js";

// Get all accounts
// GET /api/accounts
export const getAccounts = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const accounts = await prisma.account.findMany({
            where: {
                userId: req.user.id,
            },
        });

        res.json(accounts);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error",
        });
    }
};

// Add account
// POST /api/account
export const addAccount = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { platform, handle, avatarUrl } = req.body;

        const account = await prisma.account.create({
            data: {
                userId: req.user.id,
                platform,
                handle,
                avatarUrl,
            },
        });

        res.status(201).json(account);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error",
        });
    }
};

// Disconnect account
// DELETE /api/accounts/:id
export const disconnectAccount = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const accountId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const account = await prisma.account.findFirst({
            where: {
                id: accountId,
                userId: req.user.id,
            },
        });

        if (!account) {
            res.status(404).json({
                message: "Account not found",
            });
            return;
        }

        if (account.zernioAccountId) {
            try {
                await zernio.accounts.deleteAccount({
                    path: {
                        accountId: account.zernioAccountId,
                    },
                });
            } catch (e: any) {
                res.status(500).json({
                    message: e?.response?.data?.message || e?.message,
                });
                return;
            }
        }

        await prisma.account.delete({
            where: {
                id: account.id,
            },
        });

        res.json({
            message: "Account disconnected successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error",
        });
    }
};