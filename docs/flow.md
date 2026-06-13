# SocialSync — Request & Data Flows

---

## 1. Authentication Flow

```
User submits login form
        │
        ▼
POST /api/auth/login
        │
        ▼
authController: validate email/password (bcrypt.compare)
        │
        ▼
Sign JWT (30d expiry) → return { _id, name, email, token }
        │
        ▼
Client stores token in localStorage
AuthContext sets user state
React Router redirects to /dashboard
```

---

## 2. AI Content Generation Flow

```
User fills AIComposer form (prompt, tone, generateImage toggle)
        │
        ▼
POST /api/posts/generate  { prompt, tone, generateImage }
        │
        ▼
[Auth Middleware] verify JWT → attach req.user
        │
        ▼
generatePost controller:

  ┌─── Text generation ──────────────────────────────┐
  │  GoogleGenAI(gemini-2.5-flash)                   │
  │  Prompt asks for JSON: { content, imagePrompt }  │
  │  Parse response → extract content + imagePrompt  │
  └──────────────────────────────────────────────────┘
        │
        ▼  (if generateImage === true)
  ┌─── Image generation ─────────────────────────────┐
  │  Pollinations AI (free, no key)                  │
  │  URL: image.pollinations.ai/prompt/{encoded}     │
  │  Cloudinary uploads directly from URL            │
  │  mediaUrl = cloudinary secure_url                │
  └──────────────────────────────────────────────────┘
        │
        ▼
  Generation.create({ user, prompt, content, mediaUrl, tone })
        │
        ▼
Return generation document to client
Client displays content in editor + shows image preview
```

---

## 3. Post Scheduling Flow

```
User edits content in AIComposer / Scheduler
User selects platforms + picks a date/time
User clicks "Schedule"
        │
        ▼
POST /api/posts  (multipart/form-data if media uploaded)
        │
        ▼
[Auth Middleware]
        │
        ▼
schedulePost controller:
  - Parse platforms (JSON or CSV string)
  - If req.file: stream upload to Cloudinary → get mediaUrl
  - Otherwise: use mediaUrl from body (AI-generated)
  - Post.create({ user, content, platforms, mediaUrl, scheduledFor, status })
        │
        ▼
201 Created → post document returned to client
```

---

## 4. Scheduler (Auto-publish) Flow

```
Server starts → initScheduler()
        │
        ▼
node-cron runs every second ("* * * * * *")
        │
        ▼
scheduleService: query Post where status="scheduled"
                 AND scheduledFor <= now
        │
        ▼
For each due post:
  → Call Zernio API for each platform in post.platforms[]
  → On success: update post.status = "published"
  → Log to ActivityLog
  → On failure: update post.status = "failed"
```

---

## 5. Social Account Connect / Sync / Disconnect Flow

```
Connect:
  User clicks "Connect [Platform]" in PlatformPickerModal
        │
        ▼
  GET /api/oauth/:platform/url
        │
        ▼
  socialAuthController:
    getOrCreateZernioProfile(user)  ← creates profile on first connect, stores ID on User
    zernio.connect.getConnectUrl({ platform, redirectUrl })
        │
        ▼
  Return { authUrl } → client redirects user to Zernio/platform OAuth page
        │
        ▼
  User authorizes on the platform → Zernio stores tokens internally
        │
        ▼
  User lands back on /accounts page

Sync (after OAuth redirect):
  GET /api/oauth/sync
        │
        ▼
  socialAuthController:
    listAccounts from Zernio for this profile
    For each account:
      normalize platform name via platformMap
      Account.findOneAndUpdate(
        { zernioAccountId, user: req.user._id },   ← user filter prevents
        { ...fields },                              ←   overwriting another
        { upsert: true }                            ←   user's account
      )
        │
        ▼
  Return synced accounts array → client updates state

  Security: getOrCreateZernioProfile() always creates a NEW Zernio profile
  for users who don't have one yet. It no longer calls listProfiles() as a
  fallback, which previously returned profiles shared across all users of the
  same API key and caused cross-user account leakage.

Disconnect:
  DELETE /api/accounts/:id
        │
        ▼
  If account.zernioAccountId: call Zernio API to revoke
  Account.findByIdAndDelete
```

