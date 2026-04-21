# 🎓 leanlearn

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)
[![React Router](https://img.shields.io/badge/React%20Router-v7-red)](https://reactrouter.com/)
[![Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-black)](https://www.better-auth.com/)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/adityak74/leanlearn)

**leanlearn** is a modern, high-performance Learning Management System (LMS) built for speed and simplicity. It leverages a Cloudflare-native stack (Pages, D1, Workers) to provide a "Lean" experience for both learners and developers.

[Explore the Docs](SETUP.md) · [Report Bug](https://github.com/adityak74/leanlearn/issues) · [Request Feature](https://github.com/adityak74/leanlearn/issues)

---

## ✨ Key Features

- **🔐 Robust Authentication:** Secure Google OAuth integration powered by Better Auth.
- **📖 Structured Learning:** Hierarchical courses, chapters, and activities (Text/Video).
- **📈 Progress Persistence:** Real-time progress tracking with automatic saving to Cloudflare D1.
- **🎓 Automated Certification:** Earn printable A4 landscape certificates upon 100% course completion.
- **📊 Learner Profile:** Aggregated statistics including average progress and earned certificates.
- **⚡ Performance Optimized:** Parallel data fetching, aggressive asset caching, and minimal bundle size.

## 🛠 Tech Stack

- **Framework:** [React Router v7](https://reactrouter.com/) (Full-stack)
- **Server:** [Hono](https://hono.dev/) (Lightweight & Cloudflare-ready)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (Edge SQLite)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Auth:** [Better Auth](https://www.better-auth.com/)
- **Testing:** [Vitest](https://vitest.dev/)
- **Styling:** Vanilla CSS Variables (The "Lean" way)

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- Cloudflare Wrangler CLI

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adityak74/leanlearn.git
   cd leanlearn
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.dev.vars` file for local development:
   ```bash
   BETTER_AUTH_SECRET="your_secret"
   BETTER_AUTH_URL="http://localhost:5173"
   GOOGLE_CLIENT_ID="your_google_id"
   GOOGLE_CLIENT_SECRET="your_google_secret"
   ```

4. **Initialize Local Database:**
   ```bash
   npx drizzle-kit push --config=drizzle.dev.config.ts
   node scripts/seed-local.js
   ```

5. **Start Developing:**
   ```bash
   npm run dev
   ```

For detailed instructions, see the [Setup Guide](SETUP.md).

## 📁 Project Structure

```text
├── app/
│   ├── db/          # Schema and Database Helpers
│   ├── lib/         # Shared libraries (Auth client, etc.)
│   ├── routes/      # Page routes and API endpoints
│   ├── styles/      # Global styling (app.css)
│   ├── root.tsx     # Root layout and global providers
│   └── server.ts    # Hono server entry point
├── migrations/      # D1 migration files
├── scripts/         # Seeding and maintenance scripts
├── tests/           # Vitest integration tests
└── wrangler.jsonc   # Cloudflare deployment config
```

## 🧪 Testing

Run the automated test suite to verify business logic:
```bash
npm test
```

## ☁️ Deployment

### One-Click Deploy
You can deploy this entire stack (including D1 database setup) directly to Cloudflare using the button below:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/adityak74/leanlearn)

### Manual Deployment
Deploy to Cloudflare Pages manually using the Wrangler CLI:
```bash
npm run deploy
```
*Note: Ensure you have your D1 database and KV namespaces configured in `wrangler.jsonc` before manual deployment.*

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

---

Built with ❤️ by [Aditya Karnam](https://github.com/adityak74)
