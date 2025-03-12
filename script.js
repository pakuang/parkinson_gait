/*******************
 * STEP 1: Data Loading
 *******************/
// These will be populated from the real data
let parkinsonsData = [];
let controlData = [];
let parkMean, controlMean, parkMedian, controlMedian;

// Load data before initializing the visualization
async function initializeVisualization() {
  try {
    // Attempt to load the real data
    const gaitData = await loadGaitData();
    parkinsonsData = gaitData.parkinsonsData;
    controlData = gaitData.controlData;
    
    // Calculate statistics
    calculateStatistics();
    
    // Initialize visualization
    setupVisualization();
    drawHistogram();
    
    // Update statistics display
    updateStatisticsDisplay();
  } catch (error) {
    console.error("Error initializing visualization:", error);
    // Fall back to sample data
    parkinsonsData = getSampleParkinsonsData();
    controlData = getSampleControlData();
    calculateStatistics();
    setupVisualization();
    drawHistogram();
    updateStatisticsDisplay();
  }
}

// Calculate key statistics from the data
function calculateStatistics() {
  parkMean = parkinsonsData.reduce((a, b) => a + b, 0) / parkinsonsData.length;
  controlMean = controlData.reduce((a, b) => a + b, 0) / controlData.length;
  
  const sortedPark = [...parkinsonsData].sort((a, b) => a - b);
  const sortedControl = [...controlData].sort((a, b) => a - b);
  
  parkMedian = sortedPark[Math.floor(sortedPark.length / 2)];
  controlMedian = sortedControl[Math.floor(sortedControl.length / 2)];
}

// Update the statistics display in the HTML
function updateStatisticsDisplay() {
  const parkSpeedElement = document.querySelector('.stat-box:nth-child(1) .stat-value');
  const controlSpeedElement = document.querySelector('.stat-box:nth-child(2) .stat-value');
  const diffElement = document.querySelector('.stat-box:nth-child(3) .stat-value');
  
  if (parkSpeedElement && controlSpeedElement && diffElement) {
    parkSpeedElement.textContent = parkMean.toFixed(2) + ' m/s';
    controlSpeedElement.textContent = controlMean.toFixed(2) + ' m/s';
    
    const diffPercent = ((controlMean - parkMean) / controlMean * 100).toFixed(1);
    diffElement.textContent = diffPercent + '%';
  }
}

// Helper function for combined data
const getCombinedData = () => [...parkinsonsData, ...controlData];

/*******************
 * STEP 2: SVG Setup
 *******************/
// Visualization variables
let svg, chartArea, tooltip, xScale, yScale, xAxisGroup, yAxisGroup;
let brush, brushGroup, legend, resetButton, thresholdGroup;

// Tracking variables
let currentGroup = "both"; // "both", "1", or "2"
let currentBins = 15;      // bin count
let wasBrushed = false;    // track if we just brushed

function setupVisualization() {
  // Increased top margin so we have space for a legend
  const margin = { top: 70, right: 50, bottom: 60, left: 60 };
  const fullWidth = 800;
  const fullHeight = 400;
  
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;
  
  svg = d3
    .select("#chart")
    .attr("width", fullWidth)
    .attr("height", fullHeight);
  
  chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  tooltip = d3.select("#tooltip");
  
  // xScale, yScale
  xScale = d3.scaleLinear().range([0, width]);
  yScale = d3.scaleLinear().range([height, 0]);
  
  // Axis groups
  xAxisGroup = chartArea
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0, ${height})`);
  
  yAxisGroup = chartArea
    .append("g")
    .attr("class", "axis y-axis");
  
  /*******************
   * STEP 3: Brush & Reset Button
   *******************/
  brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("end", brushed);
  
  brushGroup = chartArea.append("g")
    .attr("class", "brush")
    .call(brush);
  
  // Add reset zoom button (initially hidden)
  resetButton = svg.append("g")
    .attr("class", "reset-button")
    .attr("transform", `translate(${margin.left + width - 80}, ${margin.top - 30})`)
    .style("opacity", 0)
    .style("cursor", "pointer")
    .on("click", resetZoom);
  
  resetButton.append("rect")
    .attr("width", 80)
    .attr("height", 25)
    .attr("fill", "#f8f9fa")
    .attr("stroke", "#ccc")
    .attr("rx", 4);
  
  resetButton.append("text")
    .attr("x", 40)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .style("font-size", "12px")
    .text("Reset Zoom");
  
  /*******************
   * STEP 4: Legend
   *******************/
  legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left + width / 2 - 80}, 20)`);
  
  legend.append("rect")
    .attr("class", "legend-bg")
    .attr("width", 160)
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
    .attr("transform", "translate(90, 0)");
  
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
   * STEP 5: Axis Labels and Annotations
   *******************/
  // X-axis label
  chartArea.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 40)  // a bit below the x-axis
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("Gait Speed (m/s)");
  
  // Y-axis label
  chartArea.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("transform", `translate(${-40}, ${height / 2}) rotate(-90)`)
    .text("Frequency Count");
  
  // Clinical threshold annotation
  thresholdGroup = chartArea.append("g")
    .attr("class", "threshold-annotation")
    .style("opacity", 0);
  
  thresholdGroup.append("line")
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#e74c3c")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "5,5");
  
  thresholdGroup.append("text")
    .attr("y", 15)
    .attr("x", 5)
    .attr("fill", "#e74c3c")
    .attr("font-size", "12px")
    .text("Clinical Threshold (1.0 m/s)");
  
  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  const dropdown = document.getElementById("group-select");
  dropdown.addEventListener("change", () => {
    currentGroup = dropdown.value;
    wasBrushed = false;  // resetting brush usage so xScale domain will reset
    resetButton.transition().duration(300).style("opacity", 0); // Hide reset button
    drawHistogram();
  });
  
  const binSlider = document.getElementById("bin-slider");
  const binCountLabel = document.getElementById("bin-count");
  binSlider.addEventListener("input", () => {
    currentBins = +binSlider.value;
    binCountLabel.textContent = currentBins;
    drawHistogram();
  });
}

