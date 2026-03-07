# Frontend (Next.js)

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

## Deploy to Vercel

If this repo is imported as a monorepo, set **Root Directory** to `frontend` in Vercel project settings.

Then set this environment variable in Vercel:

- `NEXT_PUBLIC_API_URL`

Build command and install command are defined in [`vercel.json`](./vercel.json).
