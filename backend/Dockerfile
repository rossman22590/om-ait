FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENV_MODE="production" \
    PYTHONPATH=/app

WORKDIR /app

RUN apk add --no-cache \
    build-base \
    curl \
    git \
    pkgconfig \
    cairo-dev \
    gobject-introspection-dev \
    freetype-dev \
    gcc \
    linux-headers \
    musl-dev \
    python3-dev

# Create non-root user and set up directories
RUN adduser -D -u 1000 appuser && \
    mkdir -p /app/logs && \
    chown -R appuser:appuser /app

# Install Python dependencies
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir -v -r requirements.txt gunicorn
# Explicit install of langfuse
RUN pip install --no-cache-dir langfuse==2.60.5

# Switch to non-root user
USER appuser

# Copy application code
COPY --chown=appuser:appuser . .

# Expose the port the app runs on
EXPOSE 8000

# Calculate optimal worker count based on 16 vCPUs
# Using same worker count as UV version for consistency
ENV WORKERS=7
ENV THREADS=2
ENV WORKER_CONNECTIONS=2000

# Gunicorn configuration - matching UV version exactly
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