function brushed(event) {
  if (!event.selection) return; // if no selection, ignore
  wasBrushed = true;
  const [x0, x1] = event.selection;
  const newDomain = [xScale.invert(x0), xScale.invert(x1)];
  xScale.domain(newDomain);
  drawHistogram();
  // clear the brush selection
  brushGroup.call(brush.move, null);
  
  // Show reset button after zooming
  resetButton.transition().duration(300).style("opacity", 1);
}

function resetZoom() {
  wasBrushed = false;
  drawHistogram(); // This will reset the xScale domain
  resetButton.transition().duration(300).style("opacity", 0);
}

/*******************
 * STEP 6: Chart Drawing
 *******************/
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
    const maxVal = d3.max(data) * 1.05; // Add 5% padding
    xScale.domain([0, maxVal]);
  }

  // Update threshold annotation position and show it
  const thresholdX = xScale(1.0); // Position at 1.0 m/s
  thresholdGroup.select("line")
    .attr("x1", thresholdX)
    .attr("x2", thresholdX);
    
  thresholdGroup.select("text")
    .attr("x", thresholdX + 5);
    
  thresholdGroup.transition()
    .duration(500)
    .style("opacity", 1);

  // We'll remove any existing elements so we can redraw fresh each time
  chartArea.selectAll(".barPark").remove();
  chartArea.selectAll(".barCtrl").remove();
  chartArea.selectAll(".barSingle").remove();
  chartArea.selectAll(".kde-line").remove();
  chartArea.selectAll(".mean-line").remove();
  chartArea.selectAll(".annotation-text").remove();

  // If BOTH: overlay two histograms in different colors
  if (currentGroup === "both") {
    // Show legend
    legend.style("visibility", "visible");

    // 1) Bins
    const histogram = d3
      .histogram()
      .value(d => d)
      .domain(xScale.domain())
      .thresholds(xScale.ticks(currentBins));

    const binsPark = histogram(parkinsonsData);
    const binsCtrl = histogram(controlData);

    // 2) yScale domain = max count from both hist sets
    const maxCount = d3.max([
      d3.max(binsPark, d => d.length),
      d3.max(binsCtrl, d => d.length),
    ]);
    yScale.domain([0, maxCount * 1.1]); // Add 10% padding

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
            `<strong>Parkinson's</strong><br>` +
            `Count: ${d.length}<br>` +
            `Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)} m/s<br>` +
            `${((d.length / parkinsonsData.length) * 100).toFixed(1)}% of group`
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
            `<strong>Control</strong><br>` +
            `Count: ${d.length}<br>` +
            `Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)} m/s<br>` +
            `${((d.length / controlData.length) * 100).toFixed(1)}% of group`
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
    
    // Add KDE curves
    drawKDECurve(parkinsonsData, "steelblue");
    drawKDECurve(controlData, "crimson");
    
    // Add mean lines
    drawMeanLine(parkMean, "steelblue", "Parkinson's Mean: " + parkMean.toFixed(2) + " m/s");
    drawMeanLine(controlMean, "crimson", "Control Mean: " + controlMean.toFixed(2) + " m/s");
    
    // Add annotation for the difference
    const diffPercent = ((controlMean - parkMean) / controlMean * 100).toFixed(1);
    chartArea.append("text")
      .attr("class", "annotation-text")
      .attr("x", xScale((parkMean + controlMean) / 2))
      .attr("y", yScale(maxCount * 0.4))
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .text(`${diffPercent}% difference in average speed`);

  } else {
    // Hide legend if only one group is selected
    legend.style("visibility", "hidden");

    // Single group (Parkinson's or Control)
    const histogram = d3
      .histogram()
      .value(d => d)
      .domain(xScale.domain())
      .thresholds(xScale.ticks(currentBins));

    const bins = histogram(data);
    const maxCount = d3.max(bins, d => d.length);
    yScale.domain([0, maxCount * 1.1]); // Add 10% padding

    let rects = chartArea.selectAll(".barSingle")
      .data(bins, d => d.x0 + "-" + d.x1);

    rects.exit().remove();

    const groupName = currentGroup === "1" ? "Parkinson's" : "Control";
    const groupColor = currentGroup === "1" ? "steelblue" : "crimson";
    const meanValue = currentGroup === "1" ? parkMean : controlMean;

    const rectsEnter = rects.enter()
      .append("rect")
      .attr("class", "barSingle")
      .attr("fill", groupColor)
      .attr("opacity", 0.6)
      .attr("x", d => xScale(d.x0))
      .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      .attr("y", height)
      .attr("height", 0)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${groupName}</strong><br>` +
            `Count: ${d.length}<br>` +
            `Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)} m/s<br>` +
            `${((d.length / data.length) * 100).toFixed(1)}% of group`
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
    
    // Add KDE curve
    drawKDECurve(data, groupColor);
    
    // Add mean line
    drawMeanLine(meanValue, groupColor, `${groupName} Mean: ${meanValue.toFixed(2)} m/s`);
    
    // Add context annotation
    if (currentGroup === "1") {
      const diffPercent = ((controlMean - parkMean) / controlMean * 100).toFixed(1);
      chartArea.append("text")
        .attr("class", "annotation-text")
        .attr("x", xScale(meanValue))
        .attr("y", yScale(maxCount * 0.7))
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text(`${diffPercent}% slower than control group`);
    } else {
      const diffPercent = ((controlMean - parkMean) / parkMean * 100).toFixed(1);
      chartArea.append("text")
        .attr("class", "annotation-text")
        .attr("x", xScale(meanValue))
        .attr("y", yScale(maxCount * 0.7))
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text(`${diffPercent}% faster than Parkinson's group`);
    }
  }

  // Update axes
  xAxisGroup.transition().duration(750).call(d3.axisBottom(xScale));
  yAxisGroup.transition().duration(750).call(d3.axisLeft(yScale).ticks(6));
}

