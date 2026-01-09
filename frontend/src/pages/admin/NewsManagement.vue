<template>
  <div class="p-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <div class="bg-purple-100 rounded-lg p-3 mr-4">
            <v-icon size="28" color="purple">mdi-newspaper</v-icon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">ການຈັດການຂ່າວສານ</h1>
            <p class="text-gray-600 mt-1">ຈັດການບົດຄວາມຂ່າວສານ, ຮູບພາບ, ແລະເນື້ອຫາ YouTube</p>
          </div>
        </div>
        <v-btn
          v-if="canAddNews"
          color="primary"
          variant="elevated"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          ເພີ່ມຂ່າວ
        </v-btn>
        <v-btn
          v-if="canExportNews"
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-download"
          @click="exportNews"
          class="ml-2"
        >
          Export ຂໍ້ມູນ
        </v-btn>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-lg">
            <v-icon color="blue" size="24">mdi-newspaper</v-icon>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">ບົດຄວາມທັງໝົດ</p>
            <p class="text-2xl font-bold text-gray-900">{{ newsList.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-red-100 rounded-lg">
            <v-icon color="red" size="24">mdi-youtube</v-icon>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">ວິດີໂອ YouTube</p>
            <p class="text-2xl font-bold text-gray-900">{{ youtubeList.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-lg">
            <v-icon color="purple" size="24">mdi-image</v-icon>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">ມີຮູບພາບ</p>
            <p class="text-2xl font-bold text-gray-900">{{ newsWithImages }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-100 rounded-lg">
            <v-icon color="orange" size="24">mdi-star</v-icon>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">ຂ່າວດ່ວນ</p>
            <p class="text-2xl font-bold text-gray-900">{{ highlightedNews + featuredYouTube }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- YouTube Upload Section (Independent) -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <v-icon class="mr-2" color="red">mdi-youtube</v-icon>
        ອັບໂຫຼດວິດີໂອ YouTube
      </h3>
      <div class="space-y-4">
        <v-text-field
          v-model="youtubeData.title"
          label="ຫົວຂໍ້ວິດີໂອ (ທາງເລືອກ)"
          placeholder="ຫົວຂໍ້ວິດີໂອ YouTube..."
          prepend-inner-icon="mdi-format-title"
          variant="outlined"
        ></v-text-field>
        
        <v-textarea
          v-model="youtubeData.description"
          label="ຄຳອະທິບາຍວິດີໂອ (ທາງເລືອກ)"
          placeholder="ຄຳອະທິບາຍກ່ຽວກັບວິດີໂອ..."
          prepend-inner-icon="mdi-text"
          variant="outlined"
          rows="3"
        ></v-textarea>
        
        <v-text-field
          v-model="youtubeData.youtube_url"
          label="ລິ້ງ YouTube"
          placeholder="https://www.youtube.com/watch?v=..."
          prepend-inner-icon="mdi-youtube"
          variant="outlined"
          :rules="[v => !!v || 'ຕ້ອງລະບຸລິ້ງ YouTube', v => isValidYouTubeUrl(v) || 'ລິ້ງ YouTube ບໍ່ຖືກຕ້ອງ']"
        ></v-text-field>
        
        <div class="flex gap-2">
          <v-btn
            color="red"
            variant="elevated"
            prepend-icon="mdi-youtube"
            @click="uploadYouTubeVideo"
            :disabled="!isValidYouTubeForm"
            :loading="uploadingYoutube"
            class="flex-shrink-0"
          >
            ອັບໂຫຼດວິດີໂອ
          </v-btn>
          <v-btn
            color="grey"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="clearYouTubeForm"
            :disabled="uploadingYoutube"
          >
            ເຄລຍຟອມ
          </v-btn>
        </div>
        
        <div v-if="uploadingYoutube" class="text-center p-4 bg-red-50 rounded-lg">
          <v-progress-circular
            indeterminate
            color="red"
            size="24"
            width="3"
            class="mr-2"
          ></v-progress-circular>
          <span class="text-red-600 font-medium">ກຳລັງອັບໂຫຼດວິດີໂອ YouTube...</span>
        </div>
      </div>
    </div>

    <!-- News and YouTube Management Section -->
    <div class="bg-white rounded-lg shadow-sm">
      <!-- Tab Headers -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button 
            @click="activeTab = 'news'"
            :class="activeTab === 'news' 
              ? 'border-blue-500 text-blue-600 border-b-2 font-medium py-4' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 font-medium py-4'"
          >
            <v-icon class="mr-2">mdi-newspaper</v-icon>
            ບົດຄວາມຂ່າວ ({{ newsList.length }})
          </button>
          <button 
            @click="activeTab = 'youtube'"
            :class="activeTab === 'youtube' 
              ? 'border-red-500 text-red-600 border-b-2 font-medium py-4' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 font-medium py-4'"
          >
            <v-icon class="mr-2">mdi-youtube</v-icon>
            ວິດີໂອ YouTube ({{ youtubeList.length }})
          </button>
        </nav>
      </div>

      <!-- News Tab Content -->
      <div v-show="activeTab === 'news'" class="overflow-x-auto">
        <div v-if="newsList.length === 0" class="p-4 text-center text-gray-500">
          <p>{{ loading ? 'ກຳລັງໂຫຼດຂ່າວ...' : 'ບໍ່ມີຂ່າວສາລ' }}</p>
        </div>
        
        <v-data-table
          :key="tableKey"
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="newsList"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <template v-slot:item.title="{ item }">
            <div class="py-2">
              <div class="font-medium">{{ item.title }}</div>
              <div class="text-sm text-gray-500 truncate max-w-xs">{{ item.description }}</div>
            </div>
          </template>
          
          <template v-slot:item.content="{ item }">
            <div class="flex gap-2">
              <v-chip v-if="item.image_url" color="purple" size="small" variant="outlined">
                <v-icon start>mdi-image</v-icon>
                ຮູບພາບ
              </v-chip>
              <v-chip v-if="!item.image_url" color="grey" size="small" variant="outlined">
                ເຉພາະຂໍ້ຄວາມ
              </v-chip>
            </div>
          </template>

          <template v-slot:item.is_highlight="{ item }">
            <v-chip
              :color="item.is_highlight ? 'success' : 'default'"
              size="small"
              variant="elevated"
            >
              {{ item.is_highlight ? 'ຂ່າວດ່ວນ' : 'ຂ່າວທົ່ວໄປ' }}
            </v-chip>
          </template>

          <template v-slot:item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="flex gap-2 justify-center">
              <v-btn
                v-if="canEditNews"
                icon="mdi-pencil"
                size="small"
                color="primary"
                variant="elevated"
                @click="editNews(item)"
                title="ແກ້ໄຂບົດຄວາມ"
                class="edit-btn"
              ></v-btn>
              <v-btn
                v-if="canEditNews"
                icon="mdi-star"
                size="small"
                :color="item.is_highlight ? 'yellow' : 'grey'"
                variant="elevated"
                @click="toggleHighlight(item)"
                :title="item.is_highlight ? 'ເອົາອອກຈາກຂ່າວດ່ວນ' : 'ເພີ່ມເປັນຂ່າວດ່ວນ'"
                class="star-btn"
              ></v-btn>
              <v-btn
                v-if="canDeleteNews"
                icon="mdi-delete"
                size="small"
                color="error"
                variant="elevated"
                @click="deleteNews(item)"
                title="ລຶບບົດຄວາມ"
                class="delete-btn"
              ></v-btn>
              <v-tooltip v-if="!canEditNews && !canDeleteNews" text="ບໍ່ມີສິດທິ">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    v-bind="props"
                    icon="mdi-eye" 
                    size="small" 
                    color="info" 
                    variant="text"
                    disabled
                  ></v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </div>

      <!-- YouTube Tab Content -->
      <div v-show="activeTab === 'youtube'" class="overflow-x-auto">
        <div v-if="youtubeList.length === 0" class="p-4 text-center text-gray-500">
          <p>{{ loadingYoutube ? 'ກຳລັງໂຫຼດວິດີໂອ YouTube...' : 'ບໍ່ມີວິດີໂອ YouTube' }}</p>
        </div>
        
        <v-data-table
          v-model:items-per-page="itemsPerPage"
          :headers="youtubeHeaders"
          :items="youtubeList"
          :loading="loadingYoutube"
          item-value="id"
          class="elevation-0"
        >
          <template v-slot:item.title="{ item }">
            <div class="py-2">
              <div class="font-medium">{{ item.title }}</div>
              <div class="text-sm text-gray-500 truncate max-w-xs">{{ item.description }}</div>
            </div>
          </template>
          
          <template v-slot:item.youtube_url="{ item }">
            <div class="flex items-center gap-2">
              <v-chip color="red" size="small" variant="outlined">
                <v-icon start>mdi-youtube</v-icon>
                YouTube
              </v-chip>
              <a :href="item.youtube_url" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs">
                {{ item.youtube_url }}
              </a>
            </div>
          </template>

          <template v-slot:item.is_featured="{ item }">
            <v-chip
              :color="item.is_featured ? 'success' : 'default'"
              size="small"
              variant="elevated"
            >
              {{ item.is_featured ? 'ວິດີໂອເດັ່ນ' : 'ວິດີໂອທົ່ວໄປ' }}
            </v-chip>
          </template>

          <template v-slot:item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="flex gap-2 justify-center">
              <v-btn
                v-if="canEditNews"
                icon="mdi-pencil"
                size="small"
                color="primary"
                variant="elevated"
                @click="editYouTube(item)"
                title="ແກ້ໄຂວິດີໂອ"
                class="edit-btn"
              ></v-btn>
              <v-btn
                v-if="canEditNews"
                icon="mdi-star"
                size="small"
                :color="item.is_featured ? 'yellow' : 'grey'"
                variant="elevated"
                @click="toggleYouTubeFeatured(item)"
                :title="item.is_featured ? 'ເອົາອອກຈາກວິດີໂອເດັ່ນ' : 'ເພີ່ມເປັນວິດີໂອເດັ່ນ'"
                class="star-btn"
              ></v-btn>
              <v-btn
                v-if="canDeleteNews"
                icon="mdi-delete"
                size="small"
                color="error"
                variant="elevated"
                @click="deleteYouTube(item)"
                title="ລຶບວິດີໂອ"
                class="delete-btn"
              ></v-btn>
              <v-tooltip v-if="!canEditNews && !canDeleteNews" text="ບໍ່ມີສິດທິ">
                <template v-slot:activator="{ props }">
                  <v-btn 
                    v-bind="props"
                    icon="mdi-eye" 
                    size="small" 
                    color="info" 
                    variant="text"
                    disabled
                  ></v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h5">
          {{ editingItem ? 'ແກ້ໄຂບົດຄວາມຂ່າວ' : 'ເພີ່ມບົດຄວາມຂ່າວ' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="formData.title"
              label="ຫົວຂໍ້ (ທາງເລືອກ)"
              placeholder="ຫົວຂໍ້ຂ່າວ..."
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-textarea
              v-model="formData.description"
              label="ຄຳອະທິບາຍ (ທາງເລືອກ)"
              placeholder="ເນື້ອຫາຂ່າວ..."
              variant="outlined"
              rows="4"
              class="mb-4"
            ></v-textarea>

            <!-- Image Upload Section -->
            <div class="mb-4 p-4 border rounded-lg bg-gray-50">
              <h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <v-icon class="mr-2" color="purple">mdi-image-plus</v-icon>
                ອັບໂຫລດຮູບພາບ
              </h4>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                <v-file-input
                  v-model="selectedImages"
                  accept="image/*"
                  multiple
                  prepend-icon="mdi-camera"
                  label="ເລືອກຮູບພາບ"
                  variant="outlined"
                  @change="handleImageUpload"
                  :loading="uploading"
                  :disabled="uploading"
                  density="compact"
                ></v-file-input>
                <p class="text-sm text-gray-500 mt-2">
                  <span v-if="uploading" class="text-purple-600 font-medium">
                    <v-icon size="16" class="mr-1">mdi-loading mdi-spin</v-icon>
                    ກຳລັງອັບໂຫລດຮູບພາບ...
                  </span>
                  <span v-else>
                    ຮອງຮັບ JPG, PNG, GIF
                  </span>
                </p>
              </div>
              <div v-if="uploadedImages.length > 0" class="mt-3">
                <p class="font-medium mb-2">ຮູບພາບທີ່ອັບໂຫລດແລ້ວ:</p>
                <div class="grid grid-cols-4 gap-2">
                  <div v-for="(image, index) in uploadedImages" :key="index" class="relative group">
                    <img 
                      :src="image.url" 
                      :alt="image.name" 
                      class="w-full h-16 object-cover rounded cursor-pointer border-2 transition-all"
                      :class="formData.image_url === image.url ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'"
                      @click="selectImageForNews(index)"
                    >
                    <v-btn
                      icon="mdi-close"
                      size="x-small"
                      color="error"
                      class="absolute -top-1 -right-1"
                      @click="removeImage(index)"
                    ></v-btn>
                    <div v-if="formData.image_url === image.url" class="absolute bottom-0 left-0 right-0 bg-purple-500 text-white text-xs text-center py-1 rounded-b">
                      ເລືອກແລ້ວ
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">ຄລິກຢູ່ຮູບພາບເພື່ອເລືອກສຳລັບບົດຄວາມຂ່າວ</p>
              </div>
            </div>

            <!-- Current selections display -->
            <div class="mb-4">
              <h4 class="font-medium mb-2">ການເລືອກເນື້ອຫາປັດຈຸບັນ:</h4>
              <div class="flex gap-2 flex-wrap">
                <v-chip v-if="formData.image_url" color="purple" size="small" variant="outlined" closable @click:close="clearSelectedImage">
                  <v-icon start>mdi-image</v-icon>
                  ຮູບພາບ
                </v-chip>
                <v-chip v-if="!formData.image_url" color="grey" size="small" variant="outlined">
                  ເຉພາະຂໍ້ຄວາມ
                </v-chip>
              </div>
            </div>

            <v-switch
              v-model="formData.is_highlight"
              label="ຕັ້ງເປັນຂ່າວດ່ວນ"
              color="primary"
              inset
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="closeDialog"
          >
            ຍົກເລີກ
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveNews"
          >
            {{ editingItem ? 'ອັບເດຕ' : 'ບັນທຶກ' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- YouTube Edit Dialog -->
    <v-dialog v-model="youtubeDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h5">
          ແກ້ໄຂວິດີໂອ YouTube
        </v-card-title>
        <v-card-text>
          <v-form ref="youtubeForm">
            <v-text-field
              v-model="youtubeData.title"
              label="ຫົວຂໍ້ວິດີໂອ (ທາງເລືອກ)"
              placeholder="ຫົວຂໍ້ວິດີໂອ YouTube..."
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-textarea
              v-model="youtubeData.description"
              label="ຄຳອະທິບາຍວິດີໂອ (ທາງເລືອກ)"
              placeholder="ຄຳອະທິບາຍກ່ຽວກັບວິດີໂອ..."
              variant="outlined"
              rows="4"
              class="mb-4"
            ></v-textarea>

            <v-text-field
              v-model="youtubeData.youtube_url"
              label="ລິ້ງ YouTube"
              placeholder="https://www.youtube.com/watch?v=..."
              variant="outlined"
              :rules="[v => !!v || 'ຕ້ອງລະບຸລິ້ງ YouTube', v => isValidYouTubeUrl(v) || 'ລິ້ງ YouTube ບໍ່ຖືກຕ້ອງ']"
              class="mb-4"
            ></v-text-field>

            <v-switch
              v-model="youtubeData.is_featured"
              label="ຕັ້ງເປັນວິດີໂອເດັ່ນ"
              color="primary"
              inset
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="closeYouTubeDialog"
          >
            ຍົກເລີກ
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveYouTube"
          >
            ອັບເດຕ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          ປິດ
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../plugins/axios'

// Get current user role for permission checking
const currentUserRole = ref('')

// Check if current user has permission for specific actions
const canAddNews = computed(() => currentUserRole.value === 'admin')
const canEditNews = computed(() => currentUserRole.value === 'admin')
const canDeleteNews = computed(() => currentUserRole.value === 'admin')
const canViewNews = computed(() => ['admin', 'viewer'].includes(currentUserRole.value))
const canExportNews = computed(() => ['admin', 'viewer'].includes(currentUserRole.value))

// Reactive data
const newsList = ref([])
const youtubeList = ref([])
const loading = ref(false)
const loadingYoutube = ref(false)
const dialog = ref(false)
const youtubeDialog = ref(false)
const editingItem = ref(null)
const editingYouTube = ref(null)
const itemsPerPage = ref(10)
const tableKey = ref(0)
const activeTab = ref('news')

// Form data
const formData = ref({
  title: '',
  description: '',
  image_url: '',
  is_highlight: false
})

// Image upload
const selectedImages = ref([])
const uploadedImages = ref([])
const uploading = ref(false)

// YouTube upload
const youtubeData = ref({
  title: '',
  description: '',
  youtube_url: ''
})
const uploadingYoutube = ref(false)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Table headers
const headers = [
  { title: 'ຫົວຂໍ້', key: 'title', sortable: true },
  { title: 'ປະເພດເນື້ອຫາ', key: 'content', sortable: false },
  { title: 'ສະຖານະ', key: 'is_highlight', sortable: true },
  { title: 'ວັນທີ່ສ້າງ', key: 'created_at', sortable: true },
  { title: 'ການດຳເນີນງານ', key: 'actions', sortable: false, width: '150px', align: 'center' }
]

const youtubeHeaders = [
  { title: 'ຫົວຂໍ້', key: 'title', sortable: true },
  { title: 'YouTube URL', key: 'youtube_url', sortable: false },
  { title: 'ສະຖານະ', key: 'is_featured', sortable: true },
  { title: 'ວັນທີ່ສ້າງ', key: 'created_at', sortable: true },
  { title: 'ການດຳເນີນງານ', key: 'actions', sortable: false, width: '150px', align: 'center' }
]

// Computed properties
const newsWithImages = computed(() => 
  newsList.value.filter(news => news.image_url).length
)

const highlightedNews = computed(() => 
  newsList.value.filter(news => news.is_highlight).length
)

const featuredYouTube = computed(() => 
  youtubeList.value.filter(video => video.is_featured).length
)

const isValidYouTubeForm = computed(() => {
  return isValidYouTubeUrl(youtubeData.value.youtube_url)
})

function isValidYouTubeUrl(url) {
  const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  return youtubeRegex.test(url)
}

// Methods
async function loadNews() {
  try {
    loading.value = true
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    const response = await api.get('/api/news')
    
    if (response.data && Array.isArray(response.data)) {
      newsList.value = response.data.map(item => ({
        ...item,
        is_highlight: item.is_highlight || false
      }))
      tableKey.value += 1
    } else {
      newsList.value = []
    }
  } finally {
    loading.value = false
  }
}

async function loadYouTubeVideos() {
  try {
    loadingYoutube.value = true
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    const response = await api.get('/api/youtube')
    
    if (response.data && Array.isArray(response.data)) {
      youtubeList.value = response.data.map(item => ({
        ...item,
        is_featured: item.is_featured || false
      }))
    } else {
      youtubeList.value = []
    }
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    } else {
      showSnackbar(
        `ຜິດພາດໃນການໂຫຼດວິດີໂອ YouTube: ${error.response?.data?.error || error.message}`, 
        'error'
      )
    }
  } finally {
    loadingYoutube.value = false
  }
}

function openAddDialog() {
  editingItem.value = null
  formData.value = {
    title: '',
    description: '',
    image_url: '',
    is_highlight: false
  }
  
  // Clear any previous uploads when starting a new article
  uploadedImages.value = []
  selectedImages.value = []
  
  dialog.value = true
}

function editNews(item) {
  editingItem.value = item
  formData.value = { ...item }
  
  // Clear upload arrays for fresh editing
  uploadedImages.value = []
  selectedImages.value = []
  
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
  editingItem.value = null
  
  // Clear upload data when closing dialog
  uploadedImages.value = []
  selectedImages.value = []
}

async function saveNews() {
  try {
    loading.value = true
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
      window.location.href = '/login'
      return
    }

    const newsData = {
      title: formData.value.title.trim() || 'ຂ່າວໃໝ່',
      description: formData.value.description.trim() || 'ບໍ່ມີເນື້ອຫາ',
      image_url: formData.value.image_url || '',
      is_highlight: formData.value.is_highlight || false
    }
    
    let response
    
    if (editingItem.value) {
      response = await api.put(`/api/news/${editingItem.value.id}`, newsData)
      showSnackbar('ອັບເດຕຂ່າວສຳເລັດແລ້ວ', 'success')
    } else {
      response = await api.post('/api/news', newsData)
      showSnackbar('ສ້າງຂ່າວສຳເລັດແລ້ວ', 'success')
    }
    
    closeDialog()
    await loadNews()
  } catch (error) {
    if (error.response?.status === 401) {
      showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else if (error.response?.status === 400) {
      showSnackbar('ຂໍ້ມູນບໍ່ຖືກຕ້ອງ - ກະລຸນາກວດສອບຂໍ້ມູນທີ່ປ້ອນ', 'error')
    } else {
      showSnackbar(
        `ຜິດພາດໃນການບັນທຶກຂ່າວ: ${error.response?.data?.error || error.message}`, 
        'error'
      )
    }
  } finally {
    loading.value = false
  }
}

async function deleteNews(item) {
  const confirmed = confirm(
    `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບບົດຄວາມຂ່າວນີ້?\n\n` +
    `ຫົວຂໍ້: "${item.title}"\n` +
    `ວັນທີ່ສ້າງ: ${formatDate(item.created_at)}\n\n` +
    `ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`
  )
  
  if (confirmed) {
    try {
      loading.value = true
      const response = await api.delete(`/api/news/${item.id}`)
      
      if (response.status === 200) {
        showSnackbar('ລຶບບົດຄວາມຂ່າວສຳເລັດແລ້ວ', 'success')
        await loadNews()
      } else {
        throw new Error('ລຶບບົດຄວາມຂ່າວບໍ່ສຳເລັດ')
      }
    } catch (error) {
      if (error.response?.status === 401) {
        showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        showSnackbar(
          `ຜິດພາດໃນການລຶບຂ່າວ: ${error.response?.data?.error || error.message}`, 
          'error'
        )
      }
    } finally {
      loading.value = false
    }
  }
}

async function toggleHighlight(item) {
  try {
    const updatedData = { ...item, is_highlight: !item.is_highlight }
    await api.put(`/api/news/${item.id}`, updatedData)
    showSnackbar(
      item.is_highlight ? 'ເອົາອອກຈາກຂ່າວດ່ວນແລ້ວ' : 'ເພີ່ມເປັນຂ່າວດ່ວນແລ້ວ', 
      'success'
    )
    loadNews()
  } catch (error) {
    if (error.response?.status === 401) {
      showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else {
      showSnackbar('ຜິດພາດໃນການອັບເດດຂ່າວ: ' + (error.response?.data?.error || error.message), 'error')
    }
  }
}

async function handleImageUpload(event) {
  const files = event.target.files || selectedImages.value
  if (files && files.length > 0) {
    uploading.value = true
    try {
      for (const file of Array.from(files)) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', file)
        
        const response = await api.post('/api/upload/image', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data && response.data.url) {
          const imageData = {
            name: file.name,
            url: response.data.url,
            file: file
          }
          uploadedImages.value.push(imageData)
          
          if (uploadedImages.value.length === 1) {
            formData.value.image_url = response.data.url
          }
        }
      }
      
      showSnackbar(`${files.length} ຮູບພາບອັບໂຫລດສຳເລັດແລ້ວ`, 'success')
    } catch (error) {
      showSnackbar(`ຜິດພາດໃນການອັບໂຫລດຮູບພາບ: ${error.response?.data?.error || error.message}`, 'error')
    } finally {
      uploading.value = false
    }
  }
}

function removeImage(index) {
  const removedImage = uploadedImages.value[index]
  uploadedImages.value.splice(index, 1)
  
  if (formData.value.image_url === removedImage.url) {
    formData.value.image_url = uploadedImages.value.length > 0 ? uploadedImages.value[0].url : ''
  }
  
  showSnackbar('ເອົາຮູບພາບອອກແລ້ວ', 'info')
}

function selectImageForNews(imageIndex) {
  if (uploadedImages.value[imageIndex]) {
    formData.value.image_url = uploadedImages.value[imageIndex].url
    showSnackbar('ເລືອກຮູບພາບສຳລັບບົດຄວາມຂ່າວນີ້ແລ້ວ', 'success')
  }
}

function clearSelectedImage() {
  formData.value.image_url = ''
  showSnackbar('ຍົກເລີກການເລືອກຮູບພາບແລ້ວ', 'info')
}

// YouTube video management functions
function editYouTube(item) {
  editingYouTube.value = item
  youtubeData.value = { ...item }
  youtubeDialog.value = true
}

function closeYouTubeDialog() {
  youtubeDialog.value = false
  editingYouTube.value = null
}

async function saveYouTube() {
  if (!isValidYouTubeForm.value) {
    showSnackbar('ກະລຸນາໃສ່ລິ້ງ YouTube ທີ່ຖືກຕ້ອງ', 'error')
    return
  }

  try {
    const updatedData = {
      title: youtubeData.value.title.trim() || 'ວິດີໂອ YouTube',
      description: youtubeData.value.description.trim() || 'ບໍ່ມີຄຳອະທິບາຍ',
      youtube_url: youtubeData.value.youtube_url.trim(),
      is_featured: youtubeData.value.is_featured || false
    }
    
    await api.put(`/api/youtube/${editingYouTube.value.id}`, updatedData)
    showSnackbar('ອັບເດຕວິດີໂອ YouTube ສຳເລັດແລ້ວ', 'success')
    
    closeYouTubeDialog()
    await loadYouTubeVideos()
  } catch (error) {
    if (error.response?.status === 401) {
      showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else {
      showSnackbar('ຜິດພາດໃນການອັບເດຕວິດີໂອ YouTube: ' + (error.response?.data?.error || error.message), 'error')
    }
  }
}

async function deleteYouTube(item) {
  const confirmed = confirm(
    `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບວິດີໂອ YouTube ນີ້?\n\n` +
    `ຫົວຂໍ້: "${item.title}"\n` +
    `URL: ${item.youtube_url}\n` +
    `ວັນທີ່ສ້າງ: ${formatDate(item.created_at)}\n\n` +
    `ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`
  )
  
  if (confirmed) {
    try {
      loadingYoutube.value = true
      const response = await api.delete(`/api/youtube/${item.id}`)
      
      if (response.status === 200) {
        showSnackbar('ลຶບວິດີໂອ YouTube ສຳເລັດແລ້ວ', 'success')
        await loadYouTubeVideos()
      } else {
        throw new Error('ລຶບວິດີໂອ YouTube ບໍ່ສຳເລັດ')
      }
    } catch (error) {
      if (error.response?.status === 401) {
        showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        showSnackbar(
          `ຜິດພາດໃນການລຶບວິດີໂອ YouTube: ${error.response?.data?.error || error.message}`, 
          'error'
        )
      }
    } finally {
      loadingYoutube.value = false
    }
  }
}

async function toggleYouTubeFeatured(item) {
  try {
    const updatedData = { ...item, is_featured: !item.is_featured }
    await api.put(`/api/youtube/${item.id}`, updatedData)
    showSnackbar(
      item.is_featured ? 'ເອົາອອກຈາກວິດີໂອເດັ່ນແລ້ວ' : 'ເພີ່ມເປັນວິດີໂອເດັ່ນແລ້ວ', 
      'success'
    )
    loadYouTubeVideos()
  } catch (error) {
    if (error.response?.status === 401) {
      showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else {
      showSnackbar('ຜິດພາດໃນການອັບເດດວິດີໂອ YouTube: ' + (error.response?.data?.error || error.message), 'error')
    }
  }
}

// YouTube upload functions
async function uploadYouTubeVideo() {
  if (!isValidYouTubeForm.value) {
    showSnackbar('ກະລຸນາໃສ່ລິ້ງ YouTube ທີ່ຖືກຕ້ອງ', 'error')
    return
  }

  uploadingYoutube.value = true
  
  try {
    const response = await api.post('/api/youtube', {
      title: youtubeData.value.title.trim() || 'ວິດີໂອ YouTube',
      description: youtubeData.value.description.trim() || 'ບໍ່ມີຄຳອະທິບາຍ',
      youtube_url: youtubeData.value.youtube_url.trim()
    })
    
    if (response.status === 201) {
      showSnackbar('ອັບໂຫຼດວິດີໂອ YouTube ສຳເລັດແລ້ວ', 'success')
      clearYouTubeForm()
      await loadYouTubeVideos()
    } else {
      throw new Error('ອັບໂຫຼດວິດີໂອ YouTube ບໍ່ສຳເລັດ')
    }
  } catch (error) {
    if (error.response?.status === 401) {
      showSnackbar('ບໍ່ໄດ້ຮັບອະນຸຍາດ - ກະລຸນາເຂົ້າສູ່ລະບົບ', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else {
      showSnackbar(
        `ຜິດພາດໃນການອັບໂຫຼດວິດີໂອ YouTube: ${error.response?.data?.error || error.message}`,
        'error'
      )
    }
  } finally {
    uploadingYoutube.value = false
  }
}

function clearYouTubeForm() {
  youtubeData.value = {
    title: '',
    description: '',
    youtube_url: ''
  }
  showSnackbar('ເຄລຍຟອມ YouTube ແລ້ວ', 'info')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  
  // Get date components
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  // Lao month names
  const laoMonths = [
    'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
    'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'
  ]
  
  const laoMonth = laoMonths[date.getMonth()]
  
  return `${day} ${laoMonth} ${year}, ${hours}:${minutes}`
}

function showSnackbar(message, color = 'success') {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

onMounted(async () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) {
    showSnackbar('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນໃຊ້ງານ', 'error')
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
    return
  }
  
  // Get current user role
  currentUserRole.value = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'viewer'
  
  // Check if user has permission to view news
  if (!canViewNews.value) {
    showSnackbar('ທ່ານບໍ່ມີສິດທິໃນການເຂົ້າເຖິງໜ້ານີ້', 'error')
    setTimeout(() => {
      window.location.href = '/admin'
    }, 2000)
    return
  }
  
  await Promise.all([loadNews(), loadYouTubeVideos()])
})
</script>

<style scoped>
.v-data-table {
  background: transparent;
}

/* Make action buttons more visible */
.v-btn.delete-btn {
  background-color: #fee2e2 !important;
  border: 1px solid #fca5a5 !important;
}

.v-btn.delete-btn:hover {
  background-color: #fecaca !important;
  transform: scale(1.05);
}

.v-btn.edit-btn {
  background-color: #dbeafe !important;
  border: 1px solid #93c5fd !important;
}

.v-btn.edit-btn:hover {
  background-color: #bfdbfe !important;
}

.v-btn.star-btn {
  background-color: #fef3c7 !important;
  border: 1px solid #fcd34d !important;
}

.v-btn.star-btn:hover {
  background-color: #fde68a !important;
}
</style>