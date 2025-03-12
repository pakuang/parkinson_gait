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
// Get the controls container and initially hide it
const filterControls = document.getElementById("controls");
filterControls.style.display = "none"; // Hide initially

// Age Range Filter (Hidden initially, will be shown later)
const ageSlider = document.createElement("input");
ageSlider.type = "range";
ageSlider.min = "50";
ageSlider.max = "90";
ageSlider.value = "90";
ageSlider.id = "age-slider";
ageSlider.step = "1";
ageSlider.style.display = "none"; // Hide initially

const ageLabel = document.createElement("label");
ageLabel.innerHTML = `Age Range: <span id='age-value'>${ageSlider.value}</span>`;
ageLabel.style.display = "none"; // Hide initially

document.body.appendChild(ageLabel);

// Fast Forward Button
const fastForwardButton = document.createElement("button");
fastForwardButton.id = "fast-forward";
fastForwardButton.textContent = "Fast Forward: Progress through Age Groups";
fastForwardButton.style.marginLeft = "10px";
fastForwardButton.style.padding = "8px 12px";
fastForwardButton.style.fontSize = "14px";
fastForwardButton.style.cursor = "pointer";

// Append the Fast Forward button to the body
document.body.insertBefore(fastForwardButton, filterControls);

// Gender Filter Dropdown (Hidden initially)
const genderSelect = document.createElement("select");
genderSelect.id = "gender-select";
genderSelect.innerHTML = `
  <option value="all">All Genders</option>
  <option value="1">Male</option>
  <option value="2">Female</option>
`;
genderSelect.style.display = "none";

// Severity Filter (Hidden initially)
const severitySelect = document.createElement("select");
severitySelect.id = "severity-select";
severitySelect.innerHTML = `
  <option value="all">All Severities</option>
  <option value="1">Hoehn & Yahr 1 (Mild)</option>
  <option value="2">Hoehn & Yahr 2</option>
  <option value="3">Hoehn & Yahr 3</option>
  <option value="4">Hoehn & Yahr 4</option>
`;
severitySelect.style.display = "none";

/*******************
 * STEP 3: Show Controls AFTER Fast Forward
 *******************/
function showControls() {
    filterControls.style.display = "block"; // Make controls visible
    ageSlider.style.display = "inline-block";
    ageLabel.style.display = "inline-block";
    genderSelect.style.display = "inline-block";
    severitySelect.style.display = "inline-block";

    filterControls.appendChild(ageLabel);
    filterControls.appendChild(ageSlider);
    filterControls.appendChild(genderSelect);
    filterControls.appendChild(severitySelect);
}


/*******************
 * STEP 3: Apply Filters
 *******************/
function updateAgeLabel(age) {
    ageText.text(`Current Age Group: ${age}`);
}

function applyFilters() {
    if (combinedData.length === 0) {
        console.log("Data not loaded yet.");
        return;
    }

    const selectedAge = parseInt(ageSlider.value);
    console.log("Filtering for Age:", selectedAge);

    let parkinsonsSpeeds = combinedData.filter(d => d.group === 1 && selectedAge >= d.age - 5).map(d => d.speed);
    let controlSpeeds = combinedData.filter(d => d.group === 2 && selectedAge >= d.age - 5).map(d => d.speed);

    console.log("Filtered Parkinson's Data:", parkinsonsSpeeds);
    console.log("Filtered Control Data:", controlSpeeds);

    drawHistogram(parkinsonsSpeeds, controlSpeeds, fixedBins);
}

function updateHistogram(selectedAge) {
    if (combinedData.length === 0) return;

    let parkinsonsSpeeds = combinedData.filter(d => d.group === 1 && selectedAge >= d.age - 5).map(d => d.speed);
    let controlSpeeds = combinedData.filter(d => d.group === 2 && selectedAge >= d.age - 5).map(d => d.speed);

    console.log("Updating histogram for Age:", selectedAge);

    const histogram = d3.histogram().domain(xScale.domain()).thresholds(fixedBins);
    const totalPark = Math.max(parkinsonsSpeeds.length, 1);
    const totalCtrl = Math.max(controlSpeeds.length, 1);

    const binsPark = histogram(parkinsonsSpeeds).map(bin => ({
        ...bin,
        density: bin.length / (totalPark * (bin.x1 - bin.x0))
    }));

    const binsCtrl = histogram(controlSpeeds).map(bin => ({
        ...bin,
        density: bin.length / (totalCtrl * (bin.x1 - bin.x0))
    }));

    const maxDensity = Math.max(
        d3.max(binsPark, d => d.density) || 0,
        d3.max(binsCtrl, d => d.density) || 0
    );

    yScale.domain([0, maxDensity]);

    chartArea.selectAll(".barPark")
        .data(binsPark)
        .transition()
        .duration(750)
        .attr("y", d => yScale(d.density))
        .attr("height", d => height - yScale(d.density));

    chartArea.selectAll(".barCtrl")
        .data(binsCtrl)
        .transition()
        .duration(750)
        .attr("y", d => yScale(d.density))
        .attr("height", d => height - yScale(d.density));

    yAxisGroup.transition().duration(750).call(d3.axisLeft(yScale).ticks(6));
}


function startAgingAnimation() {
    // const ageMilestones = [50, 52, 55, 60, 62, 65, 70, 72, 75, 80, 82, 85, 90];
    const ageMilestones = Array.from({ length: 41 }, (_, i) => i + 50);
    let index = 0;

    function updateAge() {
        if (index >= ageMilestones.length) {
            showControls(); // Show controls only after animation completes
            applyFilters();
            return;
        }

        const currentAge = ageMilestones[index];
        document.getElementById("age-value").textContent = currentAge;
        ageSlider.value = currentAge;

        updateAgeLabel(currentAge);
        updateHistogram(currentAge); // Update the histogram

        if ([50, 60, 70, 80, 90].includes(currentAge)) {
            showAnnotation(currentAge);
            setTimeout(() => {
                hideAnnotation();
                index++;
                updateAge();
            }, 8000); 
        } else {
            setTimeout(() => {
                index++;
                updateAge();
            }, 500); 
        }
    }

    updateAge();
}

