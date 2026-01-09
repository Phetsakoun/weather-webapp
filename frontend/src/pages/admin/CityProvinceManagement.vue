<template>
  <div class="min-h-screen bg-[#f4f7fa] p-6">
    <!-- Header -->
    <div class="bg-white shadow px-6 py-4 flex items-center justify-between rounded-xl mb-6">
      <div class="flex items-center">
        <div class="bg-orange-100 rounded-lg p-3 mr-4">
          <v-icon size="28" color="orange">mdi-map-marker-multiple</v-icon>
        </div>
        <div>
          <div class="text-xs text-gray-400">ຜູ້ຄຸ້ມຄອງ / ການຈັດການທີ່ຕັ້ງ</div>
          <div class="text-2xl font-bold text-blue-900">ລະບົບຈັດການທີ່ຕັ້ງ</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <v-btn color="secondary" prepend-icon="mdi-refresh" @click="refreshData">
          ໂຫຼດໃໝ່
        </v-btn>
        <v-btn 
          v-if="currentTab === 'cities'"
          color="info" 
          prepend-icon="mdi-cloud-check" 
          @click="testAllWeatherAPI"
          :loading="testingAllWeather"
          :disabled="testingAllWeather || testingAllLSTM"
        >
          ທົດສອບ API ທັງໝົດ
        </v-btn>
        <v-btn 
          v-if="currentTab === 'cities'"
          color="purple" 
          prepend-icon="mdi-brain" 
          @click="testAllLSTMPrediction"
          :loading="testingAllLSTM"
          :disabled="testingAllWeather || testingAllLSTM"
        >
          ທົດສອບ LSTM ທັງໝົດ
        </v-btn>
        <v-btn 
          v-if="currentTab === 'cities'"
          color="indigo" 
          prepend-icon="mdi-map-marker-multiple" 
          @click="showBulkRegionDialog = true"
          variant="outlined"
        >
          ອັບເດດພື້ນທີ່
        </v-btn>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white rounded-xl shadow mb-6">
      <v-tabs v-model="currentTab" class="px-6" color="primary">
        <v-tab value="provinces">
          <v-icon class="mr-2">mdi-map</v-icon>
          ແຂວງ ({{ provinces.length }})
        </v-tab>
        <v-tab value="cities">
          <v-icon class="mr-2">mdi-city</v-icon>
          ເມືອງ ({{ cities.length }})
        </v-tab>
      </v-tabs>
    </div>

    <!-- Tab Content -->
    <v-tabs-window v-model="currentTab">
      <!-- Provinces Tab -->
      <v-tabs-window-item value="provinces">
        <ProvinceManagement
          :provinces="provinces"
          :loading="loading"
          @refresh="loadProvinces"
          @edit-province="editProvince"
          @delete-province="deleteProvince"
          @add-city-to-province="addCityToProvince"
          @edit-city="editCity"
          @delete-city="deleteCity"
        />
      </v-tabs-window-item>

      <!-- Cities Tab -->
      <v-tabs-window-item value="cities">
        <!-- Statistics Overview for Cities -->
        <div class="bg-white rounded-xl shadow mb-6 p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">
            <v-icon class="mr-2">mdi-chart-bar</v-icon>
            ສະຖິຕິການຮອງຮັບຂໍ້ມູນ
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Total Cities -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center">
                <v-icon color="blue" class="mr-3" size="32">mdi-city</v-icon>
                <div>
                  <div class="text-sm text-blue-600">ທີ່ຕັ້ງທັງໝົດ</div>
                  <div class="text-2xl font-bold text-blue-800">{{ cities.length }}</div>
                  <div class="text-xs text-blue-500">ທີ່ຕັ້ງໃນລະບົບ</div>
                </div>
              </div>
            </div>
            
            <!-- Weather Data Coverage -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center">
                <v-icon color="green" class="mr-3" size="32">mdi-cloud-check</v-icon>
                <div>
                  <div class="text-sm text-green-600">ມີຂໍ້ມູນອາກາດ</div>
                  <div class="text-2xl font-bold text-green-800">{{ getWeatherDataCount() }}</div>
                  <div class="text-xs text-green-500">{{ getWeatherDataPercentage() }}% ຮອງຮັບ</div>
                </div>
              </div>
            </div>
            
            <!-- Active Cities -->
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div class="flex items-center">
                <v-icon color="amber" class="mr-3" size="32">mdi-check-circle</v-icon>
                <div>
                  <div class="text-sm text-amber-600">ເປີດໃຊ້ງານ</div>
                  <div class="text-2xl font-bold text-amber-800">{{ getActiveCitiesCount() }}</div>
                  <div class="text-xs text-amber-500">{{ getActiveCitiesPercentage() }}% ຂອງທັງໝົດ</div>
                </div>
              </div>
            </div>
            
            <!-- Testing Status -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div class="flex items-center">
                <v-icon color="purple" class="mr-3" size="32">mdi-test-tube</v-icon>
                <div>
                  <div class="text-sm text-purple-600">ກຳລັງທົດສອບ</div>
                  <div class="text-2xl font-bold text-purple-800">
                    {{ cities.filter(c => c.testingWeather || c.testingLSTM).length }}
                  </div>
                  <div class="text-xs text-purple-500">
                    {{ testingAllWeather ? 'Weather API' : testingAllLSTM ? 'LSTM Model' : 'ພ້ອມໃຊ້ງານ' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CityManagement
          :cities="cities"
          :filteredCities="filteredCities"
          :loading="loading"
          :searchQuery="searchQuery"
          :statusFilter="statusFilter"
          :regionFilter="regionFilter"
          :testingAllWeather="testingAllWeather"
          :testingAllLSTM="testingAllLSTM"
          @clear-filters="clearFilters"
          @toggle-region-filter="toggleRegionFilter"
          @edit-city="editCity"
          @delete-city="deleteCity"
          @test-weather-api="testWeatherAPI"
          @test-lstm-prediction="testLSTMPrediction"
          @toggle-city-status="toggleCityStatus"
          @update:searchQuery="searchQuery = $event"
          @update:statusFilter="statusFilter = $event"
          @update:regionFilter="regionFilter = $event"
        />
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-lg font-semibold">
            {{ isEditing ? 'ແກ້ໄຂ' : 'ເພີ່ມ' }} 
            {{ getDialogTitle() }}
          </span>
        </v-card-title>
        <v-card-text>
          <!-- Province Form -->
          <div v-if="!editedCity.name && !isEditing && !editedCity.provinceId">
            <v-text-field 
              v-model="editedProvince.name" 
              label="ຊື່ແຂວງ" 
              density="compact" 
              variant="outlined"
              placeholder="ຊື່ແຂວງ..."
            />
          </div>
          
          <!-- City Form -->
          <div v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <v-text-field 
                v-model="editedCity.name" 
                label="ຊື່ເມືອງ/ທີ່ຕັ້ງ" 
                density="compact" 
                variant="outlined"
                placeholder="ຊື່ເມືອງ..."
              />
              <v-select
                v-model="editedCity.provinceId"
                :items="provinces"
                item-title="name"
                item-value="id"
                label="ແຂວງ"
                density="compact"
                variant="outlined"
                :clearable="isEditing"
                :required="!isEditing"
                :rules="!isEditing ? [(v) => !!v || 'ກະລຸນາເລືອກແຂວງ'] : []"
              />
              <v-text-field 
                v-model="editedCity.latitude" 
                label="ລາຕີຈູດ" 
                type="number"
                step="0.0001"
                density="compact" 
                variant="outlined"
                placeholder="17.9757"
              />
              <v-text-field 
                v-model="editedCity.longitude" 
                label="ລົງຈີຈູດ" 
                type="number"
                step="0.0001"
                density="compact" 
                variant="outlined"
                placeholder="102.6330"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <v-select 
                v-model="editedCity.region" 
                :items="regionOptions" 
                label="ພື້ນທີ່" 
                density="compact" 
                variant="outlined"
              />
              <v-select 
                v-model="editedCity.status" 
                :items="statusOptions" 
                label="ສະຖານະ" 
                density="compact" 
                variant="outlined"
              />
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn 
            color="primary" 
            @click="editedCity.provinceId || (editedCity.name && !editedProvince.name) || isEditing ? saveCity() : saveProvince()"
          >
            {{ isEditing ? 'ອັບເດດ' : 'ສ້າງ' }}
          </v-btn>
          <v-btn variant="text" @click="closeDialog">ຍົກເລີກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Region Update Dialog -->
    <v-dialog v-model="showBulkRegionDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2">mdi-map-marker-multiple</v-icon>
          ອັບເດດພື້ນທີ່ທັງໝົດ
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            ຈັດແຈງພື້ນທີ່ອັດຕະໂນມັດຕາມຊື່ແຂວງລາວ
          </v-alert>
          
          <div class="mb-4">
            <h4 class="text-lg font-semibold mb-2">ພາບຕົວຢ່າງການປ່ຽນແປງ:</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="text-sm font-medium text-blue-700 mb-2">ແຂວງພາກເໜືອ</div>
                <div class="text-xs text-blue-600">
                  ຜົ້ງສາລີ, ຫລວງນໍ້າທາ, ອຸດົມໄຊ, ຫລວງພະບາງ, ບໍ່ແກ້ວ, ຫົວພັນ, ໄຊຍະບູລີ, ຊຽງຂວາງ
                </div>
              </div>
              <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                <div class="text-sm font-medium text-green-700 mb-2">ແຂວງພາກກາງ</div>
                <div class="text-xs text-green-600">
                  ວຽງຈັນ, ບໍລິຄໍາໄຊ, ຄໍາມ່ວນ, ໄຊສົມບູນ
                </div>
              </div>
              <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div class="text-sm font-medium text-orange-700 mb-2">ແຂວງພາກໃຕ້</div>
                <div class="text-xs text-orange-600">
                  ສະຫວັນນະເຂດ, ສາລະວັນ, ເຊກອງ, ອັດຕະປື, ຈໍາປາສັກ
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn 
            color="primary" 
            @click="bulkUpdateRegions"
            :loading="loading"
            :disabled="loading"
          >
            ອັບເດດພື້ນທີ່ທັງໝົດ
          </v-btn>
          <v-btn variant="text" @click="showBulkRegionDialog = false" :disabled="loading">
            ຍົກເລີກ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" location="top right">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">ປິດ</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../plugins/axios'
import ProvinceManagement from '../../components/ProvinceManagement.vue'
import CityManagement from '../../components/CityManagement.vue'

// Core reactive data
const currentTab = ref('provinces')
const provinces = ref([])
const cities = ref([])
const filteredCities = ref([])
const loading = ref(false)
const dialog = ref(false)
const showBulkRegionDialog = ref(false)
const isEditing = ref(false)

// Search and filter
const searchQuery = ref('')
const statusFilter = ref('')
const regionFilter = ref('')

// Testing states
const testingAllWeather = ref(false)
const testingAllLSTM = ref(false)

// UI states
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Form data
const editedCity = ref({
  name: '',
  latitude: '',
  longitude: '',
  status: 'ເປີດນຳໃຊ້',
  region: 'ພາກກາງ',
  provinceId: null,
  hasWeatherData: false,
  testingWeather: false,
  testingLSTM: false
})

const editedProvince = ref({
  id: null,
  name: ''
})

// Options
const statusOptions = ['ເປີດນຳໃຊ້', 'ປິດນຳໃຊ້']
const regionOptions = ['ພາກເໜືອ', 'ພາກກາງ', 'ພາກໃຕ້']

// === CORE CRUD FUNCTIONS ===

// Load provinces with their cities
async function loadProvinces() {
  try {
    loading.value = true
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      showMessage('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ', 'error')
      window.location.href = '/login'
      return
    }

    const response = await api.get('/api/provinces')
    provinces.value = response.data.map(province => ({
      ...province,
      name: province.name_th || province.name_en,
      cities: province.cities ? province.cities.map(city => ({
        ...city,
        name: city.name_th || city.name_en || 'Unknown',
        latitude: city.lat || 0,
        longitude: city.lon || 0
      })) : []
    }))
    
    // Transform cities from provinces
    const allCities = []
    provinces.value.forEach(province => {
      if (province.cities) {
        province.cities.forEach(city => {
          allCities.push({
            id: city.id,
            name: city.name_th || city.name_en || 'Unknown',
            latitude: city.lat || 0,
            longitude: city.lon || 0,
            provinceName: province.name_th || province.name_en || 'Unknown',
            provinceId: province.id,
            status: city.status || 'active', // Use database value directly
            region: city.region || 'ພາກກາງ',
            hasWeatherData: false,
            testingWeather: false,
            testingLSTM: false,
            updatingStatus: false
          })
        })
      }
    })
    cities.value = allCities
    
  } catch (error) {
    console.error('Load provinces error:', error)
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

// Province CRUD
function addProvince() {
  editedProvince.value = { id: null, name: '' }
  dialog.value = true
  isEditing.value = false
}

function editProvince(province) {
  editedProvince.value = { ...province }
  dialog.value = true
  isEditing.value = true
}

async function saveProvince() {
  if (!editedProvince.value.name) {
    showMessage('ກະລຸນາກໍ່າຊື່ແຂວງ', 'error')
    return
  }

  try {
    loading.value = true
    
    if (isEditing.value) {
      await api.put(`/api/provinces/${editedProvince.value.id}`, {
        name: editedProvince.value.name
      })
      showMessage('ອັບເດດແຂວງສຳເລັດ!', 'success')
    } else {
      await api.post('/api/provinces', {
        name: editedProvince.value.name
      })
      showMessage('ສ້າງແຂວງສຳເລັດ!', 'success')
    }
    
    closeDialog()
    await loadProvinces()
    
  } catch (error) {
    console.error('Save province error:', error)
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

async function deleteProvince(province) {
  if (province.cities && province.cities.length > 0) {
    showMessage(`ບໍ່ສາມາດລຶບແຂວງທີ່ມີ ${province.cities.length} ເມືອງໄດ້. ກະລຸນາລຶບເມືອງກ່ອນ.`, 'error')
    return
  }

  if (confirm(`ແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ "${province.name}"?`)) {
    try {
      loading.value = true
      await api.delete(`/api/provinces/${province.id}`)
      showMessage('ລຶບແຂວງສຳເລັດ!', 'success')
      await loadProvinces()
    } catch (error) {
      console.error('Delete province error:', error)
      handleApiError(error)
    } finally {
      loading.value = false
    }
  }
}

// City CRUD
function addCityToProvince(province) {
  editedCity.value = { 
    name: '', 
    latitude: '', 
    longitude: '', 
    status: 'Active', 
    region: 'ພາກກາງ',
    provinceId: province.id
  }
  dialog.value = true
  isEditing.value = false
}

function editCity(city) {
  editedCity.value = { ...city }
  dialog.value = true
  isEditing.value = true
}

async function saveCity() {
  if (!editedCity.value.name || !editedCity.value.latitude || !editedCity.value.longitude) {
    showMessage('ກະລຸນາກໍ່າຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບ', 'error')
    return
  }

  // When creating a new city, provinceId is required
  if (!isEditing.value && !editedCity.value.provinceId) {
    showMessage('ກະລຸນາເລືອກແຂວງສຳລັບເມືອງ', 'error')
    return
  }

  const coordError = validateCoordinates(editedCity.value.latitude, editedCity.value.longitude)
  if (coordError) {
    showMessage(coordError, 'error')
    return
  }

  try {
    loading.value = true
    
    if (isEditing.value) {
      await api.put(`/api/cities/${editedCity.value.id}`, {
        name: editedCity.value.name,
        latitude: editedCity.value.latitude,
        longitude: editedCity.value.longitude,
        status: editedCity.value.status,
        region: editedCity.value.region,
        provinceId: editedCity.value.provinceId
      })
      showMessage('ອັບເດດເມືອງສຳເລັດ!', 'success')
    } else {
      // Always create city under a province
      await api.post(`/api/provinces/${editedCity.value.provinceId}/cities`, {
        name: editedCity.value.name,
        latitude: editedCity.value.latitude,
        longitude: editedCity.value.longitude,
        status: editedCity.value.status,
        region: editedCity.value.region
      })
      showMessage('ສ້າງເມືອງສຳເລັດ!', 'success')
    }
    
    closeDialog()
    
    // Force a fresh reload of data
    await loadProvinces()
    
    // If we're currently on cities tab, switch to provinces to see the new city
    if (currentTab.value === 'cities') {
      currentTab.value = 'provinces'
    }
    
  } catch (error) {
    console.error('Save city error:', error)
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

async function deleteCity(city) {
  if (confirm(`ແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ "${city.name}"?`)) {
    try {
      loading.value = true
      await api.delete(`/api/cities/${city.id}`)
      showMessage('ລຶບເມືອງສຳເລັດ!', 'success')
      await loadProvinces()
    } catch (error) {
      console.error('Delete city error:', error)
      handleApiError(error)
    } finally {
      loading.value = false
    }
  }
}

// Toggle city status (active/inactive)
async function toggleCityStatus(city) {
  const newStatus = city.status === 'active' ? 'inactive' : 'active'
  const actionText = newStatus === 'active' ? 'ເປີດການໃຊ້ງານ' : 'ປິດການໃຊ້ງານ'
  
  if (confirm(`ແນ່ໃຈບໍ່ວ່າຕ້ອງການ${actionText} "${city.name}"?`)) {
    try {
      // Set loading state for this specific city
      const cityIndex = cities.value.findIndex(c => c.id === city.id)
      if (cityIndex !== -1) {
        cities.value[cityIndex].updatingStatus = true
      }
      
      await api.put(`/api/provinces/cities/${city.id}/status`, {
        status: newStatus
      })
      
      showMessage(`${actionText}ເມືອງ "${city.name}" ສຳເລັດ!`, 'success')
      await loadProvinces() // Reload to reflect changes
    } catch (error) {
      console.error('Toggle city status error:', error)
      handleApiError(error)
    } finally {
      // Remove loading state
      const cityIndex = cities.value.findIndex(c => c.id === city.id)
      if (cityIndex !== -1) {
        cities.value[cityIndex].updatingStatus = false
      }
    }
  }
}

// === COORDINATE MANAGEMENT ===

function validateCoordinates(lat, lon) {
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lon)
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return 'ພິກັດຕ້ອງເປັນຕົວເລກ'
  }
  
  if (latitude < -90 || latitude > 90) {
    return 'ແຄວ້ນຕ້ອງຢູ່ລະຫວ່າງ -90 ແລະ 90'
  }
  
  if (longitude < -180 || longitude > 180) {
    return 'ຍາວຕ້ອງຢູ່ລະຫວ່າງ -180 ແລະ 180'
  }
  
  return null
}

// === REGION MANAGEMENT ===

async function bulkUpdateRegions() {
  try {
    loading.value = true
    
    // Province name to region mapping based on Lao province names
    const provinceRegionMappings = {
      'North': [
        'ແຂວງຜົ້ງສາລີ', 'ແຂວງຫລວງນໍ້າທາ', 'ແຂວງອຸດົມໄຊ', 'ແຂວງຫລວງພະບາງ', 'ແຂວງບໍ່ແກ້ວ', 
        'ແຂວງຫົວພັນ', 'ແຂວງໄຊຍະບູລີ', 'ແຂວງຊຽງຂວາງ'
      ],
      'Central': [
        'ນະຄອນຫລວງວຽງຈັນ', 'ແຂວງວຽງຈັນ', 'ແຂວງບໍລິຄໍາໄຊ', 'ແຂວງຄໍາມ່ວນ', 'ແຂວງໄຊສົມບູນ'
      ],
      'South': [
        'ແຂວງສະຫວັນນະເຂດ', 'ແຂວງສາລະວັນ', 'ແຂວງເຊກອງ', 'ແຂວງອັດຕະປື', 'ແຂວງຈໍາປາສັກ'
      ]
    }
    
    const updates = []
    
    // Match cities by their province names
    for (const city of cities.value) {
      let newRegion = 'Central' // Default region
      
      // Find the province for this city
      const province = provinces.value.find(p => p.id === city.provinceId)
      if (province) {
        const provinceName = province.name_th || province.name_en || province.name
        
        // Check which region this province belongs to
        for (const [region, provinceNames] of Object.entries(provinceRegionMappings)) {
          if (provinceNames.some(name => provinceName.includes(name) || name.includes(provinceName))) {
            newRegion = region
            break
          }
        }
      }
      
      // Only add to updates if the region is different
      if (city.region !== newRegion) {
        updates.push({
          id: city.id,
          name: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          status: city.status,
          region: newRegion,
          provinceId: city.provinceId
        })
      }
    }
    
    if (updates.length === 0) {
      showMessage('ບໍ່ມີພາກທີ່ຕ້ອງອັບເດດ!', 'info')
      showBulkRegionDialog.value = false
      return
    }
    
    // Update cities individually
    let updatedCount = 0
    for (const update of updates) {
      try {
        await api.put(`/api/cities/${update.id}`, update)
        const city = cities.value.find(c => c.id === update.id)
        if (city) {
          city.region = update.region
        }
        updatedCount++
      } catch (error) {
        console.error(`Error updating ${update.name}:`, error)
      }
    }
    
    showMessage(`ອັບເດດພາກສຳເລັດ! ອັບເດດແລ້ວ ${updatedCount} ເມືອງ.`, 'success')
    showBulkRegionDialog.value = false
    await loadProvinces()
    
  } catch (error) {
    console.error('Bulk update regions error:', error)
    showMessage('ເກີດຂໍ້ຜິດພາດໃນການອັບເດດພາກ: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

// === API & LSTM TESTING ===

async function testWeatherAPI(city) {
  try {
    city.testingWeather = true
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    console.log('Testing weather API for city:', city.name, 'ID:', city.id)
    console.log('Using token:', token ? 'Token present' : 'No token')
    console.log('City coordinates:', city.latitude, city.longitude)
    
    const response = await api.get(`/api/weather/test/${city.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    console.log('Weather API response:', response.data)
    
    if (response.data.success) {
      city.hasWeatherData = true
      showMessage(`ທົດສອບ Weather API ສຳເລັດສຳລັບ ${city.name}!`, 'success')
    } else {
      showMessage(`ທົດສອບ Weather API ລົ້ມເຫລວສຳລັບ ${city.name}: ${response.data.error}`, 'error')
    }
  } catch (error) {
    console.error('Test weather API error:', error)
    console.error('Error response:', error.response?.data)
    showMessage(`ເກີດຂໍ້ຜິດພາດໃນການທົດສອບ Weather API ສຳລັບ ${city.name}: ${error.response?.data?.error || error.message}`, 'error')
  } finally {
    city.testingWeather = false
  }
}

async function testLSTMPrediction(city) {
  try {
    city.testingLSTM = true
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    console.log('Testing LSTM prediction for city:', city.name, 'ID:', city.id)
    console.log('Using token:', token ? 'Token present' : 'No token')
    
    const response = await api.get(`/api/predict/test/${city.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    console.log('LSTM API response:', response.data)
    
    if (response.data.success) {
      showMessage(`ທົດສອບ LSTM ສຳເລັດສຳລັບ ${city.name}!`, 'success')
    } else {
      showMessage(`ທົດສອບ LSTM ລົ້ມເຫລວສຳລັບ ${city.name}: ${response.data.error}`, 'error')
    }
  } catch (error) {
    console.error('Test LSTM prediction error:', error)
    console.error('Error response:', error.response?.data)
    showMessage(`ເກີດຂໍ້ຜິດພາດໃນການທົດສອບ LSTM ສຳລັບ ${city.name}: ${error.response?.data?.error || error.message}`, 'error')
  } finally {
    city.testingLSTM = false
  }
}

async function testAllWeatherAPI() {
  try {
    testingAllWeather.value = true
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    const citiesWithCoords = cities.value.filter(city => city.latitude && city.longitude)
    
    if (citiesWithCoords.length === 0) {
      showMessage('ບໍ່ມີເມືອງທີ່ມີພິກັດສຳລັບທົດສອບ', 'warning')
      return
    }
    
    showMessage(`ກຳລັງທົດສອບ Weather API ສຳລັບ ${citiesWithCoords.length} ເມືອງ...`, 'info')
    
    let successCount = 0
    let errorCount = 0
    
    const BATCH_SIZE = 5
    for (let i = 0; i < citiesWithCoords.length; i += BATCH_SIZE) {
      const batch = citiesWithCoords.slice(i, i + BATCH_SIZE)
      
      const promises = batch.map(async (city) => {
        try {
          city.testingWeather = true
          const response = await api.get(`/api/weather/test/${city.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          
          if (response.data.success) {
            city.hasWeatherData = true
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Weather API test error for ${city.name}:`, error)
          errorCount++
        } finally {
          city.testingWeather = false
        }
      })
      
      await Promise.all(promises)
      
      if (i + BATCH_SIZE < citiesWithCoords.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    showMessage(`ທົດສອບ Weather API ສຳເລັດແລ້ວ! ສຳເລັດ: ${successCount}, ຜິດພາດ: ${errorCount}`, 
      successCount > 0 ? 'success' : 'warning')
    
  } catch (error) {
    console.error('Test all weather API error:', error)
    showMessage(`ເກີດຂໍ້ຜິດພາດໃນການທົດສອບ Weather API ທັງຫມົດ: ${error.message}`, 'error')
  } finally {
    testingAllWeather.value = false
  }
}

async function testAllLSTMPrediction() {
  try {
    testingAllLSTM.value = true
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    const citiesWithWeatherData = cities.value.filter(city => city.hasWeatherData)
    
    if (citiesWithWeatherData.length === 0) {
      showMessage('ບໍ່ມີເມືອງທີ່ມີຂໍ້ມູນສະພາບອາກາດສຳລັບທົດສອບ LSTM. ກະລຸນາທົດສອບ Weather API ກ່ອນ.', 'warning')
      return
    }
    
    showMessage(`ກຳລັງທົດສອບ LSTM ສຳລັບ ${citiesWithWeatherData.length} ເມືອງ...`, 'info')
    
    let successCount = 0
    let errorCount = 0
    
    const BATCH_SIZE = 3
    for (let i = 0; i < citiesWithWeatherData.length; i += BATCH_SIZE) {
      const batch = citiesWithWeatherData.slice(i, i + BATCH_SIZE)
      
      const promises = batch.map(async (city) => {
        try {
          city.testingLSTM = true
          const response = await api.get(`/api/predict/test/${city.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          
          if (response.data.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`LSTM prediction test error for ${city.name}:`, error)
          errorCount++
        } finally {
          city.testingLSTM = false
        }
      })
      
      await Promise.all(promises)
      
      if (i + BATCH_SIZE < citiesWithWeatherData.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    showMessage(`ທົດສອບ LSTM ສຳເລັດແລ້ວ! ສຳເລັດ: ${successCount}, ຜິດພາດ: ${errorCount}`, 
      successCount > 0 ? 'success' : 'warning')
    
  } catch (error) {
    console.error('Test all LSTM prediction error:', error)
    showMessage(`ເກີດຂໍ້ຜິດພາດໃນການທົດສອບ LSTM ທັງຫມົດ: ${error.message}`, 'error')
  } finally {
    testingAllLSTM.value = false
  }
}

// === UTILITY FUNCTIONS ===

async function refreshData() {
  await loadProvinces()
  showMessage('ໂຫຼດຂໍ້ມູນໃໝ່ແລ້ວ!', 'info')
}

function closeDialog() {
  dialog.value = false
  editedCity.value = { 
    name: '', 
    latitude: '', 
    longitude: '', 
    status: 'ເປີດນຳໃຊ້', 
    region: 'ພາກກາງ',
    provinceId: null
  }
  editedProvince.value = { id: null, name: '' }
}

function getDialogTitle() {
  // If we have provinceId set, it's always a city
  if (editedCity.value.provinceId) {
    return 'ເມືອງ/ທີ່ຕັ້ງ'
  }
  // If editing a city
  if (isEditing.value && editedCity.value.name) {
    return 'ເມືອງ/ທີ່ຕັ້ງ'
  }
  // If editing a province
  if (isEditing.value && editedProvince.value.name) {
    return 'ແຂວງ'
  }
  // If adding and no provinceId, it's a province
  if (!editedCity.value.provinceId && editedProvince.value.name !== undefined) {
    return 'ແຂວງ'
  }
  return 'ທີ່ຕັ້ງ'
}

function showMessage(message, color = 'success') {
  snackbarText.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

function handleApiError(error) {
  if (error.response?.status === 401) {
    showMessage('ບໍ່ມີສິດເຂົ້າໃຊ້ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
  } else {
    showMessage('ຂໍ້ຜິດພາດ: ' + (error.response?.data?.error || error.message), 'error')
  }
}

// === STATISTICS ===

function getWeatherDataCount() {
  return cities.value.filter(city => city.hasWeatherData).length
}

function getWeatherDataPercentage() {
  if (cities.value.length === 0) return 0
  return Math.round((getWeatherDataCount() / cities.value.length) * 100)
}

function getActiveCitiesCount() {
  return cities.value.filter(city => city.status === 'active').length
}

function getActiveCitiesPercentage() {
  if (cities.value.length === 0) return 0
  return Math.round((getActiveCitiesCount() / cities.value.length) * 100)
}

// === SEARCH & FILTER ===

function filterCities() {
  let filtered = cities.value

  if (statusFilter.value) {
    filtered = filtered.filter(city => city.status === statusFilter.value)
  }

  if (regionFilter.value) {
    filtered = filtered.filter(city => city.region === regionFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(city => 
      city.name.toLowerCase().includes(query)
    )
  }

  filteredCities.value = filtered
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  regionFilter.value = ''
  filterCities()
}

function toggleRegionFilter(region) {
  if (regionFilter.value === region) {
    regionFilter.value = ''
  } else {
    regionFilter.value = region
  }
}

// Watch for filter changes
watch([searchQuery, statusFilter, regionFilter, cities], () => {
  filterCities()
}, { immediate: true })

// Initialize on mount
onMounted(async () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) {
    showMessage('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ', 'error')
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
    return
  }
  
  await loadProvinces()
})
</script>
