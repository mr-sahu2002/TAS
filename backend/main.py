import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

# Load environment variables
load_dotenv()
api_key = os.environ.get('google_cloud')

app = FastAPI()

# Configure CORS to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class RouteRequest(BaseModel):
    origin: str
    destination: str
    avoid_tolls: bool = False
    avoid_highways: bool = False

class RouteData(BaseModel):
    polyline: str
    distance: str
    duration: str

class TrafficData(BaseModel):
    time: str
    trafficLevel: float
    duration: int

@app.post("/api/routes", response_model=List[RouteData])
def get_routes(request: RouteRequest):
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.routeLabels,routes.staticDuration"
    }
    
    data = {
        "origin": {
            "address": request.origin
        },
        "destination": {
            "address": request.destination
        },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "computeAlternativeRoutes": True,
        "routeModifiers": {
            "avoidTolls": request.avoid_tolls,
            "avoidHighways": request.avoid_highways,
            "avoidFerries": False
        },
        "languageCode": "en-US",
        "units": "METRIC"  # Using metric for km instead of miles
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise exception if the request failed
        
        result = response.json()
        routes_data = []
        
        for route in result.get("routes", []):
            # Convert meters to km and format to 1 decimal place
            distance_km = round(route.get("distanceMeters", 0) / 1000, 1)
            
            # Convert seconds to minutes
            duration_seconds = int(route.get("duration", "0").rstrip("s"))
            duration_minutes = round(duration_seconds / 60)
            
            routes_data.append(
                RouteData(
                    polyline=route.get("polyline", {}).get("encodedPolyline", ""),
                    distance=f"{distance_km} km",
                    duration=f"{duration_minutes} mins"
                )
            )
        
        return routes_data
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching routes: {str(e)}")

@app.get("/api/traffic/{route_index}", response_model=List[TrafficData])
def get_traffic_data(route_index: int, origin: str, destination: str):
    try:
        # Generate traffic data for the next 24 hours in 30-minute intervals
        traffic_data = []
        current_time = datetime.now()
        
        for i in range(48):  # 24 hours * 2 (30-minute intervals)
            # Calculate time for this interval
            interval_time = current_time + timedelta(minutes=i * 30)
            
            # Generate traffic level (0-100%)
            # This is a simplified example - in a real app, you'd use actual traffic data
            hour = interval_time.hour
            if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
                traffic_level = random.uniform(70, 100)
            elif 10 <= hour <= 16:  # Midday
                traffic_level = random.uniform(40, 70)
            else:  # Night/early morning
                traffic_level = random.uniform(10, 40)
            
            # Calculate duration based on traffic level
            base_duration = 30  # Base duration in minutes
            duration = int(base_duration * (1 + (traffic_level / 100)))
            
            traffic_data.append({
                "time": interval_time.strftime("%H:%M"),
                "trafficLevel": round(traffic_level, 1),
                "duration": duration
            })
        
        return traffic_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating traffic data: {str(e)}")

# For testing purposes
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)