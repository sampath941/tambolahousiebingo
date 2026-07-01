# Stage 1: run tests — build fails if any test fails
FROM python:3.12-slim AS test
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV DATABASE_URL=sqlite:///./test.db
ENV JWT_SECRET=test-secret-build-only
RUN pytest tests/ -v --tb=short

# Stage 2: production image
FROM python:3.12-slim AS production
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Run Alembic migrations then start the server
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
