# GiftMap (Wakadobe Africa)

*Helping people maintain and strengthen meaningful relationships in a busy world.*

**Live demo:** https://gbyt-frontend.onrender.com
**Backend API:** https://gbyt-backend.onrender.com

> First load may take 20-30 seconds. The backend and database run on Render's free tier, which sleeps after periods of inactivity and wakes on the first request.

---

## Why GiftMap Exists

As life gets busier, people often struggle to consistently show appreciation to those who matter most — and relationships quietly erode when moments go uncelebrated.

GiftMap uses AI to help people discover thoughtful, personalized gifts that fit both the recipient's personality and the sender's budget, making it easier to celebrate the relationships, milestones, and moments that strengthen human connection.

The AI is the mechanism. The real product is relationship intelligence — GiftMap learns who your important people are, what they're like, and what occasions matter, getting more useful with every search.

---

## What GiftMap Does

Tell GiftMap who you're buying for, your relationship to them, their personality, and your budget. It searches real product data, reasons over what's actually affordable and personally resonant, and returns three distinct gift combinations — each explaining specifically why it suits this person and this occasion.

```
Recipient + Budget + Occasion
          ↓
   Real product inventory (fetched live)
          ↓
   AI reasoning (Gemini)
          ↓
   3 structured gift options, each within budget
```

No generic listicles. No items you can't actually afford. Suggestions are built from real product names and brands, not a static catalog.

---

## Architecture

GiftMap is a three-tier application: a React frontend, an Express backend, and a PostgreSQL database, each deployed independently.

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React Frontend │ ───> │  Express Backend  │ ───> │   PostgreSQL    │
│   (Render Static)│ <─── │  (Render Web Svc) │ <─── │  (Render DB)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                   │
                                   ├──> Gemini API (AI reasoning)
                                   │
                                   └──> Open Food Facts (product data,
                                        via server-side proxy)
```

### Why the backend proxies the inventory API

Open Food Facts' staging API does not return CORS headers permitting direct browser requests from arbitrary origins. Rather than work around this with a third-party CORS proxy, the Express backend makes the request server-side — where CORS does not apply at all, since CORS is a browser-enforced restriction — and forwards the result to the frontend. This also keeps the staging API's auth credentials out of the client bundle entirely.

### Why suggestions are returned as structured JSON, not prose

Early versions had Gemini return a formatted paragraph, which the frontend displayed as raw text. This was fragile — any change in Gemini's phrasing could break formatting — and prevented rendering suggestions as proper semantic HTML. The prompt now explicitly requests a fixed JSON shape (`options[]`, each with `title`, `items`, `total`, `reason`), which the frontend renders as structured `<dl>` elements. AI output is treated as data, not display text.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | Fast dev experience, component reuse |
| Routing | React Router | Client-side navigation, no full reloads |
| Backend | Express (Node.js) | Minimal, well-understood, easy to reason about |
| Database | PostgreSQL | Relational integrity between users, recipients, and searches |
| Auth | JWT + bcrypt | Stateless auth, industry-standard password hashing |
| AI | Google Gemini (`gemini-flash-lite-latest`) | Free tier, structured output support |
| Product data | Open Food Facts (staging API) | Real product names and brands, free, no API key required |
| Hosting | Render | Single provider for static site, web service, and managed Postgres |

---

## Data Model

```
users
 ├─ id (UUID, PK)
 ├─ email (unique)
 ├─ password_hash
 ├─ fullname
 └─ created_at

recipients
 ├─ id (UUID, PK)
 ├─ user_id (FK → users.id, ON DELETE CASCADE)
 ├─ name
 └─ created_at

gift_searches
 ├─ id (UUID, PK)
 ├─ user_id (FK → users.id, ON DELETE CASCADE)
 ├─ recipient_id (FK → recipients.id, ON DELETE CASCADE)
 ├─ occasion
 ├─ budget
 ├─ suggestions (TEXT — JSON-stringified AI response)
 └─ created_at
