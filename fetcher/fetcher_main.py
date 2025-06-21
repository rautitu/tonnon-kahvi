import time
import os
import logging
import psycopg2

from fetcher.fetchers.kesko_fetcher import KRuokaFetcher
from unit_tests import test_postgres_existence

# Configure logging to stdout (Docker captures this)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("orchestrator")

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
            logger.info("✅ Connected to PostgreSQL!")
            return
        except psycopg2.OperationalError as e:
            logger.warning(f"❌ Attempt {i + 1}: PostgreSQL not ready yet... Retrying in {delay}s")
            time.sleep(delay)
    raise Exception("❌ PostgreSQL connection failed after retries.")

def orchestrate_init_or_update(fetchers_to_run: list):
    """Runs fetch_and_insert of every fetcher we have (defined in the list)"""
    all_results: list[str] = []
    for fetcher in fetchers_to_run:
        fetcher_name = type(fetcher).__name__
        try:
            if fetcher.target_tbl_has_existing_data():
                result = fetcher.run_update()
                logger.info(f"Update operation for {fetcher_name}: {result}")
            else:
                result = fetcher.init_fetch_and_insert()
                logger.info(f"Initial insert operation for {fetcher_name}: {result}")
            all_results.append(result)
        except Exception as e:
            logger.exception(f"Error during process for {fetcher_name}: {e}")
    return all_results

if __name__ == "__main__":
    while True:
        logger.info("🔁 Starting new fetch/update cycle...")
        try:
            wait_for_postgres(max_retries=10, delay=2)
            fetchers = [KRuokaFetcher()]
            fetchers_results = orchestrate_init_or_update(fetchers)
            logger.info(f"Cycle completed with results: {fetchers_results}")
        except Exception as e:
            logger.exception(f"❌ Error during orchestration cycle: {e}")

        logger.info("⏳ Sleeping for 12 hours...")
        time.sleep(60 * 60 * 12)
