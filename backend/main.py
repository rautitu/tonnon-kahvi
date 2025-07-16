from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from routers.get_coffee_prices import router
from fastapi.routing import APIRoute

allowed_origins: list = [
    "http://localhost:49106", # Expo Web on host
    "http://localhost:49100",
    "http://localhost:49101",
    "http://localhost:19006", # Expo Web on host
    "http://localhost:19000",
    "http://localhost:19001",
]

app = FastAPI(title="Coffee API")

app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    #allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello, welcome to tonnon-kahvi version 0.1!"}

@app.get("/endpoints")
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
        "message": "TonnoCoffeeAPI endpoints:",
        "available_endpoints": routes
    }
