import requests
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from routers.get_coffee_prices import router
from fastapi.routing import APIRoute

#frontend will be running on same machine as the backend -> get curr machine IP to be allowed in CORS
try:
    public_ip: str = requests.get("https://ifconfig.me").text.strip()
    #print("Detected Public IP:", public_ip)
except Exception as e:
    raise RuntimeError(f"Failed to get hosts IP address, full error description: {str(e)}")

allowed_origins: list = [
    f"http://{public_ip}:49106", # Expo Web on host
    f"http://{public_ip}:49100",
    f"http://{public_ip}:49101"
]

app = FastAPI(title="Tonno coffee API")

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
