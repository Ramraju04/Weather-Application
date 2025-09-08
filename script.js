const apiKey = "ca2fe43d863ed51fe960d156027299b9";

function convertTemperature(temp, unit) {
  return unit === 'Fahrenheit' ? Math.round((temp * 9 / 5) + 32) : Math.round(temp);
}

async function findUserLocation() {
  const location = document.getElementById("user-location").value || "Bengaluru";
  const unit = document.getElementById("convertor").value;

  document.getElementById("last-updated").innerText = "Updating...";
  try {
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`);
    if (!weatherResponse.ok) {
      alert("Location not found");
      document.getElementById("last-updated").innerText = "Last updated: --";
      return;
    }
    const weatherData = await weatherResponse.json();
    const { lon, lat } = weatherData.coord;

    displayCurrentWeather(weatherData, unit);
    fetchUVIndex(lat, lon);

    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const forecastData = await forecastResponse.json();
    displayForecast(forecastData, unit);

    document.getElementById("last-updated").innerText = "Last updated: " + new Date().toLocaleString();
  } catch (error) {
    alert("Unable to retrieve weather data.");
    document.getElementById("last-updated").innerText = "Last updated: --";
    console.error(error);
  }
}

async function fetchUVIndex(lat, lon) {
  try {
    const uvResponse = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const uvData = await uvResponse.json();
    document.getElementById("UVValue").innerText = uvData.value;
  } catch {
    document.getElementById("UVValue").innerText = "N/A";
  }
}

function displayCurrentWeather(data, unit) {
  document.querySelector(".temperature").innerText = `${convertTemperature(data.main.temp, unit)}°${unit === 'Fahrenheit' ? 'F' : 'C'}`;
  document.querySelector(".feelsLike").innerText = `Feels like: ${convertTemperature(data.main.feels_like, unit)}°${unit === 'Fahrenheit' ? 'F' : 'C'}`;
  document.querySelector(".weather-desc").innerText = data.weather[0].description;
  document.querySelector(".city-country").innerText = `${data.name}, ${data.sys.country}`;
  document.getElementById("HValue").innerText = `${data.main.humidity}%`;
  document.getElementById("WValue").innerText = `${data.wind.speed} m/s`;
  document.getElementById("CValue").innerText = `${data.clouds.all}%`;
  document.getElementById("PValue").innerText = `${data.main.pressure} hPa`;
  document.getElementById("SRValue").innerText = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (IST)";
  document.getElementById("SSValue").innerText = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (IST)";

  const weatherIcon = document.querySelector(".weatherIcon");
  weatherIcon.style.background = `url(https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png) no-repeat center center`;
  weatherIcon.style.backgroundSize = 'cover';
}

function displayForecast(data, unit) {
  const forecastContainer = document.querySelector(".forecast");
  forecastContainer.innerHTML = "";
  const dailyForecasts = {};

  data.list.forEach(forecast => {
    const dateObj = new Date(forecast.dt * 1000);
    const date = dateObj.toLocaleDateString("en-GB");

    if (!dailyForecasts[date]) {
  dailyForecasts[date] = {
    maxTemp: forecast.main.temp_max,
    minTemp: forecast.main.temp_min,
    description: forecast.weather[0].description,
    icon: forecast.weather[0].icon,
    timestamp: forecast.dt
  };
} else {
  dailyForecasts[date].maxTemp = Math.max(dailyForecasts[date].maxTemp, forecast.main.temp_max);
  dailyForecasts[date].minTemp = Math.min(dailyForecasts[date].minTemp, forecast.main.temp_min);
  
  // Pick forecast closest to 12:00 for icon/desc
  const forecastHour = dateObj.getHours();
  const savedHour = new Date(dailyForecasts[date].timestamp * 1000).getHours();
  if (Math.abs(forecastHour - 12) < Math.abs(savedHour - 12)) {
    dailyForecasts[date].icon = forecast.weather[0].icon;
    dailyForecasts[date].description = forecast.weather[0].description;
    dailyForecasts[date].timestamp = forecast.dt;
  }
}

  });

  const sortedDates = Object.keys(dailyForecasts)
  .sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB); 
  })
  .slice(0, 3);


  sortedDates.forEach(date => {
    const { maxTemp, minTemp, description, icon } = dailyForecasts[date];
    const card = document.createElement("div");
    card.classList.add("forecast-card");
    card.innerHTML = `
      <div>${date}</div>
      <img class="icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
      <div>Max: ${convertTemperature(maxTemp, unit)}°${unit === 'Fahrenheit' ? 'F' : 'C'}</div>
      <div>Min: ${convertTemperature(minTemp, unit)}°${unit === 'Fahrenheit' ? 'F' : 'C'}</div>
      <div>${description}</div>
    `;
    forecastContainer.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  findUserLocation();
  document.getElementById("convertor").addEventListener("change", findUserLocation);
});
