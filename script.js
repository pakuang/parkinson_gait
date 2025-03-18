/*******************
 * Global Variables & Configuration
 *******************/
let combinedData = [];
const margin = { top: 60, right: 50, bottom: 60, left: 60 };
const defaultWidth = 800;
const defaultHeight = 400;
let width = defaultWidth - margin.left - margin.right;
let height = defaultHeight - margin.top - margin.bottom;
let fixedXDomain = [0, 2.0];

// State variables
const highlightThreshold = true; // Always highlight threshold area
const annotationsVisible = true; // Always show annotations
let fixedYAxisMax = 0;

// Color scheme - more accessible
const parkinsonsColor = "#e63946"; // Less saturated red
const controlColor = "#457b9d"; // Less saturated blue
const thresholdColor = "#d62828"; // Distinctive red for threshold

/*******************
 * Initialize SVG and Chart Components
 *******************/
const svg = d3.select("#chart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

// Clear any existing elements
svg.selectAll("*").remove();

// Main chart container
const chartArea = svg.append("g")
  .attr("class", "chart-area")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Axis groups
const xAxisGroup = chartArea.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`);

const yAxisGroup = chartArea.append("g")
  .attr("class", "y-axis");

// Groups for chart elements
const barsGroup = chartArea.append("g").attr("class", "bars-group");
const linesGroup = chartArea.append("g").attr("class", "lines-group");
const annotationsGroup = chartArea.append("g").attr("class", "annotations-group");
const statisticsGroup = chartArea.append("g").attr("class", "statistics-group");

// Legend
const legend = chartArea.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width/2 - 150}, -30)`);

// Axis labels
chartArea.append("text")
  .attr("class", "x-axis-label")
  .attr("text-anchor", "middle")
  .attr("x", width/2)
  .attr("y", height + 40)
  .attr("fill", "#333")
  .style("font-size", "13px")
  .style("font-weight", "bold")
  .text("Gait Speed (meters/second)");

chartArea.append("text")
  .attr("class", "y-axis-label")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("x", -height/2)
  .attr("y", -40)
  .attr("fill", "#333")
  .style("font-size", "13px")
  .style("font-weight", "bold")
  .text("Number of Participants");

// Tooltip
const tooltip = d3.select("#tooltip");

// Arrow marker definition for annotations
svg.append("defs").append("marker")
  .attr("id", "arrow")
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 8)
  .attr("refY", 0)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5")
  .attr("fill", thresholdColor);

/*******************
 * Direct Data Processing from Demographics File
 *******************/
// Use d3.text with a callback to handle demographics.txt
d3.text("gait-in-parkinsons-disease-1.0.0/demographics.txt").then(function(text) {
  // Process the data directly - no fallbacks
  processAndCalculateSpeedsFromDemographics(text);
  
  // Initialize visualization with the real data
  initializeVisualization();
}).catch(function(error) {
  console.error("Error loading demographics file:", error);
  // Simply show the error - no fallbacks
  alert("Error loading data file. Please check that the demographics.txt file exists in the gait-in-parkinsons-disease-1.0.0 folder.");
});


