<template>
  <div class="min-h-screen bg-[#f4f7fa] p-6">
    <!-- Breadcrumb/Title Bar -->
    <div class="bg-white shadow px-6 py-4 flex items-center justify-between rounded-xl mb-6">
      <div class="flex itemsconst roleOptions = [
  { title: 'ຌູ້ຄຸ້ມຄອງ', value: 'admin' },
  { title: 'ຌູ້ເບິ່ງ', value: 'viewer' }
]er">
        <div class="bg-green-100 rounded-lg p-3 mr-4">
          <v-icon size="28" color="green">mdi-account-multiple</v-icon>
        </div>
        <div>
          <div class="text-xs text-gray-400">ຜູ້ຄຸ້ມຄອງ / ການຈັດການຜູ້ໃຊ້</div>
          <div class="text-2xl font-bold text-blue-900">ການຈັດການຜູ້ໃຊ້</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <v-btn 
          v-if="canAddUser"
          color="primary" 
          prepend-icon="mdi-plus" 
          @click="addUser"
        >
          ເພີ່ມຜູ້ໃຊ້
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-refresh" @click="refreshData">
          ໂຫຼດຂໍ້ມູນໃໝ່
        </v-btn>
      </div>
    </div>

    <!-- Users Table Card -->
    <div class="bg-white rounded-xl shadow">
      <div class="p-6">
        <v-data-table 
          :headers="headers" 
          :items="users" 
          class="elevation-0"
          :items-per-page="10"
          :loading="loading"
          loading-text="ກໍາລັງໂຫຼດຂໍ້ມູນຜູ້ໃຊ້..."
        >
          <template #item.role="{ item }">
            <v-chip 
              :color="getRoleColor(item.role)" 
              size="small"
            >
              {{ item.role }}
            </v-chip>
          </template>
          <template #item.status="{ item }">
            <v-chip 
              :color="item.status === 'active' ? 'success' : 'warning'" 
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <v-btn 
              v-if="canEditUser"
              icon="mdi-pencil" 
              size="small" 
              color="primary" 
              @click="editUser(item)" 
              class="mr-2"
            ></v-btn>
            <v-btn 
              v-if="canDeleteUser && item.username !== 'admin'"
              icon="mdi-delete" 
              size="small" 
              color="error" 
              @click="deleteUser(item)"
            ></v-btn>
            <v-tooltip v-if="!canEditUser && !canDeleteUser" text="ບໍ່ມີສິດທິ">
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
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Add/Edit User Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-lg font-semibold">{{ isEditing ? 'ແກ້ໄຂຜູ້ໃຊ້' : 'ເພີ່ມຜູ້ໃຊ້' }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field 
            v-model="editedUser.username" 
            label="ຊື່ຜູ້ໃຊ້" 
            density="compact" 
            variant="outlined" 
            class="mb-2"
            :rules="[v => !!v || 'ຈໍາເປັນຕ້ອງມີຊື່ຜູ້ໃຊ້']"
          />
          <v-text-field 
            v-model="editedUser.email" 
            label="ອີເມວ" 
            density="compact" 
            variant="outlined" 
            type="email"
            class="mb-2"
            :rules="[v => !!v || 'ຈໍາເປັນຕ້ອງມີອີເມວ']"
          />
          
          <!-- Password creation options for new users -->
          <div v-if="!isEditing" class="mb-4">
            <v-radio-group 
              v-model="useAutoPassword" 
              label="ວິທີການສ້າງລະຫັດຜ່ານ"
              inline
              density="compact"
            >
              <v-radio 
                :value="true" 
                label="ສ້າງອັດຕະໂນມັດ"
              ></v-radio>
              <v-radio 
                :value="false" 
                label="ສ້າງເອງ"
              ></v-radio>
            </v-radio-group>
            
            <!-- Auto-generated password field -->
            <v-text-field 
              v-if="useAutoPassword"
              v-model="generatedPassword" 
              label="ລະຫັດຜ່ານທີ່ສ້າງອັດຕະໂນມັດ" 
              density="compact" 
              variant="outlined" 
              type="text"
              class="mb-2"
              readonly
              append-inner-icon="mdi-refresh"
              @click:append-inner="generatePassword"
              hint="ລະຫັດຜ່ານທີ່ສ້າງອັດຕະໂນມັດ - ກົດປຸ່ມໂຫຼດໃໝ່ເພື່ອສ້າງອີກ"
              persistent-hint
            >
              <template v-slot:append>
                <v-btn 
                  icon="mdi-content-copy" 
                  size="small" 
                  variant="text"
                  @click="copyPassword"
                  :disabled="!generatedPassword"
                />
              </template>
            </v-text-field>
            
            <!-- Manual password field -->
            <v-text-field 
              v-if="!useAutoPassword"
              v-model="editedUser.password" 
              label="ລະຫັດຜ່ານ" 
              density="compact" 
              variant="outlined" 
              type="password"
              class="mb-2"
              :rules="[v => !!v || 'ຈໍາເປັນຕ້ອງມີລະຫັດຜ່ານ', v => v.length >= 6 || 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງນ້ອຍ 6 ຕົວອັກສອນ']"
              hint="ລະຫັດຜ່ານຕ້ອງມີຢ່າງນ້ອຍ 6 ຕົວອັກສອນ"
              persistent-hint
            />
          </div>
          
          <v-text-field 
            v-if="isEditing"
            v-model="editedUser.newPassword" 
            label="ລະຫັດຜ່ານໃໝ່ (ບໍ່ບັງຄັບ)" 
            density="compact" 
            variant="outlined" 
            type="password"
            class="mb-2"
            placeholder="ປ່ອຍຫວ່າງໄວ້ເພື່ອຮັກສາລະຫັດຜ່ານເກົ່າ"
          />
          <v-select 
            v-model="editedUser.role" 
            :items="getAvailableRoles()" 
            label="ບົດບາດ" 
            density="compact" 
            variant="outlined" 
            class="mb-2"
            :rules="[v => !!v || 'ຈໍາເປັນຕ້ອງເລືອກບົດບາດ']"
          />
          <v-select 
            v-model="editedUser.status" 
            :items="statusOptions" 
            label="ສະຖານະ" 
            density="compact" 
            variant="outlined"
            :rules="[v => !!v || 'ຈໍາເປັນຕ້ອງເລືອກສະຖານະ']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn 
            color="primary" 
            @click="saveUser"
            :loading="loading"
            :disabled="loading"
          >
            {{ isEditing ? 'ບັນທຶກການແກ້ໄຂ' : 'ສ້າງຜູ້ໃຊ້' }}
          </v-btn>
          <v-btn variant="text" @click="closeDialog" :disabled="loading">ຍົກເລີກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar Notification -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" location="top right">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">ປິດ</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../plugins/axios'

