class WeatherApp {
    constructor() {
        this.API_KEY = 'f00c38e0279b7bc85480c3fe775d518c'; 
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        this.recentCities = [];
        this.currentUnit = 'metric'; 
        this.currentTempC = null;
        this.currentTempF = null;
        
        this.init();
    }

    init() {
        // Loading recent cities from localStorage
        this.loadRecentCities();
        

        this.setupEventListeners();
        
        // Checking if there is a last searched city
        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            this.getWeatherData(lastCity);
        }
    }

    setupEventListeners() {
        // Search button
        document.getElementById('searchBtn').addEventListener('click', () => {
            const city = document.getElementById('cityInput').value.trim();
            if (city) {
                this.getWeatherData(city);
            } else {
                this.showError('Please enter a city name');
            }
        });

        // Enter key in input
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = e.target.value.trim();
                if (city) {
                    this.getWeatherData(city);
                } else {
                    this.showError('Please enter a city name');
                }
            }
        });

        // Current location button
        document.getElementById('currentLocationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Recent cities dropdown
        document.getElementById('recentCitiesSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.getWeatherData(e.target.value);
            }
        });

        // Temperature unit toggle
        document.getElementById('celsiusBtn').addEventListener('click', () => {
            if (this.currentUnit !== 'metric') {
                this.currentUnit = 'metric';
                this.updateTemperatureDisplay();
                this.toggleActiveUnit('celsius');
            }
        });

        document.getElementById('fahrenheitBtn').addEventListener('click', () => {
            if (this.currentUnit !== 'imperial') {
                this.currentUnit = 'imperial';
                this.updateTemperatureDisplay();
                this.toggleActiveUnit('fahrenheit');
            }
        });

        // Close error button
        document.getElementById('closeError').addEventListener('click', () => {
            this.hideError();
        });
    }

    toggleActiveUnit(unit) {
        const celsiusBtn = document.getElementById('celsiusBtn');
        const fahrenheitBtn = document.getElementById('fahrenheitBtn');
        
        if (unit === 'celsius') {
            celsiusBtn.classList.add('bg-yellow-400', 'text-gray-900');
            celsiusBtn.classList.remove('hover:bg-white/20');
            fahrenheitBtn.classList.remove('bg-yellow-400', 'text-gray-900');
            fahrenheitBtn.classList.add('hover:bg-white/20');
        } else {
            fahrenheitBtn.classList.add('bg-yellow-400', 'text-gray-900');
            fahrenheitBtn.classList.remove('hover:bg-white/20');
            celsiusBtn.classList.remove('bg-yellow-400', 'text-gray-900');
            celsiusBtn.classList.add('hover:bg-white/20');
        }
    }

    async getWeatherData(city) {
        try {
            this.showLoading();
            
            // Fetch current weather
            const currentWeatherResponse = await fetch(
                `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&units=metric`
            );
            
            if (!currentWeatherResponse.ok) {
                throw new Error('City not found');
            }
            
            const currentWeather = await currentWeatherResponse.json();
            
            // Store temperatures for unit conversion
            this.currentTempC = Math.round(currentWeather.main.temp);
            this.currentTempF = Math.round((this.currentTempC * 9/5) + 32);
            
            // Fetch 5-day forecast
            const forecastResponse = await fetch(
                `${this.BASE_URL}/forecast?q=${city}&appid=${this.API_KEY}&units=metric`
            );
            const forecastData = await forecastResponse.json();
            
            // Update UI
            this.updateCurrentWeather(currentWeather);
            this.updateForecast(forecastData);
            this.updateBackground(currentWeather.weather[0].main);
            
            // Add to recent cities
            this.addRecentCity(city);
            
            // Save last city
            localStorage.setItem('lastCity', city);
            
            // Show weather sections
            document.getElementById('currentWeather').classList.remove('hidden');
            document.getElementById('forecastSection').classList.remove('hidden');
            this.hideError();
            
        } catch (error) {
            this.showError('City not found. Please check the spelling and try again.');
            console.error('Error:', error);
        } finally {
            this.hideLoading();
        }
    }

    async getWeatherByCoords(lat, lon) {
        try {
            this.showLoading();
            
            
            const currentWeatherResponse = await fetch(
                `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
            );
            const currentWeather = await currentWeatherResponse.json();
            
            // Store temperatures
            this.currentTempC = Math.round(currentWeather.main.temp);
            this.currentTempF = Math.round((this.currentTempC * 9/5) + 32);
            
            // Fetch forecast by coordinates
            const forecastResponse = await fetch(
                `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
            );
            const forecastData = await forecastResponse.json();
            
            // Update UI
            this.updateCurrentWeather(currentWeather);
            this.updateForecast(forecastData);
            this.updateBackground(currentWeather.weather[0].main);
            
            
            this.addRecentCity(currentWeather.name);
            
           
            localStorage.setItem('lastCity', currentWeather.name);
            
            // Show weather sections
            document.getElementById('currentWeather').classList.remove('hidden');
            document.getElementById('forecastSection').classList.remove('hidden');
            this.hideError();
            
        } catch (error) {
            this.showError('Unable to fetch weather for your location. Please try again.');
            console.error('Error:', error);
        } finally {
            this.hideLoading();
        }
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.getWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    this.showError('Unable to get your location. Please enable location services.');
                }
            );
        } else {
            this.showError('Geolocation is not supported by your browser.');
        }
    }

    updateCurrentWeather(data) {
        // Update location
        document.getElementById('locationName').textContent = `${data.name}, ${data.sys.country}`;
        
       
        this.updateTemperatureDisplay();
        
        // Update weather condition and icon
        const condition = data.weather[0].main;
        const description = data.weather[0].description;
        document.getElementById('weatherCondition').textContent = description;
        
        // Set weather icon
        const iconElement = document.getElementById('weatherIcon');
        iconElement.innerHTML = this.getWeatherIcon(condition);
        
        // Update feels like
        const feelsLikeC = Math.round(data.main.feels_like);
        const feelsLikeF = Math.round((feelsLikeC * 9/5) + 32);
        const feelsLike = this.currentUnit === 'metric' ? `${feelsLikeC}°C` : `${feelsLikeF}°F`;
        document.getElementById('feelsLike').textContent = `Feels like ${feelsLike}`;
        
        // Update stats
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        
        const windSpeed = this.currentUnit === 'metric' 
            ? `${data.wind.speed} m/s` 
            : `${(data.wind.speed * 2.237).toFixed(1)} mph`;
        document.getElementById('windSpeed').textContent = windSpeed;
        
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        
        const visibilityKm = (data.visibility / 1000).toFixed(1);
        const visibilityMiles = (data.visibility * 0.000621371).toFixed(1);
        const visibility = this.currentUnit === 'metric' 
            ? `${visibilityKm} km` 
            : `${visibilityMiles} miles`;
        document.getElementById('visibility').textContent = visibility;
        
        // Check for extreme temperature
        this.checkExtremeTemperature(data.main.temp);
    }

    updateTemperatureDisplay() {
        if (this.currentTempC !== null) {
            const temp = this.currentUnit === 'metric' ? this.currentTempC : this.currentTempF;
            document.getElementById('temperature').textContent = `${temp}°${this.currentUnit === 'metric' ? 'C' : 'F'}`;
        }
    }

    updateForecast(data) {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';
        
        // Get one forecast per day (every 8th item for 3-hour intervals)
        const dailyForecasts = data.list.filter((item, index) => index % 8 === 0).slice(0, 5);
        
        dailyForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const temp = Math.round(forecast.main.temp);
            const humidity = forecast.main.humidity;
            const windSpeed = forecast.wind.speed;
            const condition = forecast.weather[0].main;
            
            const card = document.createElement('div');
            card.className = 'forecast-card bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:border-yellow-400/50 transition-all duration-300';
            
            card.innerHTML = `
                <div class="text-center">
                    <p class="text-white font-semibold mb-3 text-lg">${dayName}</p>
                    <div class="text-5xl mb-3">
                        ${this.getWeatherIcon(condition, true)}
                    </div>
                    <p class="text-2xl font-bold text-white mb-3">${temp}°C</p>
                    <div class="flex justify-between text-sm text-white/80">
                        <div class="flex items-center gap-1">
                            <i class="fas fa-droplet text-blue-400 text-xs"></i>
                            <span>${humidity}%</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i class="fas fa-wind text-cyan-400 text-xs"></i>
                            <span>${windSpeed} m/s</span>
                        </div>
                    </div>
                </div>
            `;
            
            forecastContainer.appendChild(card);
        });
    }

    getWeatherIcon(condition, isSmall = false) {
        const size = isSmall ? 'text-3xl' : 'text-5xl';
        const icons = {
            'Clear': `<i class="fas fa-sun ${size} text-yellow-400"></i>`,
            'Clouds': `<i class="fas fa-cloud ${size} text-gray-300"></i>`,
            'Rain': `<i class="fas fa-cloud-rain ${size} text-blue-400"></i>`,
            'Snow': `<i class="fas fa-snowflake ${size} text-white"></i>`,
            'Thunderstorm': `<i class="fas fa-cloud-bolt ${size} text-yellow-600"></i>`,
            'Drizzle': `<i class="fas fa-cloud-rain ${size} text-blue-300"></i>`,
            'Mist': `<i class="fas fa-smog ${size} text-gray-400"></i>`,
            'Smoke': `<i class="fas fa-smog ${size} text-gray-500"></i>`,
            'Haze': `<i class="fas fa-smog ${size} text-gray-400"></i>`,
            'Dust': `<i class="fas fa-smog ${size} text-yellow-600"></i>`,
            'Fog': `<i class="fas fa-smog ${size} text-gray-400"></i>`,
            'Sand': `<i class="fas fa-smog ${size} text-yellow-700"></i>`,
            'Ash': `<i class="fas fa-smog ${size} text-gray-600"></i>`,
            'Squall': `<i class="fas fa-cloud-rain ${size} text-blue-500"></i>`,
            'Tornado': `<i class="fas fa-tornado ${size} text-gray-600"></i>`
        };
        
        return icons[condition] || `<i class="fas fa-cloud-sun ${size} text-gray-400"></i>`;
    }

    updateBackground(condition) {
        const body = document.getElementById('body-bg');
        const rainyBg = document.querySelector('.rainy-bg');
        
        // Remove all dynamic background classes
        body.classList.remove('rainy-bg', 'snowy-bg', 'sunny-bg', 'cloudy-bg');
        
        // Adding appropriate background based on condition
        if (condition === 'Rain' || condition === 'Drizzle' || condition === 'Thunderstorm') {
            body.classList.add('rainy-bg');
        } else if (condition === 'Snow') {
            body.classList.add('snowy-bg');
        } else if (condition === 'Clear') {
            body.classList.add('sunny-bg');
        } else if (condition === 'Clouds') {
            body.classList.add('cloudy-bg');
        }
    }

    checkExtremeTemperature(temp) {
        const alertContainer = document.getElementById('weatherAlert');
        const alertMessage = document.getElementById('alertMessage');
        
        if (temp >= 40) {
            alertMessage.innerHTML = '<i class="fas fa-triangle-exclamation mr-2"></i> Extreme Heat Alert! Temperature exceeds 40°C. Stay hydrated and avoid prolonged sun exposure.';
            alertContainer.classList.remove('hidden');
        } else if (temp <= 0) {
            alertMessage.innerHTML = '<i class="fas fa-triangle-exclamation mr-2"></i> Extreme Cold Alert! Temperature is below 0°C. Dress warmly and be cautious of ice.';
            alertContainer.classList.remove('hidden');
        } else {
            alertContainer.classList.add('hidden');
        }
    }

    addRecentCity(city) {
        if (!this.recentCities.includes(city)) {
            this.recentCities.unshift(city);
            
            // It Keeps only last 5 cities
            if (this.recentCities.length > 5) {
                this.recentCities.pop();
            }
            
            // Save to localStorage
            localStorage.setItem('recentCities', JSON.stringify(this.recentCities));
            
            // Update dropdown
            this.updateRecentCitiesDropdown();
        }
    }

    loadRecentCities() {
        const saved = localStorage.getItem('recentCities');
        if (saved) {
            this.recentCities = JSON.parse(saved);
            this.updateRecentCitiesDropdown();
        }
    }

    updateRecentCitiesDropdown() {
        const container = document.getElementById('recentCitiesContainer');
        const select = document.getElementById('recentCitiesSelect');
        
        if (this.recentCities.length > 0) {
            container.classList.remove('hidden');
            select.innerHTML = '<option value="" disabled selected>📜 Recent searches</option>';
            
            this.recentCities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                option.className = 'bg-gray-800 text-white';
                select.appendChild(option);
            });
        } else {
            container.classList.add('hidden');
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
        
        // Auto-hide the after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        document.getElementById('errorContainer').classList.add('hidden');
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }
}

// Initializing the app
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});