<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import GlobalNotification from './components/GlobalNotification.vue'

// Auth state
const token = ref(null)
const username = ref('')

// Secret admin access
const secretKeys = ref([])
const adminKeySequence = ['a', 'd', 'm', 'i', 'n'] // ต้องกดเรียงลำดับ
const keyResetTime = 2000 // reset หลังจาก 2 วินาที

// Menu state
const isMenuOpen = ref(false)
const toggleMenu = () => { isMenuOpen.value = !isMenuOpen }
const closeMenu = () => { isMenuOpen.value = false }

// ฟังก์ชันอัปเดต token/username จาก localStorage
const updateAuth = () => {
  token.value = localStorage.getItem('token')
  username.value = localStorage.getItem('username') || ''
}

const router = useRouter()
const route = useRoute()

// Secret admin access handler
const handleKeyPress = (event) => {
  // เฉพาะในหน้าหลักเท่านั้น
  if (route.path !== '/') return
  
  const key = event.key.toLowerCase()
  
  // เพิ่ม key ล่าสุดเข้าไป
  secretKeys.value.push(key)
  
  // เก็บเฉพาะ keys ที่จำเป็น
  if (secretKeys.value.length > adminKeySequence.length) {
    secretKeys.value = secretKeys.value.slice(-adminKeySequence.length)
  }
  
  // ตรวจสอบว่าตรงกับลำดับ admin หรือไม่
  const currentSequence = secretKeys.value.join('')
  const targetSequence = adminKeySequence.join('')
  
  if (currentSequence === targetSequence) {
    secretKeys.value = []
    showAdminAccessOptions()
  }
  
  // Reset หลังจากเวลาที่กำหนด
  setTimeout(() => {
    secretKeys.value = []
  }, keyResetTime)
}

const showAdminAccessOptions = () => {
  // แสดง dialog หรือ redirect ไปหน้า login ปกติ
  if (confirm('🔐 Admin Access Detected!\n\nทำคุณต้องการเข้าสู่ระบบแอดมิน?')) {
    router.push('/login')
  }
}

onMounted(() => {
  updateAuth()
  window.addEventListener('storage', updateAuth)
  document.addEventListener('keypress', handleKeyPress)
})

onUnmounted(() => {
  document.removeEventListener('keypress', handleKeyPress)
})

const isLoggedIn = computed(() => !!token.value)

