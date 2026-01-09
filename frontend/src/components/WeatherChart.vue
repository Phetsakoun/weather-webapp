<template>
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <div class="flex gap-2">
        <v-btn 
          color="primary" 
          size="small" 
          @click="refreshChart" 
          prepend-icon="mdi-refresh"
        >
          Refresh
        </v-btn>
        <v-btn 
          color="secondary" 
          size="small" 
          @click="exportChart" 
          prepend-icon="mdi-download"
        >
          Export
        </v-btn>
        <v-btn 
          color="info" 
          size="small" 
          @click="analyzeTrend" 
          prepend-icon="mdi-trending-up"
        >
          Trend Analysis
        </v-btn>
      </div>
    </div>
    
    <div :style="`height: ${height}px`" class="transition-all duration-300">
      <line-chart 
        v-if="chartType === 'line'"
        ref="chartRef"
        :data="chartData" 
        :options="chartOptions"
        :animation-duration="1500"
        :animation-easing="'easeInOutQuart'"
        @chart-rendered="onChartRendered"
        @chart-updated="onChartUpdated"
        @chart-click="onChartClick"
      />
      <bar-chart 
        v-else-if="chartType === 'bar'"
        :data="chartData" 
        :options="chartOptions" 
      />
    </div>
    
    <!-- Trend Analysis Modal -->
    <v-dialog v-model="showTrendDialog" max-width="500">
      <v-card>
        <v-card-title>Trend Analysis Results</v-card-title>
        <v-card-text>
          <div v-if="trendAnalysis" class="space-y-4">
            <div v-for="(trend, key) in trendAnalysis" :key="key" class="p-4 bg-gray-50 rounded">
              <h4 class="font-semibold capitalize mb-2">{{ key }}</h4>
              <div class="flex items-center space-x-2">
                <v-icon 
                  :color="trend.direction === 'Increasing' ? 'success' : trend.direction === 'Decreasing' ? 'error' : 'warning'"
                >
                  {{ trend.direction === 'Increasing' ? 'mdi-trending-up' : trend.direction === 'Decreasing' ? 'mdi-trending-down' : 'mdi-trending-neutral' }}
                </v-icon>
                <span>{{ trend.direction }}</span>
                <span class="text-sm text-gray-600">({{ trend.trend.toFixed(4) }})</span>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showTrendDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LineChart from './LineChart.vue'
import BarChart from './BarChart.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  chartData: {
    type: Object,
    required: true
  },
  chartOptions: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: Number,
    default: 300
  },
  chartType: {
    type: String,
    default: 'line',
    validator: (value) => ['line', 'bar'].includes(value)
  },
  rawData: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh', 'export', 'trend-analysis'])

// Local state
const showTrendDialog = ref(false)
const trendAnalysis = ref(null)

// Chart reference for advanced animations
const chartRef = ref(null)

// Methods
function refreshChart() {
  // First trigger the parent refresh event to update data
  emit('refresh')
  
  // Then apply animation with slight delay to ensure data is updated
  setTimeout(() => {
    triggerChartAnimation({
      duration: 1500,
      easing: 'easeInOutQuart',
      delay: (context) => context.dataIndex * 50
    })
  }, 100)
}

function exportChart() {
  // Export chart as image
  const canvas = document.querySelector('canvas')
  if (canvas) {
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.title.toLowerCase().replace(/\s+/g, '_')}_chart.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  emit('export')
}

function analyzeTrend() {
  if (!props.rawData.length) {
    return
  }
  
  const analysis = generateTrendAnalysis(props.rawData)
  trendAnalysis.value = analysis
  showTrendDialog.value = true
  emit('trend-analysis', analysis)
}

function generateTrendAnalysis(data) {
  if (!data.length) return {}
  
  const sortedData = [...data].sort((a, b) => new Date(a.date || a.prediction_date) - new Date(b.date || b.prediction_date))
  
  const temperatureTrend = analyzeTrendLine(sortedData.map(item => item.temperature || item.predicted_temperature).filter(Boolean))
  const humidityTrend = analyzeTrendLine(sortedData.map(item => item.humidity || item.predicted_humidity).filter(Boolean))
  const rainfallTrend = analyzeTrendLine(sortedData.map(item => item.rainfall || 0))
  
  const analysis = {}
  
  if (temperatureTrend !== null) {
    analysis.temperature = {
      trend: temperatureTrend,
      direction: temperatureTrend > 0.1 ? 'Increasing' : temperatureTrend < -0.1 ? 'Decreasing' : 'Stable'
    }
  }
  
  if (humidityTrend !== null) {
    analysis.humidity = {
      trend: humidityTrend,
      direction: humidityTrend > 0.1 ? 'Increasing' : humidityTrend < -0.1 ? 'Decreasing' : 'Stable'
    }
  }
  
  if (rainfallTrend !== null) {
    analysis.rainfall = {
      trend: rainfallTrend,
      direction: rainfallTrend > 0.1 ? 'Increasing' : rainfallTrend < -0.1 ? 'Decreasing' : 'Stable'
    }
  }
  
  return analysis
}

function analyzeTrendLine(data) {
  if (data.length < 2) return null
  
  const n = data.length
  const sumX = (n * (n - 1)) / 2
  const sumY = data.reduce((sum, val) => sum + val, 0)
  const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0)
  const sumX2 = data.reduce((sum, val, index) => sum + (index * index), 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

// Chart event handlers
function onChartRendered(chart) {
  console.log(`${props.title} chart rendered`)
}

function onChartUpdated(chart) {
  console.log(`${props.title} chart updated`)
}

function onChartClick(element) {
  if (element) {
    console.log(`Clicked on ${props.title} chart element:`, element)
  }
}

// Method to trigger refresh with animation effects
function triggerChartAnimation(options = {}) {
  if (chartRef.value?.refreshChart) {
    chartRef.value.refreshChart(options)
    return true
  }
  return false
}

// Expose method to parent component
defineExpose({
  triggerChartAnimation,
  getChartRef: () => chartRef.value
})

// Watch for data changes and auto-refresh
watch(() => props.chartData, () => {
  // Chart will automatically update due to reactivity
}, { deep: true })
</script>
