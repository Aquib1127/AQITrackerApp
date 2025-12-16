const apiKey = "881c8c96fd8654244622fb4b26a97a3b65a76023"; 

const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const resultContainer = document.getElementById("aqi-result");
const errorMsg = document.getElementById("error-msg");
const loader = document.getElementById("loader");
const welcomeMsg = document.getElementById("welcome-msg");

// Weather Elements
const tempEl = document.getElementById("temp-val");
const humidityEl = document.getElementById("humidity-val");
const windEl = document.getElementById("wind-val");

// Elements to update
const cityNameEl = document.getElementById("city-name");
const aqiValueEl = document.getElementById("aqi-value");
const aqiStatusEl = document.getElementById("aqi-status");
const aqiCard = document.getElementById("aqi-card"); 
const lastUpdatedEl = document.getElementById("last-updated");
const themeToggle = document.getElementById("theme-toggle");
const aqiMarker = document.getElementById("aqi-marker");
const recentList = document.getElementById("recent-list");
const clearBtn = document.getElementById("clear-btn");
const locateBtn = document.getElementById("locate-btn");

let myChart = null;

// CLEAR BUTTON LOGIC
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

// LOCATE ME BUTTON LOGIC
locateBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        locateBtn.innerText = "📍 Locating...";      
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;              
                getAQIData(`geo:${lat};${lon}`);
                locateBtn.innerText = "📍 Use My Current Location";
            },
            () => {
                showError("Unable to retrieve your location.");
                locateBtn.innerText = "📍 Use My Current Location";
            }
        );
    } else {
        showError("Geolocation is not supported by this browser.");
    }
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
    const url = `https://api.waqi.info/feed/${city}/?token=${apiKey}`;

    errorMsg.innerText = "";
    resultContainer.style.display = "none";
    welcomeMsg.style.display = "none";
    loader.style.display = "block";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            loader.style.display = "none";
            if (data.status === "ok") {
                updateRecentSearches(city);
                displayAQI(data.data);            
            } else {
                showError("City not found. Please enter a valid city name");
            }
        })
        .catch(error => {
            console.error(error); // Log error to see details
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
    aqiCard.className = "card aqi-card"; 
    aqiCard.classList.add(status.className);

    // Gauge Animation
    setTimeout(() => {
        let percentage = (aqi / 500) * 100;
        if (percentage > 100) percentage = 100;
        if (percentage < 0) percentage = 0;
        if(aqiMarker) aqiMarker.style.left = `${percentage}%`; 
    }, 100);

    // WEATHER DATA
    const iaqi = data.iaqi || {};
    if (iaqi.t) {
        tempEl.innerText = `${Math.round(iaqi.t.v)}°C`;
    } else {
        tempEl.innerText = "N/A";
    }
    if (iaqi.h) {
        humidityEl.innerText = `${Math.round(iaqi.h.v)}%`;
    } else {
        humidityEl.innerText = "N/A";
    }
    if (iaqi.w) {
        windEl.innerText = `${iaqi.w.v.toFixed(1)} m/s`;
    } else {
        windEl.innerText = "N/A";
    }

    // Display Pollutants
    const pollutantNames = {
        "pm25": "PM2.5", "pm10": "PM10", "o3": "O3",
        "no2": "NO2", "so2": "SO2", "co": "CO"
    };

    const pollutantList = document.getElementById("pollutant-list");
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
    // Render Chart
    if (data.forecast && data.forecast.daily && data.forecast.daily.pm25) {
        renderChart(data.forecast.daily.pm25);
    }
    resultContainer.style.display = "block";
}

// CHART FUNCTION
function renderChart(dailyData) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    const labels = dailyData.map(d => d.day); // Dates
    const values = dailyData.map(d => d.avg); // AQI Values (Average)
    if (myChart) {
        myChart.destroy();
    }
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'PM2.5 AQI (Daily Avg)',
                data: values,
                backgroundColor: '#d32f2f',
                borderRadius: 4,
                hoverBackgroundColor: '#b71c1c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false } 
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
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