function processAndCalculateSpeedsFromDemographics(text) {
  try {
    const rows = text.trim().split('\n');
    const header = rows[0].split('\t');
    
    // Clear any previous data
    combinedData = [];
    
    // Parse each row (starting from row 1 to skip header)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split('\t');
      
      // Skip rows with insufficient data
      if (cols.length < 13) continue;
      
      // Extract values exactly as shown in the Python code
      const id = cols[0];
      const group = parseInt(cols[2]) || 0; // Group 1=Parkinson's, 2=Control
      const gender = parseInt(cols[4]) || 0; // 1=Male, 2=Female
      const age = parseInt(cols[5]) || 0;
      const hoehnYahr = parseFloat(cols[8]) || null; // Severity for Parkinson's only
      const speed = parseFloat(cols[12]) || 0; // Speed_01 column (13th column, index 12)
      
      // Only add entries with valid group and speed
      if ((group === 1 || group === 2) && speed > 0) {
        combinedData.push({
          id: id,
          group: group,
          gender: gender,
          age: age,
          hoehnYahr: hoehnYahr,
          speed: speed
        });
      }
    }
    
    console.log(`Processed ${combinedData.length} valid entries from demographics file`);
    
    // Verify the data matches the Python output
    const parkinsonsData = combinedData.filter(d => d.group === 1);
    const controlData = combinedData.filter(d => d.group === 2);
    
    console.log(`Parkinson's subjects: ${parkinsonsData.length}`);
    console.log(`Control subjects: ${controlData.length}`);
    
    const parkAvg = d3.mean(parkinsonsData, d => d.speed) || 0;
    const controlAvg = d3.mean(controlData, d => d.speed) || 0;
    
    console.log(`Parkinson's average speed: ${parkAvg.toFixed(2)} m/s`);
    console.log(`Control average speed: ${controlAvg.toFixed(2)} m/s`);
    
    const parkBelow = parkinsonsData.filter(d => d.speed < 1.0).length;
    const controlBelow = controlData.filter(d => d.speed < 1.0).length;
    
    console.log(`Parkinson's below threshold: ${parkBelow} (${(parkBelow/parkinsonsData.length*100).toFixed(1)}%)`);
    console.log(`Control below threshold: ${controlBelow} (${(controlBelow/controlData.length*100).toFixed(1)}%)`);
  } catch (error) {
    console.error("Error processing demographics data:", error);
    throw error; // Re-throw the error to be caught - we don't want fallbacks
  }
}

/*******************
 * Initialization
 *******************/
function initializeVisualization() {
  // Calculate initial statistics to establish fixed y-axis
  const allSpeedValues = getAllSpeedValues();
  const initialHistogram = createHistogram(allSpeedValues, 30);
  const maxBinHeight = d3.max(initialHistogram, bin => bin.length);
  fixedYAxisMax = Math.ceil(maxBinHeight * 1.1); // Add 10% padding

  const globalExtent = d3.extent(allSpeedValues);
  // Use 0 as minimum, add padding to maximum
  fixedXDomain = [0, Math.max(1.0, globalExtent[1] * 1.1)];
  console.log("Fixed X-Axis Domain:", fixedXDomain);
  
  setupEventListeners();
  updateVisualization();
  
  // Remove toggle buttons since we want them permanently on
  removeUnwantedButtons();
}

function setupEventListeners() {
  // Group selection
  d3.select("#group-select").on("change", updateVisualization);
  
  // Age slider - check if it exists in your HTML
  const ageSlider = document.getElementById("age-slider");
  if (ageSlider) {
    d3.select("#age-slider").on("input", function() {
      document.getElementById("age-range").textContent = this.value;
      updateVisualization();
    });
  }
  
  // Gender selection - check if it exists in your HTML
  const genderSelect = document.getElementById("gender-select");
  if (genderSelect) {
    d3.select("#gender-select").on("change", updateVisualization);
  }
  
  // Severity selection - check if it exists in your HTML
  const severitySelect = document.getElementById("severity-select");
  if (severitySelect) {
    d3.select("#severity-select").on("change", updateVisualization);
  }
  
  // Handle window resize for responsiveness
  window.addEventListener("resize", debounce(handleResize, 250));
}

// Function to remove unwanted toggle buttons
function removeUnwantedButtons() {
  // Find and remove the threshold highlight button
  const highlightBtn = document.querySelector('button:not([id="toggle-annotations"]):not([id="show-profile"])');
  if (highlightBtn) {
    highlightBtn.remove();
  }
  
  // Find and remove the annotations toggle button
  const annotationsBtn = document.getElementById('toggle-annotations');
  if (annotationsBtn) {
    annotationsBtn.remove();
  }
  
  // Add missing controls if they don't exist
  addMissingControls();
}

