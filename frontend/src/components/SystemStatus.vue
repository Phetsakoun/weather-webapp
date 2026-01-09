<template>
  <div class="p-4 bg-white rounded shadow">
    <h3 class="text-lg font-bold mb-4">System Status</h3>
    
    <div class="space-y-2">
      <div class="flex items-center">
        <span class="w-3 h-3 rounded-full mr-2" :class="backendStatus ? 'bg-green-500' : 'bg-red-500'"></span>
        <span>Backend Server: {{ backendStatus ? 'Online' : 'Offline' }}</span>
      </div>
      
      <div class="flex items-center">
        <span class="w-3 h-3 rounded-full mr-2" :class="authStatus ? 'bg-green-500' : 'bg-red-500'"></span>
        <span>Authentication: {{ authStatus ? 'Valid' : 'Invalid' }}</span>
      </div>
      
      <div class="flex items-center">
        <span class="w-3 h-3 rounded-full mr-2" :class="adminStatus ? 'bg-green-500' : 'bg-red-500'"></span>
        <span>Admin Access: {{ adminStatus ? 'Granted' : 'Denied' }}</span>
      </div>
    </div>
    
    <div class="mt-4 p-2 bg-gray-100 rounded text-sm">
      <div><strong>Token:</strong> {{ token ? 'Present' : 'None' }}</div>
      <div><strong>User Role:</strong> {{ userRole || 'None' }}</div>
      <div><strong>Username:</strong> {{ username || 'None' }}</div>
    </div>
    
    <div class="mt-4 space-x-2">
      <v-btn @click="checkStatus" color="primary" size="small">Refresh Status</v-btn>
      <v-btn @click="testLogin" color="secondary" size="small">Test Login</v-btn>
      <v-btn @click="clearStorage" color="error" size="small">Clear Storage</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../plugins/axios.js'

const backendStatus = ref(false)
const authStatus = ref(false)
const adminStatus = ref(false)
const token = ref('')
const userRole = ref('')
const username = ref('')

const checkStatus = async () => {
  // Check backend connectivity
  try {
    await api.get('/auth/verify')
    backendStatus.value = true
  } catch (error) {
    backendStatus.value = false
    console.error('Backend check failed:', error)
  }
  
  // Check local storage
  token.value = localStorage.getItem('token') || sessionStorage.getItem('token')
  userRole.value = localStorage.getItem('userRole') || sessionStorage.getItem('userRole')
  username.value = localStorage.getItem('username') || sessionStorage.getItem('username')
  
  // Check auth status
  authStatus.value = !!token.value
  adminStatus.value = userRole.value === 'admin'
}

const testLogin = async () => {
  try {
    const res = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    })
    console.log('Test login response:', res.data)
    alert('Test login successful!')
    await checkStatus()
  } catch (error) {
    console.error('Test login failed:', error)
    alert('Test login failed: ' + (error.response?.data?.message || error.message))
  }
}

const clearStorage = () => {
  localStorage.clear()
  sessionStorage.clear()
  checkStatus()
  alert('Storage cleared!')
}

onMounted(() => {
  checkStatus()
})
</script>
