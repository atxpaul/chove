const permission = document.querySelector('.permission');
const positive = document.querySelector('.positive');
const negative = document.querySelector('.negative');
const error = document.querySelector('.error');

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
  positive.querySelector('p').innerHTML = `Agora mesmo hai ${
    info.currentTemp
  }°C na túa localización con ${
    info.currentWeather
  } e parece que choverá <strong>dentro de ${info.nextRain} ${
    info.nextRain === 1 ? 'hora' : 'horas'
  }</strong>`;
}

function showNegative(info) {
  hideAllPanels();
  showPanel(negative);
  negative.querySelector(
    'p'
  ).innerHTML = `Agora mesmo hai ${info.currentTemp}°C na túa localización con ${info.currentWeather} e non parece que vaia a chover nas próximas horas`;
}

async function processLocation(location) {
  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;
  if (location.coords.altitude == null) {
    const altitude = 0;
  } else {
    const altitude = location.coords.altitude;
  }

  try {
    let nextRain = 0;
    const prediction = await getData(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,weathercode&current_weather=true`
    );

    const date = new Date();
    const dformat = `${date.getFullYear()}-${(
      date.getMonth() + 1
    ).padLeft()}-${date.getDate().padLeft()}T${date.getHours().padLeft()}:00`;
    const index = prediction.hourly.time.indexOf(dformat);

    function isGoingToRain() {
      let maxTimeToCheckRain = index + 8;
      for (let i = index; i < maxTimeToCheckRain; i++) {
        nextRain++;
        if (prediction.hourly.precipitation[i] > 0) {
          return true;
        }
      }
      return false;
    }
    if (isGoingToRain() == true) {
      console.log(prediction.current_weather.weathercode);
      showPositive({
        location: 'Test',
        currentTemp: prediction.hourly.temperature_2m[index],
        currentWeather:
          weatherCodes[parseInt(prediction.current_weather.weathercode)],
        nextRain: nextRain + 1,
      });
    } else {
      showNegative({
        location: 'Test',
        currentTemp: prediction.hourly.temperature_2m[index],
        currentWeather:
          weatherCodes[parseInt(prediction.current_weather.weathercode)],
      });
    }
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

function main() {
  showPanel(permission);
  window.onblur = function () {
    window.onfocus = function () {
      location.reload(true);
    };
  };

  if (localStorage.getItem('permission') === 'ok') {
    getUserLocation();
  } else {
    permission.querySelector('button').onclick = () => getUserLocation();
  }
}

const weatherCodes = {
  0: 'ceo despexado',
  1: 'ceo parcialmente nubrado',
  2: 'ceo parcialmente nubrado',
  3: 'ceo parcialmente nubrado',
  45: 'néboa',
  48: 'néboa',
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
