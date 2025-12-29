# Deployment Guide - Daily Dairy Manager

This guide provides instructions for deploying the application locally using Docker Compose and to production platforms like Render or Railway.

## Local Deployment (Docker Compose)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Steps
1. **Clone the repository.**
2. **Build and start the containers:**
   ```bash
   docker-compose up --build -d
   ```
3. **Access the application:**
   - Frontend: [http://localhost](http://localhost)
   - Backend Health: [http://localhost/health](http://localhost/health)

---

## Production Deployment (Render)

Render supports Docker out of the box and provides a managed PostgreSQL service.

### 1. Database Setup
1. Log in to [Render](https://render.com/).
2. Create a **New PostgreSQL** database.
3. Note the **Internal Database URL** for the server and the **External Database URL** for local debugging if needed.

### 2. Server Deployment
1. Create a **New Web Service**.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `server`.
4. Render will detect the `Dockerfile`.
5. Add the following **Environment Variables**:
   - `DATABASE_URL`: The Internal Database URL from Step 1.
   - `PORT`: `3001`
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://dairy-manager.onrender.com`).
   - `NODE_ENV`: `production`

### 3. Client Deployment
1. Create a **New Static Site**.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `client`.
4. Set **Build Command**: `npm run build`
5. Set **Publish Directory**: `dist`
6. (Alternatively, use the Dockerfile by selecting **Web Service** instead of **Static Site** and pointing to `client`).

---

## Production Deployment (Railway)

Railway is excellent for "all-in-one" deployments.

### Steps
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will analyze your project. You can add a **Postgres** database to the same project.
5. Railway will automatically link the database URL. Ensure the `DATABASE_URL` variable is shared with the `server` service.
6. For the client, ensure the `VITE_API_URL` points to your deployed server URL.

---

## Post-Deployment Verification
- Ensure Prisma migrations have run. In Docker, this is typically handled in a `prestart` script or manually once:
  ```bash
  docker-compose exec server npx prisma migrate deploy
  ```
