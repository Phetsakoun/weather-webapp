<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm">
      <div class="container mx-auto py-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">ຂ່າວສານ</h1>
          <p class="text-gray-600">ຂ່າວສານ ແລະ ການປະກາດຂອງກົມອຸຕຸນິຍົມວິທະຍາ</p>
        </div>
      </div>
    </div>

    <div class="container mx-auto py-8 px-4">
      <!-- Featured YouTube Video Section -->
      <div v-if="featuredVideo" class="mb-8">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="bg-red-600 text-white px-6 py-3">
            <div class="flex items-center">
              <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span class="text-lg font-semibold">ພະຍາກອນອາກາດປະຈຳວັນຈາກກົມອຸຕຸນິຍົມ ແລະ ອຸທົກກະສາດ</span>
            </div>
          </div>
          <div class="p-6">
            <div class="relative w-full" style="padding-bottom: 56.25%;">
              <iframe 
                class="absolute top-0 left-0 w-full h-full rounded-lg"
                :src="getEmbedUrl(featuredVideo.youtube_url)"
                frameborder="0" 
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
              </iframe>
            </div>
            <div class="mt-4">
              <h3 class="text-xl font-bold text-gray-900">{{ featuredVideo.title }}</h3>
              <p class="text-gray-600 mt-2">{{ featuredVideo.description }}</p>
              <div class="text-sm text-gray-500 mt-2">
                ອັບໂຫຼດເມື່ອ: {{ formatDate(featuredVideo.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other YouTube Videos Section -->
      <div v-if="otherVideos.length > 0" class="mb-8">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center">
            <svg class="w-6 h-6 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            ວິດີໂອອື່ນໆ
          </h2>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div v-for="video in otherVideos" :key="video.id" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div class="relative">
              <div class="relative w-full" style="padding-bottom: 56.25%;">
                <iframe 
                  class="absolute top-0 left-0 w-full h-full"
                  :src="getEmbedUrl(video.youtube_url)"
                  frameborder="0" 
                  allowfullscreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                </iframe>
              </div>
              <div class="absolute top-2 right-2">
                <div class="bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </div>
              </div>
            </div>
            
            <div class="p-4">
              <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{{ video.title }}</h3>
              <div class="text-sm text-gray-500 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                {{ formatDate(video.created_at) }}
              </div>
              <p class="text-gray-700 text-sm leading-relaxed line-clamp-3">{{ video.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- YouTube Video Section - Featured at Top -->
      <div v-if="highlightNews && highlightNews.youtube_url" class="mb-8">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="bg-red-600 text-white px-6 py-3">
            <div class="flex items-center">
              <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span class="text-lg font-semibold">DMH YouTube Channel</span>
            </div>
          </div>
          <div class="p-6">
            <div class="relative w-full" style="padding-bottom: 56.25%;">
              <iframe 
                class="absolute top-0 left-0 w-full h-full rounded-lg"
                :src="getEmbedUrl(highlightNews.youtube_url)"
                frameborder="0" 
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
              </iframe>
            </div>
            <div class="mt-4">
              <h3 class="text-xl font-bold text-gray-900">{{ highlightNews.title }}</h3>
              <p class="text-gray-600 mt-2">{{ highlightNews.description }}</p>
              <div class="text-sm text-gray-500 mt-2">
                ອັບໂຫຼດເມື່ອ: {{ formatDate(highlightNews.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other News Section -->
      <div v-if="newsList.length > 0">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
            </svg>
            ຂ່າວສານອື່ນໆ
          </h2>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="item in newsList" :key="item.id" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <!-- YouTube Video Section for items with youtube_url -->
            <div v-if="item.youtube_url" class="relative">
              <div class="relative w-full" style="padding-bottom: 56.25%;">
                <iframe 
                  class="absolute top-0 left-0 w-full h-full"
                  :src="getEmbedUrl(item.youtube_url)"
                  frameborder="0" 
                  allowfullscreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                </iframe>
              </div>
              <div class="absolute top-2 right-2">
                <div class="bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </div>
              </div>
            </div>
            
            <!-- Image Section for items with image_url but no youtube_url -->
            <div v-else-if="item.image_url" class="relative">
              <img 
                :src="getImageUrl(item.image_url)" 
                :alt="item.title"
                class="w-full h-48 object-cover"
                @error="handleImageError"
              />
            </div>
            
            <div class="p-4">
              <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{{ item.title }}</h3>
              <div class="text-sm text-gray-500 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                {{ formatDate(item.created_at) }}
              </div>
              <p class="text-gray-700 text-sm leading-relaxed line-clamp-3">{{ item.description }}</p>
              
              <!-- Additional YouTube info for items with YouTube -->
              <div v-if="item.youtube_url" class="mt-3">
                <div class="inline-flex items-center text-red-600 text-sm font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  ມີວິດີໂອ YouTube
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="newsList.length === 0" class="text-center py-12">
        <div class="bg-white rounded-lg shadow-md p-8">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">ບໍ່ມີຂ່າວສານ</h3>
          <p class="text-gray-600">ຍັງບໍ່ມີຂ່າວສານທີ່ຈະສະແດງໃນເວລານີ້</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../plugins/axios';

const newsList = ref([]);
const youtubeVideos = ref([]);

function getImageUrl(imagePath) {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it starts with /uploads/, prepend backend URL
  if (imagePath.startsWith('/uploads/')) {
    return `http://localhost:5000${imagePath}`;
  }
  
  // Otherwise, assume it's a relative path and prepend backend URL
  return `http://localhost:5000/${imagePath}`;
}

function handleImageError(event) {
  console.error('Image load error:', event.target.src);
  // You can set a default image here if needed
  // event.target.src = '/path/to/default-image.jpg';
}

function getEmbedUrl(url) {
  if (!url) return '';
  
  console.log('Processing YouTube URL:', url); // Debug log
  
  // Handle different YouTube URL formats
  let videoId = '';
  
  // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
  let match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/);
  if (match) {
    videoId = match[1];
  } else {
    // Short YouTube URL: https://youtu.be/VIDEO_ID
    match = url.match(/(?:https?:\/\/)?youtu\.be\/([^?&\s]+)/);
    if (match) {
      videoId = match[1];
    } else {
      // Embedded URL: https://www.youtube.com/embed/VIDEO_ID
      match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&\s]+)/);
      if (match) {
        videoId = match[1];
      }
    }
  }
  
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  console.log('Generated embed URL:', embedUrl); // Debug log
  return embedUrl;
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

const featuredVideo = computed(() => youtubeVideos.value.find(v => v.is_featured === true || v.is_featured === 1) || youtubeVideos.value[0] || null);
const otherVideos = computed(() => youtubeVideos.value.filter(v => featuredVideo.value ? v.id !== featuredVideo.value.id : true));
const highlightNews = computed(() => newsList.value.find(n => n.is_highlight === true || n.is_highlight === 1) || null);

async function loadYouTubeVideos() {
  try {
    console.log('Loading YouTube videos...');
    const res = await api.get('/api/youtube/public');
    youtubeVideos.value = res.data;
    console.log('YouTube videos loaded:', res.data);
    console.log('YouTube videos count:', youtubeVideos.value.length);
  } catch (error) {
    console.error('Error loading YouTube videos:', error);
  }
}

async function loadNews() {
  try {
    console.log('Loading news for public page...');
    
    // Use only the public endpoint
    const res = await api.get('/api/news/public');
    console.log('✅ Success with /api/news/public');
    
    console.log('API Response Status:', res.status);
    console.log('API Response Data:', res.data);
    
    if (res.data && Array.isArray(res.data)) {
      newsList.value = res.data;
      console.log('News loaded successfully, count:', newsList.value.length);
      
      // Debug YouTube URLs
      newsList.value.forEach((news, index) => {
        console.log(`News ${index + 1}:`, {
          id: news.id,
          title: news.title,
          youtube_url: news.youtube_url,
          image_url: news.image_url,
          is_highlight: news.is_highlight
        });
        
        if (news.youtube_url) {
          console.log(`  -> YouTube URL:`, news.youtube_url);
          console.log(`  -> Embed URL:`, getEmbedUrl(news.youtube_url));
        }
      });
    } else {
      console.error('Response data is not an array:', res.data);
      newsList.value = [];
    }
  } catch (error) {
    console.error('Error loading news:', error);
    console.error('Error response status:', error.response?.status);
    console.error('Error response data:', error.response?.data);
    console.error('Error details:', error.response);
    
    // Don't redirect to login, just show empty state
    newsList.value = [];
  }
}

onMounted(async () => {
  await Promise.all([loadNews(), loadYouTubeVideos()]);
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
