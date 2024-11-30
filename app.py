from flask import Flask, render_template, request, jsonify

import pandas as pd
import json


app = Flask(__name__)

# Load data
data = pd.read_csv('data/filtering.csv')

# Convert 'Date Occurred' to datetime while handling errors, and filter out invalid dates
data['Date Occurred'] = pd.to_datetime(data['Date Occurred'], errors='coerce')
data = data.dropna(subset=['Date Occurred'])  # Drop rows where 'Date Occurred' could not be converted
data['Month'] = data['Date Occurred'].dt.month

@app.route("/")
def index():
    # Monthly statistics
    monthly_stats = data['Month'].value_counts().sort_index().to_dict()
    
    # Prepare data for D3.js
    months = list(monthly_stats.keys())
    counts = list(monthly_stats.values())
    graph_data = {"months": months, "counts": counts}  # D3.js에서 사용할 데이터
    
    return render_template("index.html", monthly_stats=monthly_stats, graph_data=json.dumps(graph_data))

@app.route("/get_data")
def get_data():
    # Convert latitude and longitude to JSON format to be used by Mapbox
    filtered_data = data[['DR Number', 'Date Occurred', 'Time Occurred', 'latitude','longitude', 'Month']].dropna(subset=['latitude', 'longitude'])
    crash_points = filtered_data.to_dict(orient='records')
    return jsonify(crash_points)

@app.route("/get_data_by_date/<date>")
def get_data_by_date(date):
    try:
        # Parse date to ensure it's in the right format
        selected_date = pd.to_datetime(date, format='%Y-%m-%d')
        filtered_data = data[data['Date Occurred'].dt.date == selected_date.date()][['latitude', 'longitude', 'DR Number']].dropna(subset=['latitude', 'longitude'])
        crash_points = filtered_data.to_dict(orient='records')
        return jsonify(crash_points)
    except ValueError:
        return jsonify([])

@app.route("/get_data_by_month/<int:month>")
def get_data_by_month(month):
    # Filter data by month
    filtered_data = data[data['Month'] == month][['latitude', 'longitude', 'DR Number']].dropna(subset=['latitude', 'longitude'])
    crash_points = filtered_data.to_dict(orient='records')
    return jsonify(crash_points)

@app.route("/about_accident",methods=['GET'])
def about_accident():
    url = url_for('analysis_collision')  # example 라우트의 URL 생성
    return {'url': url}


@app.route("/save_collision", methods=['POST'])
def save_collision():
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    dr_number = request.form.get('dr_number')
    date_occurred = pd.to_datetime('now').strftime('%Y-%m-%d')  # 현재 날짜를 "Date Occurred" 필드로 사용
    new_data = pd.DataFrame([[latitude, longitude, dr_number, date_occurred]], columns=['latitude', 'longitude', 'DR Number', 'Date Occurred'])
    new_data.to_csv('data/filtering.csv', mode='a', header=False, index=False)
    return "Collision data added successfully!"

if __name__ == "__main__":
    app.run(debug=True)

