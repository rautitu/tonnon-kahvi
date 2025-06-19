import time
import os
import psycopg2

from fetcher.fetchers.kesko_fetcher import KRuokaFetcher
from unit_tests import test_postgres_existence

def wait_for_postgres(max_retries=10, delay=2):
    """Helper method that verifies that the postgres db is up and running before executing anything else"""
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

def orchestrate_init_or_update(fetchers_to_run: list):
    """Runs fetch_and_insert of every fetcher we have (defined in the list)"""
    all_results: list[str] = []
    for fetcher in fetchers_to_run:
        if fetcher.target_tbl_has_existing_data():
            #rows exist already in target for the certain fetcher -> upsert process
            try:
                result = fetcher.run_update()
            except Exception as e:
                print(f"Error in update process in {type(fetcher).__name__}: {e}")
            all_results.append(result)
            print(f"Update operation: {result}")
        else:
            #rows dont exist in target for the certain fetcher -> init process
            try:
                result = fetcher.init_fetch_and_insert()
            except Exception as e:
                print(f"Error in init process in {type(fetcher).__name__}: {e}")
            all_results.append(result)
            print(f"Initial insert operation: {result}")
    return all_results

if __name__ == "__main__":
    #check if postgress is up and running
    wait_for_postgres(max_retries=10, delay=2)
    fetchers: list = [KRuokaFetcher()]
    #next row is an init that is to be run only if db is fresh and not initiated
    fetcher_init_run_results: list[str] = orchestrate_init_or_update(fetchers)
    print(fetcher_init_run_results)

    print("fetcher execution ends")
