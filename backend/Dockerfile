FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2 if needed (using binary here so mostly skip)
# RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend as a package to satisfy 'backend.app:create_app'
COPY . backend/

ENV PYTHONPATH=/app
ENV FLASK_APP=backend.app:create_app
ENV PORT=5000

EXPOSE 5000

# Default command uses gunicorn for production. 
# Overridden in docker-compose.yml to include migrations.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:create_app()"]