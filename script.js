/*******************
 * STEP 1: Data
 *******************/
const parkinsonsData = [
    0.642, 0.908, 0.848, 0.677, 1.046, 0.894, 1.261, 0.726, 1.369, 0.948,
    1.048, 0.731, 0.889, 1.124, 0.722, 1.166, 0.802, 0.36,  1.255, 1.128,
    1.244, 1.423, 0.987, 1.092, 1.064, 0.876, 1.242, 0.825, 1.013, 0.906,
    0.993, 0.807, 1.234, 0.832, 1.185, 1.246, 1.146, 1.218, 0.785, 1.052,
    0.664, 0.906, 1.099, 0.755, 1.112, 0.413, 1.183, 1.212, 0.616, 1.178,
    1.247, 0.918, 1.087, 0.94,  1.135, 1.118, 1.044, 0.77,  1.147, 1.276,
    1.088, 1.187, 1.352, 0.935, 0.988, 1.107, 1.218, 1.031, 1.139, 1.215,
    1.117, 1.298, 1.032, 1.151, 1.021, 1.088, 1.192, 1.167, 1.259, 1.204,
    0.856, 1.162, 0.903, 1.12,  1.08,  1.386, 1.28,  0.97,  1.01,  1.07,
    0.88,  1.07
  ];
  
  const controlData = [
    1.075, 1.04,  1.051, 1.175, 0.92,  1.121, 1.282, 0.975, 1.249, 1.164,
    1.515, 1.389, 1.211, 1.298, 1.344, 1.346, 1.415, 1.542, 1.089, 1.329,
    1.322, 1.239, 1.248, 0.954, 1.332, 1.286, 1.375, 1.051, 1.203, 1.143,
    1.17,  1.42,  1.164, 1.484, 1.54,  1.231, 1.253, 1.031, 1.13,  1.144,
    1.17,  1.391, 1.265, 1.349, 0.906, 1.371, 1.427, 1.07,  1.263, 1.348,
    1.191, 1.31,  1.442, 1.465, 1.538, 1.299, 1.151, 1.469, 1.073, 1.202,
    1.27,  1.086, 1.25,  1.458, 1.418, 1.16
  ];
  
  // Helper function for combined data
  const getCombinedData = () => [...parkinsonsData, ...controlData];
  
  /*******************
   * STEP 2: SVG Setup
   *******************/
  // Increased top margin so we have space for a legend
  const margin = { top: 60, right: 30, bottom: 40, left: 60 };
  const fullWidth = 800;
  const fullHeight = 400;
  
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;
  
  const svg = d3
    .select("#chart")
    .attr("width", fullWidth)
    .attr("height", fullHeight);
  
  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  const tooltip = d3.select("#tooltip");
  
  // xScale, yScale
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);
  
  // Axis groups
  const xAxisGroup = chartArea
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0, ${height})`);
  
  const yAxisGroup = chartArea
    .append("g")
    .attr("class", "axis y-axis");
  
  /*******************
   * STEP 3: Brush
   *******************/
  const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("end", brushed);
  
  const brushGroup = chartArea.append("g")
    .attr("class", "brush")
    .call(brush);
  
  function brushed(event) {
    if (!event.selection) return; // if no selection, ignore
    wasBrushed = true;
    const [x0, x1] = event.selection;
    const newDomain = [xScale.invert(x0), xScale.invert(x1)];
    xScale.domain(newDomain);
    drawHistogram();
    // clear the brush selection
    brushGroup.call(brush.move, null);
  }
  
  /*******************
   * STEP 4: Legend
   *******************/
  const legend = svg.append("g")
    .attr("class", "legend")
    // Center it near the top, inside the margin area
    .attr("transform", `translate(${margin.left + width / 2 - 70}, 20)`);
  
  // We'll show two legend items side by side
  // Add a white rectangle as background if desired
  legend.append("rect")
    .attr("class", "legend-bg")
    .attr("width", 140)
    .attr("height", 30)
    .attr("x", 0)
    .attr("y", -15)
    .attr("rx", 5)
    .attr("fill", "white")
    .attr("opacity", 0.8)
    .attr("stroke", "#ccc");
  
  const legendPark = legend.append("g")
    .attr("transform", "translate(0, 0)");
  
  legendPark.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "steelblue")
    .attr("opacity", 0.6);
  
  legendPark.append("text")
    .text("Parkinson's")
    .attr("x", 20)
    .attr("y", 12)
    .attr("font-size", "12px");
  
  const legendCtrl = legend.append("g")
    .attr("transform", "translate(80, 0)");
  
  legendCtrl.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "crimson")
    .attr("opacity", 0.6);
  
  legendCtrl.append("text")
    .text("Control")
    .attr("x", 20)
    .attr("y", 12)
    .attr("font-size", "12px");
  
  // Initially hide the legend (we'll show it only if group = "both")
  legend.style("visibility", "hidden");
  
  /*******************
   * STEP 5: Axis Labels
   *******************/
  // X-axis label
  chartArea.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 30)  // a bit below the x-axis
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Gait Speed (m/s)");
  
  // Y-axis label
  chartArea.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("transform", `translate(${-40}, ${height / 2}) rotate(-90)`)
    .text("Frequency Count");
  
  /*******************
   * STEP 6: Chart Drawing
   *******************/
  let currentGroup = "both"; // "both", "1", or "2"
  let currentBins = 15;      // bin count
  let wasBrushed = false;    // track if we just brushed
  
  function drawHistogram() {
    // Decide the dataset based on group
    let data;
    if (currentGroup === "both") {
      data = getCombinedData();
    } else if (currentGroup === "1") {
      data = parkinsonsData;
    } else {
      data = controlData;
    }
  
    // If not brushed, reset xScale domain to [0, max] for chosen data
    if (!wasBrushed) {
      const maxVal = d3.max(data);
      xScale.domain([0, maxVal]);
    }
    wasBrushed = false; // reset
  
    // We'll remove any existing bars so we can redraw fresh each time
    chartArea.selectAll(".barPark").remove();
    chartArea.selectAll(".barCtrl").remove();
    chartArea.selectAll(".barSingle").remove();
  
    // If BOTH: overlay two histograms in different colors
    if (currentGroup === "both") {
      // Show legend
      legend.style("visibility", "visible");
  
      // 1) Bins
      const histogram = d3
        .histogram()
        .value(d => d)
        .domain(xScale.domain())
        .thresholds(currentBins);
  
      const binsPark = histogram(parkinsonsData);
      const binsCtrl = histogram(controlData);
  
      // 2) yScale domain = max count from both hist sets
      const maxCount = d3.max([
        d3.max(binsPark, d => d.length),
        d3.max(binsCtrl, d => d.length),
      ]);
      yScale.domain([0, maxCount]);
  
      // 3) Parkinson's bars
      let rectsPark = chartArea.selectAll(".barPark")
        .data(binsPark, d => d.x0 + "-" + d.x1);
  
      rectsPark.exit().remove();
  
      const rectsParkEnter = rectsPark.enter()
        .append("rect")
        .attr("class", "barPark")
        .attr("fill", "steelblue")
        .attr("opacity", 0.6)
        .attr("x", d => xScale(d.x0))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("y", height)
        .attr("height", 0)
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `Parkinson's<br>Count: ${d.length}<br>` +
              `Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}`
            )
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
  
      rectsPark = rectsParkEnter.merge(rectsPark);
  
      rectsPark
        .transition()
        .duration(750)
        .attr("x", d => xScale(d.x0))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("y", d => yScale(d.length))
        .attr("height", d => height - yScale(d.length));
  
      // 4) Control bars
      let rectsCtrl = chartArea.selectAll(".barCtrl")
        .data(binsCtrl, d => d.x0 + "-" + d.x1);
  
      rectsCtrl.exit().remove();
  
      const rectsCtrlEnter = rectsCtrl.enter()
        .append("rect")
        .attr("class", "barCtrl")
        .attr("fill", "crimson")
        .attr("opacity", 0.6)
        .attr("x", d => xScale(d.x0))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("y", height)
        .attr("height", 0)
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `Control<br>Count: ${d.length}<br>` +
              `Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}`
            )
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
  
      rectsCtrl = rectsCtrlEnter.merge(rectsCtrl);
  
      rectsCtrl
        .transition()
        .duration(750)
        .attr("x", d => xScale(d.x0))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("y", d => yScale(d.length))
        .attr("height", d => height - yScale(d.length));
  
    } else {
      // Hide legend if only one group is selected
      legend.style("visibility", "hidden");
  
      // Single group (Parkinson's or Control)
      const histogram = d3
        .histogram()
        .value(d => d)
        .domain(xScale.domain())
        .thresholds(currentBins);
  
      const bins = histogram(data);
  
      yScale.domain([0, d3.max(bins, d => d.length)]);
  
      let rects = chartArea.selectAll(".barSingle")
        .data(bins, d => d.x0 + "-" + d.x1);
  
      rects.exit().remove();
  
      const rectsEnter = rects.enter()
        .append("rect")
        .attr("class", "barSingle")
        .attr("fill", currentGroup === "1" ? "steelblue" : "crimson")
        .attr("opacity", 0.6)
        .attr("x", d => xScale(d.x0))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("y", height)
        .attr("height", 0)
        .on("mouseover", (event, d) => {
          const groupName = currentGroup === "1" ? "Parkinson's" : "Control";
          tooltip
            .style("opacity", 1)
            .html(
              `${groupName}<br>Count: ${d.length}<br>` +
              `Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}`
            )
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
  
      rects = rectsEnter.merge(rects);
  
      rects
        .transition()
        .duration(750)
        .attr("x", d => xScale(d.x0))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("y", d => yScale(d.length))
        .attr("height", d => height - yScale(d.length));
    }
  
    // Update axes
    xAxisGroup.transition().duration(750).call(d3.axisBottom(xScale));
    yAxisGroup.transition().duration(750).call(d3.axisLeft(yScale).ticks(6));
  }
  
  /*******************
   * STEP 7: Controls
   *******************/
  const dropdown = document.getElementById("group-select");
  dropdown.addEventListener("change", () => {
    currentGroup = dropdown.value;
    wasBrushed = false;  // resetting brush usage so xScale domain will reset
    drawHistogram();
  });
  
  const binSlider = document.getElementById("bin-slider");
  const binCountLabel = document.getElementById("bin-count");
  binSlider.addEventListener("input", () => {
    currentBins = +binSlider.value;
    binCountLabel.textContent = currentBins;
    drawHistogram();
  });
  
  /*******************
   * STEP 8: Init
   *******************/

// Zoey's modification
// Define an empty array to store parsed data
let combinedData = [];

// Load the dataset
d3.text("gait-in-parkinsons-disease-1.0.0/demographics.txt").then(function(text) {
    const rows = text.split("\n").slice(1); // Skip the header row

    rows.forEach(row => {
        const cols = row.split("\t"); // Split by tab (assuming tab-separated values)

        if (cols.length > 10) { // Ensure valid row with data
            combinedData.push({
                id: cols[0], // Participant ID
                group: parseInt(cols[2]), // 1 = Parkinson’s, 2 = Control
                gender: parseInt(cols[4]), // 1 = Male, 2 = Female
                age: parseInt(cols[5]), // Age of participant
                height: parseFloat(cols[6]), // Height in meters
                weight: parseFloat(cols[7]), // Weight in kg
                hoehnYahr: parseFloat(cols[8]) || null, // Parkinson’s severity scale (only for patients)
                speed: parseFloat(cols[12]) || 0, // Gait speed (first recorded value)
            });
        }
    });

    console.log("Loaded dataset:", combinedData); // Debugging to check parsed data

    // Call the filtering function after data is loaded
    applyFilters();
});

// Step 1: Add UI Elements for Filtering
const filterControls = document.getElementById("controls");

// Age Range Filter
const ageLabel = document.createElement("label");
ageLabel.innerHTML = "Age Range: <span id='age-range'></span>";
const ageSlider = document.createElement("input");
ageSlider.type = "range";
ageSlider.min = "50";
ageSlider.max = "90";
ageSlider.value = "90";
ageSlider.id = "age-slider";
ageSlider.step = "1";
filterControls.appendChild(ageLabel);
filterControls.appendChild(ageSlider);

// Gender Filter Dropdown
const genderSelect = document.createElement("select");
genderSelect.id = "gender-select";
genderSelect.innerHTML = `
  <option value="all">All Genders</option>
  <option value="1">Male</option>
  <option value="2">Female</option>
`;
filterControls.appendChild(genderSelect);

// Severity Filter (Only for Parkinson's Patients)
const severitySelect = document.createElement("select");
severitySelect.id = "severity-select";
severitySelect.innerHTML = `
  <option value="all">All Severities</option>
  <option value="1">Hoehn & Yahr 1 (Mild)</option>
  <option value="2">Hoehn & Yahr 2</option>
  <option value="3">Hoehn & Yahr 3</option>
  <option value="4">Hoehn & Yahr 4</option>
`;
filterControls.appendChild(severitySelect);

// Step 2: Apply Filters
function applyFilters() {
  if (combinedData.length === 0) {
      console.log("Data not loaded yet.");
      return;
  }

  const selectedAge = parseInt(ageSlider.value);
  const selectedGender = genderSelect.value;
  const selectedSeverity = severitySelect.value;

  // Filter dataset dynamically
  let filteredData = combinedData.filter(d =>
    (selectedAge >= d.age - 5) && // Allow a wider range
    (selectedGender === "all" || d.gender == selectedGender) &&
    (selectedSeverity === "all" || (d.hoehnYahr == selectedSeverity && d.group == 1))
).map(d => d.speed);


  console.log("Filtered Data:", filteredData); // Debugging output
  drawHistogram(filteredData);
}



// Step 3: Add Event Listeners
ageSlider.addEventListener("input", applyFilters);
genderSelect.addEventListener("change", applyFilters);
severitySelect.addEventListener("change", applyFilters);

// Step 4: Initialize with Filters Applied
applyFilters();


  drawHistogram();
  