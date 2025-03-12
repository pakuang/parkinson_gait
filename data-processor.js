/*
 * Data processing functions for Parkinson's gait data
 * This script handles loading and processing the raw gait data files
 */

// Function to load and process all data files
async function loadGaitData() {
  try {
    // Fetch and parse the demographics.txt file which contains metadata about subjects
    const demographicsText = await fetch('gait-in-parkinsons-disease-1.0.0/demographics.txt')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load demographics file');
        }
        return response.text();
      });
    
    // Parse demographics to get subject info (particularly Speed_01 values)
    const demographics = parseTabSeparatedFile(demographicsText);
    
    // Extract speed values from demographics
    const parkinsonsSpeed = [];
    const controlSpeed = [];
    
    demographics.forEach(subject => {
      // Group is 1 for Parkinson's, 2 for Control
      if (subject.Group === '1' && subject.Speed_01) {
        const speed = parseFloat(subject.Speed_01);
        if (!isNaN(speed)) {
          parkinsonsSpeed.push(speed);
        }
      } else if (subject.Group === '2' && subject.Speed_01) {
        const speed = parseFloat(subject.Speed_01);
        if (!isNaN(speed)) {
          controlSpeed.push(speed);
        }
      }
    });
    
    console.log(`Loaded ${parkinsonsSpeed.length} Parkinson's subjects and ${controlSpeed.length} control subjects`);
    
    return {
      parkinsonsData: parkinsonsSpeed,
      controlData: controlSpeed
    };
  } catch (error) {
    console.error('Error loading gait data:', error);
    // Fallback to sample data if loading fails
    return {
      parkinsonsData: getSampleParkinsonsData(),
      controlData: getSampleControlData()
    };
  }
}

// Parse a tab-separated file into an array of objects
function parseTabSeparatedFile(fileContent) {
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].split('\t');
  
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
    });
    
    return obj;
  });
}

// Calculate gait speed from raw data file
// Note: This is a simplified version - real implementation would need
// to process the force data to calculate actual speed
function calculateGaitSpeed(fileContent) {
  // In a real implementation, we would:
  // 1. Parse the raw data (19 columns)
  // 2. Detect steps using the force data
  // 3. Calculate step length and time
  // 4. Derive speed from step length and frequency
  
  // For demonstration, returning a random value in a realistic range
  return 0.8 + Math.random() * 0.7;
}

// Sample data as fallback
function getSampleParkinsonsData() {
  return [
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
}

function getSampleControlData() {
  return [
    1.075, 1.04,  1.051, 1.175, 0.92,  1.121, 1.282, 0.975, 1.249, 1.164,
    1.515, 1.389, 1.211, 1.298, 1.344, 1.346, 1.415, 1.542, 1.089, 1.329,
    1.322, 1.239, 1.248, 0.954, 1.332, 1.286, 1.375, 1.051, 1.203, 1.143,
    1.17,  1.42,  1.164, 1.484, 1.54,  1.231, 1.253, 1.031, 1.13,  1.144,
    1.17,  1.391, 1.265, 1.349, 0.906, 1.371, 1.427, 1.07,  1.263, 1.348,
    1.191, 1.31,  1.442, 1.465, 1.538, 1.299, 1.151, 1.469, 1.073, 1.202,
    1.27,  1.086, 1.25,  1.458, 1.418, 1.16
  ];
}