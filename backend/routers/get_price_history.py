from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from db import get_db
from typing import Optional

router = APIRouter()


class PriceHistoryRow(BaseModel):
    name_finnish: str
    normal_price: Optional[float]
    batch_price: Optional[float]
    batch_discount_pct: Optional[float]
    batch_discount_type: Optional[str]
    net_weight: Optional[float]
    content_unit: Optional[str]
    price_per_weight: Optional[float]
    data_source: str
    valid_from: str
    valid_to: Optional[str]


class ProductSummary(BaseModel):
    id: str
    name_finnish: str
    data_source: str


@router.get("/coffees/{product_id}/history", response_model=list[PriceHistoryRow])
def get_price_history(product_id: str, db=Depends(get_db)):
    """Get full price history for a single product."""
    cursor = db.cursor()
    cursor.execute(
        """
        WITH numbered AS (
            -- Assign a group: increment when price changes from previous row
            SELECT *,
                SUM(price_changed) OVER (ORDER BY tonno_load_ts) AS price_group
            FROM (
                SELECT
                    name_finnish,
                    normal_price,
                    batch_price,
                    batch_discount_pct,
                    batch_discount_type,
                    net_weight,
                    content_unit,
                    tonno_data_source,
                    tonno_load_ts,
                    tonno_end_ts,
                    CASE
                        WHEN normal_price IS DISTINCT FROM
                             LAG(normal_price) OVER (ORDER BY tonno_load_ts)
                          OR batch_price IS DISTINCT FROM
                             LAG(batch_price) OVER (ORDER BY tonno_load_ts)
                        THEN 1 ELSE 0
                    END AS price_changed
                FROM products_and_prices
                WHERE id = %s
            ) sub
        )
        SELECT
            -- Take the first name_finnish in each group (name can change too)
            (ARRAY_AGG(name_finnish ORDER BY tonno_load_ts))[1] AS name_finnish,
            normal_price,
            batch_price,
            (ARRAY_AGG(batch_discount_pct ORDER BY tonno_load_ts))[1],
            (ARRAY_AGG(batch_discount_type ORDER BY tonno_load_ts))[1],
            (ARRAY_AGG(net_weight ORDER BY tonno_load_ts))[1] AS net_weight,
            (ARRAY_AGG(content_unit ORDER BY tonno_load_ts))[1],
            CASE
                WHEN (ARRAY_AGG(net_weight ORDER BY tonno_load_ts))[1] IS NOT NULL
                     AND (ARRAY_AGG(net_weight ORDER BY tonno_load_ts))[1] > 0
                    THEN COALESCE(
                        CASE WHEN batch_price IS NOT NULL AND batch_price < normal_price
                             THEN batch_price ELSE normal_price END,
                        normal_price
                    ) / (ARRAY_AGG(net_weight ORDER BY tonno_load_ts))[1]
                ELSE NULL
            END AS price_per_weight,
            (ARRAY_AGG(tonno_data_source ORDER BY tonno_load_ts))[1],
            CAST(MIN(tonno_load_ts) AS varchar) AS valid_from,
            CAST(MAX(tonno_end_ts) AS varchar) AS valid_to
        FROM numbered
        GROUP BY price_group, normal_price, batch_price
        ORDER BY MIN(tonno_load_ts) ASC
        """,
        (product_id,),
    )
    rows = cursor.fetchall()
    cursor.close()

    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")

    return [
        PriceHistoryRow(
            name_finnish=row[0],
            normal_price=row[1],
            batch_price=row[2],
            batch_discount_pct=row[3],
            batch_discount_type=row[4],
            net_weight=row[5],
            content_unit=row[6],
            price_per_weight=row[7],
            data_source=row[8],
            valid_from=row[9],
            valid_to=row[10],
        )
        for row in rows
    ]


@router.get("/coffees/products", response_model=list[ProductSummary])
def list_products(db=Depends(get_db)):
    """List all products (current active ones) for selection dropdown."""
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT DISTINCT id, name_finnish, tonno_data_source
        FROM products_and_prices
        WHERE tonno_end_ts IS NULL
            AND NOT LOWER(name_finnish) LIKE '%%suodatinpussi%%'
            AND NOT LOWER(name_finnish) LIKE '%%kahvinsuodatin%%'
        ORDER BY name_finnish ASC
        """
    )
    rows = cursor.fetchall()
    cursor.close()
    return [
        ProductSummary(id=row[0], name_finnish=row[1], data_source=row[2])
        for row in rows
    ]
