import axios from 'axios'
import { logout } from '../router/index.js'

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000'
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error) // Debug log
    if (error.response?.status === 401) {
      // Check if this is a public endpoint that doesn't require auth
      const isPublicEndpoint = error.config?.url?.includes('/public') || 
                              error.config?.url?.includes('/auth/')
      
      if (!isPublicEndpoint) {
        // Only redirect to login for protected endpoints
        console.log('🔒 Unauthorized access to protected endpoint, redirecting to login')
        logout()
        window.location.href = '/login'
      } else {
        console.log('⚠️ Public endpoint returned 401, but not redirecting to login')
      }
    }
    return Promise.reject(error)
  }
)

// Make the api instance available globally
window.$api = api

export { api }
export default api
