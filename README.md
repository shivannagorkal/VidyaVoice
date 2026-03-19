# VidyaVoice Deployment Guide

## Backend on Render

1. Create a new Web Service in Render.
2. Set:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
3. Add environment variables:
   - `GROQ_API_KEY`
   - `MURF_API_KEY`
4. Deploy and copy the Render URL.

## Frontend on Vercel

1. Import the repo into Vercel.
2. Set:
   - Root Directory: `client`
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add these environment variables in Vercel:
   - `VITE_API_URL=https://render-backend.onrender.com`
   - `VITE_CLERK_PUBLISHABLE_KEY = your-clerk-publish-key` 
4. In Firebase Console, add your Vercel domain under authorized domains for Authentication.
5. Deploy.

## Local Development

Create `client/.env.local`:

```bash
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY = your-clerk-publish-key
```

Create `server/.env`:

```bash
GROQ_API_KEY=...
MURF_API_KEY=...
PORT=3001
```

Run:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```
