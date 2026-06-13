# SocialSync Server — Test Report

**Date:** 2026-06-13  
**Framework:** Vitest v4.1.8  
**Coverage provider:** v8  
**Test environment:** Node.js (ESM)  

---

## Summary

| Metric        | Result               |
|---------------|----------------------|
| Test files    | 3                    |
| Total tests   | 31                   |
| Passed        | **31**               |
| Failed        | 0                    |
| Skipped       | 0                    |
| Duration      | ~650 ms              |

---

## Test Files & Results

### `tests/auth.test.ts` — Auth Controller (17 tests)

Tests the four exported functions from `controllers/authController.ts`.  
All dependencies (User model, bcrypt, nodemailer, crypto) are mocked.

| # | Test | Status |
|---|------|--------|
| 1 | registerUser — returns 400 when required fields are missing | ✅ PASS |
| 2 | registerUser — returns 400 when user already exists | ✅ PASS |
| 3 | registerUser — hashes the password before saving | ✅ PASS |
| 4 | registerUser — returns 201 with token on successful registration | ✅ PASS |
| 5 | loginUser — returns 400 when fields are missing | ✅ PASS |
| 6 | loginUser — returns 401 when user not found | ✅ PASS |
| 7 | loginUser — returns 401 when password is wrong | ✅ PASS |
| 8 | loginUser — returns 200 with token on correct credentials | ✅ PASS |
| 9 | forgotPassword — returns 400 when email is missing | ✅ PASS |
| 10 | forgotPassword — returns 200 with neutral message when user not found (prevents enumeration) | ✅ PASS |
| 11 | forgotPassword — returns 429 when a valid token was issued less than 60 s ago | ✅ PASS |
| 12 | forgotPassword — sends email using CLIENT_URL env var, not Origin header | ✅ PASS |
| 13 | resetPassword — returns 400 when password is too short | ✅ PASS |
| 14 | resetPassword — returns 400 when token is invalid or expired | ✅ PASS |
| 15 | resetPassword — updates password and clears token on valid reset | ✅ PASS |
| 16 | JWT token — encodes the user id and expires in 30 days | ✅ PASS |
| 17 | JWT token — throws when verified with wrong secret | ✅ PASS |

---

### `tests/middleware.test.ts` — Auth Middleware (6 tests)

Tests the `protect` middleware from `middlewares/authMiddleware.ts`.  
User model is mocked; real JWT signing/verification is used.

| # | Test | Status |
|---|------|--------|
| 1 | protect — returns 401 when no Authorization header is present | ✅ PASS |
| 2 | protect — returns 401 when Authorization header does not start with Bearer | ✅ PASS |
| 3 | protect — returns 401 when token is malformed / has wrong secret | ✅ PASS |
| 4 | protect — returns 401 when user no longer exists in the database | ✅ PASS |
| 5 | protect — attaches user to req and calls next() on a valid token | ✅ PASS |
| 6 | protect — returns 401 when JWT is expired | ✅ PASS |

---

### `tests/posts.test.ts` — Post Controller (8 tests)

Tests `getPosts`, `getGenerations`, `schedulePost`, and `generatePost` from `controllers/postController.ts`.  
Post model, Generation model, Cloudinary, and GoogleGenAI are mocked.

| # | Test | Status |
|---|------|--------|
| 1 | getPosts — returns all posts for the authenticated user | ✅ PASS |
| 2 | getPosts — returns 500 when DB throws | ✅ PASS |
| 3 | getGenerations — returns generations sorted by createdAt descending | ✅ PASS |
| 4 | schedulePost — parses platforms from a JSON string and creates a post | ✅ PASS |
| 5 | schedulePost — parses platforms from a comma-separated string fallback | ✅ PASS |
| 6 | schedulePost — returns 500 when DB throws | ✅ PASS |
| 7 | generatePost — returns 400 when GEMINI_API_KEY is missing | ✅ PASS |
| 8 | generatePost — calls Gemini and saves a Generation document | ✅ PASS |

---

## Coverage Report

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
-------------------|---------|----------|---------|---------|-------------------
All files          |   41.31 |    29.16 |   38.46 |   42.28 |
 config            |       0 |        0 |       0 |       0 |
  cloudinary.ts    |       0 |      100 |     100 |       0 | 3
  db.ts            |       0 |      100 |       0 |       0 | 3-10
  mailer.ts        |       0 |        0 |     100 |       0 | 5-7
  multer.ts        |       0 |      100 |     100 |       0 | 4-6
  zernio.ts        |       0 |        0 |     100 |       0 | 4-8
 controllers       |   47.08 |    30.43 |   47.36 |   48.08 |
  accountsCont…ts  |       0 |        0 |       0 |       0 | 13-63
  aiComposerCo…ts  |       0 |        0 |       0 |       0 | 11-20
  authControll…ts  |   90.78 |    78.04 |     100 |   90.78 | 62,70,141-142,180
  postControll…ts  |   60.27 |    29.41 |   57.14 |   63.76 | 80,100,116,156-167
  socialAuthCo…ts  |       0 |        0 |       0 |       0 | 6-146
 middlewares       |     100 |    87.50 |     100 |     100 |
  authMiddlewa…ts  |     100 |    87.50 |     100 |     100 | 28
 services          |       0 |        0 |       0 |       0 |
  scheduleServ…ts  |       0 |        0 |       0 |       0 | 6-86
