from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import pandas as pd
import os
import sys

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = "model/autopulse_pipeline.pkl"
model = None

print(f"Python version: {sys.version}")
print(f"Looking for model at: {os.path.abspath(model_path)}")

if os.path.exists(model_path):
    try:
        # Try normal load
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print("✅ Model loaded successfully!")
    except Exception as e:
        print(f"First attempt failed: {e}")
        try:
            # Try with latin1 encoding (fixes STACK_GLOBAL error)
            with open(model_path, "rb") as f:
                model = pickle.load(f, encoding='latin1')
            print("✅ Model loaded with latin1 encoding!")
        except Exception as e2:
            print(f"Second attempt failed: {e2}")
            try:
                # Try with fix_imports=True
                with open(model_path, "rb") as f:
                    model = pickle.load(f, fix_imports=True, encoding='latin1')
                print("✅ Model loaded with fix_imports!")
            except Exception as e3:
                print(f"❌ All attempts failed: {e3}")
else:
    print(f"❌ Model file not found at {model_path}")

class CarInput(BaseModel):
    brand: str
    year: int
    mileage: float
    engine_size: float
    fuel_type: str
    transmission: str

@app.get("/")
async def root():
    return {
        "message": "ML API is running",
        "model_loaded": model is not None,
        "python_version": sys.version.split()[0]
    }

@app.post("/predict")
async def predict(car: CarInput):
    if model is None:
        # Fallback prediction if model not loaded
        price = 1000000 + (car.year - 2000) * 50000
        price -= car.mileage * 10
        price += car.engine_size * 200000
        
        if car.brand.lower() == "toyota":
            price *= 1.1
        elif car.brand.lower() == "honda":
            price *= 1.05
        elif car.brand.lower() == "bmw":
            price *= 1.3
            
        price_lakhs = price / 100000
        return {
            "status": "success",
            "predicted_price_lkr": round(price_lakhs, 2),
            "note": "Using fallback calculation (model not loaded)"
        }
    
    try:
        input_data = pd.DataFrame([{
            'brand': car.brand,
            'year': car.year,
            'mileage': car.mileage,
            'engine_size': car.engine_size,
            'fuel_type': car.fuel_type,
            'transmission': car.transmission
        }])
        
        prediction = model.predict(input_data)[0]
        price_lakhs = float(prediction) / 100000
        
        return {
            "status": "success",
            "predicted_price_lkr": round(price_lakhs, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))