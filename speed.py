import pandas as pd
import numpy as np

# Load the demographics file with more flexible parsing
file_path = "gait-in-parkinsons-disease-1.0.0/demographics.txt"

try:
    # First attempt with flexible engine
    df = pd.read_csv(file_path, sep="\t", engine="python")
except Exception as e:
    print(f"First attempt failed: {e}")
    try:
        # Second attempt with error handling
        df = pd.read_csv(file_path, sep="\t", on_bad_lines='skip')
    except Exception as e:
        print(f"Second attempt failed: {e}")
        # Third attempt with manual parsing
        with open(file_path, 'r') as f:
            lines = f.readlines()
            header = lines[0].strip().split('\t')
            
            # Find the index of the relevant columns
            try:
                group_idx = header.index('Group')
                speed_idx = header.index('Speed_01')
                
                # Create lists to store data
                groups = []
                speeds = []
                
                # Parse each line manually
                for line in lines[1:]:
                    try:
                        values = line.strip().split('\t')
                        if len(values) > max(group_idx, speed_idx):
                            group = int(values[group_idx]) if values[group_idx].strip() else None
                            speed = float(values[speed_idx]) if values[speed_idx].strip() else None
                            
                            if group is not None and speed is not None:
                                groups.append(group)
                                speeds.append(speed)
                    except (ValueError, IndexError):
                        continue
                
                # Create a dataframe
                df = pd.DataFrame({'Group': groups, 'Speed_01': speeds})
            except ValueError:
                print("Error: Could not find required columns in the file")
                exit(1)

# Basic validation
print(f"Loaded dataframe with {len(df)} rows and {df.columns.size} columns")
print(f"Columns: {', '.join(df.columns)}")

# Calculate average speeds for each group
parkinsons_speeds = df[df['Group'] == 1]['Speed_01']
control_speeds = df[df['Group'] == 2]['Speed_01']

# Ensure we have data
if len(parkinsons_speeds) == 0 or len(control_speeds) == 0:
    print("Error: No data found for one or both groups")
    exit(1)

parkinsons_avg = parkinsons_speeds.mean()
control_avg = control_speeds.mean()

# Calculate percentage difference
percentage_diff = ((control_avg - parkinsons_avg) / control_avg) * 100

# Print results
print(f"\nResults:")
print(f"Number of Parkinson's subjects: {len(parkinsons_speeds)}")
print(f"Number of Control subjects: {len(control_speeds)}")
print(f"Average speed (Parkinson's): {parkinsons_avg:.2f} m/s")
print(f"Average speed (Control): {control_avg:.2f} m/s")
print(f"Percentage difference: {percentage_diff:.1f}%")

# Count subjects below clinical threshold (1.0 m/s)
parkinsons_below = (parkinsons_speeds < 1.0).sum()
control_below = (control_speeds < 1.0).sum()
print(f"Parkinson's subjects below 1.0 m/s: {parkinsons_below} ({parkinsons_below/len(parkinsons_speeds)*100:.1f}%)")
print(f"Control subjects below 1.0 m/s: {control_below} ({control_below/len(control_speeds)*100:.1f}%)")