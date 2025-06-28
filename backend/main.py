from fastapi import FastAPI
from routers.get_coffee_prices import router
from fastapi.routing import APIRoute

app = FastAPI(title="Coffee API")

app.include_router(router)

@app.get("/hello")
def root():
    return {"message": "Hello, Coffee API!"}

@app.get("/")
def get_all_endpoints():
    routes = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            routes.append({
                "path": route.path,
                "name": route.name,
                "methods": list(route.methods)
            })
    return {
        "message": "TonnoCoffeeAPI available endpoints:",
        "available_endpoints": routes
    }