---

## 6. Media Upload Flow (Manual Post)

```
User attaches image/video in Scheduler
        │
        ▼
FormData → POST /api/posts  (multipart)
        │
        ▼
Multer (memoryStorage) buffers file in req.file
        │
        ▼
cloudinary.uploader.upload_stream({ resource_type: "auto" })
        │
        ▼
Returns secure_url + resource_type
Stored in Post.mediaUrl + Post.mediaType
```

---

## 7. Forgot Password / Reset Password Flow

```
Step 1 — Request reset link
  User clicks "Forgot password?" on Login page
  Enters email → clicks "Send reset link"
        │
        ▼
  POST /api/auth/forgot-password  { email }
        │
        ▼
  authController: forgotPassword()
    User.findOne({ email })

    if user not found:
      → respond 200 with same generic message (anti-enumeration)

    Throttle check:
      if resetPasswordExpires > (now + 59 min):
        → 429 "please wait 60 seconds"

    Generate token:
      rawToken  = crypto.randomBytes(32).toString("hex")   ← sent in email link
      hashToken = sha256(rawToken)                          ← stored in DB
    
    user.resetPasswordToken   = hashToken
    user.resetPasswordExpires = now + 1 hour
    user.save()

    Send email via Nodemailer (Gmail SMTP):
      To: user.email
      Link: {client origin}/reset-password/{rawToken}

    → respond 200 with same generic message
        │
        ▼
  Client shows "Check your inbox" screen
  Resend link available after 60-second cooldown

---

Step 2 — Set new password
  User clicks link in email → lands on /reset-password/:rawToken
        │
        ▼
  POST /api/auth/reset-password/:rawToken  { password }
        │
        ▼
  authController: resetPassword()
    hashToken = sha256(rawToken)
    User.findOne({
      resetPasswordToken: hashToken,
      resetPasswordExpires: { $gt: now }     ← rejects expired tokens
    })

    if not found:
      → 400 "Reset link is invalid or has expired"

    bcrypt.hash(password, 10) → user.password
    user.resetPasswordToken   = undefined
    user.resetPasswordExpires = undefined
    user.save()

    → 200 "Password updated successfully"
        │
        ▼
  Client shows success screen → "Go to Sign In" button
```

**Security notes:**
- Only the SHA-256 hash is stored in the database; the raw token lives only in the email link and never touches the DB — so a DB breach cannot be used to reset passwords.
- The throttle (60s) prevents email flooding.
- The anti-enumeration pattern (same response whether email exists or not) prevents attackers from probing which emails are registered.
- Token expires in 1 hour; cleared from DB immediately after use.

---

## 8. Schedule Modal (AIComposer)

```
User clicks "Schedule Post" on a generation card
        │
        ▼
setActiveSchedular(gen) → modal renders (activeSchedular is truthy)

User fills platforms + date + time → clicks "Schedule Post" button
        │
        ├── success path:
        │     post created → toast.success
        │     setActiveSchedular(null) → modal closes
        │     form fields reset
        │
        └── error path:
              toast.error → modal stays open so user can retry

User clicks backdrop (area outside modal)
        │
        ▼
backdrop onClick → setActiveSchedular(null) → modal closes

User clicks ✕ button
        │
        ▼
setActiveSchedular(null) → modal closes
```

---

## Error Handling Summary

| Layer | Strategy |
|---|---|
| Auth | 401 if no/invalid JWT |
| Validation | 400 with descriptive message |
| Image gen failure | Silent catch — post saved without image |
| Scheduler failure | ActivityLog entry with status "failed" |
| Account sync cross-user | upsert filter includes `user` — silently skips |
| Global | Express error middleware → 500 |
