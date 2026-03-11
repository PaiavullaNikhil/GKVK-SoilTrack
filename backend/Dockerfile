# Dockerfile for Hugging Face Spaces
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for EasyOCR and OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 755 uploads

# Create non-root user with UID 1000 (required by Hugging Face Spaces)
RUN useradd -m -u 1000 hf_user && \
    chown -R hf_user:hf_user /app

# Switch to non-root user
USER hf_user

# Expose port 7860 (required by Hugging Face Spaces)
EXPOSE 7860

# Health check (uses Python stdlib only)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request, urllib.error; import sys; \
import time; \
url = 'http://localhost:7860/health'; \
req = urllib.request.Request(url); \
try:\n    urllib.request.urlopen(req, timeout=5)\nexcept Exception:\n    sys.exit(1)" || exit 1

# Run server on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
