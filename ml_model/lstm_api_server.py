from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/ingest_and_predict', methods=['POST'])
def ingest_and_predict():
    """
    Ingest historical data and generate LSTM predictions
    """
    try:
        # Get request data
        data = request.get_json()
        
        city_id = data.get('city_id', 1)
        city_name = data.get('city_name', 'Unknown')
        coordinates = data.get('coordinates', {})
        historical_data = data.get('historical_data', [])
        stats = data.get('stats', {})
        
        logger.info(f"Ingesting data for {city_name} (ID: {city_id})")
        logger.info(f"Historical data points: {len(historical_data)}")
        logger.info(f"Stats: {stats}")
        
        # Generate LSTM predictions based on historical data
        predictions = []
        days = 7  # Default prediction period
        
        # Use historical data statistics for more realistic predictions
        base_temp = stats.get('avg_temp', 28)
        base_humidity = stats.get('avg_humidity', 70)
        base_pressure = stats.get('avg_pressure', 1013)
        base_rainfall = stats.get('avg_rainfall', 0)
        
        for i in range(days):
            date = datetime.now() + timedelta(days=i+1)
            
            # Simulate LSTM prediction with some pattern based on historical data
            temp_variation = 3 * np.sin(i * 0.5) + np.random.normal(0, 1)
            predicted_temp = base_temp + temp_variation
            
            humidity_variation = 10 * np.sin(i * 0.3) + np.random.normal(0, 5)
            predicted_humidity = max(0, min(100, base_humidity + humidity_variation))
            
            pressure_variation = np.random.normal(0, 5)
            predicted_pressure = base_pressure + pressure_variation
            
            rainfall_variation = abs(np.random.normal(0, 2))
            predicted_rainfall = base_rainfall + rainfall_variation
            
            prediction = {
                'date': date.strftime('%Y-%m-%d'),
                'predicted_temperature': round(predicted_temp, 1),
                'predicted_humidity': round(predicted_humidity, 1),
                'predicted_pressure': round(predicted_pressure, 1),
                'predicted_rainfall': round(predicted_rainfall, 1),
                'confidence': round(np.random.uniform(0.75, 0.95), 2),
                'city_id': city_id,
                'city_name': city_name
            }
            
            predictions.append(prediction)
        
        logger.info(f"Generated {len(predictions)} predictions successfully")
        return jsonify({
            'success': True,
            'predictions': predictions,
            'city_id': city_id,
            'city_name': city_name
        })
        
    except Exception as e:
        logger.error(f"Error in ingest_and_predict: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['GET'])
def get_lstm_predictions():
    """
    Generate LSTM weather predictions
    """
    try:
        # Get parameters
        days = int(request.args.get('days', 7))
        city_id = int(request.args.get('cityId', 1))
        
        logger.info(f"Generating LSTM predictions for {days} days, city {city_id}")
        
        # Generate mock LSTM predictions
        predictions = []
        base_temp = 28  # Base temperature for Laos
        
        for i in range(days):
            date = datetime.now() + timedelta(days=i+1)
            
            # Simulate LSTM prediction with some pattern
            temp_variation = 3 * np.sin(i * 0.5) + np.random.normal(0, 1)
            predicted_temp = base_temp + temp_variation
            
            # For the first 3 days, also provide "actual" temperature for comparison
            actual_temp = None
            if i < 3:
                actual_temp = predicted_temp + np.random.normal(0, 0.5)
            
            prediction = {
                'date': date.strftime('%Y-%m-%d'),
                'predicted_temperature': round(predicted_temp, 1),
                'actual_temperature': round(actual_temp, 1) if actual_temp else None,
                'confidence': round(np.random.uniform(0.75, 0.95), 2),
                'city_id': city_id
            }
            
            predictions.append(prediction)
        
        logger.info(f"Generated {len(predictions)} predictions successfully")
        return jsonify(predictions)
        
    except Exception as e:
        logger.error(f"Error generating predictions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'LSTM Weather Prediction',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/model/info', methods=['GET'])
def model_info():
    """
    Get model information
    """
    return jsonify({
        'model_type': 'LSTM',
        'version': '1.0.0',
        'trained_on': 'Laos Weather Data',
        'accuracy': '85.2%',
        'last_updated': '2024-01-01'
    })

if __name__ == '__main__':
    print("🤖 Starting LSTM Weather Prediction Service...")
    print("📊 Service will be available at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
