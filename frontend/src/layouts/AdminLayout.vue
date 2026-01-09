<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-blue-800 text-white min-h-screen">
      <div class="p-4">
        <div class="flex items-center mb-8">
          <img src="../assets/image/logo.png" alt="Logo" class="h-8 w-8 mr-2" />
          <span class="text-xl font-semibold">ກົມອຸຕຸນິຍົມ</span>
        </div>
        <nav class="space-y-2">
          <router-link 
            to="/admin" 
            class="flex items-center p-3 rounded-lg transition"
            :class="$route.path === '/admin' ? 'bg-blue-900 border-l-4 border-black shadow-lg' : 'hover:bg-blue-700'"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            ໜ້າຫຼັກ
          </router-link>
          <router-link 
            to="/admin/news" 
            class="flex items-center p-3 rounded-lg transition"
            :class="$route.path === '/admin/news' ? 'bg-blue-900 border-l-4 border-black shadow-lg' : 'hover:bg-blue-700'"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            ຈັດການຂ່າວ
          </router-link>
          <router-link 
            to="/admin/users" 
            class="flex items-center p-3 rounded-lg transition"
            :class="$route.path === '/admin/users' ? 'bg-blue-900 border-l-4 border-black shadow-lg' : 'hover:bg-blue-700'"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            ຈັດການຜູ້ໃຊ້
          </router-link>
          <router-link 
            to="/admin/cities" 
            class="flex items-center p-3 rounded-lg transition"
            :class="$route.path === '/admin/cities' ? 'bg-blue-900 border-l-4 border-black shadow-lg' : 'hover:bg-blue-700'"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ຈັດການແຂວງ ແລະ ເມືອງ
          </router-link>
          <router-link 
            to="/admin/weather-data" 
            class="flex items-center p-3 rounded-lg transition"
            :class="$route.path === '/admin/weather-data' ? 'bg-blue-900 border-l-4 border-black shadow-lg' : 'hover:bg-blue-700'"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            ຂໍ້ມູນສະພາບອາກາດ
          </router-link>
          <router-link 
            to="/admin/notifications" 
            class="flex items-center p-3 rounded-lg transition"
            :class="$route.path === '/admin/notifications' ? 'bg-blue-900 border-l-4 border-black shadow-lg' : 'hover:bg-blue-700'"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 2a6 6 0 016 6v3.586l1.707 1.707A1 1 0 0117 15H7a1 1 0 01-.707-1.707L8 11.586V8a6 6 0 016-6zM10 18a2 2 0 104 0" />
            </svg>
            ແຈ້ງເຕືອນ & ເຕືອນໄພ
          </router-link>
          
          <!-- Logout Button -->
          <button 
            @click="logout"
            class="flex items-center p-3 rounded-lg transition hover:bg-red-700 bg-red-600 mt-4 w-full"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ອອກຈາກລະບົບ
          </button>
        </nav>
      </div>
    </div>
    <!-- Main Content -->
    <div class="flex-1 overflow-auto bg-[#f4f7fa]">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  // Clear all authentication data
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
  localStorage.removeItem('userId')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('userRole')
  sessionStorage.removeItem('username')
  sessionStorage.removeItem('userId')
  
  // Redirect to login page
  router.push('/login')
}
</script>
