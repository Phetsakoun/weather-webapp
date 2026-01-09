<template>
  <div v-bind="$attrs">
    <canvas ref="canvas"></canvas>
  </div>
</template>
<script setup>
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { Chart } from 'chart.js/auto'
defineOptions({ inheritAttrs: false })

const props = defineProps({
  data: Object,
  options: Object,
  animationDuration: {
    type: Number,
    default: 1000
  },
  animationEasing: {
    type: String,
    default: 'easeInOutQuart'
  },
  responsive: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['chart-rendered', 'chart-updated', 'chart-click'])

const canvas = ref(null)
let chartInstance = null
let chartAnimation = null

onMounted(() => {
  if (canvas.value) {
    // Merge default options with provided options
    const defaultOptions = {
      responsive: props.responsive,
      animation: {
        duration: props.animationDuration,
        easing: props.animationEasing,
      }
    }
    
    // Create chart instance with enhanced options
    chartInstance = new Chart(canvas.value, {
      type: 'line',
      data: props.data,
      options: {
        ...defaultOptions,
        ...props.options,
        // Add click event handler
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            emit('chart-click', elements[0])
          }
        }
      }
    })
    
    // Emit chart ready event
    emit('chart-rendered', chartInstance)
  }
})

// Apply smooth transitions for data changes
watch(() => props.data, (newData, oldData) => {
  if (chartInstance) {
    // Apply staggered animation for smooth transition
    if (chartAnimation) {
      chartAnimation.cancel()
    }
    
    // Create a progressive update effect for better visualization
    const startTime = Date.now()
    const updateDuration = props.animationDuration
    
    chartInstance.data = newData
    
    // Apply custom animation for updating
    chartAnimation = chartInstance.update('active')
    
    // Emit update event once transition is complete
    setTimeout(() => {
      emit('chart-updated', chartInstance)
    }, updateDuration + 50)
  }
}, { deep: true })

// Apply smooth transitions for options changes
watch(() => props.options, (newOptions) => {
  if (chartInstance) {
    chartInstance.options = {
      ...chartInstance.options,
      ...newOptions
    }
    chartInstance.update()
  }
}, { deep: true })

// Clean up chart instance on component unmount
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})

// Utility function to create animated gradient backgrounds
function createGradient(ctx, colors) {
  if (!ctx) return 'rgba(0, 0, 0, 0.1)'
  
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color)
  })
  
  return gradient
}

// Manually refresh chart with animation
function refreshChart(animationOptions = {}) {
  if (chartInstance) {
    const options = {
      duration: animationOptions.duration || props.animationDuration,
      easing: animationOptions.easing || props.animationEasing,
      from: animationOptions.from || 0,
      to: animationOptions.to || 1,
      loop: animationOptions.loop || false
    }
    
    // Apply animation options
    chartInstance.options.animation = {
      ...chartInstance.options.animation,
      ...options
    }
    
    // Force update with animation
    chartInstance.update('active')
    
    return true
  }
  
  return false
}

// Expose method to component's parent
defineExpose({
  refreshChart,
  getChartInstance: () => chartInstance
})
</script>