// Add necessary controls if they don't exist in HTML
function addMissingControls() {
  const controlsContainer = document.getElementById('controls');
  if (!controlsContainer) return;
  
  // Add age slider if missing
  if (!document.getElementById('age-slider')) {
    const ageContainer = document.createElement('div');
    ageContainer.innerHTML = `<label for="age-slider">Age Range: <span id="age-range">90</span></label>
    <input type="range" id="age-slider" min="50" max="90" value="90" />`;
    controlsContainer.appendChild(ageContainer);
    
    document.getElementById('age-slider').addEventListener('input', function() {
      document.getElementById('age-range').textContent = this.value;
      updateVisualization();
    });
  }
  
  // Add gender select if missing
  if (!document.getElementById('gender-select')) {
    const genderSelect = document.createElement('select');
    genderSelect.id = 'gender-select';
    genderSelect.innerHTML = `
      <option value="all">All Genders</option>
      <option value="1">Male</option>
      <option value="2">Female</option>
    `;
    controlsContainer.appendChild(genderSelect);
    genderSelect.addEventListener('change', updateVisualization);
  }
  
  // Add severity select if missing
  if (!document.getElementById('severity-select')) {
    const severitySelect = document.createElement('select');
    severitySelect.id = 'severity-select';
    severitySelect.innerHTML = `
      <option value="all">All Severities</option>
      <option value="1">Hoehn & Yahr 1 (Mild)</option>
      <option value="2">Hoehn & Yahr 2</option>
      <option value="3">Hoehn & Yahr 3</option>
      <option value="4">Hoehn & Yahr 4 (Severe)</option>
    `;
    controlsContainer.appendChild(severitySelect);
    severitySelect.addEventListener('change', updateVisualization);
  }
}

// Debounce function to prevent excessive resize calculations
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Resize handler for responsive design
function handleResize() {
  const container = document.getElementById("chart-container");
  if (!container) return;
  
  const containerWidth = container.clientWidth;
  const newWidth = Math.min(containerWidth - 40, defaultWidth); // 40px padding
  
  // Adjust chart dimensions
  width = newWidth - margin.left - margin.right;
  
  // Update SVG dimensions
  svg.attr("width", width + margin.left + margin.right);
  
  // Update scales
  updateVisualization();
}

/*******************
 * Data Filtering and Processing
 *******************/
function getFilteredData() {
  // Handle case where controls don't exist
  const selectedGroup = document.getElementById("group-select")?.value || "both";
  const selectedAge = parseInt(document.getElementById("age-slider")?.value || 90);
  const selectedGender = document.getElementById("gender-select")?.value || "all";
  const selectedSeverity = document.getElementById("severity-select")?.value || "all";
  
  let parkinsonsData = [];
  let controlData = [];
  
  // Filter Parkinson's data
  if (selectedGroup === "both" || selectedGroup === "1") {
    parkinsonsData = combinedData.filter(d => 
      d.group === 1 && 
      d.age <= selectedAge &&
      (selectedGender === "all" || parseInt(d.gender) === parseInt(selectedGender)) &&
      (selectedSeverity === "all" || 
        (d.hoehnYahr !== null && 
         Math.floor(d.hoehnYahr) === parseInt(selectedSeverity)))
    );
  }
  
  // Filter Control data
  if (selectedGroup === "both" || selectedGroup === "2") {
    controlData = combinedData.filter(d => 
      d.group === 2 && 
      d.age <= selectedAge &&
      (selectedGender === "all" || parseInt(d.gender) === parseInt(selectedGender))
    );
  }
  
  return {
    parkinson: parkinsonsData,
    control: controlData
  };
}

// Extract all speed values for a consistent bin width
function getAllSpeedValues() {
  return combinedData.map(d => d.speed);
}

// Create histogram bins with optimal binning
function createHistogram(data, binCount = 20) {
  if (!data || data.length === 0) return [];
  
  // Get data extent with a slight padding
  const extent = d3.extent(data);
  const min = Math.max(0, extent[0] * 0.9);
  const max = extent[1] * 1.1;
  
  // Create histogram generator with intelligent bin width
  const histogram = d3.histogram()
    .domain([min, max])
    .thresholds(d3.range(min, max, (max - min) / binCount));
  
  return histogram(data);
}

