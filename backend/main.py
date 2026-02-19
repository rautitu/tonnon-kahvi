import requests
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from routers.get_coffee_prices import router as coffee_router
from routers.get_price_history import router as history_router
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
    f"http://{public_ip}:49101",
    f"http://tonnopannu.duckdns.org:49106", # Expo Web on host
    f"http://tonnopannu.duckdns.org:49100",
    f"http://tonnopannu.duckdns.org:49101",
]

app = FastAPI(title="Tonno coffee API")

app.include_router(coffee_router)
app.include_router(history_router)

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
    return {"message": "Welcome to tonnon-kahvi! Your one and only source for coffee prices in Finland!"}

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
