# syntax=docker/dockerfile:1
# ---------- Build stage ----------
FROM eclipse-temurin:21-jdk-noble AS build
WORKDIR /workspace
# Cache dependencies separately from sources
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src/ src/
RUN ./mvnw -B -q -DskipTests package

# ---------- Runtime stage ----------
FROM eclipse-temurin:21-jre-noble AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app && useradd --system --gid app --home /app app \
    && mkdir -p /app/data/media && chown -R app:app /app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/target/thuyet-minh-backend.jar ./app.jar
USER app
ENV SPRING_PROFILES_ACTIVE=prod \
    APP_STORAGE_LOCAL_ROOT=/app/data/media \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
VOLUME ["/app/data/media"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT:-8080}/actuator/health/liveness" || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