// Calculate statistics for a dataset
function calculateStatistics(data) {
  if (!data || data.length === 0) {
    return {
      mean: 0,
      median: 0,
      sd: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      belowThreshold: 0,
      percentBelowThreshold: 0
    };
  }
  
  const speeds = data.map(d => d.speed);
  speeds.sort((a, b) => a - b);
  
  const mean = d3.mean(speeds);
  const median = d3.median(speeds);
  const sd = Math.sqrt(d3.variance(speeds));
  const min = d3.min(speeds);
  const max = d3.max(speeds);
  const q1 = d3.quantile(speeds, 0.25);
  const q3 = d3.quantile(speeds, 0.75);
  
  const belowThreshold = speeds.filter(s => s < 1.0).length;
  const percentBelowThreshold = (belowThreshold / speeds.length) * 100;
  
  return {
    mean,
    median,
    sd,
    min,
    max,
    q1,
    q3,
    belowThreshold,
    percentBelowThreshold
  };
}

/*******************
 * Visualization Update
 *******************/
function updateVisualization() {
  // Get filtered data
  const { parkinson, control } = getFilteredData();
  
  // Calculate statistics
  const parkStats = calculateStatistics(parkinson);
  const controlStats = calculateStatistics(control);
  
  // Update global stats display
  updateStatisticsDisplay(parkStats, controlStats);
  
  // Set up scales
  const xExtent = d3.extent([...parkinson, ...control].map(d => d.speed));
  const xMin = Math.max(0, (xExtent[0] || 0) * 0.8); // 20% padding below min
  const xMax = (xExtent[1] || 2) * 1.1; // 10% padding above max
  
  const xScale = d3.scaleLinear()
    .domain(fixedXDomain)
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([0, fixedYAxisMax]) // Use fixed y-axis max for consistency
    .range([height, 0]);
  
  // Get speed values for histograms
  const parkSpeeds = parkinson.map(d => d.speed);
  const controlSpeeds = control.map(d => d.speed);
  
  // Clear previous elements
  barsGroup.selectAll("*").remove();
  linesGroup.selectAll("*").remove();
  annotationsGroup.selectAll("*").remove();
  statisticsGroup.selectAll("*").remove();
  legend.selectAll("*").remove();
  
  // Draw the threshold zone shading (always highlighted now)
  linesGroup.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", xScale(1.0))
    .attr("height", height)
    .attr("fill", thresholdColor)
    .attr("opacity", 0.1) // Light shading for the threshold area
    .style("pointer-events", "none");
  
  // Add label for highlighted area on the left side
  linesGroup.append("text")
    .attr("x", 10)
    .attr("y", 30)
    .attr("font-size", "11px")
    .attr("fill", thresholdColor)
    .attr("font-style", "italic")
    .text("Speeds below clinical threshold");
  
  // Draw the histogram bars for Parkinson's
  drawHistogramBars(parkSpeeds, "parkinson", parkinsonsColor, xScale, yScale);
  
  // Draw the histogram bars for Control
  drawHistogramBars(controlSpeeds, "control", controlColor, xScale, yScale);
  
  // Draw the clinical threshold line
  linesGroup.append("line")
    .attr("class", "threshold-line")
    .attr("x1", xScale(1.0))
    .attr("x2", xScale(1.0))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", thresholdColor)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");
  
//   // Add clinical threshold label
//   linesGroup.append("text")
//     .attr("class", "threshold-label")
//     .attr("x", xScale(1.0) + 5)
//     .attr("y", 20)
//     .attr("fill", thresholdColor)
//     .attr("font-weight", "bold")
//     .attr("font-size", "12px")
//     .text("Clinical Threshold (1.0 m/s)");
  
  // Draw statistical markers
  drawStatisticalMarkers(parkStats, "parkinson", parkinsonsColor, xScale, yScale);
  drawStatisticalMarkers(controlStats, "control", controlColor, xScale, yScale);
  
  // Always draw annotations since they're permanent now
  if (parkStats.percentBelowThreshold > 0) {
    drawAnnotations(parkStats, xScale, yScale);
  }
  
  // Update axes
  xAxisGroup.call(d3.axisBottom(xScale)
    .ticks(10)
    .tickFormat(d => d.toFixed(1)));
  
  yAxisGroup.call(d3.axisLeft(yScale)
    .ticks(6)
    .tickFormat(d => Math.round(d)));
  
  // Add grid lines for better readability
  chartArea.selectAll(".y-grid-line").remove();
  chartArea.selectAll(".y-grid-line")
    .data(yScale.ticks(6))
    .enter()
    .append("line")
    .attr("class", "y-grid-line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d))
    .attr("stroke", "#ddd")
    .attr("stroke-width", 0.5);
  
  // Add legend
  drawLegend();
}

