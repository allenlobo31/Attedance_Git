# Nexus Attendance

## Deploy the backend on Render

This repository includes `render.yaml` for the API service. The frontend is deployed separately on Vercel. Create a MongoDB Atlas database first and allow connections from Render (`0.0.0.0/0` in the Atlas network access list, or use a restricted egress setup).

1. In Render, create a Blueprint from this repository and select `render.yaml`.
2. Set `MONGO_URI`, `VENUE_LAT`, `VENUE_LNG`, `ADMIN_KEY`, and `CLIENT_ORIGIN` when prompted.
3. Deploy and copy the generated backend URL. Render uses `/api/health` as the health check.

## Deploy the frontend on Vercel

1. Import this repository into Vercel.
2. Set the project root to `frontend`.
3. Add the environment variable `VITE_API_URL` with the deployed Render backend URL, without a trailing slash.
4. Deploy, then set Render's `CLIENT_ORIGIN` to the Vercel URL and redeploy the backend if needed.

Vercel uses `frontend/vercel.json` and builds the app with Vite. For local development, run the backend and frontend separately; the Vite proxy forwards `/api` requests to `http://localhost:5000`.
