import json
import requests
import cloudscraper
from base_fetcher import BaseProductFetcher

class KRuokaFetcher(BaseProductFetcher):
    category: str = 'suodatinkahvi'

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
                    if 'batch' in pricing:
                        batch = pricing['batch']
                        extracted_item.update({
                            'batch_price': batch.get('price'),
                            'batch_discount_pct': batch.get('discountPercentage'),
                            'batch_discount_type': batch.get('discountType'),  # Note: typo in original JSON?
                            'batch_days_left': batch.get('validNumberOfDaysLeft')
                        })
            
            extracted_data.append(extracted_item)
        
        return extracted_data

    def fetch_prices(self):
        url = "https://www.k-ruoka.fi/kr-api/v2/product-search/suodatinkahvi?storeId=N106&offset=0&limit=100"

        #headers discovered with inspecting Network traffic and converting to cURL request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
            'Accept': 'application/json',
            'X-K-Build-Number': '24596', #this is atleast crucial
            'Origin': 'https://www.k-ruoka.fi',
            'Referer': 'https://www.k-ruoka.fi/haku?q=suodatinkahvi',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        }

        #creating a cloudscraper instance instead of using requests directly to handle cloudflare JS challenge
        scraper: cloudscraper.CloudScraper = cloudscraper.create_scraper()
        response: requests.models.Response = scraper.post(url, headers=headers)

        print(f"K-Ruoka API response code: {response.status_code}")

        if response.status_code == 200:
            print("Successfully queried K-Ruoka API")
            parsed_response = self._extract_product_data(response.json())
            print(f"TEMP type of parsed_response: {type(parsed_response)}")
            return parsed_response
        else:
            print("Request failed. Response:")
            print(response.text)
            raise RuntimeError(f"Failed to fetch data from K-Ruoka API, API response code: {response.status_code}")

        
