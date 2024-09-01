import React, { useState, useEffect } from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Image,ActivityIndicator,Platform,StatusBar,Dimensions,ScrollView,Alert,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {useSharedValue,useAnimatedStyle,withSpring,} from 'react-native-reanimated';
import HourlyForecastChart from '../components/HourlyForecastChart';
import { WeatherData, ForecastItem, ForecastData } from '../constants/types';

// Use environment variables to protect API Keys (Sensitive Information)
const OPEN_WEATHER_MAP_API_KEY = process.env.EXPO_PUBLIC_OPEN_WEATHER_MAP_API_KEY;
const { width } = Dimensions.get('window');

// Use State Management variables to update only specific UI based on information
export default function WeatherApp() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastItem[] | null>(null);
  const [hourlyForecastData, setHourlyForecastData] = useState<ForecastItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<ForecastItem | null>(null);
  const [selectedHourData, setSelectedHourData] = useState<ForecastItem | null>(null);
  const [dailyForecastData, setDailyForecastData] = useState<{ [key: string]: ForecastItem[] }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

// Create smooth UI transitions
  const weatherIconScale = useSharedValue(0);
  const temperatureOpacity = useSharedValue(0);
  const weatherInfoOpacity = useSharedValue(0);

// Fetches Weather data based on user's location when opening the app
  useEffect(() => {
    getLocationWeather();
  }, []);

// Animate weather information as data becomes available
  useEffect(() => {
    if (weatherData || selectedForecast) {
      weatherIconScale.value = withSpring(1);
      temperatureOpacity.value = withSpring(1);
      weatherInfoOpacity.value = withSpring(1);
    }
  }, [weatherData, selectedForecast]);

// Project Requirement displaying PM Accelerator details
  const showInfoPopup = () => {
    Alert.alert(
      "About PM Accelerator",
      "PM Accelerator is the premier AI learning and development hub, featuring award-winning AI products and mentors from top-tier companies such as Google, Meta, and Apple. We offer a dynamic AI PM Bootcamp, designed to empower the next generation of AI professionals through hands-on experience, mentorship, and real-world projects.",
      [
        { text: "OK", onPress: () => console.log("OK Pressed") }
      ]
    );
  };