/*******************
 * Drawing Components
 *******************/
function drawHistogramBars(speeds, className, color, xScale, yScale) {
  if (!speeds || speeds.length === 0) return;
  
  // Create histogram with optimal binning
  const binCount = 25;
  const histogram = d3.histogram()
    .domain(xScale.domain())
    .thresholds(xScale.ticks(binCount));
  
  const bins = histogram(speeds);
  
  // Create a container group for all bars of this class
  const barsContainer = barsGroup.append("g")
    .attr("class", `${className}-container`);
  
  // Draw the bars
  const bars = barsContainer.selectAll(`.bar-${className}`)
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", `bar-${className}`)
    .attr("x", d => xScale(d.x0) + 1)
    .attr("y", d => yScale(d.length))
    .attr("width", d => Math.max(1, xScale(d.x1) - xScale(d.x0) - 2))
    .attr("height", d => height - yScale(d.length))
    .attr("fill", d => {
      if (className === "parkinson" && d.x1 <= 1.0) {
        return d3.color(color).brighter(0.5); // Brighter for highlighted bars
      }
      return color;
    })
    .attr("opacity", d => {
      // Critical fix: Ensure all bars have enough opacity to be interactive
      if (className === "parkinson") {
        return d.x1 <= 1.0 ? 0.9 : 0.8;
      }
      return 0.7;
    })
    .attr("stroke", d => {
      if (className === "parkinson" && d.x1 <= 1.0) {
        return thresholdColor; // Outline for highlighted bars
      }
      return "none";
    })
    .attr("stroke-width", 0.5)
    .attr("pointer-events", "all"); // CRITICAL FIX: Ensure ALL bars receive pointer events
  
  // Add event listeners AFTER all attributes are set
  bars.on("mouseover", function(event, d) {
      const groupName = className === "parkinson" ? "Parkinson's" : "Control";
      const percentage = (d.length / speeds.length * 100).toFixed(1);
      const isBelowThreshold = d.x1 <= 1.0;
      
      // Log for debugging
      console.log(`Hover on ${groupName} bar: ${d.x0.toFixed(2)}-${d.x1.toFixed(2)}`);
      
      d3.select(this)
        .attr("opacity", 1.0)
        .attr("stroke", "#555")
        .attr("stroke-width", 1.5);
      
      tooltip.style("opacity", 0.95)
        .html(`
          <strong>${groupName} Group</strong><br>
          <span style="color: #ccc;">──────────────</span><br>
          <strong>Speed Range:</strong> ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)} m/s<br>
          <strong>Count:</strong> ${d.length} participants<br>
          <strong>Percentage:</strong> ${percentage}% of group<br>
          ${isBelowThreshold ? `<span style="color: ${thresholdColor}; font-weight: bold;">⚠ Below clinical threshold</span>` : ""}
        `)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("opacity", d => {
          if (className === "parkinson") {
            return d.x1 <= 1.0 ? 0.9 : 0.8;
          }
          return 0.7;
        })
        .attr("stroke-width", d => {
          if (className === "parkinson" && d.x1 <= 1.0) {
            return 0.5;
          }
          return 0;
        });
      
      tooltip.style("opacity", 0);
    });
}

function drawStatisticalMarkers(stats, className, color, xScale, yScale) {
  if (!stats || stats.mean === 0) return;
  
  const markerGroup = statisticsGroup.append("g")
    .attr("class", `${className}-statistics`);
  
  // Mean line
  markerGroup.append("line")
    .attr("class", "mean-line")
    .attr("x1", xScale(stats.mean))
    .attr("x2", xScale(stats.mean))
    .attr("y1", 10)
    .attr("y2", height)
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "3,3")
    .attr("opacity", 0.8);
  
  // Mean label
  markerGroup.append("text")
    .attr("class", "mean-label")
    .attr("x", xScale(stats.mean))
    .attr("y", 8)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", color)
    .text(`Mean: ${stats.mean.toFixed(2)}`);
}

