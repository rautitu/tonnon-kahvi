FROM python:3.11-slim

WORKDIR /app

COPY fetcher /app/fetcher
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "-u", "fetcher_main.py"]
