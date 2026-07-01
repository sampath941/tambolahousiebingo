# Stage 1: run Python tests (fail fast before building anything)
FROM python:3.12-slim AS py-test
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
ENV DATABASE_URL=sqlite:///./test.db
ENV JWT_SECRET=test-secret-build-only
RUN pytest tests/ -v --tb=short

# Stage 2: build React frontend
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL intentionally unset → BASE defaults to '' → same-origin API calls
RUN npm run build

# Stage 3: production image — Python + built frontend
FROM python:3.12-slim AS production
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=frontend-build /build/dist ./dist
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
