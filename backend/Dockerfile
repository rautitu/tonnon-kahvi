FROM python:3.11-slim

# Install system dependencies for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the backend code into the container
COPY backend /app

# Copy requirements.txt from the parent directory
COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