function drawAnnotations(stats, xScale, yScale) {
  // Skip if no data or below threshold percentage is zero
  if (!stats || stats.percentBelowThreshold <= 0) return;
  
  const percent = Math.round(stats.percentBelowThreshold);
  
  // Find optimal annotation position - FIXED POSITION to match image
  // Position text in the middle of the threshold area at a higher position
  const annotationX = xScale(0.6); // Set to 0.6 m/s as shown in the image
  const annotationY = height * 0.6; // Position in the lower half of the chart
  
  // Add the text annotation for below threshold percentage
  annotationsGroup.append("text")
    .attr("class", "threshold-annotation")
    .attr("x", annotationX)
    .attr("y", annotationY)
    .attr("text-anchor", "middle")
    .attr("fill", thresholdColor)
    .attr("font-size", "12px")
    .text(`${percent}% of Parkinson's patients`);
  
  annotationsGroup.append("text")
    .attr("class", "threshold-annotation")
    .attr("x", annotationX)
    .attr("y", annotationY + 15)
    .attr("text-anchor", "middle")
    .attr("fill", thresholdColor)
    .attr("font-size", "12px")
    .text("fall below critical threshold");
  
  // Fixed arrow position to match image - points down and slightly right
  const arrowPoints = [
    { x: annotationX, y: annotationY + 20 },
    { x: annotationX + 10, y: annotationY + 40 },
    { x: annotationX + 20, y: annotationY + 60 }
  ];
  
  const line = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveBasis);
  
  annotationsGroup.append("path")
    .attr("class", "annotation-arrow")
    .attr("d", line(arrowPoints))
    .attr("fill", "none")
    .attr("stroke", thresholdColor)
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrow)");
}

function drawLegend() {
  // Parkinson's legend
  legend.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", parkinsonsColor)
    .attr("rx", 2);
  
  legend.append("text")
    .text("Parkinson's")
    .attr("x", 20)
    .attr("y", 12)
    .attr("fill", "#333")
    .attr("font-size", "14px");
  
  // Control legend
  legend.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", controlColor)
    .attr("x", 110)
    .attr("rx", 2);
  
  legend.append("text")
    .text("Control")
    .attr("x", 130)
    .attr("y", 12)
    .attr("fill", "#333")
    .attr("font-size", "14px");
  
  // Clinical threshold legend
  legend.append("line")
    .attr("x1", 200)
    .attr("x2", 220)
    .attr("y1", 7)
    .attr("y2", 7)
    .attr("stroke", thresholdColor)
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");
  
  legend.append("text")
    .text("Clinical Threshold (1.0 m/s)")
    .attr("x", 225)
    .attr("y", 12)
    .attr("fill", thresholdColor)
    .attr("font-weight", "bold")
    .attr("font-size", "14px");

}

/*******************
 * Helper Functions
 *******************/
function updateStatisticsDisplay(parkStats, controlStats) {
  // Update statistics values in the DOM
  if (parkStats && controlStats) {
    // Calculate speed reduction percentage
    const speedReduction = controlStats.mean > 0 
      ? ((controlStats.mean - parkStats.mean) / controlStats.mean * 100)
      : 0;
    
    // Update values in statistics boxes
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
      statValues[0].textContent = parkStats.mean.toFixed(2) + " m/s";
      statValues[1].textContent = controlStats.mean.toFixed(2) + " m/s";
      statValues[2].textContent = speedReduction.toFixed(1) + "%";
      
      // Add below threshold stat if it doesn't exist
      if (statValues.length < 4 && parkStats.percentBelowThreshold > 0) {
        const statsContainer = document.getElementById('statistics');
        if (statsContainer) {
          const newStatBox = document.createElement('div');
          newStatBox.className = 'stat-box';
          newStatBox.innerHTML = `
            <div class="stat-value">${Math.round(parkStats.percentBelowThreshold)}%</div>
            <div class="stat-label">Below Clinical Threshold</div>
          `;
          statsContainer.appendChild(newStatBox);
        }
      } else if (statValues.length >= 4) {
        statValues[3].textContent = Math.round(parkStats.percentBelowThreshold) + "%";
      }
    }
  }
}