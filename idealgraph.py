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
import json

# Ensure the data is properly formatted for JavaScript (JSON arrays)
parkinsons_speed_json = json.dumps(parkinsons_speed)
control_speed_json = json.dumps(control_speed)

# Generate the corrected HTML file content
html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gait Speed Distribution</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {{ font-family: Arial, sans-serif; text-align: center; }}
        .axis-label {{ font-size: 14px; }}
        .hist-bar {{ fill: steelblue; opacity: 0.6; }}
        .kde-line {{ stroke: red; stroke-width: 2; fill: none; }}
    </style>
</head>
<body>
    <h2>Gait Speed Distribution (Parkinson's vs. Control)</h2>
    <svg width="800" height="500"></svg>

    <script>
        // Actual dataset values
        var parkinsons_speed = {parkinsons_speed_json};
        var control_speed = {control_speed_json};

        // Combine both datasets with labels
        var dataset = parkinsons_speed.map(d => ({{ value: d, group: "Parkinson's" }}))
                     .concat(control_speed.map(d => ({{ value: d, group: "Control" }})));

        // Set dimensions
        var margin = {{ top: 30, right: 30, bottom: 50, left: 50 }},
            width = 800 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select("svg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // X Scale
        var x = d3.scaleLinear()
            .domain(d3.extent(dataset, d => d.value))
            .range([0, width]);

        // Histogram bins
        var histogram = d3.histogram()
            .value(d => d.value)
            .domain(x.domain())
            .thresholds(x.ticks(20));

        var bins = histogram(dataset);

        // Y Scale
        var y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([height, 0]);

        // X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("class", "axis-label")
            .text("Gait Speed (Speed_01)");

        // Y Axis
        svg.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .attr("class", "axis-label")
            .text("Count");

        // Draw Histogram Bars
        svg.selectAll("rect")
            .data(bins)
            .enter().append("rect")
            .attr("x", d => x(d.x0))
            .attr("y", d => y(d.length))
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("height", d => height - y(d.length))
            .attr("class", "hist-bar");

        // KDE Function
        function kernelDensityEstimator(kernel, X) {{
            return X.map(x => ({{ x, y: d3.mean(dataset, d => kernel(x - d.value)) }}));
        }}

        function gaussianKernel(scale) {{
            return x => Math.exp(-0.5 * (x / scale) ** 2) / (Math.sqrt(2 * Math.PI) * scale);
        }}

        var kde = kernelDensityEstimator(gaussianKernel(0.1), x.ticks(50));

        // Draw KDE Line
        var kdeLine = d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y * dataset.length * 5)); // Scaling factor

        svg.append("path")
            .datum(kde)
            .attr("class", "kde-line")
            .attr("d", kdeLine);
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