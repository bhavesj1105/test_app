# BakBak Backend - Docker Setup

This guide explains how to run the backend with Postgres and Adminer using Docker Compose.

## Prerequisites
- Docker Desktop (macOS/Windows) or Docker Engine (Linux)
- docker-compose v1 or v2

## What gets created
- Postgres 16 database (port 5432)
- Adminer DB UI (port 8080)
- BakBak server (Node.js, port 5000)

## Environment variables
The compose file loads `bakbak-server/.env.example` for convenience.
You can copy and customize it as `bakbak-server/.env` and point compose to that instead.

Important vars (with defaults in compose):
- DB_HOST=db (service name)
- DB_PORT=5432
- DB_USERNAME=postgres
- DB_PASSWORD=postgres
- DB_DATABASE=bakbak_db
- JWT_SECRET=change_me

## First run
```sh
# from repo root
docker-compose up --build
```

Then open:
- Backend API: http://localhost:5000
- Adminer: http://localhost:8080 (System: PostgreSQL, Server: db, User: postgres, Password: postgres, DB: bakbak_db)

## Notes
- The backend reads TypeORM config from `src/config/database.ts`. In development mode (NODE_ENV=development), it enables schema synchronize.
- The `uploads` folder is volume-mounted so files persist across container restarts.
- For production, build with `NODE_ENV=production` and use real secrets (do not mount `.env.example`). Migrations should be run instead of synchronize.

### Custom PORT and DATABASE_URL
- To change the API port (host side), set `PORT` in your shell when running compose, e.g. `PORT=4000 docker-compose up --build`. The container still listens on 5000; the host maps to your `PORT`.
- If you prefer a single connection string, set `DATABASE_URL` (e.g. `postgres://postgres:postgres@db:5432/bakbak_db`). When set, it overrides individual DB_* variables.

## Common issues
- Port conflicts: stop local Postgres or change mapped ports in `docker-compose.yml`.
- Permissions on volumes: on Linux, ensure your user can write to `./bakbak-server/uploads`.
