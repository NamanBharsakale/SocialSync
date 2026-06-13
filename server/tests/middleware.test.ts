import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/authMiddleware.js";

vi.mock("../model/User.js", () => ({
  User: { findById: vi.fn() },
}));

const { User } = await import("../model/User.js");
const { protect } = await import("../middlewares/authMiddleware.js");

function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

const next: NextFunction = vi.fn();

describe("protect middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
  });

  it("returns 401 when no Authorization header is present", async () => {
    const req = { headers: {} } as AuthRequest;
    const res = makeRes();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect((res.json as any).mock.calls[0][0].message).toMatch(/no token/i);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header does not start with Bearer", async () => {
    const req = { headers: { authorization: "Basic abc" } } as AuthRequest;
    const res = makeRes();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is malformed / has wrong secret", async () => {
    const badToken = jwt.sign({ id: "uid" }, "wrong-secret");
    const req = {
      headers: { authorization: `Bearer ${badToken}` },
    } as AuthRequest;
    const res = makeRes();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when user no longer exists in the database", async () => {
    const token = jwt.sign({ id: "uid99" }, "testsecret");
    vi.mocked(User.findById).mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as any);
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = makeRes();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect((res.json as any).mock.calls[0][0].message).toMatch(/no longer exists/i);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches user to req and calls next() on a valid token", async () => {
    const token = jwt.sign({ id: "uid1" }, "testsecret");
    const fakeUser = { _id: "uid1", name: "Alice", email: "a@b.com" };
    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockResolvedValue(fakeUser),
    } as any);
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = makeRes();
    await protect(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(fakeUser);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when JWT is expired", async () => {
    const expiredToken = jwt.sign({ id: "uid1" }, "testsecret", { expiresIn: -1 });
    const req = {
      headers: { authorization: `Bearer ${expiredToken}` },
    } as AuthRequest;
    const res = makeRes();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
