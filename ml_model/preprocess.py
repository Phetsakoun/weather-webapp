import numpy as np
from sklearn.preprocessing import MinMaxScaler

def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i : i + seq_length])
        ys.append(data[i + seq_length])
    return np.array(xs), np.array(ys)

def prepare_data(series, seq_length=24):
    # series shape: (n, 5) [temp, hum, pres, wind_speed, rainfall]
    if len(series) < seq_length + 1:
        raise ValueError(f"Not enough data: need ≥{seq_length+1}, got {len(series)}")

    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(series)
    X, y = create_sequences(scaled, seq_length)

    # X shape => (samples, seq_length, 5)
    return X, y, scaler
