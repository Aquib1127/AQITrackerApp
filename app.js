const apiKey = "881c8c96fd8654244622fb4b26a97a3b65a76023"; 

const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();

    // Validate input 
    if (city) {
        getAQIData(city);
    } else {
        console.log("Please enter a valid city name");
    }
});

function getAQIData(city) {
    // Construct the API URL 
    const url = `https://api.waqi.info/feed/${city}/?token=${apiKey}`;

    // Fetch data from API
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Display raw data in console for testing 
            console.log("API Response:", data); 
            
            if (data.status === "ok") {
                console.log(`AQI for ${city}:`, data.data.aqi);
            } else {
                console.error("City not found or API error");
            }
        })
        .catch(error => {
            // Handle network errors
            console.error("Error fetching data:", error);
        });
}