const headers = [
  { title: 'ຊື່ຜູ້ໃຊ້', key: 'username' },
  { title: 'ອີເມວ', key: 'email' },
  { title: 'ບົດບາດ', key: 'role' },
  { title: 'ສະຖານະ', key: 'status' },
  { title: 'ການດໍາເນີນການ', key: 'actions', sortable: false }
]

const users = ref([])
const loading = ref(false)
const dialog = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const isEditing = ref(false)
const generatedPassword = ref('')
const useAutoPassword = ref(true) // ตัวเลือกใช้รหัสผ่านอัตโนมัติ
const editedUser = ref({
  username: '',
  email: '',
  password: '',
  newPassword: '',
  role: '',
  status: 'active'
})

const roleOptions = [
  { title: 'Admin', value: 'admin' },
  { title: 'Viewer', value: 'viewer' }
]
const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' }
]

// Get current user role for permission checking
const currentUserRole = ref('')

// Check if current user has permission for specific actions
const canAddUser = computed(() => currentUserRole.value === 'admin')
const canEditUser = computed(() => currentUserRole.value === 'admin')
const canDeleteUser = computed(() => currentUserRole.value === 'admin')
const canViewUsers = computed(() => ['admin', 'viewer'].includes(currentUserRole.value))

// ฟังก์ชัน copy รหัสผ่านไปยัง clipboard
function copyPassword() {
  if (generatedPassword.value) {
    navigator.clipboard.writeText(generatedPassword.value)
      .then(() => {
        showMessage('ລະຫັດຜ່ານຖືກຄັດລອກໄປຍັງ clipboard ແລ້ວ!', 'info')
      })
      .catch(() => {
        showMessage('ບໍ່ສາມາດຄັດລອກລະຫັດຜ່ານໄດ້', 'error')
      })
  }
}

// ฟังก์ชัน generate รหัสผ่านแบบสุ่ม
function generatePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  // สร้างรหัสผ่าน 8 ตัว โดยมีอย่างละ 2 ตัวของแต่ละประเภท
  let password = ''
  
  // เพิ่มตัวพิมพ์ใหญ่ 2 ตัว
  for (let i = 0; i < 2; i++) {
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  }
  
  // เพิ่มตัวพิมพ์เล็ก 2 ตัว
  for (let i = 0; i < 2; i++) {
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  }
  
  // เพิ่มตัวเลข 2 ตัว
  for (let i = 0; i < 2; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  // เพิ่มสัญลักษณ์ 2 ตัว
  for (let i = 0; i < 2; i++) {
    password += symbols.charAt(Math.floor(Math.random() * symbols.length))
  }
  
  // สลับตำแหน่งตัวอักษรเพื่อความสุ่ม
  const passwordArray = password.split('')
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]]
  }
  
  generatedPassword.value = passwordArray.join('')
}

