
import os
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import TransformedTargetRegressor
import joblib

MARKET_MULTIPLIER = 1.15
CURRENT_YEAR = 2026

def train():
    data_path = 'data/car_price_dataset.csv'
    model_dir = 'model'
    model_path = os.path.join(model_dir, 'autopulse_pipeline.pkl')
    
    # Check if data exists
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Ensure it exists before training.")
        return

    # Load data
    df = pd.read_csv(data_path)
    
    # Drop rows missing 'Price'
    df = df.dropna(subset=['Price'])
    
    # Keep only necessary columns
    columns_to_keep = ['Brand', 'Model', 'YOM', 'Engine (cc)', 'Gear', 'Fuel Type', 'Millage(KM)', 'Price']
    df = df[columns_to_keep]
    
    # Market Calibration
    df['Price'] = df['Price'] * MARKET_MULTIPLIER
    
    # Feature Engineering
    df['Vehicle_Age'] = CURRENT_YEAR - df['YOM']
    df = df.drop(columns=['YOM'])
    
    # Separate features and target
    X = df.drop(columns=['Price'])
    y = df['Price']
    
    # Preprocessing Pipeline
    numeric_features = ['Vehicle_Age', 'Engine (cc)', 'Millage(KM)']
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', RobustScaler())
    ])
    
    categorical_features = ['Brand', 'Model', 'Gear', 'Fuel Type']
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('encoder', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # Model Training
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    wrapped_model = TransformedTargetRegressor(
        regressor=rf_model,
        func=np.log1p,
        inverse_func=np.expm1
    )
    
    # Full Pipeline
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', wrapped_model)
    ])
    
    # Train
    print("Training pipeline...")
    pipeline.fit(X, y)
    print("Training complete.")
    
    # Save Model
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
        
    joblib.dump(pipeline, model_path)
    print(f"Pipeline saved to {model_path}.")

if __name__ == "__main__":
    train()