function showAnnotation(age) {
    const annotationBox = document.getElementById("annotation-box");

    let message = "";
    if (age === 50) {
        message = "At age 50, the control group has a wide distribution, peaking around 1.2–1.4 m/s. " +
                  "Parkinson’s patients already show a slower gait, with their distribution shifted left, " +
                  "mostly below 1.2 m/s, with some falling under 0.8 m/s.";
    } else if (age === 60) {
        message = "By age 60, the control group remains largely unchanged, though a few individuals show slowing below 1.1 m/s. " +
                  "The Parkinson’s group, however, has a wider distribution, with more participants below 1.0 m/s, " +
                  "and an increasing number slowing to around 0.6–0.8 m/s.";
    } else if (age === 70) {
        message = "At age 70, the control group still peaks around 1.2 m/s but now has a longer left tail, " +
                  "with more participants dropping below 1.0 m/s. The Parkinson’s group shows a clear downward shift, " +
                  "with most now below 0.8 m/s and a growing cluster below 0.6 m/s.";
    } else if (age === 80) {
        message = "By age 80, the control group’s distribution has compressed, with fewer participants above 1.2 m/s, " +
                  "and more shifting toward 1.0–1.1 m/s. The Parkinson’s distribution continues to narrow and shift left, " +
                  "with most below 0.6 m/s and an increasing number near 0.4 m/s.";
    } else if (age === 90) {
        message = "At age 90, Parkinson’s patients shows a much broader range of gait speeds, with many now below 1.0 m/s. " +
                  "Parkinson’s patients exhibit extreme bradykinesia, with their distribution becoming increasingly concentrated at very slow speeds, highlighting severe mobility loss.";
    }

    annotationBox.innerHTML = `<strong>Age ${age}:</strong> ${message}`;
    annotationBox.style.display = "block";
    annotationBox.style.position = "absolute";  // Ensure it stays in the right position
    annotationBox.style.top = "calc(85%)";  // Move it below the chart
    annotationBox.style.left = "50%";
    annotationBox.style.transform = "translateX(-50%)"; // Center it horizontally
    annotationBox.style.width = "60%"; // Make sure it fits neatly under the chart
    annotationBox.style.textAlign = "center"; // Align text for readability
}


function hideAnnotation() {
    document.getElementById("annotation-box").style.display = "none";
}




// Event Listeners
ageSlider.addEventListener("input", function() {
    document.getElementById("age-value").textContent = ageSlider.value;
    updateAgeLabel(ageSlider.value);
    applyFilters(); // Ensure filters are reapplied
});
genderSelect.addEventListener("change", applyFilters);
severitySelect.addEventListener("change", applyFilters);
document.getElementById("group-select").addEventListener("change", applyFilters);
fastForwardButton.addEventListener("click", startAgingAnimation);


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
// Modify the position of the age label to move it to the left
const ageText = chartArea.append("text")
    .attr("id", "age-group-label")
    .attr("x", -margin.left + 20)  // 🔥 Shift to the left
    .attr("y", -20)  // Keep it slightly above the graph
    .attr("text-anchor", "start")  // 🔥 Align text to the left
    .attr("font-size", "16px")
    .attr("fill", "black")
    .text(`Current Age Group: ${ageSlider.value}`);

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

// Parkinson’s Legend
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

const totalPark = parkinsonsData.length;
const totalCtrl = controlData.length;

const binsPark = histogram(parkinsonsData).map(bin => ({
    ...bin,
    density: bin.length / (totalPark * (bin.x1 - bin.x0)) // Normalize counts
}));

const binsCtrl = histogram(controlData).map(bin => ({
    ...bin,
    density: bin.length / (totalCtrl * (bin.x1 - bin.x0)) // Normalize counts
}));


const maxDensity = Math.max(
    d3.max(binsPark, d => d.density) || 0,
    d3.max(binsCtrl, d => d.density) || 0
);
yScale.domain([0, maxDensity]); // Use density instead of raw counts


  chartArea.selectAll(".barPark").remove();
  chartArea.selectAll(".barCtrl").remove();
  

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
      .transition()
      .duration(750)
      .attr("y", d => yScale(d.density))
      .attr("height", d => height - yScale(d.density));

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
      .transition()
      .duration(750)
      .attr("y", d => yScale(d.density))
      .attr("height", d => height - yScale(d.density));

      
  xAxisGroup.transition().duration(750).call(d3.axisBottom(xScale));
  yAxisGroup.transition().duration(750).call(d3.axisLeft(yScale).ticks(6));

  svg.select("#x-axis-label").remove();
  svg.select("#y-axis-label").remove();

  // X-Axis Label
svg.append("text")
.attr("id", "x-axis-label")
.attr("x", width / 2 + margin.left)
.attr("y", height + margin.top + 35)
.attr("text-anchor", "middle")
.style("font-size", "14px")
.text("Gait Speed (m/s)");

// Y-Axis Label
svg.append("text")
.attr("id", "y-axis-label")
.attr("transform", "rotate(-90)")
.attr("x", -height /1.5)
.attr("y", margin.left - 40)
.attr("text-anchor", "middle")
.style("font-size", "14px")
.text("Density");

}

fastForwardButton.addEventListener("click", startAgingAnimation);
/*******************
 * STEP 6: Initialize
 *******************/
// applyFilters();
setTimeout(applyFilters, 500);
