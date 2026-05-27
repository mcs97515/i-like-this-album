# I Like This Album

A music recommendation web app — search for an album you love and get personalized recommendations based on it. Built by lionsss.

## Features

- **Album search & recommendations** — powered by the Last.fm API, with results cached in Redis and persisted in Postgres
- **Streaming links** — every recommendation includes direct Spotify and Apple Music links fetched from the iTunes Search API
- **Search history** — a deduplicated log of every album you've searched, with quick links back to results
- **Google sign-in** — authentication via NextAuth
- **Animated UI** — page transitions, a spinning 3D thumbs-up, hover and tap effects throughout

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth (Google OAuth) |
| Database | PostgreSQL via Prisma |
| Cache | Redis (Upstash) |
| Music data | Last.fm API |
| Streaming links | iTunes Search API |
| Fonts | DM Sans |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Last.fm API key
- Google OAuth credentials

### Environment Variables

Create a `.env` file at the root:

```env
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
LASTFM_API_KEY=
```

### Install & Run

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Recommended stack (all have free tiers):

- **Vercel** — hosting
- **Neon** — serverless Postgres
- **Upstash** — serverless Redis

After provisioning, set your environment variables in the Vercel dashboard and update your Google OAuth redirect URI to your production domain.

## License

MIT
