from fastapi import FastAPI
from routers.get_coffee_prices import router
#from routers import get_coffee_prices

app = FastAPI(title="Coffee API")

#app.include_router(get_coffee_prices.router)
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Hello, Coffee API!"}
