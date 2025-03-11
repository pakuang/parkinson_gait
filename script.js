/*******************
 * STEP 1: Load Data
 *******************/

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


// Gender Filter Dropdown

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
  const selectedGroup = document.getElementById("group-select").value; // Get group selection

<<<<<<< HEAD
  let parkinsonsSpeeds = [];
  let controlSpeeds = [];
=======
  // Filter dataset dynamically
  let filteredData = combinedData.filter(d =>
    (selectedSeverity === "all" || (d.hoehnYahr == selectedSeverity && d.group == 1))
).map(d => d.speed);
>>>>>>> c2325efcffa0aa6432e620c3d63e98dc77d5dc03

  if (selectedGroup === "both" || selectedGroup === "1") {
    // Filter Parkinson's data
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
    // Filter Control data
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

  drawHistogram(parkinsonsSpeeds, controlSpeeds);
}

<<<<<<< HEAD
// Event Listeners
ageSlider.addEventListener("input", applyFilters);
genderSelect.addEventListener("change", applyFilters);
=======


// Step 3: Add Event Listeners
>>>>>>> c2325efcffa0aa6432e620c3d63e98dc77d5dc03
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
function drawHistogram(parkinsonsData, controlData) {
  if (parkinsonsData.length === 0 && controlData.length === 0) {
    console.log("No data to display.");
    return;
  }

  const maxVal = Math.max(
    d3.max(parkinsonsData, d => d) || 0, 
    d3.max(controlData, d => d) || 0
  );
  xScale.domain([0, maxVal]);

  const histogram = d3.histogram().domain(xScale.domain()).thresholds(15);

  const binsPark = histogram(parkinsonsData);
  const binsCtrl = histogram(controlData);

  const maxCount = Math.max(
    d3.max(binsPark, d => d.length) || 0,
    d3.max(binsCtrl, d => d.length) || 0
  );
  yScale.domain([0, maxCount]);

  chartArea.selectAll(".barPark").remove();
  chartArea.selectAll(".barCtrl").remove();

  chartArea.selectAll(".barPark")
    .data(binsPark)
    .enter()
    .append("rect")
    .attr("class", "barPark")
    .attr("fill", "steelblue")
    .attr("opacity", 0.6)
    .attr("x", d => xScale(d.x0))
    .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
    .attr("y", height)
    .attr("height", 0)
    .transition()
    .duration(750)
    .attr("y", d => yScale(d.length))
    .attr("height", d => height - yScale(d.length));

  chartArea.selectAll(".barCtrl")
    .data(binsCtrl)
    .enter()
    .append("rect")
    .attr("class", "barCtrl")
    .attr("fill", "crimson")
    .attr("opacity", 0.6)
    .attr("x", d => xScale(d.x0))
    .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
    .attr("y", height)
    .attr("height", 0)
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
