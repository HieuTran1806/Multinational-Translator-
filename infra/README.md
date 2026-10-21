# Local Docker environment

This directory provides a local development stack for the services present on the
`phase-1-contract-baseline` branch: PostgreSQL and the Spring Boot backend.

## Requirements

- Docker Desktop with Docker Compose v2+
- Ports 5432 and 8080 available (or override them in `.env`)
- Network access for the first image build and Maven dependency download

## Start

From the repository root in PowerShell:

```powershell
Copy-Item infra/.env.example infra/.env
notepad infra/.env
# Set POSTGRES_PASSWORD to a private local password before starting.
docker compose --env-file infra/.env -f infra/docker-compose.yml config
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d
docker compose --env-file infra/.env -f infra/docker-compose.yml ps
```

Backend: http://localhost:8080  
Health: http://localhost:8080/actuator/health  
Readiness: http://localhost:8080/actuator/health/readiness  
Liveness: http://localhost:8080/actuator/health/liveness

The `dev` Spring profile runs Flyway migrations and loads development demo data.
Use a separate database for integration tests; do not point tests at the development
database.

## Inspect and stop

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml logs --tail 200 backend postgres
docker compose --env-file infra/.env -f infra/docker-compose.yml down
```

The ordinary `down` command preserves named volumes. Do not add `-v` unless you
intentionally want to delete the database and media volumes.

## Scope on this branch

This branch currently does not contain `apps/admin/` or `apps/mobile/`. Consequently,
this Compose file does not claim to run the entire product UI or mobile app. The Admin
web app can only be added to the stack after its source and Docker build context are
restored to this branch. Mobile apps are normally built and run with their platform
toolchains, not as a long-running Compose service.

The backend image is built from the current source. It uses PostgreSQL in this stack,
a named volume for uploaded media, and the Dockerfile health check. Production deployment
requires separate secrets, HTTPS, a persistent storage/backup plan, and production
configuration; this local stack is not a production deployment.
