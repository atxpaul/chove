// DOM Elements - Initial setup, can be replaced for testing
let domElements = {
    permission: typeof document !== 'undefined' ? document.querySelector('.permission') : null,
    positive: typeof document !== 'undefined' ? document.querySelector('.positive') : null,
    negative: typeof document !== 'undefined' ? document.querySelector('.negative') : null,
    error: typeof document !== 'undefined' ? document.querySelector('.error') : null,
    image: typeof document !== 'undefined' ? document.querySelector('#image') : null,
    // Add other elements if they become dynamic or need mocking
};

// Function to allow overriding DOM elements for testing
function setDomElements(elements) {
    domElements = { ...domElements, ...elements };
}

// Geolocation Service - Initial setup, can be replaced for testing
let geoService = {
    getCurrentPosition: (successCb, errorCb, options) => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCb, errorCb, options);
        } else {
            // Provide a default behavior or error if navigator.geolocation is not available
            // For example, call errorCb immediately or log a warning.
            // This is important for environments where navigator.geolocation might be undefined.
            console.warn('Geolocation is not available.');
            if (errorCb) {
                errorCb(new Error('Geolocation not available or not supported.'));
            }
        }
    }
};


// Function to allow overriding geolocation service for testing
function setGeolocationService(service) {
    geoService = service;
}

// Global State
let state = {
    prediction: {},
    nextRain: 0,
    stopRaining: 0,
    index: 0,
    userHour: null,
    variationTime: 0,
    // Potentially add weatherCodes here if it's considered dynamic state,
    // but it's currently a const. For now, keep as is.
};

const HOURSTOCHECK = 12;
const PERCENTAGETORAIN = 0.12;

// DOM Manipulation functions using domElements
function hideAllPanels() {
    if (domElements.permission) domElements.permission.classList.add('hidden');
    if (domElements.positive) domElements.positive.classList.add('hidden');
    if (domElements.negative) domElements.negative.classList.add('hidden');
    if (domElements.error) domElements.error.classList.add('hidden');
}

function showPanel(panelElement) {
    // Assumes panelElement is one of the elements from domElements
    if (panelElement) panelElement.classList.remove('hidden');
}

async function getData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error conseguindo info do tempo'); // Use Error object
    const data = await response.json();
    return data;
}

function showError(message) {
    hideAllPanels();
    if (domElements.error && domElements.error.querySelector('p')) {
        domElements.error.querySelector('p').innerText = message;
    }
    showPanel(domElements.error);
}

function showPositive(info) {
    hideAllPanels();
    showPanel(domElements.positive);
    if (domElements.image) {
        domElements.image.src = info.currentWeather.icon;
        domElements.image.alt = info.currentWeather.alt;
    }
    if (domElements.positive && domElements.positive.querySelector('p')) {
        if (state.nextRain > 0) {
            domElements.positive.querySelector('p').innerHTML = `Agora mesmo hai ${
                info.currentTemp
            }°C na túa localización con ${info.textWeather} 
        e parece que pode chover dentro de ${state.nextRain} ${
                state.nextRain === 1 ? 'hora' : 'horas'
            }`;
        } else {
            domElements.positive.querySelector(
                'p'
            ).innerHTML = `Agora mesmo hai ${info.currentTemp}°C na túa localización con ${info.textWeather} 
        e parece que pode chover axiña`;
        }
    }
}

function showPositiveRaining(info) {
    hideAllPanels();
    showPanel(domElements.positive);
    if (domElements.image) {
        domElements.image.src = info.currentWeather.icon;
        domElements.image.alt = info.currentWeather.alt;
    }
    if (domElements.positive && domElements.positive.querySelector('p')) {
        if (state.stopRaining > 0) {
            domElements.positive.querySelector('p').innerHTML = `Agora mesmo hai ${
                info.currentTemp
            }°C na túa localización con ${info.textWeather} 
        e parece que pode chover ata dentro de ${state.stopRaining} ${
                state.stopRaining === 1 ? 'hora' : 'horas'
            } polo menos. 
        ${
            state.nextRain > 0
                ? '\nPode voltar a chover en ' + state.nextRain + ' horas'
                : ''
        }`;
        } else {
            domElements.positive.querySelector('p').innerHTML = `Agora mesmo hai ${
                info.currentTemp
            }°C na túa localización con ${info.textWeather} 
        e parece que vai parar de chover nuns intres
        ${
            state.nextRain > 0
                ? '\nPode voltar a chover en ' + state.nextRain + ' horas'
                : ''
        }`;
        }
    }
}

