import json
import requests
import datetime
import cloudscraper

import psycopg2
from psycopg2.extras import execute_values

from fetcher.base_fetcher import BaseProductFetcher

class SRyhmaFetcher(BaseProductFetcher):
    category: str = 'suodatinkahvi'
    _data_source: str = 'S-Ryhma'

    def target_tbl_has_existing_data(self) -> bool:
        """
        Checks if there are existing rows in the products_and_prices table 
        for the S-Ryhma data source.
        
        Returns:
            bool: True if there are existing S-Ryhma rows (>0), False if no rows (0)
        """
        check_query = f"""
            SELECT COUNT(*) 
            FROM products_and_prices 
            WHERE tonno_data_source = '{self._data_source}'
        """
        
        with self._conn.cursor() as cur:
            cur.execute(check_query)
            count = cur.fetchone()[0]
        
        return count > 0

    def _extract_product_data(self, json_data: dict):
        extracted_data: list = []
    
        for item in json_data['data']['store']['products']['items']:
            #product: dict = item['product']
            
            extracted_item = {
                'id': item.get('id'),
                'name_finnish': item.get('name'),
                'name_english': item.get('name'),
                'available_store': item.get('storeId'),
                #'available_web': product.get('availability', {}).get('web'),
                'available_web': None,
                'net_weight': int(item.get('price')) / int(item.get('comparisonPrice')),
                'content_unit': item.get('comparisonUnit'),
                'image_url': 'not available in S-Ryhma',
                'brand_name': item.get('brandName'),
                'normal_price_unit': item.get('pricing', {}).get('comparisonUnit'),
                'normal_price': item.get('pricing', {}).get('regularPrice'),
                'batch_price': item.get('pricing', {}).get('currentPrice'),
                'batch_discount_pct': None,
                'batch_discount_type': None,
                'batch_days_left': None
            }
            
            extracted_data.append(extracted_item)
        
        return extracted_data

    def _fetch_prices(self):
        url = "https://api.s-kaupat.fi/?operationName=RemoteFilteredProducts&variables=%7B%22includeStoreEdgePricing%22%3Atrue%2C%22storeEdgeId%22%3A%22513971200%22%2C%22facets%22%3A%5B%7B%22key%22%3A%22brandName%22%2C%22order%22%3A%22asc%22%7D%2C%7B%22key%22%3A%22category%22%7D%2C%7B%22key%22%3A%22labels%22%7D%5D%2C%22generatedSessionId%22%3A%22fb741e50-639f-4cd1-8fab-c8b8f5101c21%22%2C%22includeAgeLimitedByAlcohol%22%3Atrue%2C%22limit%22%3A24%2C%22queryString%22%3A%22suodatinkahvi%22%2C%22storeId%22%3A%22513971200%22%2C%22useRandomId%22%3Afalse%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22abbeaf3143217630082d1c0ba36033999b196679bff4b310a0418e290c141426%22%7D%7D"

        #headers discovered with inspecting Network traffic and converting to cURL request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.s-kaupat.fi',
            'x-client-name': 'skaupat-web',
            'x-client-version': 'production-e14c351ce120b6fca5d16451b7a06bae74b4b0f2'

        }

        #creating a cloudscraper instance instead of using requests directly to handle cloudflare JS challenge
        scraper: cloudscraper.CloudScraper = cloudscraper.create_scraper()
        response: requests.models.Response = scraper.post(url, headers=headers)

        print(f"S-ryhma API response code: {response.status_code}")

        if response.status_code == 200:
            print("Successfully queried S-ryhma API")
            parsed_response: list = self._extract_product_data(response.json())
            return parsed_response
        else:
            print("Request failed. Response:")
            print(response.text)
            raise RuntimeError(f"Failed to fetch data from S-ryhma API, API response code: {response.status_code}")

    def _insert_init_prices(self, conn, product_data: list[dict]) -> str:
        "Initial insert product data into products_and_prices table"
        if not product_data:
            return "No products to insert."

        insert_query = """
            INSERT INTO products_and_prices (
                id, name_finnish, name_english, available_store, available_web,
                net_weight, content_unit, image_url, brand_name,
                normal_price_unit, normal_price, batch_price,
                batch_discount_pct, batch_discount_type, batch_days_left,
                tonno_data_source, tonno_load_ts, tonno_end_ts
            ) VALUES %s
            ON CONFLICT (id, tonno_load_ts) DO NOTHING
        """

        records: list[tuple] = [
            (
                item['id'], item['name_finnish'], item['name_english'],
                item['available_store'], item['available_web'],
                item['net_weight'], item['content_unit'], item['image_url'],
                item['brand_name'], item['normal_price_unit'], item['normal_price'],
                item['batch_price'], item['batch_discount_pct'],
                item['batch_discount_type'], item['batch_days_left'],
                "S-ryhma",  # tonno_data_source (constant value)
                datetime.datetime.now(),  # tonno_load_ts (current time)
                None  # tonno_end_ts (NULL)
            )
            for item in product_data
        ]

        with conn.cursor() as cur:
            execute_values(cur, insert_query, records)
        conn.commit()

        return f"Attempted to insert {len(records)} products (duplicates skipped)."
    
    def _update_prices(self, conn, product_data: list[dict]) -> str:
        """
        Updates product data in the target table using a slowly changing dimension approach.
        1. Marks existing rows that are present in the new data as historical.
        2. Marks rows that are no longer in the source data as historical.
        3. Inserts all incoming data as new, current rows.
        """
        if not product_data:
            return "No product data from source, no updates performed."

        update_ts = datetime.datetime.now()
        incoming_ids = tuple(item['id'] for item in product_data)

        with conn.cursor() as cur:
            # 1. Update existing rows that are also in the incoming data.
            # These are products whose prices/details may have changed.
            # We mark the old version as historical.
            update_existing_query = """
                UPDATE products_and_prices
                SET tonno_end_ts = %s
                WHERE id = ANY(%s) AND tonno_end_ts IS NULL;
            """
            cur.execute(update_existing_query, (update_ts, list(incoming_ids)))
            updated_count = cur.rowcount

            # 2. Mark products that have disappeared from the source as historical.
            # These are products that exist in our DB but not in the new data feed.
            update_disappeared_query = """
                UPDATE products_and_prices
                SET tonno_end_ts = %s
                WHERE id NOT IN %s AND tonno_end_ts IS NULL;
            """
            cur.execute(update_disappeared_query, (update_ts, incoming_ids))
            disappeared_count = cur.rowcount

            # 3. Insert all incoming products as the new "current" rows.
            # This covers brand new products and new versions of existing products.
            # Note: No "ON CONFLICT" clause, as we always want to insert a new version.
            insert_query = """
                INSERT INTO products_and_prices (
                    id, name_finnish, name_english, available_store, available_web,
                    net_weight, content_unit, image_url, brand_name,
                    normal_price_unit, normal_price, batch_price,
                    batch_discount_pct, batch_discount_type, batch_days_left,
                    tonno_data_source, tonno_load_ts, tonno_end_ts
                ) VALUES %s
            """
            
            records_to_insert: list[tuple] = [
                (
                    item['id'], item['name_finnish'], item['name_english'],
                    item['available_store'], item['available_web'],
                    item['net_weight'], item['content_unit'], item['image_url'],
                    item['brand_name'], item['normal_price_unit'], item['normal_price'],
                    item['batch_price'], item['batch_discount_pct'],
                    item['batch_discount_type'], item['batch_days_left'],
                    "S-Ryhma",      # tonno_data_source
                    update_ts,      # tonno_load_ts (use the consistent timestamp)
                    None            # tonno_end_ts (NULL for current version)
                )
                for item in product_data
            ]
            
            execute_values(cur, insert_query, records_to_insert)
            inserted_count = len(records_to_insert)

        conn.commit()

        return (f"Price update complete. Inserted: {inserted_count}, "
                f"Updated (new version): {updated_count}, "
                f"Disappeared: {disappeared_count}.")
    
    def init_fetch_and_insert(self):
        """Performs both fetch + insert operations, returns some description string of the operation end result from insert"""
        fetched_data: list[dict] = self._fetch_prices()
        return self._insert_init_prices(self._conn, fetched_data)

    def run_update(self):
        """Performs a scheduled fetch and update of prices."""
        fetched_data: list[dict] = self._fetch_prices()
        return self._update_prices(self._conn, fetched_data)
