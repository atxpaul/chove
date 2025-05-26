/** @jest-environment jsdom */

// Import functions and state from the refactored main.js
const main = require('./main');
const {
  processCurrentWeather,
  // For direct tests of isRaining/isGoingToRain, we'll use the actual functions
  // but manipulate the shared `state` object.
  isRaining: actualIsRaining,
  isGoingToRain: actualIsGoingToRain,
  // Constants
  HOURSTOCHECK,
  PERCENTAGETORAIN,
  // State and setters
  state,
  setDomElements,
  setGeolocationService, // Though not used in current tests, good to have for future
  weatherCodes, // Actual weatherCodes object
  // processData will be tested with some of its dependencies mocked
  processData,
} = main;


// Mock DOM elements structure
const createMockElement = () => ({
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
  // For elements that have innerText or innerHTML manipulated
  innerText: '',
  innerHTML: '',
  // For elements that have a button child (like 'permission')
  querySelector: jest.fn().mockImplementation(selector => {
    if (selector === 'p') {
      // Return an object that can have innerText/innerHTML set
      return { innerText: '', innerHTML: '' };
    }
    if (selector === 'button') {
      return { onclick: jest.fn() };
    }
    return null;
  }),
  // For image element
  src: '',
  alt: '',
});

describe('processCurrentWeather', () => {
  // These tests are simple pure functions, no state/DOM interaction
  test('should return correct data for weather code 0 (sun)', () => {
    const result = processCurrentWeather(0);
    expect(result).toEqual({ icon: '../img/sun.svg', alt: 'icono sol', weather: 'sun' });
  });
  // ... (other processCurrentWeather tests remain the same)
  test('should return correct data for weather code 1 (sun and clouds)', () => {
    const result = processCurrentWeather(1);
    expect(result).toEqual({ icon: '../img/suncloud.svg', alt: 'icono sol e nube', weather: 'sunandclouds'});
  });
  test('should return correct data for weather code 2 (sun and clouds)', () => {
    const result = processCurrentWeather(2);
    expect(result).toEqual({ icon: '../img/suncloud.svg', alt: 'icono sol e nube', weather: 'sunandclouds'});
  });
  test('should return correct data for weather code 3 (sun and clouds)', () => {
    const result = processCurrentWeather(3);
    expect(result).toEqual({ icon: '../img/suncloud.svg', alt: 'icono sol e nube', weather: 'sunandclouds'});
  });
  test('should return correct data for weather code 45 (fog)', () => {
    const result = processCurrentWeather(45);
    expect(result).toEqual({ icon: '../img/fog.svg', alt: 'icono neboa', weather: 'fog'});
  });
  test('should return correct data for weather code 48 (fog)', () => {
    const result = processCurrentWeather(48);
    expect(result).toEqual({ icon: '../img/fog.svg', alt: 'icono neboa', weather: 'fog'});
  });
  test('should return correct data for weather code 51 (rain)', () => {
    const result = processCurrentWeather(51);
    expect(result).toEqual({ icon: '../img/rain.svg', alt: 'icono choiva', weather: 'rain'});
  });
  test('should return correct data for weather code 61 (rain)', () => {
    const result = processCurrentWeather(61);
    expect(result).toEqual({ icon: '../img/rain.svg', alt: 'icono choiva', weather: 'rain'});
  });
  test('should return correct data for weather code 80 (rain)', () => {
    const result = processCurrentWeather(80);
    expect(result).toEqual({ icon: '../img/rain.svg', alt: 'icono choiva', weather: 'rain'});
  });
  test('should return correct data for weather code 71 (snow)', () => {
    const result = processCurrentWeather(71);
    expect(result).toEqual({ icon: '../img/snow.svg', alt: 'icono neve ou saraiba', weather: 'snow'});
  });
  test('should return correct data for weather code 95 (storm)', () => {
    const result = processCurrentWeather(95);
    expect(result).toEqual({ icon: '../img/storm.svg', alt: 'icono treboada', weather: 'storm'});
  });
  test('should return undefined for unknown weather code', () => {
    const result = processCurrentWeather(1000); // An unknown code
    expect(result).toEqual({ icon: undefined, alt: undefined, weather: undefined });
  });
});

