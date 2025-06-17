from fetcher.fetchers.kesko_fetcher import KRuokaFetcher
from unit_tests import test_postgres_existence

def fetch_all_prices():
    fetchers = [KRuokaFetcher()]
    all_prices = []
    for fetcher in fetchers:
        try:
            data = fetcher.fetch_prices()
            all_prices.extend(data)
        except Exception as e:
            print(f"Error in {type(fetcher).__name__}: {e}")
    return all_prices

if __name__ == "__main__":
    #prices = fetch_all_prices()
    #sprint(prices)
    test_postgres_existence.main()
    print("fetcher execution ends")
