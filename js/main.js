const permission = document.querySelector('.permission');
const positive = document.querySelector('.positive');
const negative = document.querySelector('.negative');
const error = document.querySelector('.error');
const image = document.querySelector('#image');

const HOURSTOCHECK = 12;
const PERCENTAGETORAIN = 0.35;

let prediction = {};
let nextRain = 0;
let stopRaining = 0;
let index;
let userHour;

function hideAllPanels() {
  permission.classList.add('hidden');
  positive.classList.add('hidden');
  negative.classList.add('hidden');
  error.classList.add('hidden');
}

function showPanel(panel) {
  panel.classList.remove('hidden');
}

async function getData(url) {
  const response = await fetch(url);
  if (!response.ok) throw 'Error conseguindo info do tempo';
  const data = await response.json();
  return data;
}

function showError(message) {
  hideAllPanels();
  error.querySelector('p').innerText = message;
  showPanel(error);
}

function showPositive(info) {
  hideAllPanels();
  showPanel(positive);
  image.src = info.currentWeather.icon;
  image.alt = info.currentWeather.alt;
  if (nextRain > 0) {
    positive.querySelector('p').innerHTML = `Agora mesmo hai ${
      info.currentTemp
    }°C na túa localización con ${info.textWeather} 
    e parece que pode chover dentro de ${info.nextRain} ${
      info.nextRain === 1 ? 'hora' : 'horas'
    }`;
  } else {
    positive.querySelector(
      'p'
    ).innerHTML = `Agora mesmo hai ${info.currentTemp}°C na túa localización con ${info.textWeather} 
    e parece que pode chover axiña`;
  }
}

function showPositiveRaining(info) {
  hideAllPanels();
  showPanel(positive);
  image.src = info.currentWeather.icon;
  image.alt = info.currentWeather.alt;
  if (stopRaining > 0) {
    positive.querySelector('p').innerHTML = `Agora mesmo hai ${
      info.currentTemp
    }°C na túa localización con ${info.textWeather} 
    e parece que pode chover ata dentro de ${info.stopRaining} ${
      info.stopRaining === 1 ? 'hora' : 'horas'
    } polo menos. 
    ${
      info.nextRain > 0
        ? '\nPode voltar a chover en ' + info.nextRain + ' horas'
        : ''
    }`;
  } else {
    positive.querySelector('p').innerHTML = `Agora mesmo hai ${
      info.currentTemp
    }°C na túa localización con ${info.textWeather} 
    e parece que vai parar de chover nuns intres
    ${
      info.nextRain > 0
        ? '\nPode voltar a chover en ' + info.nextRain + ' horas'
        : ''
    }`;
  }
}

function showNegative(info) {
  hideAllPanels();
  showPanel(negative);
  image.src = info.currentWeather.icon;
  image.alt = info.currentWeather.alt;
  negative.querySelector(
    'p'
  ).innerHTML = `Agora mesmo hai ${info.currentTemp}°C na túa localización con ${info.textWeather}  e non parece que vaia a chover nas próximas horas`;
}

