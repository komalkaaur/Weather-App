import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import axios from 'axios';
import { WeatherData } from '../constants/types'; 

// Use environment variables to protect API Keys (Sensitive Information)
const OPEN_WEATHER_MAP_API_KEY = process.env.EXPO_PUBLIC_OPEN_WEATHER_MAP_API_KEY;

export default function WeatherApp() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches Weather data based on user's location when opening the app
  useEffect(() => {
    getLocationWeather();
  }, []);

  // This function fetches weather data based on the user's current location
  const getLocationWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      // Request location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      // Get current location: This uses the device's GPS or network location
      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      // Fetch weather data based on latitude and longitude
      await fetchWeatherByCoords(lat, lon);
    } catch (error) {
      console.error('Error getting location weather:', error);
      setError('Failed to get weather. Please try again.');
    }
    setLoading(false);
  };

  // Fetches Weather data by coordinates
  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      const response = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=metric`
      );
      setWeatherData(response.data);
      setCity(response.data.name);
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
    }
  };

  return null; 
}