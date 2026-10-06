import os
import joblib
import logging
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Constants
MODEL_PATH = "model/autopulse_pipeline.pkl"
CURRENT_YEAR = 2026

# Global variable for the model
pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline
    if os.path.exists(MODEL_PATH):
        try:
            pipeline = joblib.load(MODEL_PATH)
            logger.info(f"Successfully loaded model from {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            pipeline = None
    else:
        logger.warning(f"Model file {MODEL_PATH} not found on startup.")
    yield
    # Clean up if needed
    pipeline = None

app = FastAPI(title="Auto Pulse AI Microservice", lifespan=lifespan)

# Serve simple web UI
if os.path.isdir("ui"):
    app.mount("/static", StaticFiles(directory="ui"), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    if os.path.exists("ui/index.html"):
        return FileResponse("ui/index.html")
    return HTMLResponse("<h1>UI not found. Create ui/index.html</h1>", status_code=404)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VehicleRequest(BaseModel):
    brand: str
    model: str
    yom: int = Field(gt=1900, description="Year of Manufacture")
    engine_cc: int = Field(gt=0, description="Engine capacity in cc")
    gear: str
    fuel_type: str
    millage_km: int = Field(gt=0, description="Millage in kilometers")

@app.post("/predict")
async def predict(request: VehicleRequest):
    if pipeline is None:
        logger.error("Prediction requested but model is not loaded.")
        raise HTTPException(status_code=503, detail="Model is currently unavailable")
        
    try:
        # Engineer the Vehicle_Age
        vehicle_age = CURRENT_YEAR - request.yom
        
        # Map to Pandas DataFrame with names the pipeline expects
        data = {
            'Brand': [request.brand],
            'Model': [request.model],
            'Engine (cc)': [request.engine_cc],
            'Gear': [request.gear],
            'Fuel Type': [request.fuel_type],
            'Millage(KM)': [request.millage_km],
            'Vehicle_Age': [vehicle_age]
        }
        df = pd.DataFrame(data)
        
        # Run prediction
        prediction = pipeline.predict(df)[0]
        
        return {
            "status": "success",
            "predicted_price_lkr": float(prediction)
        }
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during prediction")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
