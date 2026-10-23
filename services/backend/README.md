# Backend — Spring Boot 4.1 (Java 21, Maven Wrapper)

```bash
# PostgreSQL: docker compose -f ../../infra/docker-compose.yml --env-file ../../infra/.env up -d postgres
export SPRING_PROFILES_ACTIVE=dev DB_PASSWORD=...        # xem .env.example
./mvnw spring-boot:run
./mvnw test        # unit test
./mvnw verify      # + integration test (cần TEST_DB_URL tới DB test riêng)
```

- Schema: `src/main/resources/db/migration` (Flyway); demo: `db/demo` (chỉ profile `dev`).
- Profiles: `application-{dev,test,prod}.yml`.
- OpenAPI: `/v3/api-docs`, `/swagger-ui.html` (dev).
- Kiến trúc/ERD/xác thực: [`../../docs/architecture/architecture.md`](../../docs/architecture/architecture.md) · API: [`../../docs/architecture/api.md`](../../docs/architecture/api.md)

- Quy tắc cấu trúc và phụ thuộc: [`ARCHITECTURE.md`](ARCHITECTURE.md).
