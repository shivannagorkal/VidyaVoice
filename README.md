# VidyaVoice — Deployment Guide

## Step 1 — Set up Clerk (Authentication)

1. Go to **https://clerk.com** → Sign up free
2. Click **Create Application**
3. Name it `VidyaVoice`
4. Enable **Google** and/or **Email** login
5. Go to **API Keys** → copy:
   - `Publishable Key` (starts with `pk_`)
6. Go to **Domains** → add your Vercel URL after deploy (e.g. `vidyavoice.vercel.app`)

---

## Step 2 — Deploy Backend to Render

1. Go to **https://render.com** → Sign up free with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repo (push your code first — see Step 4)
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Add **Environment Variables**:
   ```
   GROQ_API_KEY    = your groq key
   MURF_API_KEY    = your murf key
   ```
6. Click **Deploy** → wait ~2 mins
7. Copy your Render URL (e.g. `https://vidyavoice-api.onrender.com`)

---

## Step 3 — Deploy Frontend to Vercel

1. Go to **https://vercel.com** → Sign up free with GitHub
2. Click **New Project** → import your repo
3. Settings:
   - **Root Directory**: `client`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY = pk_live_xxxx   (from Clerk)
   VITE_API_URL               = https://vidyavoice-api.onrender.com
   ```
5. Click **Deploy** → wait ~1 min
6. Copy your Vercel URL (e.g. `https://vidyavoice.vercel.app`)

---

## Step 4 — Push code to GitHub

```bash
# In the vidyavoice root folder
git init
git add .
git commit -m "VidyaVoice initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vidyavoice.git
git push -u origin main
```

---

## Step 5 — Add Vercel URL to Clerk

1. Go back to Clerk Dashboard → **Domains**
2. Add your Vercel URL: `vidyavoice.vercel.app`
3. Also add to **Allowed Origins** in Clerk settings

---

## Step 6 — Test

Open `https://vidyavoice.vercel.app`
- You should see the VidyaVoice login page
- Sign in with Google or Email
- Complete onboarding and start chatting!

---

## Local Development (with auth)

```bash
# client/.env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
VITE_API_URL=

# server/.env
GROQ_API_KEY=gsk_xxxx
MURF_API_KEY=xxxx
PORT=3001
```

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm install && npm run dev
```