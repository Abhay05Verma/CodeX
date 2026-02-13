# Deploy Frontend on Vercel

1. **Connect repo**  
   In [Vercel](https://vercel.com), import your repo and set **Root Directory** to `frontend` (or `CodeX/frontend` if your repo root is `CodeX`).

2. **Environment variable**  
   In the project → **Settings → Environment Variables**, add:
   - **Name:** `NEXT_PUBLIC_API_URL`  
   - **Value:** Your backend URL (e.g. `https://your-app.onrender.com` for a backend hosted on Render).  
   Use the same value for Production, Preview, and Development if you use one backend for all.

3. **Deploy**  
   Push to your branch; Vercel will run `npm install` and `npm run build`. The app will call your backend via the rewrites in `next.config.ts` using `NEXT_PUBLIC_API_URL`.

**Note:** The backend (Express) should be deployed elsewhere (e.g. Render). This frontend only runs on Vercel and talks to that backend URL.