describe('isRaining (with shared state)', () => {
  beforeEach(() => {
    // Set state directly
    state.prediction = {
      hourly: {
        precipitation: new Array(HOURSTOCHECK * 2).fill(0),
      },
    };
    state.index = 0;
    state.stopRaining = 0; // Function resets this internally first
    state.variationTime = 0;
  });

  test('should return true and update state.stopRaining if precipitation is above threshold', () => {
    state.prediction.hourly.precipitation[state.index] = PERCENTAGETORAIN + 0.1;
    state.prediction.hourly.precipitation[state.index + 1] = PERCENTAGETORAIN + 0.1;
    const result = actualIsRaining();
    expect(result).toBe(true);
    expect(state.stopRaining).toBe(2); // Two hours of rain
  });

  test('should return false and reset state.stopRaining if no precipitation is above threshold', () => {
    state.prediction.hourly.precipitation.fill(PERCENTAGETORAIN - 0.1);
    state.stopRaining = 5; // Simulate it had a value, though function resets it
    const result = actualIsRaining();
    expect(result).toBe(false);
    expect(state.stopRaining).toBe(0);
  });
});

describe('isGoingToRain (with shared state)', () => {
  beforeEach(() => {
    state.prediction = {
      hourly: {
        precipitation: new Array(HOURSTOCHECK * 2).fill(0),
      },
    };
    state.index = 0;
    state.nextRain = 0; // Function resets this internally first
    state.variationTime = 0;
  });

  test('should return true and update state.nextRain if precipitation is expected', () => {
    state.prediction.hourly.precipitation[state.index + 2] = PERCENTAGETORAIN + 0.1; // Rain in 2 hours
    const result = actualIsGoingToRain();
    expect(result).toBe(true);
    expect(state.nextRain).toBe(2); // 0, 1 (then rain at 2)
  });

  test('should return false and reset state.nextRain if no precipitation is expected', () => {
    state.prediction.hourly.precipitation.fill(PERCENTAGETORAIN - 0.1);
    // isGoingToRain resets nextRain to 0 if no rain is found after the loop
    const result = actualIsGoingToRain();
    expect(result).toBe(false);
    expect(state.nextRain).toBe(0);
  });

  test('should return true and set state.nextRain to 0 if rain is at current index', () => {
    state.prediction.hourly.precipitation[state.index] = PERCENTAGETORAIN + 0.1;
    const result = actualIsGoingToRain();
    expect(result).toBe(true);
    expect(state.nextRain).toBe(0);
  });
});

// --- Tests for processData ---
// We need to mock parts of the main module that processData calls,
// especially DOM manipulation and other side-effect functions.
// The actual processData function from main will be used.
jest.mock('./main', () => {
  const actual = jest.requireActual('./main');
  return {
    ...actual, // Use actual for state, constants, and processData itself
    // Mock functions that have side effects or are dependencies of processData
    processCurrentWeather: jest.fn(), // Already tested separately
    getCurrentWeather: jest.fn(),   // Returns a value based on state.prediction
    isRaining: jest.fn(),           // Modifies state.stopRaining, returns bool
    isGoingToRain: jest.fn(),       // Modifies state.nextRain, returns bool
    // DOM display functions
    showPositiveRaining: jest.fn(),
    showPositive: jest.fn(),
    showNegative: jest.fn(),
    hideAllPanels: jest.fn(), // Though not directly called by processData, show functions call it
    showPanel: jest.fn(),     // Same as above
  };
});


