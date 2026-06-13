import { Request, Response } from "express";
import zernio from "../config/zernio";
import { User } from "../model/User";
import { Account } from "../model/Account.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";
const getOrCreateZernioProfile = async (user:any):Promise<string>=>{
    // Reuse the stored profile ID — avoids hitting the wrong profile on re-fetch
    if(user.zernioProfileId) return user.zernioProfileId as string;

    try {
        // Always create a new profile — never reuse another user's profile.
        // listProfiles() returns profiles across the shared API key and would
        // hand user B the profile belonging to user A.
        const createResult = await zernio.profiles.createProfile({
            body:{name:`${user.name || user.email}'s workspace`} as any
        })

        const created = (createResult.data as any)?.profile || createResult.data;

        const pid = created?._id || created?.id;

        if(!pid){
            throw new Error("Failed to create Zernio profile - No id returned")
        }
        await User.findByIdAndUpdate(user._id,{zernioProfileId:pid})
        return pid;
    } catch (error: any) {
        console.error("getOrCreateZernioProfile Error: ",error?.message || error);
        throw error;
    }
}



//Generate OAuth authorization url
//GET /api/auth/:platforms
export const generateAuthUrl = async (req:AuthRequest,res:Response):Promise<void>=>{
    try {
        const {platform} = req.params;
        const profileId = await getOrCreateZernioProfile(req.user);

        const origin = req.headers.origin;

        const redirectUrl = `${origin}/accounts`;

        const result = await zernio.connect.getConnectUrl({
            path: {platform: platform as any},
            query: {
                profileId,
                redirect_url: redirectUrl,

            }
        })

        const data = result.data as any;
        console.log("getConnectUrl response: ",JSON.stringify(data,null,2))

        const authUrl = data.authUrl;

        if(!authUrl){
            throw new Error(`Zernio returned no authUrl. Full response: ${JSON.stringify(data)} `)
        }

        res.json({url:authUrl})

    } catch (error:any) {
        res.status(500).json({message: error?.message || "Server error"})
    }
}
//sync connected accounts from zernio into mongodb
//GET /api/auth/sync

export const syncsAccounts = async (req:AuthRequest,res:Response):Promise<void>=>{
    try{
        const profileId = await getOrCreateZernioProfile(req.user);
        const result = await zernio.accounts.listAccounts({
            query: {profileId, status: "connected"} as any
        })

        const data = result.data as any
        console.log("listAccounts raw response:", JSON.stringify(data, null, 2));

        const zernioAccounts: any[] = data?.accounts || (Array.isArray(data) ? data : []);

        const platformMap: Record<string, string> = {
            twitter: "twitter",
            linkedin: "linkedin",
            linkedinads: "linkedin",
            facebook: "facebook",
            metaads: "facebook",
            instagram: "instagram",
        };
        const syncedAccounts = [];

        for(const zAccount of zernioAccounts){
            console.log("Processing zAccount:", JSON.stringify(zAccount, null, 2));

            const zid = zAccount._id || zAccount.id;
            if(!zid){
                console.warn("Skipping account with no ID", zAccount);
                continue;
            }

            if(zAccount.enabled === false){
                console.log(`Skipping disabled account ${zid}`);
                continue;
            }

            const rawPlatform = (zAccount.platform || "").toLowerCase();
            const normalizedPlatform = platformMap[rawPlatform];

            if(!normalizedPlatform){
                console.warn(`Skipping unsupported platform "${rawPlatform}" for account ${zid}`);
                continue;
            }

            const account = await Account.findOneAndUpdate(
                {zernioAccountId: zid, user: req.user._id},
                {
                    user: req.user._id,
                    platform: normalizedPlatform,
                    handle: zAccount.username || zAccount.displayName || zAccount.name || "Unknown",
                    zernioAccountId: zid,
                    status: "connected",
                    avatarUrl: zAccount.profilePicture || zAccount.avatarUrl || zAccount.picture || null,
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            )
            syncedAccounts.push(account)
        }
        res.json(syncedAccounts)
    }
    catch(error:any){
        res.status(500).json({
            message:error?.message || "Server Error"
        })
    }
}





