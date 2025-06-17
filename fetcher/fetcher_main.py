import time
import os
import psycopg2

from fetcher.fetchers.kesko_fetcher import KRuokaFetcher
from unit_tests import test_postgres_existence

def wait_for_postgres(max_retries=10, delay=2):
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.environ['DB_HOST'],
                database=os.environ['DB_NAME'],
                user=os.environ['DB_USER'],
                password=os.environ['DB_PASSWORD']
            )
            conn.close()
            print("✅ Connected to PostgreSQL!")
            return
        except psycopg2.OperationalError as e:
            print(f"❌ Attempt {i + 1}: PostgreSQL not ready yet... Retrying in {delay}s")
            time.sleep(delay)
    raise Exception("❌ PostgreSQL connection failed after retries.")

def orchestrate_price_fetch_and_insert():
    """Runs fetch_and_insert of every fetcher we have (defined in the list)"""
    #check if postgress is up and running
    wait_for_postgres(max_retries=10, delay=2)
    
    fetchers: list = [KRuokaFetcher()]
    all_results: list[str] = []
    for fetcher in fetchers:
        try:
            all_results.append(fetcher.fetch_and_insert())
        except Exception as e:
            print(f"Error in {type(fetcher).__name__}: {e}")
    return all_results

if __name__ == "__main__":
    fetcher_run_results: list[str] = orchestrate_price_fetch_and_insert()
    print(fetcher_run_results)


    #test_postgres_existence.main()


    print("fetcher execution ends")
