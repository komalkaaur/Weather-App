import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { WeatherData, ForecastData, ForecastItem } from '../constants/types'; 

// Use environment variables to protect API Keys (Sensitive Information)
const OPEN_WEATHER_MAP_API_KEY = process.env.EXPO_PUBLIC_OPEN_WEATHER_MAP_API_KEY;

export default function WeatherApp() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLocationWeather();
  }, []);

  const getLocationWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      await fetchWeatherByCoords(lat, lon);
      await fetchForecastByCoords(lat, lon);
    } catch (error) {
      console.error('Error getting location weather:', error);
      setError('Failed to get weather. Please try again.');
    }
    setLoading(false);
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      const response = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=metric`
      );
      setWeatherData(response.data);
      setCity(response.data.name);
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
      setError('Failed to fetch weather data.');
    }
  };

  const fetchForecastByCoords = async (lat: number, lon: number) => {
    try {
      const response = await axios.get<ForecastData>(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=metric`
      );
      setForecastData(response.data.list);
    } catch (error) {
      console.error('Error fetching forecast by coordinates:', error);
      setError('Failed to fetch forecast data.');
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : weatherData ? (
        <ScrollView>
          <View style={styles.weatherContainer}>
            <Text style={styles.cityName}>{city}</Text>
            <Image
              style={styles.weatherIcon}
              source={{ uri: getWeatherIcon(weatherData.weather[0].icon) }}
            />
            <Text style={styles.temperature}>{Math.round(weatherData.main.temp)}°C</Text>
            <Text style={styles.description}>{weatherData.weather[0].description}</Text>
          </View>
          {forecastData && (
            <View style={styles.forecastContainer}>
              <Text style={styles.forecastTitle}>5-Day Forecast</Text>
              {forecastData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.forecastItem}>
                  <Text style={styles.forecastDay}>
                    {new Date(item.dt * 1000).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}
                  </Text>
                  <Image
                    style={styles.forecastIcon}
                    source={{ uri: getWeatherIcon(item.weather[0].icon) }}
                  />
                  <Text style={styles.forecastTemp}>{Math.round(item.main.temp)}°C</Text>
                  <Text style={styles.forecastDescription}>{item.weather[0].description}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <Text style={styles.errorText}>No weather data available.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  weatherContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cityName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weatherIcon: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  temperature: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 24,
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  forecastContainer: {
    marginTop: 20,
  },
  forecastTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  forecastDay: {
    fontSize: 18,
  },
  forecastIcon: {
    width: 50,
    height: 50,
  },
  forecastTemp: {
    fontSize: 18,
  },
  forecastDescription: {
    fontSize: 18,
    textTransform: 'capitalize',
  },
});