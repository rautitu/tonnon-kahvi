from fetcher.fetchers.kesko_fetcher import KRuokaFetcher
from unit_tests import test_postgres_existence

def orchestrate_price_fetch_and_insert():
    """Runs fetch_and_insert of every fetcher we have (defined in the list)"""
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
