import os
import psycopg2

def get_db():
    conn = psycopg2.connect(
        host=os.environ["DB_HOST"],
        port="5432",
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"]
    )
    try:
        yield conn
    finally:
        conn.close()