// Load users from database
async function loadUsers() {
  try {
    loading.value = true
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      showMessage('ກະລຸນາລ໋ອກອິນກ່ອນ', 'error')
      window.location.href = '/login'
      return
    }

    const response = await api.get('/api/users')
    users.value = response.data
  } catch (error) {
    console.error('Load users error:', error)
    if (error.response?.status === 401) {
      showMessage('ບໍ່ມີສິດທິ - ກະລຸນາລ໋ອກອິນ', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else {
      showMessage('ຂໍ້ຜິດພາດໃນການໂຫຼດຜູ້ໃຊ້: ' + (error.response?.data?.error || error.message), 'error')
    }
  } finally {
    loading.value = false
  }
}

function getRoleColor(role) {
  switch (role) {
    case 'admin': return 'error'
    case 'viewer': return 'info'
    default: return 'default'
  }
}

// Get available roles based on current user's role
function getAvailableRoles() {
  if (currentUserRole.value === 'admin') {
    return roleOptions // Admin can assign any role
  } else {
    return roleOptions.filter(role => role.value === 'viewer') // Others can only create viewer (if allowed)
  }
}

// Check if user can perform role-related actions
function canAssignRole(role) {
  if (currentUserRole.value === 'admin') return true
  return false
}

function addUser() {
  if (!canAddUser.value) {
    showMessage('ທ່ານບໍ່ມີສິດທິໃນການເພີ່ມຜູ້ໃຊ້', 'error')
    return
  }
  
  isEditing.value = false
  useAutoPassword.value = true // Default to auto-generated password
  generatePassword() // Generate initial password
  editedUser.value = { 
    username: '', 
    email: '', 
    password: '',
    newPassword: '',
    role: '', 
    status: 'active' 
  }
  dialog.value = true
}

function editUser(user) {
  if (!canEditUser.value) {
    showMessage('ທ່ານບໍ່ມີສິດທິໃນການແກ້ໄຂຜູ້ໃຊ້', 'error')
    return
  }
  
  // Additional check: Admin users can only be edited by admin
  if (user.role === 'admin' && currentUserRole.value !== 'admin') {
    showMessage('ທ່ານບໍ່ມີສິດທິໃນການແກ້ໄຂຜູ້ຄຸ້ມຄອງ', 'error')
    return
  }
  
  isEditing.value = true
  editedUser.value = { 
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    newPassword: '' // เพิ่มฟิลด์สำหรับรหัสผ่านใหม่
  }
  dialog.value = true
}

async function saveUser() {
  if (!editedUser.value.username || !editedUser.value.email || !editedUser.value.role) {
    showMessage('ກະລຸນາຕື່ມຂໍ້ມູນໃສ່ທຸກຊ່ອງທີ່ຈໍາເປັນ', 'error')
    return
  }

  // Validate password for new users
  if (!isEditing.value) {
    if (useAutoPassword.value && !generatedPassword.value) {
      showMessage('ການສ້າງລະຫັດຜ່ານອັດຕະໂນມັດລົ້ມເຫຼວ. ກະລຸນາລອງອີກຄັ້ງ', 'error')
      return
    }
    if (!useAutoPassword.value && !editedUser.value.password) {
      showMessage('ກະລຸນາໃສ່ລະຫັດຜ່ານ', 'error')
      return
    }
    if (!useAutoPassword.value && editedUser.value.password.length < 6) {
      showMessage('ລະຫັດຜ່ານຕ້ອງມີຢ່າງນ້ອຍ 6 ຕົວອັກສອນ', 'error')
      return
    }
  }

  try {
    loading.value = true
    
    if (isEditing.value) {
      // Update existing user
      const updateData = {
        username: editedUser.value.username,
        email: editedUser.value.email,
        role: editedUser.value.role,
        status: editedUser.value.status
      }
      
      // เพิ่มรหัสผ่านใหม่ถ้ามีการใส่
      if (editedUser.value.newPassword && editedUser.value.newPassword.trim()) {
        updateData.password = editedUser.value.newPassword.trim()
      }
      
      await api.put(`/api/users/${editedUser.value.id}`, updateData)
      showMessage('ບັນທຶກການແກ້ໄຂຜູ້ໃຊ້ສໍາເລັດ!', 'success')
    } else {
      // Create new user
      const password = useAutoPassword.value ? generatedPassword.value : editedUser.value.password
      const newUserData = {
        username: editedUser.value.username,
        email: editedUser.value.email,
        password: password,
        role: editedUser.value.role,
        status: editedUser.value.status
      }
      
      await api.post('/api/users', newUserData)
      const passwordMessage = useAutoPassword.value ? 
        `ສ້າງຜູ້ໃຊ້ສໍາເລັດ! ລະຫັດຜ່ານ: ${generatedPassword.value}` :
        'ສ້າງຜູ້ໃຊ້ສໍາເລັດ!'
      showMessage(passwordMessage, 'success')
    }
    
    closeDialog()
    await loadUsers() // Reload the users list
    
  } catch (error) {
    console.error('Save user error:', error)
    if (error.response?.status === 401) {
      showMessage('ບໍ່ມີສິດທິ - ກະລຸນາລ໋ອກອິນ', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else if (error.response?.status === 400) {
      showMessage('ຂໍ້ມູນບໍ່ຖືກຕ້ອງ: ' + (error.response?.data?.error || 'ຄໍາຮ້ອງຂໍບໍ່ຖືກຕ້ອງ'), 'error')
    } else if (error.response?.status === 409) {
      showMessage('ຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວນີ້ມີຢູ່ແລ້ວ', 'error')
    } else {
      showMessage('ຂໍ້ຜິດພາດໃນການບັນທຶກຜູ້ໃຊ້: ' + (error.response?.data?.error || error.message), 'error')
    }
  } finally {
    loading.value = false
  }
}

async function deleteUser(user) {
  if (!canDeleteUser.value) {
    showMessage('ທ່ານບໍ່ມີສິດທິໃນການລຶບຜູ້ໃຊ້', 'error')
    return
  }
  
  // Prevent deleting admin users (except by admin)
  if (user.role === 'admin' && currentUserRole.value !== 'admin') {
    showMessage('ທ່ານບໍ່ມີສິດທິໃນການລຶບຜູ້ຄຸ້ມຄອງ', 'error')
    return
  }
  
  // Prevent deleting the default admin user
  if (user.username === 'admin') {
    showMessage('ບໍ່ສາມາດລຶບຜູ້ຄຸ້ມຄອງຫຼັກໄດ້', 'error')
    return
  }
  
  if (confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຜູ້ໃຊ້ "${user.username}"?`)) {
    try {
      loading.value = true
      await api.delete(`/api/users/${user.id}`)
      showMessage('ລຶບຜູ້ໃຊ້ສໍາເລັດ!', 'success')
      await loadUsers() // Reload the users list
    } catch (error) {
      console.error('Delete user error:', error)
      if (error.response?.status === 401) {
        showMessage('ບໍ່ມີສິດທິ - ກະລຸນາລ໋ອກອິນ', 'error')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else if (error.response?.status === 403) {
        showMessage('ບໍ່ມີສິດທິໃນການລຶບຜູ້ໃຊ້ນີ້', 'error')
      } else {
        showMessage('ຂໍ້ຜິດພາດໃນການລຶບຜູ້ໃຊ້: ' + (error.response?.data?.error || error.message), 'error')
      }
    } finally {
      loading.value = false
    }
  }
}

function closeDialog() {
  dialog.value = false
  generatedPassword.value = '' // เคลียร์รหัสผ่านที่ generate
  useAutoPassword.value = true // Reset to auto password
  editedUser.value = { 
    username: '', 
    email: '', 
    password: '',
    newPassword: '',
    role: '', 
    status: 'active' 
  }
}

async function refreshData() {
  await loadUsers()
  showMessage('ໂຫຼດຂໍ້ມູນໃໝ່ແລ້ວ!', 'info')
}

function showMessage(message, color = 'success') {
  snackbarText.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// Load users when component mounts
onMounted(async () => {
  // Check authentication first
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) {
    showMessage('ກະລຸນາລ໋ອກອິນກ່ອນ', 'error')
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
    return
  }
  
  // Get current user role
  currentUserRole.value = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'viewer'
  
  // Check if user has permission to view users
  if (!canViewUsers.value) {
    showMessage('ທ່ານບໍ່ມີສິດທິໃນການເຂົ້າເຖິງໜ້ານີ້', 'error')
    setTimeout(() => {
      window.location.href = '/admin'
    }, 2000)
    return
  }
  
  await loadUsers()
})
</script>