// This function fetches weather data based on the user's current location
// It's an async function to handle the asynchronous nature of location and API requests
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

      // Fetch weather and forecast data based on latitude and longitude, as the API uses
      await fetchWeatherByCoords(lat, lon);
      await fetchForecastByCoords(lat, lon);
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

  // Fetches forecast but also breaks it down into daily and hourly forecasts for chart display
  const fetchForecastByCoords = async (lat: number, lon: number) => {
    try {
      const response = await axios.get<ForecastData>(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=metric`
      );
      const dailyData = groupForecastByDay(response.data.list);
      setDailyForecastData(dailyData);
      setForecastData(Object.values(dailyData).map(day => day[0])); // Use first item of each day for 5-day forecast
      setSelectedDate(Object.keys(dailyData)[0]); // Select first day by default
      setHourlyForecastData(dailyData[Object.keys(dailyData)[0]]); // Set hourly data for the first day
    } catch (error) {
      console.error('Error fetching forecast by coordinates:', error);
    }
  };

  // This helper function allows to group forecasts by day
  const groupForecastByDay = (forecastList: ForecastItem[]): { [key: string]: ForecastItem[] } => {
    return forecastList.reduce((acc, item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as { [key: string]: ForecastItem[] });
  };

  // When user types in a city name, this uses the API to fetch information about it
  const fetchWeather = async () => {
    setLoading(true);
    try {
      const response = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=metric`
      );
      setWeatherData(response.data);
      await fetchForecast();
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
    setLoading(false);
  };

  // When user types in a city name, this uses the API to fetch information about it
  const fetchForecast = async () => {
    try {
      const response = await axios.get<ForecastData>(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPEN_WEATHER_MAP_API_KEY}&units=metric`
      );
      setForecastData(filterForecastData(response.data.list));
      setHourlyForecastData(response.data.list.slice(0, 8)); // Get first 24 hours (3-hour intervals)
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }
  };

  // This updates the UI visible due to the day user clicks on in the 5-day forecast
  const handleDaySelection = (item: ForecastItem) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();
    setSelectedDate(date);
    setSelectedForecast(item);
    setHourlyForecastData(dailyForecastData[date]);
  };

  // Ensure only one forecast item is displayed
  const filterForecastData = (data: ForecastItem[]): ForecastItem[] => {
    const uniqueDaysMap: { [date: string]: ForecastItem } = {};
    data.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!uniqueDaysMap[date]) {
        uniqueDaysMap[date] = item;
      }
    });
    return Object.values(uniqueDaysMap);
  };

  // Function which displays the 5-day forecast
  const renderForecastItem = (item: ForecastItem, index: number) => (
    <TouchableOpacity
      key={item.dt}
      style={[styles.forecastItem, selectedForecast?.dt === item.dt && styles.selectedForecastItem]}
      onPress={() => handleDaySelection(item)}
    >
      <Text style={styles.forecastDay}>{index === 0 ? 'Today' : new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
      <Image
        style={styles.forecastIcon}
        source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png` }}
      />
      <Text style={styles.forecastTemp}>{Math.round(item.main.temp)}°C</Text>
    </TouchableOpacity>
  );

  // Helper function to obtain icons through url
  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: weatherIconScale.value }],
    };
  });

  const animatedTemperatureStyle = useAnimatedStyle(() => {
    return {
      opacity: temperatureOpacity.value,
    };
  });

  const animatedWeatherInfoStyle = useAnimatedStyle(() => {
    return {
      opacity: weatherInfoOpacity.value,
      transform: [{ translateY: withSpring(weatherInfoOpacity.value * 20) }],
    };
  });

  // This updates the selected hour data when a user interacts with the hourly chart
  const handleHourlyDataPointClick = (index: number) => {
    setSelectedHourData(hourlyForecastData ? hourlyForecastData[index] : null);
  };

  // This is a reusable component for displaying weather details as they all follow the same format
  const renderWeatherInfo = (data: WeatherData | ForecastItem) => (
    <Animated.View style={[styles.weatherContainer, animatedWeatherInfoStyle]}>
      <Text style={styles.cityName}>{weatherData?.name}</Text>
      <Animated.Image
        style={[styles.weatherIcon, animatedIconStyle]}
        source={{ uri: getWeatherIcon(data.weather[0].icon) }}
      />
      <Animated.Text style={[styles.temperature, animatedTemperatureStyle]}>
        {Math.round(data.main.temp)}°C
      </Animated.Text>
      <Text style={styles.description}>{data.weather[0].description}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="thermometer" size={24} color="#FFD700" />
          <Text style={styles.detailText}>{Math.round(data.main.feels_like)}°C</Text>
          <Text style={styles.detailLabel}>Feels like</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="weather-windy" size={24} color="#87CEEB" />
          <Text style={styles.detailText}>{data.wind.speed} m/s</Text>
          <Text style={styles.detailLabel}>Wind speed</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="water-percent" size={24} color="#4169E1" />
          <Text style={styles.detailText}>{data.main.humidity}%</Text>
          <Text style={styles.detailLabel}>Humidity</Text>
        </View>
      </View>
    </Animated.View>
  );

  // This uses a combination of conditional rendering and reusable components to create the UI
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {/* LinearGradient provides a visually appealing background that transitions between colors */}
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.background}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.topSpacing} />
            {/* Allows users to input a city name for weather lookup */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter city"
                placeholderTextColor="#ccc"
                value={city}
                onChangeText={setCity}
              />
              <TouchableOpacity style={styles.searchButton} onPress={fetchWeather}>
                <MaterialCommunityIcons name="magnify" size={24} color="white" />
              </TouchableOpacity>
            </View>
            {/* Conditional rendering based on the loading state and data availability */}
            {loading ? (
              // Show a loading indicator while fetching data
              <ActivityIndicator size="large" color="#fff" style={styles.loader} />
            ) : weatherData ? (
              // If weather data is available, render the weather information
              // Uses selectedForecast if available (user has selected a day), otherwise uses current weatherData
              renderWeatherInfo(selectedForecast || weatherData)
            ) : null}

        {hourlyForecastData && (
        // Only render the HourlyForecastChart if hourlyForecastData is available
        // This prevents errors and improves performance by not rendering an empty chart
        <HourlyForecastChart 
          hourlyData={hourlyForecastData} 
          onDataPointClick={handleHourlyDataPointClick}
          selectedHour={selectedHourData?.dt}
          selectedDate={selectedDate}
        />
      )}

            {forecastData && (
              // Only render the forecast section if forecastData is available
              <View style={styles.forecastContainer}>
                <Text style={styles.forecastTitle}>5-Day Forecast</Text>
                <View style={styles.forecastList}>
                {/* Map only the first 5 items of forecastData to display a 5-day forecast */}
                  {forecastData.slice(0, 5).map((item, index) => renderForecastItem(item, index))}
                </View>
              </View>
            )}
            {/* Footer container: Includes name and PM Accelerator Info */}
            <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Made by Komal Kaur</Text>
            <TouchableOpacity onPress={showInfoPopup} style={styles.infoButton}>
              <MaterialCommunityIcons name="information-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start', 
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topSpacing: {
    height: 40, 
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginTop: 30,
    color: 'white',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    color: 'white',
    fontSize: 14,
  },
  infoButton: {
    marginLeft: 5,
    padding: 5,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: 30,
  },
  weatherContainer: {
    alignItems: 'center',
    marginBottom: 10, 
    paddingHorizontal: 20,
    marginTop: -20,
  },
  cityName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  weatherIcon: {
    width: 120,
    height: 120,
    marginBottom: 0, 
  },
  temperature: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10, 
  },
  description: {
    fontSize: 24,
    color: 'white',
    marginBottom: 0, 
    textTransform: 'capitalize',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10, 
  },
  detailItem: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  forecastContainer: {
    marginTop: 10, 
    paddingHorizontal: 20,
  },
  forecastTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15, 
  },
  forecastList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastItem: {
    alignItems: 'center',
    width: width / 5 - 10,
    padding: 5,
    borderRadius: 10,
  },
  selectedForecastItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  forecastDay: {
    fontSize: 14,
    color: 'white',
    marginBottom: 5, 
  },
  forecastIcon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  forecastTemp: {
    fontSize: 16,
    color: 'white',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});