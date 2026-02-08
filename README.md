# Todo App (Angular + Strapi + Postgres + Local AI)

A simple authenticated todo app:
- **Frontend:** Angular + Angular Material (served by Nginx in Docker)
- **Backend:** Strapi (Content API) + users-permissions auth
- **DB:** Postgres
- **AI (free/local):** Ollama generates a “today plan” and creates tasks via a button in the UI

## Quickstart (Docker – recommended)

### 1) Start everything

```bash
docker compose up -d --build
```

Frontend: `http://localhost:8080`  
Strapi admin: `http://localhost:1337/admin`

### 2) Pull the AI model (one-time)

This downloads the model into the Docker volume.

```bash
docker compose exec ollama ollama pull llama3.2:3b
```

### 3) Create accounts and use the app

1. Open Strapi admin (`http://localhost:1337/admin`) and create the **admin** user (first-run).
2. Open the frontend (`http://localhost:8080`) and **register/login** as a normal user.
3. Go to **My Tasks** and click **AI Plan Today** to generate tasks for the day.

## AI “Plan Today” (how it works)

- Frontend calls: `POST /api/tasks/generate-today`
- Strapi calls Ollama’s API to generate JSON tasks, then stores them for the logged-in user.
- Backend env vars:
  - `OLLAMA_BASE_URL` (example in Docker: `http://ollama:11434`)
  - `OLLAMA_MODEL` (default: `llama3.2:3b`)

If the AI button returns an error:
- Ensure the model is pulled: `docker compose exec ollama ollama list`
- Check backend logs: `docker compose logs -f strapi`

## Running without Docker (optional)

### Backend (Strapi)

```bash
cd backend
npm install
npm run develop
```

Create a `.env` using `backend/.env.example` and set:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

### Local Ollama

Install Ollama, then:

```bash
ollama pull llama3.2:3b
ollama serve
```

### Frontend (Angular)

The frontend uses relative `/api/*` calls. In Docker, Nginx proxies `/api` to Strapi.
For `ng serve`, you’ll need a dev proxy. Example `frontend/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:1337",
    "secure": false,
    "changeOrigin": true
  }
}
```

Then run:

```bash
cd frontend
npm install
ng serve --proxy-config proxy.conf.json
```

Frontend dev server: `http://localhost:4200`

## Useful URLs / Ports

- Frontend (Docker): `http://localhost:8080`
- Strapi API (Docker): `http://localhost:1337/api`
- Strapi Admin (Docker): `http://localhost:1337/admin`
- Postgres (host port): `localhost:5433` → container `5432`

## Notes

- `docker-compose.yml` is set up for local development (it includes dev secrets/passwords). Change them before any real deployment.

