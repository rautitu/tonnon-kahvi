FROM python:3.11-slim

# Install system dependencies for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY fetcher /app/fetcher
COPY unit_tests /app/unit_tests
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "-u", "-m", "fetcher.fetcher_main"] 