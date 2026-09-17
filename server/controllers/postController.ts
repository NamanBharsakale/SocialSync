import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { GoogleGenAI } from "@google/genai";
import { cloudinary } from "../config/cloudinary.js";
import { prisma } from "../config/prisma.js";

// Generate post
// POST /api/posts/generate
export const generatePost = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { prompt, tone, generateImage } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            res.status(400).json({
                message:
                    "GeminiAPI key is missing.Please add it in your server/.env file.",
            });
            return;
        }

        const ai = new GoogleGenAI({ apiKey });

        // Generate text
        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a social media post based on this prompt : "${prompt}".

             Tone: ${tone}.

             include relevant hashtags.

             Format the response as JSON with "content" and "imagePrompt" fields.

             The "imagePrompt" should be a highly descriptive prompt for an image generator that complements the post.`,
        });

        let content = "";
        let imagePrompt = prompt;

        try {
            const rawText = textResponse.text || "";
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);

            const data = jsonMatch
                ? JSON.parse(jsonMatch[0])
                : {
                      content: rawText,
                      imagePrompt: prompt,
                  };

            content = data.content;
            imagePrompt = data.imagePrompt;
        } catch (e) {
            content = textResponse.text || "";
        }

        let mediaUrl = "";

        if (generateImage) {
            try {
                // Pollinations AI — temporarily retained.
                // This will be replaced with Gemini image generation later.
                const encodedPrompt = encodeURIComponent(imagePrompt);

                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

                // Retry up to 4 times with exponential backoff
                let uploadResult: any = null;

                for (let attempt = 0; attempt < 4; attempt++) {
                    try {
                        uploadResult = await cloudinary.uploader.upload(
                            pollinationsUrl,
                            {
                                folder: "ai-generations",
                            }
                        );

                        break;
                    } catch (uploadErr: any) {
                        const is402 = uploadErr?.message?.includes("402");

                        if (is402 && attempt < 3) {
                            await new Promise((r) =>
                                setTimeout(r, 3000 * (attempt + 1))
                            );
                            continue;
                        }

                        throw uploadErr;
                    }
                }

                if (uploadResult) {
                    mediaUrl = uploadResult.secure_url;
                }
            } catch (error: any) {
                console.error(
                    "Image generation failed: ",
                    error?.message
                );
            }
        }

        // Save generation to PostgreSQL
        const generation = await prisma.generation.create({
            data: {
                userId: req.user.id,
                prompt,
                content,
                mediaUrl,
                mediaType: mediaUrl ? "image" : undefined,
                tone,
            },
        });

        res.json(generation);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error",
        });
    }
};

// Get generations
// GET /api/posts/generations
export const getGenerations = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const generations = await prisma.generation.findMany({
            where: {
                userId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json(generations);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server Error",
        });
    }
};

// Get posts
// GET /api/posts
export const getPosts = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const posts = await prisma.post.findMany({
            where: {
                userId: req.user.id,
            },
        });

        res.json(posts);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server Error",
        });
    }
};

// Schedule post
// POST /api/posts
export const schedulePost = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const {
            content,
            platforms,
            scheduledFor,
            status,
        } = req.body;

        // Parse platforms if it comes as a stringified array from FormData
        let parsedPlatforms = platforms;

        if (typeof platforms === "string") {
            try {
                parsedPlatforms = JSON.parse(platforms);
            } catch (error) {
                parsedPlatforms = platforms.split(",");
            }
        }

        let mediaUrl: string | undefined = req.body.mediaUrl;
        let mediaType: "image" | "video" | undefined = req.body.mediaType;

        if (req.file) {
            const result = await new Promise<any>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "auto",
                        folder: "social-sync",
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                stream.end(req.file!.buffer);
            });

            mediaUrl = result.secure_url;
            mediaType =
                result.resource_type === "video"
                    ? "video"
                    : "image";
        }

        // Save post to PostgreSQL
        const post = await prisma.post.create({
            data: {
                userId: req.user.id,
                content,
                platforms,
                mediaUrl,
                mediaType,
                scheduledFor: new Date(scheduledFor),
                status,
            },
        });

        res.status(201).json(post);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server Error",
        });
    }
};