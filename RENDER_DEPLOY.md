# Deploy Backend on Render

Render runs from the **repo root** by default. This project’s backend lives in the **`backend/`** folder, so you need to set the **Root Directory**.

## Option 1: Dashboard (quick)

1. Open your **Render** service (e.g. Web Service).
2. Go to **Settings**.
3. Under **Build & Deploy**, set **Root Directory** to:
   ```text
   backend
   ```
4. **Build Command:** `npm install` (or leave default).
5. **Start Command:** `npm start` (or leave default).
6. Save and trigger a new deploy.

## Option 2: Blueprint (`render.yaml`)

A **`render.yaml`** in the repo root is set up so the web service uses `rootDir: backend`. If you use **Blueprint** when creating the service, Render will pick this up and use the `backend` folder automatically.

---

**Environment variables** (in Render dashboard → Environment):

- `MONGO_URI` or `MONGODB_URI` – MongoDB Atlas connection string  
- `JWT_SECRET` – secret for JWT  
- `CLIENT_URL` – frontend URL (e.g. `https://your-app.vercel.app`) for CORS  
- `PORT` – set by Render; no need to add it yourself  

Then redeploy after setting **Root Directory** to **`backend`**.
