FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend as a package to satisfy 'from backend.app' imports
COPY . backend/

ENV PYTHONPATH=/app
ENV FLASK_APP=backend.app:create_app
ENV PORT=5000

EXPOSE 5000

CMD ["python", "backend/app.py"]