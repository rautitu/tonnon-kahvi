import json
import requests
import datetime
import cloudscraper
import urllib.parse
import logging
import uuid
import hashlib

import psycopg2
from psycopg2.extras import execute_values

from fetcher.base_fetcher import BaseProductFetcher

# Configure logging to stdout (Docker captures this)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("s-ryhma-fetcher")


class SRyhmaFetcher(BaseProductFetcher):
    category: str = 'suodatinkahvi'
    _data_source: str = 'S-ryhma'

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
                'available_store': True,
                #'available_store': item.get('storeId'),
                #'available_web': product.get('availability', {}).get('web'),
                'available_web': None,
                'net_weight': float(item.get('price')) / float(item.get('comparisonPrice')),
                'content_unit': item.get('comparisonUnit'),
                'image_url': 'not available in S-ryhma',
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
        base_url = "https://api.s-kaupat.fi/"
        variables_template = {
            "includeStoreEdgePricing": True,
            "storeEdgeId": "513971200",
            "facets": [
                {"key": "brandName", "order": "asc"},
                {"key": "category"},
                {"key": "labels"}
            ],
            "generatedSessionId": str(uuid.uuid4()),
            "includeAgeLimitedByAlcohol": True,
            "limit": 24,
            "queryString": "suodatinkahvi",
            "storeId": "726308750",
            "useRandomId": False
        }
        extensions = {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "abbeaf3143217630082d1c0ba36033999b196679bff4b310a0418e290c141426"
            }
        }

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.s-kaupat.fi',
            'x-client-name': 'skaupat-web',
            'x-client-version': 'production-e14c351ce120b6fca5d16451b7a06bae74b4b0f2'
        }

        all_data = []
        offset = 0
        limit = variables_template["limit"]

        scraper = cloudscraper.create_scraper()

        while True:
            variables_template["from"] = offset
            variables_str = urllib.parse.quote(json.dumps(variables_template))
            extensions_str = urllib.parse.quote(json.dumps(extensions))

            url = f"{base_url}?operationName=RemoteFilteredProducts&variables={variables_str}&extensions={extensions_str}"

            response = scraper.get(url, headers=headers)
            print(f"API call (offset={offset}) response code: {response.status_code}")

            if response.status_code != 200:
                logger.exception(f"Failed to fetch S-ryhma data, status: {response.status_code}, full response: {response.text}")

            json_data = response.json()
            product_data = self._extract_product_data(json_data)
            all_data.extend(product_data)

            # Pagination check
            product_info = json_data["data"]["store"]["products"]
            total = product_info["total"]
            received = len(product_info["items"])
            offset += received

            logger.info(f"S-Ryhma API, fetched {received} products, total so far: {len(all_data)}")

            if offset >= total:
                break

        return all_data

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
                tonno_data_source, tonno_load_ts, tonno_end_ts,
                tonno_row_hash
            ) VALUES %s
            ON CONFLICT (id, tonno_load_ts) DO NOTHING
        """

        records: list[tuple] = []
        for item in product_data:
            # Calculate the hash for each row
            hash_input = '||'.join([
                str(item.get('id', 'null')),
                str(item.get('name_finnish', 'null')),
                str(item.get('name_english', 'null')),
                str(item.get('available_store', 'false')),
                str(item.get('available_web', 'false')),
                str(item.get('net_weight', '0')),
                str(item.get('content_unit', 'null')),
                str(item.get('image_url', 'null')),
                str(item.get('brand_name', 'null')),
                str(item.get('normal_price_unit', 'null')),
                str(item.get('normal_price', '0')),
                str(item.get('batch_price', '0')),
                str(item.get('batch_discount_pct', '0')),
                str(item.get('batch_discount_type', 'null')),
                str(item.get('batch_days_left', '0'))
            ])
            
            row_hash = hashlib.sha256(hash_input.encode()).hexdigest()

            records.append((
                item['id'], item['name_finnish'], item['name_english'],
                item['available_store'], item['available_web'],
                item['net_weight'], item['content_unit'], item['image_url'],
                item['brand_name'], item['normal_price_unit'], item['normal_price'],
                item['batch_price'], item['batch_discount_pct'],
                item['batch_discount_type'], item['batch_days_left'],
                self._data_source,  # tonno_data_source (constant value)
                datetime.datetime.now(),  # tonno_load_ts (current time)
                None,  # tonno_end_ts (NULL)
                row_hash  # tonno_row_hash
            ))

        with conn.cursor() as cur:
            execute_values(cur, insert_query, records)
        conn.commit()

        return f"Attempted to insert {len(records)} products (duplicates skipped)."
    
    def _update_prices(self, conn, product_data: list[dict]) -> str:
        """
        Updates product data in the target table using a slowly changing dimension + row_hash.
        1. Marks existing rows as historical only if the incoming row differs (row_hash mismatch).
        2. Marks rows no longer present in the source as historical.
        3. Inserts incoming rows as new current rows (only those with changed hash or new ids).
        """
        if not product_data:
            return "No product data from source, no updates performed."

        update_ts = datetime.datetime.now()
        incoming_ids = tuple(item['id'] for item in product_data)

        with conn.cursor() as cur:
            # Create a temp table to hold incoming rows + their row_hash
            cur.execute("""
                CREATE TEMP TABLE incoming_products (
                    id TEXT,
                    name_finnish TEXT,
                    name_english TEXT,
                    available_store BOOLEAN,
                    available_web BOOLEAN,
                    net_weight NUMERIC,
                    content_unit TEXT,
                    image_url TEXT,
                    brand_name TEXT,
                    normal_price_unit TEXT,
                    normal_price NUMERIC,
                    batch_price NUMERIC,
                    batch_discount_pct NUMERIC,
                    batch_discount_type TEXT,
                    batch_days_left INT,
                    tonno_row_hash TEXT
                ) ON COMMIT DROP;
            """)

            # Insert all incoming rows into the temp table, calculating row_hash here
            insert_temp_query = """
                INSERT INTO incoming_products (
                    id, name_finnish, name_english, available_store, available_web,
                    net_weight, content_unit, image_url, brand_name,
                    normal_price_unit, normal_price, batch_price,
                    batch_discount_pct, batch_discount_type, batch_days_left,
                    tonno_row_hash
                )
                VALUES %s
            """
            records_for_temp = [
                (
                    item['id'], item['name_finnish'], item['name_english'],
                    item['available_store'], item['available_web'],
                    item['net_weight'], item['content_unit'], item['image_url'],
                    item['brand_name'], item['normal_price_unit'], item['normal_price'],
                    item['batch_price'], item['batch_discount_pct'],
                    item['batch_discount_type'], item['batch_days_left'],
                    # same expression you wrote earlier
                    None  # placeholder, will be filled via UPDATE after load
                )
                for item in product_data
            ]
            execute_values(cur, insert_temp_query, records_for_temp)

            # Update row_hash in temp table using Postgres digest function
            cur.execute("""
                UPDATE incoming_products
                SET tonno_row_hash = encode(sha256(concat_ws(
                    '||', 
                    coalesce(id, 'null'), 
                    coalesce(name_finnish, 'null'), 
                    coalesce(name_english, 'null'), 
                    coalesce(available_store, 'false'), 
                    coalesce(available_web, 'false'),
                    coalesce(net_weight, '0'), 
                    coalesce(content_unit, 'null'), 
                    coalesce(image_url, 'null'), 
                    coalesce(brand_name, 'null'),
                    coalesce(normal_price_unit, 'null'), 
                    coalesce(normal_price, '0'), 
                    coalesce(batch_price, '0'),
                    coalesce(batch_discount_pct, '0'), 
                    coalesce(batch_discount_type, 'null'), 
                    coalesce(batch_days_left, '0')
                )::bytea), 'hex');
            """)

            # 1. Mark old versions as historical only where hash differs
            update_existing_query = """
                UPDATE products_and_prices p
                SET tonno_end_ts = %s
                FROM incoming_products i
                WHERE 
                    p.id = i.id
                    AND p.tonno_end_ts IS NULL
                    AND p.tonno_data_source = %s
                    AND p.tonno_row_hash IS DISTINCT FROM i.tonno_row_hash;
            """
            cur.execute(update_existing_query, (update_ts, self._data_source))
            updated_count = cur.rowcount

            # 2. Mark disappeared products as historical
            update_disappeared_query = """
                UPDATE products_and_prices
                SET tonno_end_ts = %s
                WHERE 
                    id NOT IN %s AND
                    tonno_end_ts IS NULL AND
                    tonno_data_source = %s;
            """
            cur.execute(update_disappeared_query, (update_ts, incoming_ids, self._data_source))
            disappeared_count = cur.rowcount

            # 3. Insert only changed or new rows
            insert_query = """
                INSERT INTO products_and_prices (
                    id, name_finnish, name_english, available_store, available_web,
                    net_weight, content_unit, image_url, brand_name,
                    normal_price_unit, normal_price, batch_price,
                    batch_discount_pct, batch_discount_type, batch_days_left,
                    tonno_data_source, tonno_load_ts, tonno_end_ts, tonno_row_hash
                )
                SELECT
                    i.id, i.name_finnish, i.name_english, i.available_store, i.available_web,
                    i.net_weight, i.content_unit, i.image_url, i.brand_name,
                    i.normal_price_unit, i.normal_price, i.batch_price,
                    i.batch_discount_pct, i.batch_discount_type, i.batch_days_left,
                    %s, %s, NULL, i.tonno_row_hash
                FROM incoming_products i
                LEFT JOIN products_and_prices p
                ON p.id = i.id
                AND p.tonno_end_ts IS NULL
                AND p.tonno_data_source = %s
                WHERE p.id IS NULL OR p.tonno_row_hash IS DISTINCT FROM i.tonno_row_hash;
            """
            cur.execute(insert_query, (self._data_source, update_ts, self._data_source))
            inserted_count = cur.rowcount

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
