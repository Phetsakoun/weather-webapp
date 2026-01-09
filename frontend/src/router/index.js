// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { showError } from '../services/notificationService'

// import หน้า page/component ที่จะใช้เป็น route
import Home from '../pages/Home.vue'
import TomorrowForecast from '../components/TomorrowForecast.vue'
import SevenDayForecast from '../components/SevenDayForecast.vue'
import LoginForm from '../components/LoginForm.vue'
import AirQualityPage from '../pages/AirQualityPage.vue'
import RadarPage from '../pages/RadarPage.vue'
import NewsPage from '../pages/NewsPage.vue'
import LearnPage from '../pages/AboutOrganization.vue'
import AdminDashboard from '../pages/admin/AdminDashboard.vue'
import UserManagement from '../pages/admin/UserManagement.vue'
import CityProvinceManagement from '../pages/admin/CityProvinceManagement.vue'
import WeatherDataReview from '../pages/admin/WeatherDataReview.vue'
import ModelManagement from '../pages/admin/ModelManagement.vue'
import NotificationManagement from '../pages/admin/NotificationManagement.vue'

import NewsManagement from '../pages/admin/NewsManagement.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

// Authentication helper function
function isAuthenticated() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  console.log('🔍 Checking authentication:')
  console.log('   - Token present:', !!token)
  
  if (!token) {
    console.log('❌ No token found')
    return false
  }
  
  try {
    // Basic token format validation (JWT has 3 parts separated by dots)
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid token format')
      return false
    }
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]))
    console.log('   - Token payload:', payload)
    
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log('❌ Token expired')
      // Token expired, remove it
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('userRole')
      sessionStorage.removeItem('userRole')
      return false
    }
    
    console.log('✅ Token is valid')
    return true
  } catch (error) {
    console.log('❌ Token validation error:', error)
    // Invalid token format
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('userRole')
    sessionStorage.removeItem('userRole')
    return false
  }
}

// Admin role check function
function isAdmin() {
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole')
  console.log('👑 Checking admin role:')
  console.log('   - Stored role:', userRole)
  console.log('   - Is admin:', userRole === 'admin' || userRole === 'superadmin')
  return userRole === 'admin' || userRole === 'superadmin'
}

// Logout function
function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
  localStorage.removeItem('userId')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('userRole')
  sessionStorage.removeItem('username')
  sessionStorage.removeItem('userId')
}

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/airquality', name: 'AirQuality', component: AirQualityPage },
  { path: '/tomorrow',  name: 'Tomorrow', component: TomorrowForecast },
  { path: '/7day',      name: '7Day',     component: SevenDayForecast },
  { path: '/login', name: 'Login', component: LoginForm },
  { path: '/radar', name: 'Radar', component: RadarPage },
  { path: '/news', name: 'News', component: NewsPage },
  { path: '/learn', name: 'Learn', component: LearnPage },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    beforeEnter: (to, from, next) => {
      console.log('Admin route beforeEnter triggered') // Debug log
      if (!isAuthenticated()) {
        console.log('Not authenticated, redirecting to login') // Debug log
        // Redirect to login if not authenticated
        next({ name: 'Login', query: { redirect: to.fullPath } })
      } else if (!isAdmin()) {
        console.log('Not admin, redirecting to home with notification') // Debug log
        // Redirect first, then show notification
        next({ name: 'Home' })
        // Show notification after navigation completes
        setTimeout(() => {
          showError(
            'You need administrator privileges to access this page.',
            'Access Denied'
          )
        }, 300)
      } else {
        console.log('Admin access granted') // Debug log
        next()
      }
    },
    children: [
      { 
        path: '', 
        redirect: '/admin/dashboard', // redirect /admin ไปที่ /admin/dashboard
      },
      { 
        path: 'dashboard', 
        name: 'AdminDashboard', 
        component: AdminDashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      { 
        path: 'news', 
        name: 'NewsManagement', 
        component: NewsManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      { 
        path: 'users', 
        name: 'UserManagement', 
        component: UserManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      { 
        path: 'cities', 
        name: 'CityProvinceManagement', 
        component: CityProvinceManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      { 
        path: 'weather-data', 
        name: 'WeatherDataReview', 
        component: WeatherDataReview,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      { 
        path: 'models', 
        name: 'ModelManagement', 
        component: ModelManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      { 
        path: 'notifications', 
        name: 'NotificationManagement', 
        component: NotificationManagement,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),  // ใช้ History mode
  routes
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  console.log('🚀 Router guard triggered:')
  console.log('   - From:', from.path)
  console.log('   - To:', to.path)
  console.log('   - Requires Auth:', to.matched.some(record => record.meta.requiresAuth))
  console.log('   - Requires Admin:', to.matched.some(record => record.meta.requiresAdmin))
  
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log('🔐 Route requires authentication')
    if (!isAuthenticated()) {
      console.log('❌ Not authenticated, redirecting to login')
      // Redirect to login with return URL
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // Check if route requires admin role
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      console.log('👑 Route requires admin role')
      if (!isAdmin()) {
        console.log('❌ Not admin, redirecting to home with notification')
        // Redirect first, then show notification
        next({ name: 'Home' })
        // Show notification after navigation completes
        setTimeout(() => {
          showError(
            'You need administrator privileges to access this page.',
            'Access Denied'
          )
        }, 300)
        return
      }
    }
  }
  
  console.log('✅ Navigation allowed')
  next()
})

export { isAuthenticated, isAdmin, logout }
export default router
