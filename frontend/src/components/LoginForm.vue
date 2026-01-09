<template>
  <div class="min-h-screen w-full flex relative overflow-hidden bg-white">
    <!-- BG อาคารเต็มจอ -->
    <div class="absolute inset-0 w-full h-full z-0">
      <img :src="bgImage" class="w-full h-full object-cover" />
    </div>
    <!-- SVG Wave Overlay -->
    <svg
      class="absolute top-0 right-0 h-full z-10"
      style="width: 70vw; min-width: 500px; max-width: 1000px;"
      viewBox="0 0 900 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
<path
  d="M900,0 Q500,60 300,200 Q10,900 0,900 L900,900 Z"
  fill="white"
/>
    </svg>
    <!-- Box Login -->
    <div class="relative z-30 flex flex-col md:flex-row items-center justify-end h-screen w-full">
      <div class="flex-1"></div>
      <div class="flex-1 flex items-center justify-center md:pr-16">
        <div class="w-full max-w-md bg-white/95 shadow-2xl rounded-3xl p-10">
          <div class="mb-7">
            <h2 class="text-3xl font-bold text-blue-900 mb-2">Login</h2>
            <p class="text-gray-700 text-sm">ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານເພື່ອເຂົ້າສູ່ລະບົບ</p>
          </div>
          <form @submit.prevent="login" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <v-text-field
                v-model="username"
                variant="outlined"
                density="comfortable"
                class="custom-input"
                hide-details="auto"
                :rules="[rules.required]"
                autocomplete="username"
                placeholder="ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <v-text-field
                v-model="password"
                variant="outlined"
                density="comfortable"
                class="custom-input"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                hide-details="auto"
                :rules="[rules.required]"
                autocomplete="current-password"
                placeholder="ກະລຸນາປ້ອນລະຫັດຜ່ານ"
              />
            </div>
            <div class="flex items-center justify-between py-2">
              <v-checkbox
                v-model="remember"
                label="ຈື່ລະຫັດຜ່ານ"
                hide-details
                density="compact"
                color="primary"
                class="text-sm"
              />
              <a href="#" class="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                ລືມລະຫັດຜ່ານ
              </a>
            </div>
            <v-btn
              type="submit"
              class="w-full mt-6"
              color="indigo-darken-4"
              size="large"
              :loading="loading"
              elevation="2"
              :rounded="'lg'"
            >
              Login
            </v-btn>
            <div v-if="error" class="mt-4">
              <v-alert
                type="error"
                variant="tonal"
                :text="error"
                closable
                @click:close="error = ''"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import bgImage from '../assets/image/bgloing.png'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../plugins/axios'

// -- ฟอร์ม login เหมือนเดิม --
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const remember = ref(false)
const error = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()
const rules = {
  required: v => !!v || 'ກະລຸນາປ້ອນຂໍ້ມູນ'
}

const login = async () => {
  if (!username.value || !password.value) {
    error.value = 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ແລະລະຫັດຜ່ານ'
    return
  }
  loading.value = true
  error.value = ''
  
  console.log('🔐 Starting login process...') // Debug log
  console.log('📡 API baseURL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api') // Debug log
  
  try {
    console.log('📤 Sending login request...') // Debug log
    const res = await api.post('/api/auth/login', {
      username: username.value,
      password: password.value,
      remember: remember.value
    })
    
    console.log('✅ Login response received:', res.data) // Debug log
    
    // Store authentication data
    const storage = remember.value ? localStorage : sessionStorage
    storage.setItem('token', res.data.token)
    storage.setItem('username', res.data.username)
    storage.setItem('userRole', res.data.role)
    storage.setItem('userId', res.data.userId)
    
    console.log('💾 Stored auth data:') // Debug log
    console.log('   - Token:', res.data.token ? 'Present' : 'Missing') // Debug log
    console.log('   - Role:', res.data.role) // Debug log
    console.log('   - Username:', res.data.username) // Debug log
    
    // Force trigger auth state update
    window.dispatchEvent(new Event('storage'))
    
    // Small delay to ensure auth state is updated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Redirect logic based on user role
    let redirectTo = '/' // default หน้าผู้ใช้ปกติ
    
    if (res.data.role === 'admin' || res.data.role === 'superadmin') {
      // ถ้าเป็น admin หรือ superadmin ให้ไปหน้า dashboard ทันที
      redirectTo = '/admin/dashboard'
    } else {
      // ถ้าไม่ใช่ admin ให้ไปหน้าหลัก
      redirectTo = '/'
    }
    
    // ถ้ามี redirect parameter จาก URL ให้ใช้นั้นแทน (เฉพาะ admin เท่านั้น)
    if (route.query.redirect && (res.data.role === 'admin' || res.data.role === 'superadmin')) {
      // ถ้า redirect มาจาก /admin ให้ไปที่ dashboard แทน
      if (route.query.redirect === '/admin') {
        redirectTo = '/admin/dashboard'
      } else {
        redirectTo = route.query.redirect
      }
    }
    
    console.log('🎯 Login successful, redirecting to:', redirectTo) // Debug log
    console.log('🔍 User role:', res.data.role) // Debug log
    console.log('🔍 Original redirect request:', route.query.redirect) // Debug log
    
    // ใช้ replace แทน push เพื่อให้แน่ใจว่า navigation ทำงาน
    try {
      await router.replace(redirectTo)
      console.log('✅ Redirect completed') // Debug log
    } catch (routerError) {
      console.error('❌ Router error:', routerError)
      // ถ้า router ล้มเหลว ลองใช้ window.location
      window.location.href = redirectTo
    }
    
  } catch (e) {
    console.error('❌ Login failed:', e) // Debug log
    console.error('❌ Error response:', e.response) // Debug log
    error.value = e.response?.data?.message || 'ເຂົ້າສູ່ລະບົບລົ້ມເຫລວ'
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
@media (max-width: 900px) {
  svg { display: none !important; }
  .z-20 { display: none !important; }
}
</style>
