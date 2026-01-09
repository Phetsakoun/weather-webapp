<template>
  <div class="min-h-screen bg-[#f4f7fa] p-6">
    <!-- Breadcrumb/Title Bar -->
    <div class="bg-white shadow px-6 py-4 flex items-center justify-between rounded-xl mb-6">
      <div class="flex items-center">
        <div class="bg-purple-100 rounded-lg p-3 mr-4">
          <v-icon size="28" color="purple">mdi-brain</v-icon>
        </div>
        <div>
          <div class="text-xs text-gray-400">Admin / AI Model Management</div>
          <div class="text-2xl font-bold text-blue-900">AI Model Management</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <v-btn color="primary" prepend-icon="mdi-upload" @click="uploadModel">
          Upload Model
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-refresh" @click="refreshData">
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Models Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      <div v-for="model in models" :key="model.id" class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <div class="bg-purple-100 rounded-full p-3 mr-3">
              <v-icon size="24" color="purple">mdi-brain</v-icon>
            </div>
            <div>
              <h3 class="font-semibold">{{ model.name }}</h3>
              <p class="text-sm text-gray-500">{{ model.type }}</p>
            </div>
          </div>
          <v-chip :color="getStatusColor(model.status)" size="small">
            {{ model.status }}
          </v-chip>
        </div>
        
        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Accuracy:</span>
            <span class="font-semibold">{{ model.accuracy }}%</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Last Updated:</span>
            <span>{{ model.updated }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Version:</span>
            <span>{{ model.version }}</span>
          </div>
        </div>

        <div class="flex gap-2">
          <v-btn size="small" color="primary" @click="retrainModel(model)">Retrain</v-btn>
          <v-btn size="small" color="secondary" @click="downloadModel(model)">Download</v-btn>
          <v-btn size="small" color="error" @click="deleteModel(model)" v-if="model.status !== 'Active'">Delete</v-btn>
        </div>
      </div>
    </div>

    <!-- Model Usage Log Card -->
    <div class="bg-white rounded-xl shadow">
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="bg-blue-100 rounded-full p-3 mr-3">
            <v-icon color="primary">mdi-history</v-icon>
          </div>
          <h3 class="text-lg font-semibold">Model Usage Log</h3>
        </div>
        <v-data-table 
          :headers="logHeaders" 
          :items="logs" 
          class="elevation-0"
          :items-per-page="10"
        >
          <template #item.action="{ item }">
            <v-chip :color="getActionColor(item.action)" size="small">
              {{ item.action }}
            </v-chip>
          </template>
          <template #item.result="{ item }">
            <v-chip :color="item.result === 'Success' ? 'success' : 'error'" size="small">
              {{ item.result }}
            </v-chip>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Upload Model Dialog -->
    <v-dialog v-model="uploadDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-lg font-semibold">Upload New Model</span>
        </v-card-title>
        <v-card-text>
          <v-text-field 
            v-model="newModel.name" 
            label="Model Name" 
            density="compact" 
            variant="outlined" 
            class="mb-2"
          />
          <v-select 
            v-model="newModel.type" 
            :items="modelTypes" 
            label="Model Type" 
            density="compact" 
            variant="outlined" 
            class="mb-2"
          />
          <v-file-input 
            label="Select Model File" 
            accept=".h5,.pkl,.pt" 
            density="compact" 
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="saveModel">Upload</v-btn>
          <v-btn variant="text" @click="uploadDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar Notification -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" location="top right">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const models = ref([
  { 
    id: 1, 
    name: 'LSTM Weather Prediction', 
    type: 'LSTM Neural Network',
    status: 'Active', 
    accuracy: 94.2,
    version: 'v2.1.0',
    updated: '2025-07-01' 
  },
  { 
    id: 2, 
    name: 'Temperature Forecasting', 
    type: 'Random Forest',
    status: 'Training', 
    accuracy: 89.7,
    version: 'v1.3.2',
    updated: '2025-06-28' 
  },
  { 
    id: 3, 
    name: 'Rainfall Prediction', 
    type: 'Support Vector Machine',
    status: 'Inactive', 
    accuracy: 87.1,
    version: 'v1.0.5',
    updated: '2025-06-15' 
  }
])

const logHeaders = [
  { title: 'Date', key: 'date' },
  { title: 'Model', key: 'model' },
  { title: 'Action', key: 'action' },
  { title: 'Result', key: 'result' },
  { title: 'Duration', key: 'duration' }
]

const logs = ref([
  { date: '2025-07-01 14:30', model: 'LSTM Weather', action: 'Retrain', result: 'Success', duration: '2h 15m' },
  { date: '2025-06-30 09:15', model: 'Temperature Forecasting', action: 'Upload', result: 'Success', duration: '15m' },
  { date: '2025-06-28 16:45', model: 'LSTM Weather', action: 'Prediction', result: 'Success', duration: '0.5s' },
  { date: '2025-06-27 11:20', model: 'Rainfall Prediction', action: 'Training', result: 'Failed', duration: '1h 30m' }
])

const uploadDialog = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const newModel = ref({
  name: '',
  type: ''
})

const modelTypes = [
  'LSTM Neural Network',
  'Random Forest',
  'Support Vector Machine',
  'Convolutional Neural Network',
  'Gradient Boosting'
]

function getStatusColor(status) {
  switch (status) {
    case 'Active': return 'success'
    case 'Training': return 'warning'
    case 'Inactive': return 'error'
    default: return 'default'
  }
}

function getActionColor(action) {
  switch (action) {
    case 'Retrain': return 'primary'
    case 'Upload': return 'info'
    case 'Prediction': return 'success'
    case 'Training': return 'warning'
    default: return 'default'
  }
}

function uploadModel() {
  newModel.value = { name: '', type: '' }
  uploadDialog.value = true
}

function retrainModel(model) {
  if (confirm(`Are you sure you want to retrain "${model.name}"? This may take several hours.`)) {
    snackbarText.value = `Retraining started for ${model.name}`
    snackbarColor.value = 'info'
    showSnackbar.value = true
    
    // Add log entry
    logs.value.unshift({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      model: model.name,
      action: 'Retrain',
      result: 'In Progress',
      duration: '...'
    })
  }
}

function downloadModel(model) {
  snackbarText.value = `Downloading ${model.name}...`
  snackbarColor.value = 'info'
  showSnackbar.value = true
}

function deleteModel(model) {
  if (confirm(`Are you sure you want to delete "${model.name}"?`)) {
    models.value = models.value.filter(m => m.id !== model.id)
    snackbarText.value = 'Model deleted successfully!'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  }
}

function saveModel() {
  if (!newModel.value.name || !newModel.value.type) {
    snackbarText.value = 'Please fill all required fields.'
    snackbarColor.value = 'error'
    showSnackbar.value = true
    return
  }

  const model = {
    id: Math.max(...models.value.map(m => m.id)) + 1,
    name: newModel.value.name,
    type: newModel.value.type,
    status: 'Training',
    accuracy: 0,
    version: 'v1.0.0',
    updated: new Date().toISOString().slice(0, 10)
  }
  
  models.value.push(model)
  snackbarText.value = 'Model uploaded successfully!'
  snackbarColor.value = 'success'
  showSnackbar.value = true
  uploadDialog.value = false
}

function refreshData() {
  snackbarText.value = 'Data refreshed!'
  snackbarColor.value = 'info'
  showSnackbar.value = true
}
</script>
