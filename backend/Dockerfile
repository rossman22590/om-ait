FROM python:3.11-alpine

ENV ENV_MODE production
WORKDIR /app

# Install system dependencies including timezone data
RUN apk add --no-cache gcc musl-dev libffi-dev tzdata

# Set timezone for New York (handles EST/EDT automatically)
ENV TZ=America/New_York

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies using pip
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Verify critical dependencies are installed
RUN python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
RUN python -c "import dramatiq; print('Dramatiq:', dramatiq.__version__)"
RUN python -c "import uvicorn; print('Uvicorn:', uvicorn.__version__)"
RUN python -c "import gunicorn; print('Gunicorn:', gunicorn.__version__)"

# Copy application code
COPY . .

# Calculate optimal worker count based on 16 vCPUs
# Using (2*CPU)+1 formula for CPU-bound applications
ENV WORKERS=33
ENV THREADS=2
ENV WORKER_CONNECTIONS=2000

ENV PYTHONPATH=/app
EXPOSE 8000

# Gunicorn configuration
CMD ["sh", "-c", "gunicorn api:app \
  --workers $WORKERS \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 1800 \
  --graceful-timeout 600 \
  --keep-alive 1800 \
  --max-requests 0 \
  --max-requests-jitter 0 \
  --forwarded-allow-ips '*' \
  --worker-connections $WORKER_CONNECTIONS \
  --worker-tmp-dir /dev/shm \
  --preload \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --capture-output \
  --enable-stdio-inheritance \
  --threads $THREADS"]