function showNegative(info) {
    hideAllPanels();
    showPanel(domElements.negative);
    if (domElements.image) {
        domElements.image.src = info.currentWeather.icon;
        domElements.image.alt = info.currentWeather.alt;
    }
    if (domElements.negative && domElements.negative.querySelector('p')) {
        domElements.negative.querySelector(
            'p'
        ).innerHTML = `Agora mesmo hai ${info.currentTemp}°C na túa localización con ${info.textWeather}  e non parece que vaia a chover nas próximas horas`;
    }
}

// Logic functions using state object
function processCurrentWeather(weatherCode) {
    let icon;
    let alt;
    let weather;
    // console.log(`Processing code ${weatherCode}`); // Keep or remove console logs as desired
    if (weatherCode == 0) {
        icon = '../img/sun.svg';
        alt = 'icono sol';
        weather = 'sun';
    } else if (weatherCode == 1 || weatherCode == 2 || weatherCode == 3) {
        icon = '../img/suncloud.svg';
        alt = 'icono sol e nube';
        weather = 'sunandclouds';
    } else if (
        weatherCode == 51 || weatherCode == 53 || weatherCode == 55 ||
        weatherCode == 56 || weatherCode == 57 || weatherCode == 61 ||
        weatherCode == 63 || weatherCode == 65 || weatherCode == 66 ||
        weatherCode == 67 || weatherCode == 80 || weatherCode == 81 ||
        weatherCode == 82 || weatherCode == 85 || weatherCode == 86
    ) {
        icon = '../img/rain.svg';
        alt = 'icono choiva';
        weather = 'rain';
    } else if (weatherCode == 45 || weatherCode == 48) {
        icon = '../img/fog.svg';
        alt = 'icono neboa';
        weather = 'fog';
    } else if (
        weatherCode == 71 || weatherCode == 75 || weatherCode == 73 ||
        weatherCode == 77
    ) {
        icon = '../img/snow.svg';
        alt = 'icono neve ou saraiba';
        weather = 'snow';
    } else if (weatherCode == 95 || weatherCode == 96 || weatherCode == 99) {
        icon = '../img/storm.svg';
        alt = 'icono treboada';
        weather = 'storm';
    }
    return { icon, alt, weather };
}

function getCurrentWeather() {
    return state.prediction.current_weather.weathercode;
}

function processData() {
    let currentWeather = processCurrentWeather(getCurrentWeather());
    // console.log(`O tempo actual é ${weatherCodes[parseInt(state.prediction.current_weather.weathercode)]}`);
    if (
        currentWeather.weather == 'rain' ||
        currentWeather.weather == 'storm' ||
        currentWeather.weather == 'snow'
    ) {
        isRaining(); // This function will modify state.stopRaining
        if (isGoingToRain() == true && state.stopRaining < 4) { // isGoingToRain modifies state.nextRain
            // console.log(`Está chovendo e volverá a chover en ${state.nextRain} horas`);
        }
        showPositiveRaining({
            location: 'Test', // This could also come from state or be passed in
            currentTemp: state.prediction.hourly.temperature_2m[state.index],
            currentWeather: currentWeather,
            stopRaining: state.stopRaining,
            textWeather: weatherCodes[parseInt(state.prediction.current_weather.weathercode)],
            nextRain: state.nextRain,
        });
    } else if (
        currentWeather.weather == 'sun' ||
        currentWeather.weather == 'sunandclouds' ||
        currentWeather.weather == 'fog'
    ) {
        if (isGoingToRain() == true) { // Modifies state.nextRain
            showPositive({
                location: 'Test',
                currentTemp: state.prediction.hourly.temperature_2m[state.index],
                currentWeather: currentWeather,
                nextRain: state.nextRain,
                textWeather: weatherCodes[parseInt(state.prediction.current_weather.weathercode)],
            });
        } else {
            showNegative({
                location: 'Test',
                currentTemp: state.prediction.hourly.temperature_2m[state.index],
                currentWeather: currentWeather,
                textWeather: weatherCodes[parseInt(state.prediction.current_weather.weathercode)],
            });
        }
    }
}

