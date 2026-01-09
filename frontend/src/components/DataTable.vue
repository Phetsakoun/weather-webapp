<template>
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <div class="flex gap-2">
        <v-btn 
          color="primary" 
          size="small" 
          @click="exportData" 
          :loading="exporting"
          prepend-icon="mdi-download"
        >
          Export
        </v-btn>
      </div>
    </div>
    
    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      :search="search"
      class="elevation-1"
      item-key="id"
      :items-per-page="itemsPerPage"
    >
      <!-- Temperature slot -->
      <template v-slot:item.temperature="{ item }" v-if="showTemperature">
        <v-chip :color="getTemperatureColor(item.temperature)" variant="flat" size="small">
          {{ item.temperature }}°C
        </v-chip>
      </template>
      
      <!-- Predicted Temperature slot -->
      <template v-slot:item.predicted_temperature="{ item }" v-if="showPredictedTemperature">
        <v-chip :color="getTemperatureColor(item.predicted_temperature)" variant="flat" size="small">
          {{ Math.round(item.predicted_temperature * 10) / 10 }}°C
        </v-chip>
      </template>
      
      <!-- Actual Temperature slot -->
      <template v-slot:item.actual_temperature="{ item }" v-if="showActualTemperature">
        <v-chip :color="getTemperatureColor(item.actual_temperature)" variant="flat" size="small">
          {{ item.actual_temperature ? Math.round(item.actual_temperature * 10) / 10 : 'N/A' }}°C
        </v-chip>
      </template>
      
      <!-- Humidity slot -->
      <template v-slot:item.humidity="{ item }" v-if="showHumidity">
        <div class="flex items-center">
          <v-progress-linear
            :model-value="item.humidity"
            color="blue"
            height="8"
            class="mr-2"
            style="min-width: 60px"
          />
          {{ item.humidity }}%
        </div>
      </template>
      
      <!-- Predicted Humidity slot -->
      <template v-slot:item.predicted_humidity="{ item }" v-if="showPredictedHumidity">
        <div class="flex items-center">
          <v-progress-linear
            :model-value="item.predicted_humidity"
            color="blue"
            height="8"
            class="mr-2"
            style="min-width: 60px"
          />
          {{ Math.round(item.predicted_humidity) }}%
        </div>
      </template>
      
      <!-- Actual Humidity slot -->
      <template v-slot:item.actual_humidity="{ item }" v-if="showActualHumidity">
        <div class="flex items-center">
          <v-progress-linear
            :model-value="item.actual_humidity"
            color="cyan"
            height="8"
            class="mr-2"
            style="min-width: 60px"
          />
          {{ item.actual_humidity ? Math.round(item.actual_humidity) : 'N/A' }}%
        </div>
      </template>
      
      <!-- Confidence slot -->
      <template v-slot:item.confidence="{ item }" v-if="showConfidence">
        <div class="flex items-center">
          <v-progress-linear
            :model-value="getConfidenceValue(item.confidence)"
            color="success"
            height="8"
            class="mr-2"
            style="min-width: 60px"
          />
          {{ Math.round(getConfidenceValue(item.confidence)) }}%
        </div>
      </template>
      
      <!-- Date slot -->
      <template v-slot:item.date="{ item }" v-if="showDate">
        <v-chip color="info" variant="flat" size="small">
          {{ formatDate(item.date) }}
        </v-chip>
      </template>
      
      <!-- Prediction Date slot -->
      <template v-slot:item.prediction_date="{ item }" v-if="showPredictionDate">
        <v-chip color="info" variant="flat" size="small">
          {{ formatDate(item.prediction_date) }}
        </v-chip>
      </template>
      
      <!-- Actions slot -->
      <template v-slot:item.actions="{ item }" v-if="showActions">
        <v-btn
          color="primary"
          size="small"
          variant="text"
          @click="$emit('edit', item)"
          prepend-icon="mdi-pencil"
        >
          Edit
        </v-btn>
        <v-btn
          color="error"
          size="small"
          variant="text"
          @click="$emit('delete', item)"
          prepend-icon="mdi-delete"
        >
          Delete
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  headers: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  search: {
    type: String,
    default: ''
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  showTemperature: {
    type: Boolean,
    default: false
  },
  showPredictedTemperature: {
    type: Boolean,
    default: false
  },
  showActualTemperature: {
    type: Boolean,
    default: false
  },
  showHumidity: {
    type: Boolean,
    default: false
  },
  showPredictedHumidity: {
    type: Boolean,
    default: false
  },
  showActualHumidity: {
    type: Boolean,
    default: false
  },
  showConfidence: {
    type: Boolean,
    default: false
  },
  showDate: {
    type: Boolean,
    default: false
  },
  showPredictionDate: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'export'])

// Local state
const exporting = ref(false)

// Methods
function getTemperatureColor(temperature) {
  if (temperature < 20) return 'blue'
  if (temperature < 25) return 'green'
  if (temperature < 30) return 'orange'
  return 'red'
}

function getConfidenceValue(confidence) {
  // ถ้าเป็น null หรือ undefined ให้ return 0
  if (confidence === null || confidence === undefined) return 0
  
  // แปลงเป็น number
  const numValue = Number(confidence)
  
  // ถ้าค่ามากกว่า 100 ให้หารด้วย 100 (กรณีที่เป็น 8900 -> 89)
  if (numValue > 100) {
    return numValue / 100
  }
  
  // ถ้าค่าน้อยกว่าหรือเท่ากับ 1 ให้คูณ 100 (กรณีที่เป็น 0.89 -> 89)
  if (numValue <= 1) {
    return numValue * 100
  }
  
  // ถ้าอยู่ระหว่าง 1-100 ให้ return ตามเดิม
  return numValue
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

async function exportData() {
  exporting.value = true
  try {
    await emit('export', props.items)
  } finally {
    exporting.value = false
  }
}
</script>
