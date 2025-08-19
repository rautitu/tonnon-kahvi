CREATE TABLE products_and_prices (
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
    batch_days_left INTEGER,
    tonno_data_source TEXT,
    tonno_load_ts TIMESTAMP, 
    tonno_end_ts TIMESTAMP,
    tonno_row_hash TEXT

    PRIMARY KEY (id, tonno_load_ts)
);