function isRaining() {
    // console.log('Comprobando se está chovendo');
    state.stopRaining = 0; // Reset before check
    let maxTimeToCheckRain = state.index + HOURSTOCHECK;
    let hourWithVariation;
    for (let i = state.index; i < maxTimeToCheckRain; i++) {
        // Ensure 'i' doesn't go out of bounds for prediction.hourly.precipitation
        if (i >= state.prediction.hourly.precipitation.length) break; 
        hourWithVariation = i + state.variationTime; // variationTime needs to be set
        if (state.prediction.hourly.precipitation[i] > PERCENTAGETORAIN) {
            // console.log(`O índice ás ${hourWithVariation < 24 ? hourWithVariation : hourWithVariation - 24} horas é de ${state.prediction.hourly.precipitation[i]}`);
            state.stopRaining++;
        }
    }

    if (state.stopRaining > 0) {
        // console.log(`Seica si, agora o indice de choiva da próxima hora é de ${state.prediction.hourly.precipitation[state.index + 1]}`);
        return true;
    }

    // console.log(`Seica non`);
    // state.stopRaining = 0; // Already reset at the beginning
    return false;
}

function isGoingToRain() {
    // console.log('Comprobando se vai chover');
    state.nextRain = 0; // Reset before check
    let maxTimeToCheckRain = state.index + HOURSTOCHECK;
    let hourWithVariation;
    for (let i = state.index; i < maxTimeToCheckRain; i++) {
        // Ensure 'i' doesn't go out of bounds
        if (i >= state.prediction.hourly.precipitation.length) break;
        hourWithVariation = i + state.variationTime; // variationTime needs to be set
        // console.log(`O índice ás ${hourWithVariation < 24 ? hourWithVariation : hourWithVariation - 24} horas é de ${state.prediction.hourly.precipitation[i]}`);

        if (state.prediction.hourly.precipitation[i] > PERCENTAGETORAIN) {
            // console.log(`Seica si, ás ${hourWithVariation < 24 ? hourWithVariation : hourWithVariation - 24} horas o indice de choiva é de ${state.prediction.hourly.precipitation[i]}`);
            return true; // nextRain has accumulated the count of hours *before* rain
        }
        state.nextRain++;
    }
    state.nextRain = 0; // Reset if no rain found in the loop
    // console.log(`Seica non`);
    return false;
}

