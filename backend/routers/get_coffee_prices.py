from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db import get_db
import psycopg2

router = APIRouter()

class CoffeeOut(BaseModel):
    name_finnish: str
    normal_price: float
    net_weight: float
    data_source: str

@router.get("/coffees", response_model=list[CoffeeOut])
def get_coffee_prices(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            name_finnish, 
            normal_price, 
            net_weight,
            normal_price / net_weight as price_per_wright,
            tonno_data_source 
        FROM products_and_prices
        WHERE tonno_end_ts IS NULL
        """
    )
    rows = cursor.fetchall()
    cursor.close()
    return [CoffeeOut(name_finnish=row[0], normal_price=row[1], net_weight=row[2], data_source=row[3]) for row in rows]
