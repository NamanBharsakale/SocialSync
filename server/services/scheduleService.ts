import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import zernio from "../config/zernio.js";

export const initScheduler = () => {
    cron.schedule("* * * * * *", async () => {
        try {
            const now = new Date();

            // Find scheduled posts that are ready to publish.
            const postsToPublish = await prisma.post.findMany({
                where: {
                    status: "scheduled",
                    scheduledFor: {
                        lte: now,
                    },
                },
            });

            if (postsToPublish.length === 0) {
                return;
            }

            // Claim posts by moving them to "processing".
            // The status condition prevents a post already claimed by
            // another scheduler tick from being claimed again.
            await prisma.post.updateMany({
                where: {
                    id: {
                        in: postsToPublish.map((post) => post.id),
                    },
                    status: "scheduled",
                },
                data: {
                    status: "processing",
                },
            });

            // Re-read only posts that were successfully moved to processing.
            const claimed = await prisma.post.findMany({
                where: {
                    id: {
                        in: postsToPublish.map((post) => post.id),
                    },
                    status: "processing",
                },
            });

            for (const post of claimed) {
                try {
                    const accounts = await prisma.account.findMany({
                        where: {
                            userId: post.userId,
                            platform: {
                                in: post.platforms,
                            },
                            status: "connected",
                            zernioAccountId: {
                                not: null,
                            },
                        },
                    });

                    if (accounts.length === 0) {
                        console.log(
                            `No connected Zernio accounts found for post ${post.id}`
                        );

                        await prisma.post.update({
                            where: {
                                id: post.id,
                            },
                            data: {
                                status: "failed",
                            },
                        });

                        continue;
                    }

                    const zernioPlatforms = accounts.map((acc) => ({
                        platform: acc.platform as any,
                        accountId: acc.zernioAccountId!,
                    }));

                    const payload = {
                        content: post.content,
                        publishNow: true,
                        ...(post.mediaUrl
                            ? {
                                  mediaItems: [
                                      {
                                          type: post.mediaType || "image",
                                          url: post.mediaUrl,
                                      },
                                  ],
                              }
                            : {}),
                        platforms: zernioPlatforms,
                    };

                    console.log(
                        `Publishing post ${post.id} to zernio with media: ${
                            post.mediaUrl || "none"
                        }`
                    );

                    const response = await zernio.posts.createPost({
                        body: payload,
                    });

                    const publishedPost =
                        (response.data as any)?.post || response.data;

                    if (!publishedPost) {
                        throw new Error(
                            "Failed to get post object from Zernio response"
                        );
                    }

                    console.log(
                        `Zernio post created : ${
                            publishedPost._id || publishedPost.id
                        }`
                    );

                    await prisma.post.update({
                        where: {
                            id: post.id,
                        },
                        data: {
                            status: "published",
                        },
                    });

                    await prisma.activityLog.create({
                        data: {
                            userId: post.userId,
                            actionType: "POST_PUBLISHED",
                            description: `Published post to ${accounts
                                .map((a) => a.platform)
                                .join(",")}`,
                            relatedPostId: post.id,
                        },
                    });
                } catch (error: any) {
                    console.error(
                        `Failed to publish post ${post.id} : `,
                        error?.response?.data || error?.message
                    );

                    await prisma.post.update({
                        where: {
                            id: post.id,
                        },
                        data: {
                            status: "failed",
                        },
                    });
                }
            }

            if (claimed.length > 0) {
                console.log(
                    `Evaluated ${claimed.length} posts at ${now.toISOString()}`
                );
            }
        } catch (error: any) {
            console.error("Error in scheduler: ", error);
        }
    });

    console.log("Scheduler service initialised.");
};