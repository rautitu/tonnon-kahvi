import json
import datetime
import logging
import hashlib

from curl_cffi import requests as cffi_requests

import psycopg2
from psycopg2.extras import execute_values

from fetcher.base_fetcher import BaseProductFetcher

# Configure logging to stdout (Docker captures this)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("k-ruoka-fetcher")

class KRuokaFetcher(BaseProductFetcher):
    category: str = 'suodatinkahvi'
    _data_source: str = 'K-ruoka'

    def target_tbl_has_existing_data(self) -> bool:
        """
        Checks if there are existing rows in the products_and_prices table 
        for the K-ruoka data source.
        
        Returns:
            bool: True if there are existing K-ruoka rows (>0), False if no rows (0)
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
    
        for item in json_data['result']:
            product: dict = item['product']
            
            extracted_item = {
                'id': item.get('id'),
                'name_finnish': product.get('localizedName', {}).get('finnish'),
                'name_english': product.get('localizedName', {}).get('english'),
                'available_store': product.get('availability', {}).get('store'),
                'available_web': product.get('availability', {}).get('web'),
                'net_weight': product.get('productAttributes', {}).get('measurements', {}).get('netWeight'),
                'content_unit': product.get('productAttributes', {}).get('measurements', {}).get('contentUnit'),
                'image_url': product.get('productAttributes', {}).get('image', {}).get('url'),
                'brand_name': product.get('brand', {}).get('name'),
                'normal_price_unit': None,
                'normal_price': None,
                'batch_price': None,
                'batch_discount_pct': None,
                'batch_discount_type': None,
                'batch_days_left': None
            }
            
            # Handle mobilescan pricing data
            if 'mobilescan' in product:
                mobilescan = product['mobilescan']
                if 'pricing' in mobilescan:
                    pricing = mobilescan['pricing']
                    if 'normal' in pricing:
                        normal = pricing['normal']
                        extracted_item.update({
                            'normal_price_unit': normal.get('unit'),
                            'normal_price': normal.get('price')
                        })
                    if 'discount' in pricing:
                        discount = pricing['discount']
                        extracted_item.update({
                            'batch_price': discount.get('price'),
                            'batch_discount_pct': discount.get('discountPercentage'),
                            'batch_discount_type': discount.get('discountType'),  
                            'batch_days_left': discount.get('validNumberOfDaysLeft')
                        })
                    if 'batch' in pricing:
                        batch = pricing['batch']
                        extracted_item.update({
                            'batch_price': batch.get('price'),
                            'batch_discount_pct': batch.get('discountPercentage'),
                            'batch_discount_type': batch.get('discountType'), 
                            'batch_days_left': batch.get('validNumberOfDaysLeft')
                        })
            
            extracted_data.append(extracted_item)
        
        return extracted_data

    def _fetch_prices(self):
        url = "https://www.k-ruoka.fi/kr-api/v2/product-search/suodatinkahvi?storeId=N106&offset=0&limit=100"

        #headers discovered with inspecting Network traffic and converting to cURL request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
            'Accept': 'application/json',
            'X-K-Build-Number': '24596', #this is atleast crucial
            'Origin': 'https://www.k-ruoka.fi',
            'Referer': 'https://www.k-ruoka.fi/haku?q=suodatinkahvi',
            'Accept-Language': 'fi-FI,fi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        }

        # Using curl_cffi with Firefox TLS fingerprint impersonation to bypass Cloudflare
        # (cloudscraper no longer reliably passes Cloudflare's JS challenge for k-ruoka.fi)
        response = cffi_requests.post(url, headers=headers, impersonate="firefox")

        logger.info(f"K-Ruoka API response code: {response.status_code}")

        if response.status_code == 200:
            logger.info("Successfully queried K-Ruoka API")
            parsed_response: list = self._extract_product_data(response.json())
            return parsed_response
        else:
            logger.exception(f"Failed to fetch data from K-Ruoka API, API response code: {response.status_code}, full response: {response.text}")

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
            
            # Calculate SHA256 hash in Python
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

        # Calculate row_hash for each item in Python
        for item in product_data:
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
            item['tonno_row_hash'] = hashlib.sha256(hash_input.encode()).hexdigest()

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

            # Insert all incoming rows into the temp table with pre-calculated row_hash
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
                    item['tonno_row_hash']  # Use the pre-calculated hash
                )
                for item in product_data
            ]
            execute_values(cur, insert_temp_query, records_for_temp)

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
