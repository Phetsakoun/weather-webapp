import sys
import os
import json
import numpy as np
import joblib
from tensorflow.keras.models import load_model

# เพิ่มโฟลเดอร์ parent (ml_model) เข้าใน path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# คอนฟิก
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "lstm_weather.keras")
SCALER_PATH = os.path.join(BASE_DIR, "model", "scaler.pkl")
SEQ_LEN = 24

# โหลดโมเดลและ scaler
model = load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

def predict_next(history):
    """
    history: array (SEQ_LEN, 5) ของ [temp, hum, pres, wind_speed, rainfall]
    คืนค่า: ทำนาย [temp, hum, pres, wind_speed, rainfall] ถัดไป (array)
    """
    arr = np.array(history).reshape(1, SEQ_LEN, 5)  # เปลี่ยนเป็น 5 features
    pred_scaled = model.predict(arr)[0]  # shape (5,)
    pred = scaler.inverse_transform(pred_scaled.reshape(1, -1))[0]
    return pred

if __name__ == "__main__":
    # ตรวจ argument
    if len(sys.argv) < 2:
        print(f"Usage: python {os.path.basename(__file__)} '[json_array]'")
        sys.exit(1)

    # ดึง history จาก JSON string
    try:
        history = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print("Error: Argument must be a JSON array")
        sys.exit(1)

    # ตรวจความยาว
    if len(history) != SEQ_LEN:
        print(f"Error: history must have length {SEQ_LEN}, got {len(history)}")
        sys.exit(1)

    # ทำนายและพิมพ์ผล
    next_pred = predict_next(history)
    print(json.dumps({
        'temperature': round(float(next_pred[0]), 2),
        'humidity': round(float(next_pred[1]), 2),
        'pressure': round(float(next_pred[2]), 2),
        'wind_speed': round(float(next_pred[3]), 2),
        'rainfall': round(float(next_pred[4]), 2)
    }))
