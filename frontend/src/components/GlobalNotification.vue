<!-- src/components/GlobalNotification.vue -->
<template>
  <v-snackbar
    v-model="notification.show"
    :color="getColor(notification.type)"
    :timeout="notification.timeout"
    location="top right"
    :max-width="400"
    class="global-notification"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-2">
        {{ getIcon(notification.type) }}
      </v-icon>
      <div>
        <div v-if="notification.title" class="font-weight-bold mb-1">
          {{ notification.title }}
        </div>
        <div>{{ notification.message }}</div>
      </div>
    </div>
    
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        size="small"
        @click="hideNotification"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { notification, hideNotification } from '../services/notificationService'

const getColor = (type) => {
  switch (type) {
    case 'success': return 'success'
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'info'
  }
}

const getIcon = (type) => {
  switch (type) {
    case 'success': return 'mdi-check-circle'
    case 'error': return 'mdi-alert-circle'
    case 'warning': return 'mdi-alert'
    case 'info': return 'mdi-information'
    default: return 'mdi-information'
  }
}
</script>

<style scoped>
.global-notification {
  z-index: 9999;
}
</style>
