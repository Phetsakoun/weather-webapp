import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import joblib
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Input, LSTM, Dense
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from data_loader import load_weather_data
from preprocess import prepare_data

# ตั้งโฟลเดอร์เก็บโมเดล
BASE_DIR  = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

if __name__ == "__main__":
    SEQ_LEN = 24
    EPOCHS  = 50  # ลด epochs ให้น้อยลงเพื่อฝึกเร็วขึ้น
    BATCH   = 32

    try:
        # 1) Load & preprocess
        print("🔄 Loading weather data from database...")
        data = load_weather_data()  # shape (n, 5) - เพิ่ม rainfall
        print(f"✅ Loaded weather data: {data.shape}")
        
        if len(data) < SEQ_LEN + 1:
            print(f"❌ Error: Not enough data. Need at least {SEQ_LEN + 1} records, got {len(data)}")
            exit(1)
        
        print("🔄 Preparing sequences...")
        X, y, scaler = prepare_data(data, SEQ_LEN)  # X: (samples, SEQ_LEN, 5), y: (samples, 5)
        print(f"✅ Shape X: {X.shape}, y: {y.shape}")

        # 2) Split
        split = int(len(X) * 0.8)
        X_train, X_val = X[:split], X[split:]
        y_train, y_val = y[:split], y[split:]
        print(f"📊 Training samples: {len(X_train)}, Validation samples: {len(X_val)}")

        # 3) Build model
        print("🏗️ Building LSTM model...")
        model = Sequential([
            Input(shape=(SEQ_LEN, 5)),  # เปลี่ยนเป็น 5 features
            LSTM(50, return_sequences=True),  # เพิ่ม LSTM layer
            LSTM(50),
            Dense(25, activation='relu'),  # เพิ่ม hidden layer
            Dense(5)  # ทำนาย temp, hum, pres, wind_speed, rainfall
        ])
        model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])
        print("✅ Model compiled successfully")
        print(model.summary())

    # 4) Callbacks
    checkpoint = ModelCheckpoint(
        filepath=os.path.join(MODEL_DIR, "lstm_weather.keras"),
        monitor="val_loss", save_best_only=True, verbose=1
    )
    earlystop = EarlyStopping(
        monitor="val_loss", patience=10, restore_best_weights=True, verbose=1
    )

    # 5) Train
    print("🚀 Starting training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS, batch_size=BATCH,
        callbacks=[checkpoint, earlystop],
        verbose=1
    )
    print("✅ Training completed!")

    # 6) Save scaler
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    joblib.dump(scaler, scaler_path)
    print(f"💾 Scaler saved to: {scaler_path}")
    
    # 7) Save model in modern format
    model_path = os.path.join(MODEL_DIR, "lstm_weather.keras")
    model.save(model_path)
    print(f"💾 Model saved to: {model_path}")
    
    # 8) Print training summary
    print("\n📊 Training Summary:")
    print(f"Final Training Loss: {history.history['loss'][-1]:.4f}")
    print(f"Final Validation Loss: {history.history['val_loss'][-1]:.4f}")
    print(f"Best Validation Loss: {min(history.history['val_loss']):.4f}")
    print("🎉 Model training completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during training: {str(e)}")
        import traceback
        print("📄 Full error traceback:")
        traceback.print_exc()
        exit(1)
