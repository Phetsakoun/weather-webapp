import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT') or "3307"                # default ถ้า None
DB_NAME = os.getenv('DB_NAME')

DB_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

def load_weather_data():
    engine = create_engine(DB_URL)
    df = pd.read_sql(
        "SELECT timestamp, temperature, humidity, pressure, wind_speed, rainfall FROM weather ORDER BY timestamp",
        engine
    )
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    # เพิ่มคอลัมน์ที่ขาดหายไปพร้อมค่าเริ่มต้น
    if 'wind_speed' not in df.columns:
        df['wind_speed'] = 5.0  # ค่าเริ่มต้น wind speed
    if 'rainfall' not in df.columns:
        df['rainfall'] = 0.0  # ค่าเริ่มต้น rainfall
    # คืนค่าเป็น numpy array (n, 5) - เพิ่ม rainfall
    return df[['temperature', 'humidity', 'pressure', 'wind_speed', 'rainfall']].values