// ตรวจสอบว่าเป็นหน้า admin หรือไม่
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  updateAuth()
  router.push('/login')
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header - แสดงเฉพาะกับเส้นทางที่ไม่ใช่ admin -->
    <header v-if="!isAdminRoute" class="bg-white shadow-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center">
            <img src="../src/assets/image/logo.png" alt="Logo" class="h-10 w-10 mr-2 cursor-pointer" />
          </router-link>
          <span class="font-bold text-base sm:text-lg whitespace-nowrap">ກົມອຸຕຸນິຍົມ ແລະ ອຸທົກກະສາດ</span>
        </div>
        <!-- Desktop nav -->
        <nav class="hidden md:flex space-x-4 items-center">
          <router-link
            to="/"
            class="font-medium hover:underline"
            :class="{ 'text-blue-600': route.path === '/' }"
          >ໜ້າຫຼັກ</router-link>
          <router-link
            to="/airquality"
            class="font-medium hover:text-blue-600"
            :class="{ 'text-blue-600': route.path === '/airquality' }"
          >ຄຸນນະພາບອາກາດ</router-link>
          <router-link
            to="/radar"
            class="font-medium hover:text-blue-600"
            :class="{ 'text-blue-600': route.path === '/radar' }"
          >ແຜນທີເຣດາ</router-link>
          <router-link
            to="/news"
            class="font-medium hover:text-blue-600"
            :class="{ 'text-blue-600': route.path === '/news' }"
          >ຂ່າວສານ</router-link>
          <router-link
            to="/learn"
            class="font-medium hover:text-blue-600"
            :class="{ 'text-blue-600': route.path === '/learn' }"
          >ກ່ຽວກັບອົງກອນ</router-link>
        </nav>
        <!-- Hamburger Mobile -->
        <button class="md:hidden ml-2" @click="toggleMenu">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <!-- Mobile Menu Overlay -->
      <transition name="fade">
        <div
          v-if="isMenuOpen"
          class="fixed inset-0 z-50 bg-black/50 flex"
          @click.self="closeMenu"
        >
          <nav class="bg-white text-black w-64 max-w-[80vw] h-full shadow-xl p-6 flex flex-col space-y-4">
            <button class="self-end mb-4" @click="closeMenu">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <router-link to="/" class="py-2 border-b" @click="closeMenu">ໜ້າຫຼັກ</router-link>
            <router-link to="/airquality" class="py-2 border-b" @click="closeMenu">ຄຸນນະພາບອາກາດ</router-link>
            <router-link to="/radar" class="py-2 border-b" @click="closeMenu">ແຜນທີເຣດາ</router-link>
            <router-link to="/news" class="py-2 border-b" @click="closeMenu">ຂ່າວສານ</router-link>
            <router-link to="/learn" class="py-2" @click="closeMenu">ກ່ຽວກັບອົງກອນ</router-link>
          </nav>
        </div>
      </transition>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-h-0">
      <router-view class="flex-1" />
    </main>

    <!-- Footer - แสดงเฉพาะกับเส้นทางที่ไม่ใช่ admin -->
    <footer v-if="!isAdminRoute" class="bg-blue-800 text-white py-3">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Info -->
          <div>
            <h3 class="font-bold text-lg mb-3">ກົມອຸຕຸນິຍົມ ແລະ ອຸທົກກະສາດ</h3>
            <p class="text-blue-200">ກະຊວງຊັບພະຍາກອນທຳມະຊາດ ແລະ ສິ່ງແວດລ້ອມ</p>
            <p class="text-blue-200 mt-2">
              ຖະຫນົນສຸພານຸວົງ ບ້ານ ອາກາດ ເມືອງ ສີໂຄດຕະບອງ ນະຄອນຫລວງວຽງຈັນ ສ.ປ.ປ.ລາວ.
            </p>
          </div>
          <!-- Contact -->
          <div>
            <h3 class="font-bold text-lg mb-3">ຕິດຕໍ່ພວກເຮົາ</h3>
            <p class="text-blue-200">ໂທລະສັບ: +856 23 724 289</p>
            <p class="text-blue-200">ແຟັກ: +856 24 725 276</p>
            <p class="text-blue-200">ອີເມວ: info@dmh.gov.la</p>
          </div>
          <!-- Social -->
          <div>
            <h3 class="font-bold text-lg mb-3 text-center md:text-left">ຊ່ອງທາງຕິດຕາມ</h3>
            <div class="flex justify-center md:justify-start space-x-8">
              <!-- Facebook -->
              <a
                href="https://www.facebook.com/p/%E0%BA%81%E0%BA%BB%E0%BA%A1%E0%BA%AD%E0%BA%B8%E0%BA%95%E0%BA%B8%E0%BA%99%E0%BA%B4%E0%BA%8D%E0%BA%BB%E0%BA%A1-%E0%BB%81%E0%BA%A5%E0%BA%B0-%E0%BA%AD%E0%BA%B8%E0%BA%97%E0%BA%BB%E0%BA%81%E0%BA%81%E0%BA%B0%E0%BA%AA%E0%BA%B2%E0%BA%94-100066540918462/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                class="hover:text-blue-300"
              >
                <svg class="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <!-- YouTube -->
              <a
                href="https://www.youtube.com/@dmh4217"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                class="hover:text-blue-300"
              >
                <svg class="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div class="pt-6 border-t border-blue-700 text-center text-blue-300 text-sm mt-4">
          <p>© 2025 ກົມອຸຕຸນິຍົມ ແລະ ອຸທົກກະສາດ. ສະຫງວນລິຂະສິດ.</p>
        </div>
      </div>
    </footer>

    <!-- Global Notification Component -->
    <GlobalNotification />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap');
body {
  font-family: 'Noto Sans Lao', sans-serif;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
