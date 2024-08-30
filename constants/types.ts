// Interface for specific weather data based on location
export interface WeatherData {
    name: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: {
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
  }
  
  // Interface for all the forecast items necessary
  export interface ForecastItem {
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: {
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
  }
  
  export interface ForecastData {
    list: ForecastItem[];
  }