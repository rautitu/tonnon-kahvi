from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db import get_db
import psycopg2

router = APIRouter()

class CoffeeOut(BaseModel):
    name_finnish: str
    normal_price: float
    net_weight: float
    price_per_weight: float
    data_source: str

@router.get("/coffees", response_model=list[CoffeeOut])
def get_coffee_prices(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        with get_correct_price as ( 
            select  
                id, 
                case  
                    when batch_price is not null and batch_price < normal_price then batch_price 
                    else normal_price 
                end as current_price, 
                case  
                    when batch_price is not null and batch_price < normal_price then 1 
                    else 0 
                end as fl_deal_price
                FROM products_and_prices 
                WHERE tonno_end_ts IS NULL 
        ) 
        SELECT  
            aa.name_finnish,
            bb.current_price as normal_price,  
            aa.net_weight, 
            bb.current_price / aa.net_weight as price_per_weight, 
            aa.tonno_data_source,
            bb.fl_deal_price,
            aa.tonno_end_ts as data_fetched_ts
        FROM products_and_prices aa 
            left join get_correct_price bb 
                on aa.id = bb.id 
        WHERE aa.tonno_end_ts IS NULL
    """
    )
    rows = cursor.fetchall()
    cursor.close()
    return [CoffeeOut(name_finnish=row[0], normal_price=row[1], net_weight=row[2], price_per_weight=row[3],data_source=row[4],data_fetched_ts=row[6]) for row in rows]
