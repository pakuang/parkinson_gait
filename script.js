/*******************
 * STEP 1: Load Data
 *******************/

// Define an empty array to store parsed data
let combinedData = [];
const fixedBins = 30; // Set fixed number of bins

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
                hoehnYahr: parseFloat(cols[8]) || null, // Parkinson’s severity scale
                speed: parseFloat(cols[12]) || 0, // Gait speed (first recorded value)
            });
        }
    });

    console.log("Loaded dataset:", combinedData);
    applyFilters();
});


/*******************
 * STEP 2: UI Elements for Filtering
 *******************/
const filterControls = document.getElementById("controls");

// Age Range Filter
const ageLabel = document.createElement("label");
ageLabel.innerHTML = "Age Range: <span id='age-range'>90</span>"; // Set initial value
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

// Event Listeners
ageSlider.addEventListener("input", function() {
  // Update the displayed value when the slider moves
  document.getElementById("age-range").textContent = this.value;
  applyFilters();
});
genderSelect.addEventListener("change", applyFilters);
severitySelect.addEventListener("change", applyFilters);
document.getElementById("group-select").addEventListener("change", applyFilters);

/*******************
 * STEP 3: Apply Filters
 *******************/
function applyFilters() {
  if (combinedData.length === 0) {
      console.log("Data not loaded yet.");
      return;
  }

  const selectedAge = parseInt(ageSlider.value);
  const selectedGender = genderSelect.value;
  const selectedSeverity = severitySelect.value;
  const selectedGroup = document.getElementById("group-select").value;
    
  let parkinsonsSpeeds = [];
  let controlSpeeds = [];

  if (selectedGroup === "both" || selectedGroup === "1") {
      parkinsonsSpeeds = combinedData
          .filter(d =>
              d.group === 1 &&
              (selectedAge >= d.age - 5) &&
              (selectedGender === "all" || d.gender == selectedGender) &&
              (selectedSeverity === "all" || d.hoehnYahr == selectedSeverity)
          )
          .map(d => d.speed);
  }

  if (selectedGroup === "both" || selectedGroup === "2") {
      controlSpeeds = combinedData
          .filter(d =>
              d.group === 2 &&
              (selectedAge >= d.age - 5) &&
              (selectedGender === "all" || d.gender == selectedGender)
          )
          .map(d => d.speed);
  }

  console.log("Filtered Parkinson's Data:", parkinsonsSpeeds);
  console.log("Filtered Control Data:", controlSpeeds);
  console.log("Current Bins:", fixedBins);
  drawHistogram(parkinsonsSpeeds, controlSpeeds, fixedBins);
}



// Event Listeners
ageSlider.addEventListener("input", applyFilters);
genderSelect.addEventListener("change", applyFilters);
severitySelect.addEventListener("change", applyFilters);
document.getElementById("group-select").addEventListener("change", applyFilters);


/*******************
 * STEP 4: Chart Setup
 *******************/
const margin = { top: 60, right: 30, bottom: 40, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const chartArea = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

const xAxisGroup = chartArea.append("g").attr("transform", `translate(0, ${height})`);
const yAxisGroup = chartArea.append("g");

/*******************
 * STEP 5: Draw Histogram
 *******************/
function drawHistogram(parkinsonsData, controlData, binCount = 15) {
  if (parkinsonsData.length === 0 && controlData.length === 0) {
      console.log("No data to display.");
      return;
  }
  // Remove existing legend if any (to prevent duplicates)
  chartArea.selectAll(".legend").remove();

  // Add a legend container
  const legend = chartArea.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width / 2 - 70}, -30)`); // Adjust position

  // Parkinson's Legend
  legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "crimson") 
      .attr("opacity", 0.6);

  legend.append("text")
      .text("Parkinson's")
      .attr("x", 20)
      .attr("y", 12)
      .attr("font-size", "14px");

  // Control Legend
  legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "steelblue") 
      .attr("opacity", 0.6)
      .attr("x", 100);

  legend.append("text")
      .text("Control")
      .attr("x", 120)
      .attr("y", 12)
      .attr("font-size", "14px");

  const maxVal = Math.max(
      d3.max(parkinsonsData, d => d) || 0, 
      d3.max(controlData, d => d) || 0
  );
  xScale.domain([0, maxVal]);

  const histogram = d3.histogram().domain(xScale.domain()).thresholds(fixedBins);

  const binsPark = histogram(parkinsonsData);
  const binsCtrl = histogram(controlData);

  const maxCount = Math.max(
      d3.max(binsPark, d => d.length) || 0,
      d3.max(binsCtrl, d => d.length) || 0
  );
  yScale.domain([0, maxCount]);

  chartArea.selectAll(".barPark").remove();
  chartArea.selectAll(".barCtrl").remove();

  // Get the tooltip element
  const tooltip = d3.select("#tooltip");

  // Parkinson's bars with hover functionality
  chartArea.selectAll(".barPark")
      .data(binsPark)
      .enter()
      .append("rect")
      .attr("class", "barPark")
      .attr("fill", "crimson")
      .attr("opacity", 0.6)
      .attr("x", d => xScale(d.x0))
      .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      .attr("y", height)
      .attr("height", 0)
      .on("mouseover", function(event, d) {
          // Calculate percentage of total
          const percentage = ((d.length / parkinsonsData.length) * 100).toFixed(1);
          
          // Show tooltip with data
          tooltip
              .style("opacity", 1)
              .html(`
                  <strong>Parkinson's Group</strong><br>
                  Speed Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)} m/s<br>
                  Count: ${d.length} subjects<br>
                  Percentage: ${percentage}%
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          
          // Highlight the bar
          d3.select(this).attr("opacity", 0.9);
      })
      .on("mousemove", function(event) {
          // Move tooltip with mouse
          tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
          // Hide tooltip and restore opacity
          tooltip.style("opacity", 0);
          d3.select(this).attr("opacity", 0.6);
      })
      .transition()
      .duration(750)
      .attr("y", d => yScale(d.length))
      .attr("height", d => height - yScale(d.length));

  // Control bars with hover functionality
  chartArea.selectAll(".barCtrl")
      .data(binsCtrl)
      .enter()
      .append("rect")
      .attr("class", "barCtrl")
      .attr("fill", "steelblue")
      .attr("opacity", 0.6)
      .attr("x", d => xScale(d.x0))
      .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      .attr("y", height)
      .attr("height", 0)
      .on("mouseover", function(event, d) {
          // Calculate percentage of total
          const percentage = ((d.length / controlData.length) * 100).toFixed(1);
          
          // Show tooltip with data
          tooltip
              .style("opacity", 1)
              .html(`
                  <strong>Control Group</strong><br>
                  Speed Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)} m/s<br>
                  Count: ${d.length} subjects<br>
                  Percentage: ${percentage}%
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          
          // Highlight the bar
          d3.select(this).attr("opacity", 0.9);
      })
      .on("mousemove", function(event) {
          // Move tooltip with mouse
          tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
          // Hide tooltip and restore opacity
          tooltip.style("opacity", 0);
          d3.select(this).attr("opacity", 0.6);
      })
      .transition()
      .duration(750)
      .attr("y", d => yScale(d.length))
      .attr("height", d => height - yScale(d.length));

  xAxisGroup.transition().duration(750).call(d3.axisBottom(xScale));
  yAxisGroup.transition().duration(750).call(d3.axisLeft(yScale).ticks(6));
}

/*******************
 * STEP 6: Initialize
 *******************/
applyFilters();