describe('processData (with mocks and shared state)', () => {
  const mockCurrentWeatherSun = { icon: 'sun.svg', alt: 'sun', weather: 'sun' };
  const mockCurrentWeatherRain = { icon: 'rain.svg', alt: 'rain', weather: 'rain' };
  const mockTemp = 20;
  const mockWeatherCodeSun = 0;
  const mockWeatherCodeRain = 61;

  let mockDom;

  beforeEach(() => {
    // Reset and configure mocks
    main.processCurrentWeather.mockClear();
    main.getCurrentWeather.mockClear();
    main.isRaining.mockClear();
    main.isGoingToRain.mockClear();
    main.showPositiveRaining.mockClear();
    main.showPositive.mockClear();
    main.showNegative.mockClear();

    // Setup mock DOM elements
    mockDom = {
        permission: createMockElement(),
        positive: createMockElement(),
        negative: createMockElement(),
        error: createMockElement(),
        image: createMockElement(),
    };
    setDomElements(mockDom); // Use the new setter

    // Setup shared state for each test
    state.prediction = {
      current_weather: { weathercode: mockWeatherCodeSun }, // Default to sun
      hourly: {
        temperature_2m: new Array(24).fill(mockTemp),
        precipitation: new Array(24).fill(0), // For isRaining/isGoingToRain if their actual impl were used
      },
    };
    state.index = 0;
    state.stopRaining = 0; // Reset, will be set by mock isRaining
    state.nextRain = 0;    // Reset, will be set by mock isGoingToRain
  });

  test('Scenario 1: Raining, will rain again soon -> showPositiveRaining', () => {
    // Configure state and mock return values for this scenario
    state.prediction.current_weather.weathercode = mockWeatherCodeRain;
    main.getCurrentWeather.mockReturnValue(mockWeatherCodeRain); // Consistent with state
    main.processCurrentWeather.mockReturnValue(mockCurrentWeatherRain);

    main.isRaining.mockImplementation(() => {
      state.stopRaining = 2; // It is raining and will continue for 2 hours
      return true;
    });
    main.isGoingToRain.mockImplementation(() => {
      state.nextRain = 3;    // It will rain again in 3 hours
      return true;
    });
    // main.stopRaining is set by the mock isRaining for the condition `stopRaining < 4`

    processData(); // Call the actual processData

    expect(main.showPositiveRaining).toHaveBeenCalledTimes(1);
    expect(main.showPositiveRaining).toHaveBeenCalledWith(expect.objectContaining({
      currentTemp: mockTemp,
      currentWeather: mockCurrentWeatherRain,
      stopRaining: 2,
      textWeather: weatherCodes[mockWeatherCodeRain],
      nextRain: 3,
    }));
    expect(main.showPositive).not.toHaveBeenCalled();
    expect(main.showNegative).not.toHaveBeenCalled();
  });

  test('Scenario 2: Raining, will stop soon, no more rain -> showPositiveRaining', () => {
    state.prediction.current_weather.weathercode = mockWeatherCodeRain;
    main.getCurrentWeather.mockReturnValue(mockWeatherCodeRain);
    main.processCurrentWeather.mockReturnValue(mockCurrentWeatherRain);

    main.isRaining.mockImplementation(() => {
      state.stopRaining = 1; // Raining, stops in 1 hour
      return true;
    });
    main.isGoingToRain.mockImplementation(() => {
      state.nextRain = 0;    // No more rain expected
      return false;
    });

    processData();

    expect(main.showPositiveRaining).toHaveBeenCalledTimes(1);
    expect(main.showPositiveRaining).toHaveBeenCalledWith(expect.objectContaining({
      currentTemp: mockTemp,
      currentWeather: mockCurrentWeatherRain,
      stopRaining: 1,
      textWeather: weatherCodes[mockWeatherCodeRain],
      nextRain: 0,
    }));
  });

  test('Scenario 3: Not raining, will rain soon -> showPositive', () => {
    state.prediction.current_weather.weathercode = mockWeatherCodeSun;
    main.getCurrentWeather.mockReturnValue(mockWeatherCodeSun);
    main.processCurrentWeather.mockReturnValue(mockCurrentWeatherSun);
    // isRaining is only called if current weather is rain/storm/snow, so no need to mock it here.
    main.isGoingToRain.mockImplementation(() => {
      state.nextRain = 2; // Will rain in 2 hours
      return true;
    });

    processData();

    expect(main.showPositive).toHaveBeenCalledTimes(1);
    expect(main.showPositive).toHaveBeenCalledWith(expect.objectContaining({
      currentTemp: mockTemp,
      currentWeather: mockCurrentWeatherSun,
      nextRain: 2,
      textWeather: weatherCodes[mockWeatherCodeSun],
    }));
  });

  test('Scenario 4: Not raining, no rain expected -> showNegative', () => {
    state.prediction.current_weather.weathercode = mockWeatherCodeSun;
    main.getCurrentWeather.mockReturnValue(mockWeatherCodeSun);
    main.processCurrentWeather.mockReturnValue(mockCurrentWeatherSun);

    main.isGoingToRain.mockImplementation(() => {
      state.nextRain = 0; // No rain expected
      return false;
    });

    processData();

    expect(main.showNegative).toHaveBeenCalledTimes(1);
    expect(main.showNegative).toHaveBeenCalledWith(expect.objectContaining({
      currentTemp: mockTemp,
      currentWeather: mockCurrentWeatherSun,
      textWeather: weatherCodes[mockWeatherCodeSun],
    }));
  });
});
