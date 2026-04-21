# leanlearn Setup Guide

This guide covers the setup for both local development and production deployment.

## 1. Prerequisites
- Node.js (v20 or higher)
- npm
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## 2. Environment Configuration
The project uses `.dev.vars` for local environment variables and Cloudflare Dashboard for production.

### Local Development (.dev.vars)
Create a file named `.dev.vars` in the root directory:

```bash
BETTER_AUTH_SECRET="your_secure_secret"
BETTER_AUTH_URL="http://localhost:5173"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Obtaining Google Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create/Select a project.
3. Go to **APIs & Services > Credentials**.
4. Create an **OAuth client ID** (Web application).
5. Add Authorized JavaScript origins: `http://localhost:5173` (Local) and your production URL.
6. Add Authorized redirect URIs: `http://localhost:5173/api/auth/callback/google`

---

## 3. Local Development Workflow (SQLite)
For a faster "Lean" experience, local development uses a local `dev.db` SQLite file.

### Initial Setup
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Sync Schema to Local DB:**
   ```bash
   npx drizzle-kit push --config=drizzle.dev.config.ts
   ```

3. **Seed Local Data:**
   ```bash
   node scripts/seed-local.js
   ```

4. **Run Dev Server:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).

---

## 4. Production Workflow (Cloudflare D1)
In production, the app uses Cloudflare D1 and Pages.

### One-Click Deploy
The fastest way to deploy is using the Cloudflare Deploy button:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/adityak74/leanlearn)

This will:
1. Fork the repository.
2. Setup a Cloudflare Pages project.
3. Provision a Cloudflare D1 database.

### Manual Database Initialization
If you prefer manual control:

1. **Generate Migrations:**
   ```bash
   npm run db:generate
   ```

2. **Apply Migrations to D1:**
   ```bash
   # Local testing with D1 proxy
   npm run db:migrate
   
   # Remote D1 (Production)
   npx wrangler d1 migrations apply DB --remote
   ```

3. **Seed Remote D1:**
   ```bash
   npx wrangler d1 execute DB --remote --file=scripts/seed.sql
   ```

### Deployment
1. **Set Environment Variables:**
   Go to your Cloudflare Pages Dashboard > Settings > Environment Variables and add your production secrets.
   
2. **Deploy:**
   ```bash
   npm run deploy
   ```

---

## 5. Architecture Notes
- **Cloudflare-Native Stack:** The application is built to run entirely on the Cloudflare edge. It utilizes **Cloudflare Pages** for hosting, **Cloudflare D1** for low-latency relational data, and **Cloudflare Workers** (via React Router's single-fetch) for server-side logic.
- **Database Selection:** The app automatically switches between Cloudflare D1 and Local SQLite via `app/db/db.server.ts`. It detects the presence of the D1 binding and falls back to `dev.db` if unavailable.
- **Authentication:** Better Auth handles sessions. Ensure your `BETTER_AUTH_URL` matches the environment you are currently in.
- **Styling:** Global styles are managed in `app/styles/app.css` and integrated via `app/root.tsx`.