-------------------|---------|----------|---------|---------|-------------------

Statements : 41.31%  (126 / 305)
Branches   : 29.16%  ( 49 / 168)
Functions  : 38.46%  ( 10 / 26 )
Lines      : 42.28%  (126 / 298)
```

---

## Coverage by Layer

| Module | Statements | Branches | Functions | Notes |
|--------|-----------|----------|-----------|-------|
| `middlewares/authMiddleware.ts` | 100% | 87.5% | 100% | Line 28: edge-case branch (non-object decoded payload) |
| `controllers/authController.ts` | 90.78% | 78.04% | 100% | Uncovered: Mongoose error paths (lines 62, 70, 141–142, 180) |
| `controllers/postController.ts` | 60.27% | 29.41% | 57.14% | Uncovered: image upload retry loop, Cloudinary upload path, media URL handling |
| `controllers/accountsController.ts` | 0% | 0% | 0% | Not covered — Zernio OAuth integration (integration test required) |
| `controllers/socialAuthController.ts` | 0% | 0% | 0% | Not covered — Zernio OAuth integration (integration test required) |
| `controllers/aiComposerController.ts` | 0% | 0% | 0% | Not covered — thin wrapper, excluded by scope |
| `services/scheduleService.ts` | 0% | 0% | 0% | Not covered — requires real DB + cron context |
| `config/*` | 0% | — | — | Config modules: tested indirectly via mocks |

---

## Test Strategy Notes

### What is tested
- **Unit tests only** — all external dependencies (MongoDB, Redis, SMTP, Zernio, Cloudinary, Gemini) are mocked at module boundaries.
- All four auth controller functions (register, login, forgot-password, reset-password) across their happy paths and every documented error branch.
- The `protect` middleware covering the full decision tree: no header → wrong scheme → bad token → expired token → missing user → valid token.
- Post controller CRUD and AI generation entry points.
- JWT token shape and expiry encoding.

### What is not tested (and why)
| Module | Reason |
|--------|--------|
| `socialAuthController.ts` | Requires live Zernio OAuth flow and MongoDB; suited for integration tests |
| `accountsController.ts` | Same: Zernio API calls + DB writes require real credentials |
| `scheduleService.ts` | Cron-driven; needs real DB + time manipulation; suited for integration tests |
| `config/mailer.ts` | Nodemailer transport initialization tested implicitly via `forgotPassword` mock |
| `config/db.ts` | Mongoose connection — not a unit test concern |

### Known coverage gaps in tested files
| File | Uncovered area | Impact |
|------|---------------|--------|
| `authController.ts:62,70` | Mongoose `save()` rejection paths | Low — `save()` failure is handled by the global error middleware |
| `authController.ts:141–142` | bcrypt comparison error path | Low — bcrypt errors are extremely rare in practice |
| `authController.ts:180` | Edge case in reset token mismatch | Low |
| `postController.ts:80` | Pollinations image upload retry loop | Medium — retry logic not exercised |
| `postController.ts:100,116` | Cloudinary upload error and fallback | Medium |
| `authMiddleware.ts:28` | Non-standard decoded payload branch | Low |

---

## Issues Found During Test Authoring

1. **vitest 4.x constructor mock compatibility** — `vi.fn().mockImplementation(() => ({...}))` does not work reliably as a `new`-able constructor mock in vitest 4.x. The class-based mock pattern (`class { models = {...} }`) with `vi.hoisted()` is required for `GoogleGenAI`.

2. **`vi.mock` hoisting and `const` TDZ** — Variables referenced inside `vi.mock` factory functions must be created with `vi.hoisted()` to avoid the Temporal Dead Zone error in ESM modules.

---

## Recommendations

1. **Add integration tests for `socialAuthController` and `scheduleService`** using a local MongoDB instance (`mongodb-memory-server`) with seeded fixtures and a mocked Zernio client at the HTTP boundary.

2. **Add coverage for the Pollinations retry loop** in `postController` by mocking Cloudinary to simulate a 402 response on the first attempt.

3. **Target ≥ 80% branch coverage** on `authController` by adding tests that simulate DB `save()` failures and bcrypt errors using rejected mock promises.

4. **Add a `deletePost` / `updatePost` test** once those endpoints are implemented — the scheduler's `processing → failed` status transition is especially worth covering.

5. **CI integration** — add `npm test` to the GitHub Actions pipeline before the build step. Coverage threshold can be enforced with `--coverage.thresholds.statements=70` once integration tests are added.
