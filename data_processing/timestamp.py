import pandas as pd
from datetime import datetime

# Load the filtered collisions data
file_path = 'filtered_collisions.csv'
filtered_collisions = pd.read_csv(file_path)

# Function to convert 'Date Occurred' and 'Time Occurred' to nanoseconds since the epoch
def to_nanoseconds(date_str, time_int):
    # Parse the date and time
    date_format = '%Y-%m-%d'
    time_str = f'{time_int:04}'  # Ensure time is in HHMM format
    time_format = '%H%M'
    
    # Combine and parse
    combined_datetime = datetime.strptime(date_str, date_format)
    combined_datetime = combined_datetime.replace(
        hour=int(time_str[:2]),
        minute=int(time_str[2:])
    )
    
    # Convert to nanoseconds since the epoch
    return int(combined_datetime.timestamp() * 1e9)

# Apply the conversion
filtered_collisions['timestamp_ns'] = filtered_collisions.apply(
    lambda row: to_nanoseconds(row['Date Occurred'], row['Time Occurred']),
    axis=1
)

# Drop the original 'Date Occurred' and 'Time Occurred' columns
filtered_collisions = filtered_collisions.drop(columns=['Date Occurred', 'Time Occurred'])

# Save the updated DataFrame with only the nanoseconds timestamp column
output_path_cleaned = 'filtered_collisions_timestamps_only.csv'
filtered_collisions.to_csv(output_path_cleaned, index=False)

print(f"Filtered collisions saved to: {output_path_cleaned}")









# Load collision timestamps data
collision_file_path = 'filtered_collisions_timestamps_only.csv'
collision_data = pd.read_csv(collision_file_path)

# Convert timestamps to datetime
collision_data['timestamp_ns'] = pd.to_datetime(collision_data['timestamp_ns'], unit='ns')

# Sort by timestamp
collision_data = collision_data.sort_values(by='timestamp_ns').reset_index(drop=True)

# Save back to a CSV file
collision_data.to_csv('filtered_collisions_timestamps_sorted.csv', index=False)

print("Collision data sorted and saved as 'filtered_collisions_timestamps_sorted.csv'.")