```

One user has many recipients. One recipient has many gift searches. Deleting a user cascades through both child tables.

---

## API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | No | Create an account, returns JWT |
| POST | `/users/login` | No | Authenticate, returns JWT |
| GET | `/users/me` | Yes | Current user's profile |
| GET | `/gifts` | Yes | All saved gift searches for the logged-in user |
| POST | `/gifts` | Yes | Save a new gift search |
| DELETE | `/gifts/:id` | Yes | Delete a saved search (only if owned by requester) |
| GET | `/inventory/:category` | No | Proxies Open Food Facts for a given category |
| GET | `/health` | No | Server status check |

---

## Running Locally

### Prerequisites

- Node.js 24+
- PostgreSQL 18+
- A Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### Backend

```bash
cd gbyt-server
npm install
```

Create `.env`:

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=giftmap
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=any_long_random_string
```

Create the database and tables:

```bash
psql -U postgres -c "CREATE DATABASE giftmap;"
psql -U postgres -d gbyt -f schema.sql
```

Run the server:

```bash
npm run dev
```

Server runs at `http://localhost:3001`. Confirm with `GET /health`.

### Frontend

```bash
cd gbyt
npm install
```

Create `.env`:

```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Run the dev server:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

> Always run `npm run build` locally before pushing. Vite's dev server resolves imports more leniently than its production build — a passing `npm run dev` does not guarantee a successful deploy.

---

## Deployment

Both services deploy to [Render](https://render.com) from their respective GitHub repositories, with auto-deploy on push to `main`.

**Database** — Render PostgreSQL (free tier). Backend connects via `DATABASE_URL`, Render's single-string connection format.

**Backend** — Render Web Service. Build command `npm install`, start command `npm start`.

**Frontend** — Render Static Site. Build command `npm run build`, publish directory `dist`.

### Required environment variables

**Backend:**

| Variable | Source |
|---|---|
| `DATABASE_URL` | Render PostgreSQL → Connections → Internal Database URL |
| `JWT_SECRET` | Any long random string |
| `FRONTEND_URL` | Live frontend URL, for CORS |
| `PORT` | `3001` |

**Frontend:**

| Variable | Source |
|---|---|
| `VITE_API_URL` | Live backend URL (no trailing slash, no `/api`) |
| `VITE_GEMINI_API_KEY` | Gemini API key |

> Vite environment variables are compiled into the build at build time, not read at runtime. Adding or changing one on Render requires a fresh deploy — saving the variable alone does not update an already-built `dist` folder.

---

## Known Constraints

Documented honestly, since they reflect real architectural decisions rather than oversights.

**Open Food Facts staging is not a production-grade dependency.** It is free, requires no API key, and returns real product names and brands — but it does not provide pricing (estimated locally by category) and its legacy full-text search backend has known reliability issues. The structured-filter endpoint used here (`/api/v2/search` with tag-prefixed category filters) is more stable but still beta infrastructure on Open Food Facts' end, not something GiftMap controls.

**Render's free tier sleeps after 15 minutes of inactivity.** The first request after a sleep period takes 10-30 seconds to respond while the instance wakes. This affects both the backend and the database's responsiveness, not just the frontend.

**The free Postgres instance has a limited lifespan on Render's free tier.** It is not provisioned for long-term production data retention as configured.

---

## Roadmap

- [ ] Migrate inventory source to a direct retailer partnership (starting with one local supermarket) or Open Food Facts' Search-a-licious API once it exits beta
- [ ] Visual/UX redesign pass on Results and History pages
- [ ] Recipient profiles (save preferences across multiple searches per person)
- [ ] Move off Render's free tier for production-grade uptime and database persistence
- [ ] Rate limiting and request retry visibility for AI calls

---

## Project History

Built iteratively, frontend through backend through deployment, with each layer added once the previous one was working end to end. Notable real-world lessons absorbed along the way: model deprecation handling (Gemini 2.0 Flash retirement), the difference between CORS failures and underlying server errors, case-sensitive filesystem bugs invisible in local Windows development, and the tradeoffs between client-side and server-side proxying for third-party APIs.