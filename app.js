const apiKey = "881c8c96fd8654244622fb4b26a97a3b65a76023"; 

const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const resultContainer = document.getElementById("aqi-result");
const errorMsg = document.getElementById("error-msg");
const loader = document.getElementById("loader");
const welcomeMsg = document.getElementById("welcome-msg");

// Elements to update
const cityNameEl = document.getElementById("city-name");
const aqiValueEl = document.getElementById("aqi-value");
const aqiStatusEl = document.getElementById("aqi-status");
const aqiBox = document.getElementById("aqi-box");
const pollutantList = document.getElementById("pollutant-list");
const lastUpdatedEl = document.getElementById("last-updated");
const gaugeFill = document.getElementById("gauge-fill");
const themeToggle = document.getElementById("theme-toggle");
const recentList = document.getElementById("recent-list");
const clearBtn = document.getElementById("clear-btn");

cityInput.addEventListener("input", () => {
    if (cityInput.value.length > 0) {
        clearBtn.style.display = "flex";
    } else {
        clearBtn.style.display = "none";
    }
});
clearBtn.addEventListener("click", () => {
    cityInput.value = "";
    clearBtn.style.display = "none";
    cityInput.focus();
});

// TOGGLE LOGIC
themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
        document.documentElement.setAttribute("data-theme", "light");
        themeToggle.innerText = "🌙";
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggle.innerText = "☀️";
    }
});

// RECENT SEARCHES
function updateRecentSearches(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    if (!searches.includes(city)) {
        searches.unshift(city);
        if (searches.length > 5) searches.pop();
        localStorage.setItem("recentSearches", JSON.stringify(searches));
    }
    renderRecentList();
}

function renderRecentList() {
    let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    recentList.innerHTML = "";  
    if (searches.length === 0) {
        recentList.innerHTML = '<p class="empty-msg">No recent searches</p>';
        return;
    }
    searches.forEach(city => {
        const item = document.createElement("p");
        item.innerText = city;
        item.onclick = () => {
            cityInput.value = city;
            clearBtn.style.display = "flex";
            getAQIData(city);
        };
        recentList.appendChild(item);
    });
}
renderRecentList();

// SEARCH LOGIC
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) getAQIData(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) getAQIData(city);
    }
});

function getAQIData(city) {
    // Construct the API URL 
    const url = `https://api.waqi.info/feed/${city}/?token=${apiKey}`;

    // Reset UI & Show Loader
    errorMsg.innerText = "";
    resultContainer.style.display = "none";
    welcomeMsg.style.display = "none";
    loader.style.display = "block";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Hide Loader when data returns
            loader.style.display = "none";
            if (data.status === "ok") {
                updateRecentSearches(city);
                displayAQI(data.data);            
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
    
    cityNameEl.innerText = `Air Quality in ${data.city.name}`;
    aqiValueEl.innerText = aqi;
    
    if (data.time && data.time.s) {
        lastUpdatedEl.innerText = `Updated: ${data.time.s}`;
    }

    const status = getAQIStatus(aqi);
    aqiStatusEl.innerText = status.label;

    aqiBox.className = "aqi-box"; 
    aqiBox.classList.add(status.className);

    // Animate Gauge
    setTimeout(() => {
        const percentage = Math.min((aqi / 500) * 100, 100); 
        gaugeFill.style.width = `${percentage}%`;
    }, 100);

    const pollutantNames = {
        "pm25": "PM2.5", "pm10": "PM10", "o3": "O3",
        "no2": "NO2", "so2": "SO2", "co": "CO"
    };

    pollutantList.innerHTML = "";
    if (data.iaqi) {
        for (const [key, value] of Object.entries(data.iaqi)) {
            if (pollutantNames[key]) { 
                const li = document.createElement("li");
                li.innerHTML = `<strong>${pollutantNames[key]}</strong> <span>${value.v}</span>`;
                pollutantList.appendChild(li);
            }
        }
    }
    resultContainer.style.display = "block";
}

function showError(message) {
    errorMsg.innerText = message;
    welcomeMsg.style.display = "block";
}

function getAQIStatus(aqi) {
    if (aqi <= 50) return { label: "Good", className: "good" };
    if (aqi <= 100) return { label: "Moderate", className: "moderate" };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", className: "sensitive" };
    if (aqi <= 200) return { label: "Unhealthy", className: "unhealthy" };
    if (aqi <= 300) return { label: "Very Unhealthy", className: "very-unhealthy" };
    return { label: "Hazardous", className: "hazardous" };
}