function processCurrentWeather(weatherCode) {
  let icon;
  let alt;
  let weather;
  console.log(`Processing code ${weatherCode}`);
  if (weatherCode == 0) {
    icon = '../img/sun.svg';
    alt = 'icono sol';
    weather = 'sun';
  } else if (weatherCode == 1 || weatherCode == 2 || weatherCode == 3) {
    icon = '../img/suncloud.svg';
    alt = 'icono sol e nube';
    weather = 'sunandclouds';
  } else if (
    weatherCode == 51 ||
    weatherCode == 53 ||
    weatherCode == 55 ||
    weatherCode == 56 ||
    weatherCode == 57 ||
    weatherCode == 61 ||
    weatherCode == 63 ||
    weatherCode == 65 ||
    weatherCode == 66 ||
    weatherCode == 67 ||
    weatherCode == 80 ||
    weatherCode == 81 ||
    weatherCode == 82 ||
    weatherCode == 85 ||
    weatherCode == 86
  ) {
    icon = '../img/rain.svg';
    alt = 'icono choiva';
    weather = 'rain';
  } else if (weatherCode == 45 || weatherCode == 48) {
    icon = '../img/fog.svg';
    alt = 'icono neboa';
    weather = 'fog';
  } else if (
    weatherCode == 71 ||
    weatherCode == 75 ||
    weatherCode == 73 ||
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
  return {
    icon: icon,
    alt: alt,
    weather: weather,
  };
}

function getCurrentWeather() {
  return prediction.current_weather.weathercode;
}

function processData() {
  let currentWeather = processCurrentWeather(getCurrentWeather());
  console.log(
    `O tempo actual é ${
      weatherCodes[parseInt(prediction.current_weather.weathercode)]
    }`
  );
  if (
    currentWeather.weather == 'rain' ||
    currentWeather.weather == 'storm' ||
    currentWeather.weather == 'snow'
  ) {
    isRaining();
    if (isGoingToRain() == true && stopRaining < 4) {
      console.log(`Está chovendo e volverá a chover en ${nextRain} horas`);
    }
    showPositiveRaining({
      location: 'Test',
      currentTemp: prediction.hourly.temperature_2m[index],
      currentWeather: currentWeather,
      stopRaining: stopRaining, // == 0 ? stopRaining + 1 : stopRaining,
      textWeather:
        weatherCodes[parseInt(prediction.current_weather.weathercode)],
      nextRain: nextRain,
    });
  } else if (
    currentWeather.weather == 'sun' ||
    currentWeather.weather == 'sunandclouds' ||
    currentWeather.weather == 'fog'
  ) {
    if (isGoingToRain() == true) {
      showPositive({
        location: 'Test',
        currentTemp: prediction.hourly.temperature_2m[index],
        currentWeather: currentWeather,
        nextRain: nextRain, //== 0 ? nextRain + 1 : nextRain,
        textWeather:
          weatherCodes[parseInt(prediction.current_weather.weathercode)],
      });
    } else {
      showNegative({
        location: 'Test',
        currentTemp: prediction.hourly.temperature_2m[index],
        currentWeather: currentWeather,
        textWeather:
          weatherCodes[parseInt(prediction.current_weather.weathercode)],
      });
    }
  }
}

function isRaining() {
  console.log('Comprobando se está chovendo');
  let maxTimeToCheckRain = index + HOURSTOCHECK;
  for (let i = index; i < maxTimeToCheckRain; i++) {
    if (prediction.hourly.precipitation[i] > PERCENTAGETORAIN) {
      console.log(
        `O índice ás ${i < 24 ? i : i - 24} horas é de ${
          prediction.hourly.precipitation[i]
        }`
      );
      stopRaining++;
    }
  }

  if (stopRaining > 0) {
    console.log(
      `Seica si, agora o indice de choiva da próxima hora é de ${
        prediction.hourly.precipitation[index + 1]
      }`
    );
    return true;
  }

  console.log(`Seica non`);
  stopRaining = 0;
  return false;
}

function isGoingToRain() {
  console.log('Comprobando se vai chover');
  let maxTimeToCheckRain = index + HOURSTOCHECK;
  for (let i = index; i < maxTimeToCheckRain; i++) {
    console.log(
      `O índice ás ${i < 24 ? i : i - 24} horas é de ${
        prediction.hourly.precipitation[i]
      }`
    );
    console.log(`${prediction.hourly.time[i]}`);
    if (prediction.hourly.precipitation[i] > PERCENTAGETORAIN) {
      console.log(
        `Seica si, ás ${i < 24 ? i : i - 24} horas o indice de choiva é de ${
          prediction.hourly.precipitation[i]
        }`
      );
      return true;
    }
    nextRain++;
  }
  nextRain = 0;
  console.log(`Seica non`);
  return false;
}

async function processLocation(location) {
  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;

  try {
    prediction = await getData(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,weathercode&current_weather=true`
    );

    // const date = new Date();
    // const dformat = `${date.getFullYear()}-${(
    //   date.getMonth() + 1
    // ).padLeft()}-${date.getDate().padLeft()}T${date.getHours().padLeft()}:00`;
    // index = prediction.hourly.time.indexOf(dformat);
    const currentDate = prediction.current_weather.time;
    index = prediction.hourly.time.indexOf(currentDate);
    userHour = getUserTime();

    processData();
  } catch (error) {
    console.log(error);
    showError('Erro conseguindo información meteorolóxica');
  }
}

Number.prototype.padLeft = function (base, chr) {
  var len = String(base || 10).length - String(this).length + 1;
  return len > 0 ? new Array(len).join(chr || '0') + this : this;
};

function getUserLocation() {
  hideAllPanels();

  navigator.geolocation.getCurrentPosition(
    (locationInfo) => {
      localStorage.setItem('permission', 'ok');
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

function main() {
  showPanel(permission);
  if (detectBrowser() != 'Firefox') {
    window.onblur = function () {
      window.onfocus = function () {
        location.reload(true);
      };
    };
  }

  if (localStorage.getItem('permission') === 'ok') {
    getUserLocation();
  } else {
    permission.querySelector('button').onclick = () => getUserLocation();
  }
}

function detectBrowser() {
  if (
    (navigator.userAgent.indexOf('Opera') ||
      navigator.userAgent.indexOf('OPR')) != -1
  ) {
    return 'Opera';
  } else if (navigator.userAgent.indexOf('Chrome') != -1) {
    return 'Chrome';
  } else if (navigator.userAgent.indexOf('Safari') != -1) {
    return 'Safari';
  } else if (navigator.userAgent.indexOf('Firefox') != -1) {
    return 'Firefox';
  } else if (
    navigator.userAgent.indexOf('MSIE') != -1 ||
    !!document.documentMode == true
  ) {
    return 'IE'; //crap
  } else {
    return 'Unknown';
  }
}

const weatherCodes = {
  0: 'ceo despexado',
  1: 'ceo parcialmente nubrado',
  2: 'ceo parcialmente nubrado',
  3: 'ceo parcialmente nubrado',
  45: 'néboa',
  48: 'orballo',
  51: 'choiva feble',
  53: 'choiva feble',
  55: 'choiva feble',
  56: 'choiva con neve',
  57: 'choiva con neve',
  61: 'choiva',
  63: 'choiva',
  65: 'choiva',
  66: 'choiva con neve',
  67: 'choiva con neve',
  71: 'neve',
  75: 'neve',
  73: 'neve',
  77: 'saraiba',
  80: 'choiva intermitente',
  81: 'choiva intermitente',
  82: 'choiva intermitente',
  85: 'choiva intensa intermitente',
  86: 'choiva intensa intermitente',
  95: 'treboada',
  96: 'treboada',
  99: 'treboada',
};

main();

module.exports = { weatherCodes, processData, isGoingToRain, isRaining };