/*******************
 * Helper Functions
 *******************/

// Function to draw KDE (Kernel Density Estimation) curve
function drawKDECurve(data, color) {
  // KDE function
  function kernelDensityEstimator(kernel, X) {
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  }
  
  function kernelEpanechnikov(bandwidth) {
    return function(u) {
      return Math.abs(u /= bandwidth) <= 1 ? 0.75 * (1 - u * u) / bandwidth : 0;
    };
  }
  
  // Create the KDE estimate
  const bandwidth = 0.15;
  const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xScale.ticks(50));
  const density = kde(data);
  
  // Scale factor for the density curve
  const scaleFactor = chartArea.selectAll(".barPark").size() > 0 ? 
    yScale.domain()[1] / d3.max(density, d => d[1]) / 2 : 
    yScale.domain()[1] / d3.max(density, d => d[1]) / 1.5;
  
  // Draw the density curve
  chartArea.append("path")
    .datum(density)
    .attr("class", "kde-line")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .attr("opacity", 0)
    .attr("d", d3.line()
      .curve(d3.curveBasis)
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1] * scaleFactor))
    )
    .transition()
    .duration(1000)
    .attr("opacity", 0.8);
}

// Function to draw mean lines
function drawMeanLine(meanValue, color, label) {
  // Draw vertical line at mean
  chartArea.append("line")
    .attr("class", "mean-line")
    .attr("x1", xScale(meanValue))
    .attr("x2", xScale(meanValue))
    .attr("y1", height)
    .attr("y2", 0)
    .attr("stroke", color)
    .attr("opacity", 0)
    .transition()
    .duration(1000)
    .attr("opacity", 1);
  
  // Add text label for mean
  chartArea.append("text")
    .attr("class", "annotation-text")
    .attr("x", xScale(meanValue))
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("fill", color)
    .attr("opacity", 0)
    .text(label)
    .transition()
    .duration(1000)
    .attr("opacity", 1);
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', initializeVisualization);