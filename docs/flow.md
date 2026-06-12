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
Sign JWT (7d expiry) → return { token, user }
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
node-cron runs every minute
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

## 5. Social Account Connect / Disconnect Flow

```
Connect:
  User clicks "Connect [Platform]"
        │
        ▼
  POST /api/accounts/connect  { platform }
        │
        ▼
  accountController → Zernio: create OAuth URL
        │
        ▼
  Return authUrl → client opens OAuth popup / redirect
        │
        ▼
  OAuth callback → /api/oauth/[platform]/callback
        │
        ▼
  socialAuthController: exchange code → access token
  Account.create({ user, platform, accessToken, username })
        │
        ▼
  Client refreshes account list

Disconnect:
  DELETE /api/accounts/:id
        │
        ▼
  Account.findByIdAndDelete → Zernio revoke token
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

## Error Handling Summary

| Layer | Strategy |
|---|---|
| Auth | 401 if no/invalid JWT |
| Validation | 400 with descriptive message |
| Image gen failure | Silent catch — post saved without image |
| Scheduler failure | ActivityLog entry with status "failed" |
| Global | Express error middleware → 500 |
