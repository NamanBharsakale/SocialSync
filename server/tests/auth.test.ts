import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

// ── Mongoose model mocks ──────────────────────────────────────────────────────
vi.mock("../model/User.js", () => ({
  User: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../config/mailer.js", () => ({
  default: { sendMail: vi.fn().mockResolvedValue({ messageId: "mock-id" }) },
}));

vi.mock("bcrypt", () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue("salt"),
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn(),
  },
}));

vi.mock("crypto", async (importOriginal) => {
  const real = await importOriginal<typeof import("crypto")>();
  return {
    default: {
      ...real,
      randomBytes: () => ({ toString: () => "rawtoken123" }),
      createHash: real.createHash,
    },
  };
});

const { User } = await import("../model/User.js");
const bcrypt = (await import("bcrypt")).default;
const { registerUser, loginUser, forgotPassword, resetPassword } = await import(
  "../controllers/authController.js"
);

// ── helpers ───────────────────────────────────────────────────────────────────
function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(body: object): Request {
  return { body } as unknown as Request;
}

// ── registerUser ─────────────────────────────────────────────────────────────
describe("registerUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when required fields are missing", async () => {
    const res = makeRes();
    await registerUser(makeReq({ email: "a@b.com" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect((res.json as any).mock.calls[0][0].message).toMatch(
      /name, email, and password are required/i
    );
  });

  it("returns 400 when user already exists", async () => {
    vi.mocked(User.findOne).mockResolvedValue({ email: "a@b.com" });
    const res = makeRes();
    await registerUser(makeReq({ name: "Alice", email: "a@b.com", password: "pass" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect((res.json as any).mock.calls[0][0].message).toMatch(/user already exists/i);
  });

  it("hashes the password before saving", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue({
      _id: "uid1",
      name: "Alice",
      email: "a@b.com",
    } as any);
    process.env.JWT_SECRET = "testsecret";
    const res = makeRes();
    await registerUser(makeReq({ name: "Alice", email: "a@b.com", password: "plain" }), res);
    expect(bcrypt.hash).toHaveBeenCalledWith("plain", "salt");
  });

  it("returns 201 with token on successful registration", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue({
      _id: "uid1",
      name: "Alice",
      email: "a@b.com",
    } as any);
    process.env.JWT_SECRET = "testsecret";
    const res = makeRes();
    await registerUser(makeReq({ name: "Alice", email: "a@b.com", password: "plain" }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload).toHaveProperty("token");
    expect(payload.email).toBe("a@b.com");
  });
});

// ── loginUser ─────────────────────────────────────────────────────────────────
describe("loginUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when fields are missing", async () => {
    const res = makeRes();
    await loginUser(makeReq({ email: "a@b.com" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 401 when user not found", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = makeRes();
    await loginUser(makeReq({ email: "no@one.com", password: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(User.findOne).mockResolvedValue({ _id: "uid", email: "a@b.com", password: "hash" });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = makeRes();
    await loginUser(makeReq({ email: "a@b.com", password: "wrong" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 200 with token on correct credentials", async () => {
    vi.mocked(User.findOne).mockResolvedValue({
      _id: "uid1",
      name: "Alice",
      email: "a@b.com",
      password: "hash",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    process.env.JWT_SECRET = "testsecret";
    const res = makeRes();
    await loginUser(makeReq({ email: "a@b.com", password: "correct" }), res);
    expect(res.status).not.toHaveBeenCalledWith(401);
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload).toHaveProperty("token");
  });
});

// ── forgotPassword ────────────────────────────────────────────────────────────
describe("forgotPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const res = makeRes();
    await forgotPassword(makeReq({}), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 200 with neutral message when user not found (prevents enumeration)", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    const res = makeRes();
    await forgotPassword(makeReq({ email: "ghost@x.com" }), res);
    expect(res.status).not.toHaveBeenCalledWith(404);
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.message).toMatch(/reset link/i);
  });

  it("returns 429 when a valid token was issued less than 60 s ago", async () => {
    vi.mocked(User.findOne).mockResolvedValue({
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
      save: vi.fn(),
    });
    const res = makeRes();
    await forgotPassword(makeReq({ email: "a@b.com" }), res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it("sends email using CLIENT_URL env var, not Origin header", async () => {
    const mailer = (await import("../config/mailer.js")).default;
    process.env.CLIENT_URL = "https://app.example.com";
    vi.mocked(User.findOne).mockResolvedValue({
      _id: "uid",
      name: "Alice",
      email: "a@b.com",
      resetPasswordExpires: null,
      save: vi.fn(),
    });
    const req = {
      body: { email: "a@b.com" },
      headers: { origin: "https://attacker.com" },
    } as unknown as Request;
    const res = makeRes();
    await forgotPassword(req, res);
    const mailCall = vi.mocked(mailer.sendMail).mock.calls[0][0] as any;
    expect(mailCall.html).toContain("https://app.example.com");
    expect(mailCall.html).not.toContain("https://attacker.com");
  });
});

// ── resetPassword ─────────────────────────────────────────────────────────────
describe("resetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when password is too short", async () => {
    const res = makeRes();
    const req = { params: { token: "tok" }, body: { password: "ab" } } as unknown as Request;
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when token is invalid or expired", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    const res = makeRes();
    const req = {
      params: { token: "bad-token" },
      body: { password: "newpassword" },
    } as unknown as Request;
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect((res.json as any).mock.calls[0][0].message).toMatch(/invalid or has expired/i);
  });

  it("updates password and clears token on valid reset", async () => {
    const saveMock = vi.fn();
    vi.mocked(User.findOne).mockResolvedValue({
      password: "oldhash",
      resetPasswordToken: "hashedtok",
      resetPasswordExpires: new Date(Date.now() + 3600_000),
      save: saveMock,
    });
    const res = makeRes();
    const req = {
      params: { token: "validtoken" },
      body: { password: "newsecurepassword" },
    } as unknown as Request;
    await resetPassword(req, res);
    expect(saveMock).toHaveBeenCalled();
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.message).toMatch(/updated/i);
  });
});

// ── JWT token shape ───────────────────────────────────────────────────────────
describe("JWT token", () => {
  it("encodes the user id and expires in 30 days", () => {
    process.env.JWT_SECRET = "testsecret";
    const token = jwt.sign({ id: "uid99" }, "testsecret", { expiresIn: "30d" });
    const decoded = jwt.verify(token, "testsecret") as any;
    expect(decoded.id).toBe("uid99");
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(decoded.exp * 1000 - decoded.iat * 1000).toBeCloseTo(thirtyDaysMs, -3);
  });

  it("throws when verified with wrong secret", () => {
    const token = jwt.sign({ id: "uid" }, "correct");
    expect(() => jwt.verify(token, "wrong")).toThrow();
  });
});
