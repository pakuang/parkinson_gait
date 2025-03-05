import zipfile
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

demographics_txt_path = "gait-in-parkinsons-disease-1.0.0/demographics.txt"

# 3. **Loading the Demographics Data**
demographics_df = pd.read_csv(demographics_txt_path, sep="\t", engine="python", error_bad_lines=False)

# 4. **Ensuring "Speed_01" is Numeric**
demographics_df["Speed_01"] = pd.to_numeric(demographics_df["Speed_01"], errors="coerce")

# Remove NaN values for gait speed
filtered_df = demographics_df.dropna(subset=["Speed_01"])

# Extract Speed_01 values for each group
parkinsons_speed = filtered_df.loc[filtered_df["Group"] == 1, "Speed_01"].tolist()
control_speed = filtered_df.loc[filtered_df["Group"] == 2, "Speed_01"].tolist()

# Generate the HTML file content
html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gait Speed Distribution</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <h2 style="text-align:center;">Gait Speed Distribution (Parkinson's vs. Control)</h2>
    <div id="gaitSpeedChart"></div>

    <script>
        // Actual dataset values
        var parkinsons_speed = {parkinsons_speed};
        var control_speed = {control_speed};

        var trace1 = {{
            x: parkinsons_speed,
            type: "histogram",
            name: "Parkinson's",
            opacity: 0.6,
            marker: {{color: "red"}},
            histnorm: "probability density"
        }};

        var trace2 = {{
            x: control_speed,
            type: "histogram",
            name: "Control",
            opacity: 0.6,
            marker: {{color: "blue"}},
            histnorm: "probability density"
        }};

        var layout = {{
            barmode: "overlay",
            xaxis: {{ title: "Gait Speed (Speed_01)" }},
            yaxis: {{ title: "Density" }},
            title: "Gait Speed Distribution with KDE Overlay",
        }};

        Plotly.newPlot("gaitSpeedChart", [trace1, trace2], layout);
    </script>
</body>
</html>
"""

# Save to an HTML file
html_path = "gait_speed_distribution.html"
with open(html_path, "w") as file:
    file.write(html_content)

# Provide the download link
html_path