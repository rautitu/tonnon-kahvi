from fastapi import FastAPI
from routers import coffee

app = FastAPI(title="Coffee API")

app.include_router(coffee.router)
