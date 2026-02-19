# Deployment Guide: Nexus on Render

Follow these steps to deploy Nexus to the cloud for free using [Render.com](https://render.com).

## 1. Preparation (Already Done)
*   **Backend:** `requirements.txt` now includes `gunicorn` and `psycopg2`.
*   **Frontend:** `api.js` is configured to look for `VITE_API_URL`.
*   **Repo:** Your GitHub repository is clean and ready.

## 2. Deploy Database (Optional but Recommended)
*   *Note:* You can skip this and use SQLite (Ephemeral) for a quick demo, but data will reset on redeploy.
1.  On Render, click **New +** -> **PostgreSQL**.
2.  Name: `nexus-db`.
3.  Region: `Frankfurt` (or closest).
4.  Plan: **Free**.
5.  Click **Create Database**.
6.  Copy the **Internal DB URL** (starts with `postgres://...`).

## 3. Deploy Backend (Web Service)
1.  Click **New +** -> **Web Service**.
2.  Connect your GitHub repo `nexus-project`.
3.  **Name:** `nexus-api`.
4.  **Region:** Same as DB.
5.  **Root Directory:** `backend`.
6.  **Runtime:** `Python 3`.
7.  **Build Command:** `pip install -r requirements.txt`.
8.  **Start Command:** `gunicorn run:app`.
9.  **Environment Variables:**
    *   `DATABASE_URL`: Paste the Internal DB URL from Step 2 (or leave blank for SQLite).
    *   `SECRET_KEY`: Generate a random string.
    *   `OPENAI_API_KEY`: Your OpenAI Key (sk-...).
10. Click **Create Web Service**.
11. **Wait:** Once deployed, copy the service URL (e.g., `https://nexus-api.onrender.com`).

## 4. Deploy Frontend (Static Site)
1.  Click **New +** -> **Static Site**.
2.  Connect your GitHub repo `nexus-project`.
3.  **Name:** `nexus-web`.
4.  **Root Directory:** `frontend`.
5.  **Build Command:** `npm install && npm run build`.
6.  **Publish Directory:** `dist`.
7.  **Environment Variables:**
    *   `VITE_API_URL`: Paste the Backend URL from Step 3 (MUST end with `/api`).
        *   Example: `https://nexus-api.onrender.com/api`
8.  Click **Create Static Site**.

## 5. Final Verification
1.  Visit your Frontend URL (e.g., `https://nexus-web.onrender.com`).
2.  Login with `admin@nexus.ai` / `admin123`.
3.  If using a fresh DB, the seed data won't be there.
    *   You can run the seed script remotely via the Render Shell (Paid) OR
    *   Add a temporary route to trigger seeding (Recommended for Demo).

## (Optional) Quick Seed Route
If you want to seed the DB on the live site:
1.  Add `SEED_SECRET` to backend env vars.
2.  Call `POST https://nexus-api.onrender.com/seed?secret=YOUR_SECRET`.
