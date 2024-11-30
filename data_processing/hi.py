import h5py
import pandas as pd

# Step 1: Load metr-la.h5 file into a DataFrame
file_path = 'metr-la.h5'
try:
    with h5py.File(file_path, 'r') as f:
        axis0 = f['df/axis0'][:].astype(str)  # Sensor IDs (column names)
        axis1 = f['df/axis1'][:]  # Timestamps in nanoseconds
        block0_values = f['df/block0_values'][:]  # Sensor data (values)
        
    # Convert to DataFrame
    metr_la_data_df = pd.DataFrame(block0_values, index=axis1, columns=axis0)
    # Convert nanoseconds to datetime for the index
    metr_la_data_df.index = pd.to_datetime(metr_la_data_df.index, unit='ns')
except Exception as e:
    raise ValueError(f"Error loading HDF5 file: {e}")

# Step 2: Load collision timestamps from CSV
collision_file_path = 'filtered_collisions_timestamps_sorted.csv'
collision_data = pd.read_csv(collision_file_path)

# Convert the collision timestamps to datetime
collision_data['timestamp_ns'] = pd.to_datetime(collision_data['timestamp_ns'], unit='ns')

# Step 3: Load sensor location data (latitude, longitude, sensor ID mapping)
sensor_location_file_path = 'graph_sensor_locations.csv'
sensor_location_data = pd.read_csv(sensor_location_file_path)

# Step 4: Extract sensor data for a given collision timestamp
# Example: Use the first timestamp from the collision data
collision_timestamp = collision_data['timestamp_ns'].iloc[5]

if collision_timestamp in metr_la_data_df.index:
    # Extract all sensor speeds for the given timestamp
    collision_speeds = metr_la_data_df.loc[collision_timestamp]
    collision_speeds_df = pd.DataFrame({'Sensor ID': collision_speeds.index, 'Speed': collision_speeds.values})
    
    # Ensure both columns being merged have the same data type
    collision_speeds_df['Sensor ID'] = collision_speeds_df['Sensor ID'].astype(str)
    sensor_location_data['sensor_id'] = sensor_location_data['sensor_id'].astype(str)
    
    # Merge with sensor location data
    result_df = pd.merge(collision_speeds_df, sensor_location_data, left_on='Sensor ID', right_on='sensor_id')
    result_df = result_df[['Sensor ID', 'latitude', 'longitude', 'Speed']]  # Rearrange columns
else:
    result_df = pd.DataFrame(columns=['Sensor ID', 'latitude', 'longitude', 'Speed'])

# Display the resulting DataFrame
print(f"Collision Timestamp: {collision_timestamp}")
print(result_df)
