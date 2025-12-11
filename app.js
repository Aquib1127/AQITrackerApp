const apiKey = "881c8c96fd8654244622fb4b26a97a3b65a76023"; 

const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const resultContainer = document.getElementById("aqi-result");
const errorMsg = document.getElementById("error-msg");
const loader = document.getElementById("loader");

// Elements to update
const cityNameEl = document.getElementById("city-name");
const aqiValueEl = document.getElementById("aqi-value");
const aqiStatusEl = document.getElementById("aqi-status");
const aqiBox = document.getElementById("aqi-box");
const pollutantList = document.getElementById("pollutant-list");
const lastUpdatedEl = document.getElementById("last-updated");

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();

    // Validate input 
    if (city) {
        getAQIData(city);
    } else {
        // Simple shake animation or focus if empty
        cityInput.focus();
    }
});

function getAQIData(city) {
    // Construct the API URL 
    const url = `https://api.waqi.info/feed/${city}/?token=${apiKey}`;

    // Reset UI & Show Loader
    errorMsg.innerText = "";
    resultContainer.style.display = "none";
    loader.style.display = "block"; // Show spinner

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 2. Hide Loader when data returns
            loader.style.display = "none";

            if (data.status === "ok") {
                displayAQI(data.data); // Success: Display Data
            } else {
                showError("City not found. Please enter a valid city name");
            }
        })
        .catch(error => {
            loader.style.display = "none";
            showError("Network error. Please check your internet connection.");
        });
}

function displayAQI(data) {
    const aqi = data.aqi;
    
    // Update Basic Info
    cityNameEl.innerText = `Air Quality in ${data.city.name}`;
    aqiValueEl.innerText = aqi;

    if (data.time && data.time.s) {
        lastUpdatedEl.innerText = `Last Updated: ${data.time.s}`;
    }
    
    // Determine Color and Status
    const status = getAQIStatus(aqi);
    aqiStatusEl.innerText = status.label;

    aqiBox.className = "aqi-box"; 
    aqiBox.classList.add(status.className);

    // Display Pollutants
    pollutantList.innerHTML = "";
    if (data.iaqi) {
        for (const [key, value] of Object.entries(data.iaqi)) {
            if (['pm25', 'pm10', 'no2', 'so2', 'o3', 'co'].includes(key)) {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${key.toUpperCase()}</strong> <span>${value.v}</span>`;
                pollutantList.appendChild(li);
            }
        }
    }
    resultContainer.style.display = "block";
}

function showError(message) {
    errorMsg.innerText = message;
    resultContainer.style.display = "none";
}
 
function getAQIStatus(aqi) {
    if (aqi <= 50) return { label: "Good", className: "good" };
    if (aqi <= 100) return { label: "Moderate", className: "moderate" };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", className: "sensitive" };
    if (aqi <= 200) return { label: "Unhealthy", className: "unhealthy" };
    if (aqi <= 300) return { label: "Very Unhealthy", className: "very-unhealthy" };
    return { label: "Hazardous", className: "hazardous" };
}