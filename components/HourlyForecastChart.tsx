import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ForecastItem } from '../constants/types';

// Get the width of the device screen for proper proportions
const { width } = Dimensions.get('window');

// Define the props interface for the component
interface HourlyForecastChartProps {
  hourlyData: ForecastItem[];
  onDataPointClick: (index: number) => void;
  selectedHour?: number;
  selectedDate: string | null;
}

const HourlyForecastChart: React.FC<HourlyForecastChartProps> = ({ 
  hourlyData, 
  onDataPointClick, 
  selectedHour,
  selectedDate
}) => {
  // Extract hours and temperatures from hourlyData
  const labels = hourlyData.map(item => new Date(item.dt * 1000).getHours());
  const temperatures = hourlyData.map(item => Math.round(item.main.temp));
  // Find the index of the selected hour in the hourlyData array
  const selectedIndex = hourlyData.findIndex(item => item.dt === selectedHour);

  return (
    <View style={styles.chartContainer}>
    {/* Display the chart title with the selected date or 'Today' */}
      <Text style={styles.chartTitle}>
        24-Hour Forecast for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
      </Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data: temperatures }],
        }}
        width={width - 40} // Chart width (screen width minus margins)
        height={180}
        yAxisSuffix="°C"
        chartConfig={{
          // Chart appearance configuration
          backgroundColor: 'transparent',
          backgroundGradientFrom: 'transparent',
          backgroundGradientTo: 'transparent',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#ffa726',
          },
          propsForBackgroundLines: {
            strokeDasharray: '', // Solid line
            stroke: 'rgba(255, 255, 255, 0.2)',
          },
          propsForLabels: {
            fontWeight: 'bold',
          },
        }}
        bezier // Use bezier curve for smoother lines
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        withInnerLines={true}
        withOuterLines={true}
        withHorizontalLabels={true}
        withVerticalLabels={true}
        withDots={true}
        onDataPointClick={({ index }) => onDataPointClick(index)}
        decorator={() => {
          return selectedIndex !== -1 ? (
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 10,
                position: 'absolute',
                top: 10,
                left: selectedIndex * ((width - 40) / labels.length),
                width: 4,
                height: 4,
              }}
            />
          ) : null;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
});

export default HourlyForecastChart;