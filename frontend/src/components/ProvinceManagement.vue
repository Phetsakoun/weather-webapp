<template>
  <div class="bg-white rounded-xl shadow">
    <div class="p-6">
      <!-- Province Statistics -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center">
            <v-icon color="blue" class="mr-2">mdi-map</v-icon>
            <div>
              <div class="text-sm text-blue-600">ຈຳນວນແຂວງທັງໝົດ</div>
              <div class="text-2xl font-bold text-blue-800">{{ provinces.length }}</div>
              <div class="text-xs text-blue-500">{{ getTotalCities() }} ເມືອງ</div>
            </div>
          </div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <v-icon color="green" class="mr-2">mdi-city</v-icon>
            <div>
              <div class="text-sm text-green-600">ເມືອງຕໍ່ແຂວງ</div>
              <div class="text-2xl font-bold text-green-800">{{ getAverageCities() }}</div>
              <div class="text-xs text-green-500">ສະເລ່ຍ</div>
            </div>
          </div>
        </div>
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-center">
            <v-icon color="orange" class="mr-2">mdi-map-marker-check</v-icon>
            <div>
              <div class="text-sm text-orange-600">ເມືອງທີ່ໃຊ້ງານໄດ້</div>
              <div class="text-2xl font-bold text-orange-800">{{ getActiveCities() }}</div>
              <div class="text-xs text-orange-500">{{ getActiveCitiesPercentage() }}% ຂອງທັງໝົດ</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Provinces List -->
      <div class="space-y-4">
        <div v-for="province in provinces" :key="province.id" class="border rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <v-icon color="primary" class="mr-2">mdi-map</v-icon>
              <h3 class="text-lg font-semibold">{{ province.name }}</h3>
              <v-chip size="small" class="ml-2">
                {{ province.cities ? province.cities.length : 0 }} ເມືອງ
              </v-chip>
            </div>
            <div class="flex items-center space-x-2">
              <v-btn 
                size="small" 
                color="primary" 
                prepend-icon="mdi-plus"
                @click="$emit('add-city-to-province', province)"
              >
                ເພີ່ມເມືອງ
              </v-btn>
              <v-btn 
                size="small" 
                color="secondary" 
                icon="mdi-pencil"
                @click="$emit('edit-province', province)"
              />
              <v-btn 
                size="small" 
                color="error" 
                icon="mdi-delete"
                @click="$emit('delete-province', province)"
                :disabled="province.cities && province.cities.length > 0"
              />
            </div>
          </div>

          <!-- Cities in Province -->
          <div v-if="province.cities && province.cities.length > 0" class="ml-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div 
                v-for="city in province.cities" 
                :key="city.id" 
                class="bg-gray-50 border rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium">{{ city.name || city.name_th || city.name_en || 'Unknown' }}</h4>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ formatCoordinate(city.latitude || city.lat) }}, {{ formatCoordinate(city.longitude || city.lon) }}
                    </div>
                    <div class="flex items-center space-x-2 mt-2">
                      <v-chip 
                        :color="getRegionColor(city.region || 'Central')" 
                        size="x-small"
                      >
                        {{ getRegionText(city.region || 'Central') }}
                      </v-chip>
                      <v-chip 
                        :color="(city.status || 'Active') === 'Active' ? 'success' : 'warning'" 
                        size="x-small"
                      >
                        {{ city.status || 'Active' }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="flex flex-col space-y-1">
                    <v-btn 
                      size="x-small" 
                      color="primary" 
                      icon="mdi-pencil"
                      @click="$emit('edit-city', city)"
                    />
                    <v-btn 
                      size="x-small" 
                      color="error" 
                      icon="mdi-delete"
                      @click="$emit('delete-city', city)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-else class="text-center py-8 text-gray-500">
            <v-icon size="48" class="mb-2">mdi-city-variant-outline</v-icon>
            <p>ບໍ່ມີເມືອງໃນແຂວງນີ້</p>
            <v-btn 
              size="small" 
              color="primary" 
              class="mt-2"
              @click="$emit('add-city-to-province', province)"
            >
              ເພີ່ມເມືອງທຳອິດ
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Empty State for Provinces -->
      <div v-if="provinces.length === 0" class="text-center py-12">
        <v-icon size="64" class="mb-4 text-gray-400">mdi-map-outline</v-icon>
        <h3 class="text-lg font-semibold text-gray-600 mb-2">ບໍ່ມີຂໍ້ມູນແຂວງ</h3>
        <p class="text-gray-500 mb-4">ເລີ່ມຕົ້ນດ້ວຍການເພີ່ມແຂວງທຳອິດ</p>
        <v-btn color="primary" @click="$emit('add-province')">
          ເພີ່ມແຂວງ
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  provinces: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'refresh',
  'edit-province',
  'delete-province',
  'add-city-to-province',
  'edit-city',
  'delete-city'
])

// Helper functions
function getTotalCities() {
  return props.provinces.reduce((total, province) => {
    return total + (province.cities ? province.cities.length : 0)
  }, 0)
}

function getAverageCities() {
  if (props.provinces.length === 0) return 0
  return Math.round(getTotalCities() / props.provinces.length * 10) / 10
}

function getActiveCities() {
  let activeCount = 0
  props.provinces.forEach(province => {
    if (province.cities) {
      province.cities.forEach(city => {
        if (city.status === 'Active' || !city.status) {
          activeCount++
        }
      })
    }
  })
  return activeCount
}

function getActiveCitiesPercentage() {
  const total = getTotalCities()
  if (total === 0) return 0
  return Math.round((getActiveCities() / total) * 100)
}

function formatCoordinate(coord) {
  if (coord === null || coord === undefined || isNaN(coord)) return '0.0000'
  return parseFloat(coord).toFixed(4)
}

function getRegionColor(region) {
  switch(region) {
    case 'North': return 'blue'
    case 'Central': return 'green'
    case 'South': return 'orange'
    default: return 'grey'
  }
}

function getRegionText(region) {
  switch(region) {
    case 'North': return 'ພາກເໜືອ'
    case 'Central': return 'ພາກກາງ'
    case 'South': return 'ພາກໃຕ້'
    default: return region
  }
}
</script>
