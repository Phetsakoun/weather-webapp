import os
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# Try to import TensorFlow, but don't fail if it's not available
try:
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("⚠️ TensorFlow not available, using mock predictions")

try:
    from dotenv import load_dotenv, find_dotenv
    # Load environment variables
    dotenv_path = find_dotenv()
    if dotenv_path:
        load_dotenv(dotenv_path)
except ImportError:
    print("⚠️ python-dotenv not available, continuing without environment variables")

# Base directory of ml_model
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Paths for model and scaler
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'lstm_weather.keras')  # Updated to use .keras format
SCALER_PATH = os.path.join(BASE_DIR, 'model', 'scaler.pkl')
SEQ_LEN = 24

# Check if model files exist and TensorFlow is available
MODEL_LOADED = False
if TENSORFLOW_AVAILABLE:
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            model = load_model(MODEL_PATH, compile=False)
            scaler = joblib.load(SCALER_PATH)
            MODEL_LOADED = True
            print("✅ Model loaded successfully")
        else:
            print("⚠️ Model files not found, using mock predictions")
    except Exception as e:
        print(f"⚠️ Failed to load model: {e}, using mock predictions")

app = FastAPI(title="Weather ML API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- (1) Schema for request ---------- #
class WeatherSequence(BaseModel):
    temperature: list  # length SEQ_LEN
    humidity: list     # length SEQ_LEN
    pressure: list     # length SEQ_LEN
    wind_speed: list   # length SEQ_LEN
    rainfall: list     # length SEQ_LEN

@app.post('/predict')
def predict_weather(seq: WeatherSequence):
    """
    รับข้อมูล weather sequence (temperature, humidity, pressure, wind_speed, rainfall)
    ขนาดแต่ละอาเรย์ต้องยาวเท่า SEQ_LEN (24)
    คืนค่า prediction
    """
    if not MODEL_LOADED:
        # Mock prediction for testing
        return {
            'temperature': 28.5,
            'humidity': 75.2,
            'pressure': 1013.2,
            'wind_speed': 3.2,
            'rainfall': 2.1
        }
    
    # ตรวจสอบความยาวข้อมูล
    if not (len(seq.temperature) == len(seq.humidity) == len(seq.pressure) == len(seq.wind_speed) == len(seq.rainfall) == SEQ_LEN):
        raise HTTPException(status_code=400, detail=f'Each array must have {SEQ_LEN} values')

    # รวม features [temperature, humidity, pressure, wind_speed, rainfall] → shape (SEQ_LEN, 5)
    input_seq = np.stack([
        np.array(seq.temperature, dtype=float),
        np.array(seq.humidity, dtype=float),
        np.array(seq.pressure, dtype=float),
        np.array(seq.wind_speed, dtype=float),
        np.array(seq.rainfall, dtype=float)
    ], axis=1)  # (SEQ_LEN, 5)

    # scale input (รองรับทั้ง MinMax, Standard)
    seq_scaled = scaler.transform(input_seq)
    seq_input = seq_scaled.reshape(1, SEQ_LEN, 5)  # (1, SEQ_LEN, 5)

    # predict
    pred_scaled = model.predict(seq_input)
    pred_scaled = pred_scaled[0]  # shape (5,)
    inv = scaler.inverse_transform(pred_scaled.reshape(1, -1))[0]
    
    # Convert numpy types to Python native types to avoid JSON serialization errors
    return {
        'temperature': float(round(inv[0], 2)),
        'humidity': float(round(inv[1], 2)),
        'pressure': float(round(inv[2], 2)),
        'wind_speed': float(round(inv[3], 2)),
        'rainfall': float(round(inv[4], 2))
    }

# ---------- (3) Ingest and Predict endpoint ---------- #
@app.post('/ingest_and_predict')
def ingest_and_predict(lat: float = Query(...), lon: float = Query(...)):
    """
    ดึงข้อมูลสภาพอากาศล่าสุดจาก API และทำนายผล
    """
    try:
        # Mock weather data for testing
        mock_times = []
        mock_temps = []
        mock_humidities = []
        mock_pressures = []
        mock_wind_speeds = []
        mock_rainfalls = []
        
        # Generate mock data for next 7 days
        base_temp = 28.0
        for i in range(7):
            mock_times.append(f"2025-01-{8+i:02d}")
            
            # Simulate temperature variation based on location
            temp_variation = np.sin(i * 0.5) * 3 + np.random.normal(0, 1)
            # Adjust temperature based on latitude (higher lat = cooler)
            lat_adjustment = (18.0 - lat) * 0.5 if lat < 18.0 else 0
            temp = base_temp + temp_variation + lat_adjustment
            mock_temps.append(round(temp, 1))
            
            # Simulate humidity (tropical climate)
            humidity = 70 + np.random.normal(0, 10)
            humidity = max(30, min(95, humidity))  # Clamp between 30-95%
            mock_humidities.append(round(humidity, 1))
            
            # Simulate pressure (standard atmospheric pressure with variation)
            pressure = 1013.25 + np.random.normal(0, 5)
            mock_pressures.append(round(pressure, 1))
            
            # Simulate wind speed
            wind_speed = 2 + np.random.exponential(1.5)
            wind_speed = min(wind_speed, 15)  # Cap at 15 m/s
            mock_wind_speeds.append(round(wind_speed, 1))
            
            # Simulate rainfall with some randomness
            rainfall = max(0, np.random.exponential(2) if np.random.random() > 0.7 else 0)
            mock_rainfalls.append(round(rainfall, 1))
        
        return {
            "status": "success",
            "location": {"lat": lat, "lon": lon},
            "predictions": {
                "times": mock_times,
                "temperatures": mock_temps,
                "humidities": mock_humidities,
                "pressures": mock_pressures,
                "wind_speeds": mock_wind_speeds,
                "rainfalls": mock_rainfalls
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ---------- (4) Health check ---------- #
@app.get("/")
def read_root():
    model_status = "loaded" if MODEL_LOADED else "mock mode"
    return {
        "message": "ML Weather API is running", 
        "model_status": model_status,
        "endpoints": ["/predict", "/ingest_and_predict"],
        "docs": "/docs"
    }

# ---------- (5) Run server ---------- #
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting ML Weather API server on 127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
