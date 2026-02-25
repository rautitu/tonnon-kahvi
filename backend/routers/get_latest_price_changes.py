from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from db import get_db
from typing import Optional

router = APIRouter()


class PriceChangeRow(BaseModel):
    product_name: str
    data_source: str
    price_before: float
    price_after: float
    change_date: str


@router.get("/coffees/latest-price-changes", response_model=list[PriceChangeRow])
def get_latest_price_changes(
    limit: int = Query(default=50, ge=1, le=200),
    db=Depends(get_db),
):
    """
    Return the most recent products whose normal_price actually changed.
    Compares each row to its predecessor (by tonno_load_ts per product)
    and returns only rows where normal_price differs.
    """
    cursor = db.cursor()
    cursor.execute(
        """
        WITH price_with_prev AS (
            SELECT
                id,
                name_finnish,
                tonno_data_source,
                normal_price,
                LAG(normal_price) OVER (PARTITION BY id ORDER BY tonno_load_ts) AS prev_price,
                tonno_load_ts
            FROM products_and_prices
            WHERE normal_price IS NOT NULL
        )
        SELECT
            name_finnish,
            tonno_data_source,
            prev_price,
            normal_price,
            CAST(tonno_load_ts AS varchar)
        FROM price_with_prev
        WHERE prev_price IS NOT NULL
          AND normal_price IS DISTINCT FROM prev_price
        ORDER BY tonno_load_ts DESC
        LIMIT %s
        """,
        (limit,),
    )
    rows = cursor.fetchall()
    cursor.close()

    return [
        PriceChangeRow(
            product_name=row[0],
            data_source=row[1],
            price_before=row[2],
            price_after=row[3],
            change_date=row[4],
        )
        for row in rows
    ]