async function processLocation(location) {
    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    try {
        state.prediction = await getData(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,weathercode&current_weather=true`
        );

        const currentDate = state.prediction.current_weather.time;
        const currentHour = new Date(currentDate);
        currentHour.setMinutes(0, 0, 0);
        const roundedCurrentDate = currentHour.toISOString().slice(0, 13) + ':00';
        state.index = state.prediction.hourly.time.indexOf(roundedCurrentDate);
        if (state.index === -1) state.index = 0; // Fallback if exact hour not found

        state.userHour = getUserTime();
        // console.log(`A hora actual UTC é ${state.prediction.hourly.time[state.index]}, a hora do usuario son as ${state.userHour}`);
        state.variationTime = getVariationUTCToUserTime(
            state.prediction.hourly.time[state.index].substr(11, 2),
            state.userHour
        );

        processData();
    } catch (error) {
        // console.log(error);
        showError(error.message || 'Erro conseguindo información meteorolóxica');
    }
}

// Ensure Number.prototype.padLeft is defined or imported if not native
if (!Number.prototype.padLeft) {
    Number.prototype.padLeft = function (base, chr) {
        var len = String(base || 10).length - String(this).length + 1;
        return len > 0 ? new Array(len).join(chr || '0') + this : this;
    };
}


function getUserLocation() {
    hideAllPanels();
    geoService.getCurrentPosition(
        (locationInfo) => {
            if (typeof localStorage !== 'undefined') localStorage.setItem('permission', 'ok');
            processLocation(locationInfo);
        },
        () => {
            showError('Erro conseguindo localización');
        }
    );
}

function getUserTime() {
    const date = new Date();
    let hour = date.getHours().padLeft();
    return hour;
}

function getVariationUTCToUserTime(hourUTC, hourUser) {
    let variation;
    if (hourUser < hourUTC) {
        variation = 24 + parseInt(hourUser) - parseInt(hourUTC);
    } else {
        variation = hourUser - hourUTC;
    }
    // console.log(`A variación de tempo sobre UTC é ${variation}`);
    return variation;
}

function main() {
    // Check if DOM is ready before trying to access elements
    if (typeof document !== 'undefined' && document.readyState !== 'loading') {
        // Initialize domElements again in case they were not available at initial script load
        // This is more relevant for scripts loaded in <head> without defer/async
        if (!domElements.permission) { // Simple check if elements need re-init
             domElements.permission = document.querySelector('.permission');
             domElements.positive = document.querySelector('.positive');
             domElements.negative = document.querySelector('.negative');
             domElements.error = document.querySelector('.error');
             domElements.image = document.querySelector('#image');
        }

        showPanel(domElements.permission);
        if (detectBrowser() != 'Firefox') {
            window.onblur = function () {
                window.onfocus = function () {
                    location.reload(true);
                };
            };
        }

        if (typeof localStorage !== 'undefined' && localStorage.getItem('permission') === 'ok') {
            getUserLocation();
        } else if (domElements.permission && domElements.permission.querySelector('button')) {
            domElements.permission.querySelector('button').onclick = () => getUserLocation();
        }
    } else if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', main); // Defer main until DOM is loaded
        return; // Prevent running main logic before DOM is ready
    } else {
        // Non-browser environment, skip DOM-dependent parts of main
        console.log("Non-browser environment: Skipping DOM-dependent main() logic.");
    }
}


function detectBrowser() {
    if (typeof navigator === 'undefined') return 'Unknown (no navigator)';
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Opera') != -1 || userAgent.indexOf('OPR') != -1) return 'Opera';
    if (userAgent.indexOf('Chrome') != -1) return 'Chrome';
    if (userAgent.indexOf('Safari') != -1) return 'Safari';
    if (userAgent.indexOf('Firefox') != -1) return 'Firefox';
    if (userAgent.indexOf('MSIE') != -1 || !!document.documentMode == true) return 'IE';
    return 'Unknown';
}

const weatherCodes = {
    0: 'ceo despexado', 1: 'ceo parcialmente nubrado', 2: 'ceo parcialmente nubrado',
    3: 'ceo parcialmente nubrado', 45: 'néboa', 48: 'orballo',
    51: 'choiva feble', 53: 'choiva feble', 55: 'choiva feble',
    56: 'choiva con neve', 57: 'choiva con neve', 61: 'choiva',
    63: 'choiva', 65: 'choiva', 66: 'choiva con neve',
    67: 'choiva con neve', 71: 'neve', 75: 'neve',
    73: 'neve', 77: 'saraiba', 80: 'choiva intermitente',
    81: 'choiva intermitente', 82: 'choiva intermitente',
    85: 'choiva intensa intermitente', 86: 'choiva intensa intermitente',
    95: 'treboada', 96: 'treboada', 99: 'treboada',
};

// Run main function, ensuring it's called after DOM is ready if in browser
if (typeof window !== 'undefined') { // Check if in browser-like environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main(); // DOM is already ready or it's a non-DOM part of main
    }
}


module.exports = {
    // Constants
    HOURSTOCHECK,
    PERCENTAGETORAIN,
    weatherCodes,
    // State (exported for testing)
    state,
    // Core logic functions
    processCurrentWeather,
    getCurrentWeather,
    isRaining,
    isGoingToRain,
    processData,
    processLocation, // If it needs to be tested directly
    getUserTime,     // Utility
    getVariationUTCToUserTime, // Utility
    // DOM related (also for testing)
    setDomElements,
    domElements, // Exporting for inspection, though setDomElements is preferred modifier
    hideAllPanels,
    showPanel,
    showError,
    showPositive,
    showPositiveRaining,
    showNegative,
    // Geolocation related (for testing)
    setGeolocationService,
    geoService, // Exporting for inspection
    getUserLocation, // If it needs to be tested directly
    // Main function
    main,
    // Others
    getData, // If needed for testing getData itself
    detectBrowser,
};
