import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";

vi.mock("../model/Posts.js", () => ({
  Post: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../model/Generation.js", () => ({
  Generation: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../config/cloudinary.js", () => ({
  cloudinary: {
    uploader: {
      upload: vi.fn(),
      upload_stream: vi.fn(),
    },
  },
}));

const mockGenerateContent = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    text: JSON.stringify({
      content: "Generated post content #hashtag",
      imagePrompt: "A scenic mountain landscape",
    }),
  })
);

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

const { Post } = await import("../model/Posts.js");
const { Generation } = await import("../model/Generation.js");
const { getPosts, getGenerations, schedulePost, generatePost } = await import(
  "../controllers/postController.js"
);

function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(body: object = {}, user = { _id: "uid1" }, file?: any): AuthRequest {
  return { body, user, file } as unknown as AuthRequest;
}

// ── getPosts ──────────────────────────────────────────────────────────────────
describe("getPosts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all posts for the authenticated user", async () => {
    const fakePosts = [
      { _id: "p1", content: "Post 1", status: "scheduled" },
      { _id: "p2", content: "Post 2", status: "published" },
    ];
    vi.mocked(Post.find).mockResolvedValue(fakePosts as any);
    const res = makeRes();
    await getPosts(makeReq(), res);
    expect(Post.find).toHaveBeenCalledWith({ user: "uid1" });
    expect(res.json).toHaveBeenCalledWith(fakePosts);
  });

  it("returns 500 when DB throws", async () => {
    vi.mocked(Post.find).mockRejectedValue(new Error("DB down"));
    const res = makeRes();
    await getPosts(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── getGenerations ────────────────────────────────────────────────────────────
describe("getGenerations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns generations sorted by createdAt descending", async () => {
    const fakeGens = [{ _id: "g1", prompt: "test" }];
    vi.mocked(Generation.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue(fakeGens),
    } as any);
    const res = makeRes();
    await getGenerations(makeReq(), res);
    expect(Generation.find).toHaveBeenCalledWith({ user: "uid1" });
    expect(res.json).toHaveBeenCalledWith(fakeGens);
  });
});

// ── schedulePost ──────────────────────────────────────────────────────────────
describe("schedulePost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("parses platforms from a JSON string and creates a post", async () => {
    const fakePost = { _id: "p1", content: "Hello", platforms: ["twitter"] };
    vi.mocked(Post.create).mockResolvedValue(fakePost as any);
    const res = makeRes();
    await schedulePost(
      makeReq({
        content: "Hello",
        platforms: '["twitter"]',
        scheduledFor: new Date(Date.now() + 60_000).toISOString(),
        status: "scheduled",
      }),
      res
    );
    expect(Post.create).toHaveBeenCalledWith(
      expect.objectContaining({ platforms: ["twitter"], content: "Hello" })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("parses platforms from a comma-separated string fallback", async () => {
    vi.mocked(Post.create).mockResolvedValue({ _id: "p2" } as any);
    const res = makeRes();
    await schedulePost(
      makeReq({
        content: "Hi",
        platforms: "twitter,linkedin",
        scheduledFor: new Date(Date.now() + 60_000).toISOString(),
        status: "scheduled",
      }),
      res
    );
    expect(Post.create).toHaveBeenCalledWith(
      expect.objectContaining({ platforms: ["twitter", "linkedin"] })
    );
  });

  it("returns 500 when DB throws", async () => {
    vi.mocked(Post.create).mockRejectedValue(new Error("DB error"));
    const res = makeRes();
    await schedulePost(
      makeReq({
        content: "Hi",
        platforms: '["twitter"]',
        scheduledFor: new Date().toISOString(),
      }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── generatePost ──────────────────────────────────────────────────────────────
describe("generatePost", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when GEMINI_API_KEY is missing", async () => {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res = makeRes();
    await generatePost(makeReq({ prompt: "test", tone: "casual" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    process.env.GEMINI_API_KEY = original;
  });

  it("calls Gemini and saves a Generation document", async () => {
    process.env.GEMINI_API_KEY = "fake-key";
    const fakeGen = { _id: "g1", content: "Generated post content #hashtag" };
    vi.mocked(Generation.create).mockResolvedValue(fakeGen as any);
    const res = makeRes();
    await generatePost(
      makeReq({ prompt: "Write a post about AI", tone: "professional", generateImage: false }),
      res
    );
    expect(Generation.create).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Write a post about AI", tone: "professional" })
    );
    expect(res.json).toHaveBeenCalledWith(fakeGen);
  });
});
