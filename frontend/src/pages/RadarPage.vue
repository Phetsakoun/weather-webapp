<!-- src/pages/RadarPage.vue -->
<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">ແຜນທີ່ເຣດາ (Weather Radar)</h1>
      <p class="text-gray-600">ຕິດຕາມສະຖານະການຝົນໃນພາກພື້ນແບບເວລາຈິງ</p>
    </div>

    <!-- Controls -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-3">ການຄວບຄຸມການສະແດງຜົນ</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">ປະເພດແຜນທີ່</label>
          <select v-model="selectedOverlay" @change="updateMap" class="w-full p-2 border border-gray-300 rounded-md">
            <option value="radar">ເຣດາ (Radar)</option>
            <option value="clouds">ເມກ (Clouds)</option>
            <option value="rain">ຝົນ (Rain)</option>
            <option value="wind">ລົມ (Wind)</option>
            <option value="temp">ອຸນຫະພູມ (Temperature)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Radar Map -->
    <div
      class="relative w-full mb-6 rounded-lg overflow-hidden shadow-lg"
      style="height: min(70vw, 60vh); z-index: 0;"
    >
      <div class="w-full h-full">
        <iframe
          :src="mapUrl"
          class="w-full h-full min-h-[250px]"
          style="display:block; border:none;"
          frameborder="0"
          allowfullscreen
          allow="geolocation; fullscreen; payment; microphone; camera; encrypted-media; autoplay"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          referrerpolicy="no-referrer-when-downgrade"
          loading="lazy"
          title="Radar map by Windy.com"
          @error="handleIframeError"
        ></iframe>
      </div>
      
      <!-- Error fallback (หากต้องการ) -->
      <div v-if="iframeError" class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
        <div class="text-center">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-gray-600">ກຳລັງໂຫຼດແຜນທີ່...</p>
          <button @click="reloadIframe" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            ໂຫຼດໃໝ່
          </button>
        </div>
      </div>
    </div>

    <!-- Radar Color Legend -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2M9 3h6a2 2 0 012 2v12a4 4 0 01-2 2H9M15 3h4a2 2 0 012 2v12a4 4 0 01-2 2h-4"></path>
        </svg>
        ຄຳອະທິບາຍສີໃນແຜນທີ່ເຣດາ
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Precipitation Intensity -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 mb-3">ຄວາມແຮງຂອງຝົນ</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #40E0D0;"></div>
              <span class="text-sm"><strong>ສີຟ້າອ່ອນ</strong> - ຝົນນ້ອຍ (0.1-1 mm/h)</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #32CD32;"></div>
              <span class="text-sm"><strong>ສີຂຽວ</strong> - ຝົນປານກາງ (1-4 mm/h)</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #FFD700;"></div>
              <span class="text-sm"><strong>ສີເຫຼືອງ</strong> - ຝົນຫຼາຍ (4-10 mm/h)</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #FF8C00;"></div>
              <span class="text-sm"><strong>ສີສົ້ມ</strong> - ຝົນໜັກ (10-20 mm/h)</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #FF0000;"></div>
              <span class="text-sm"><strong>ສີແດງ</strong> - ຝົນໜັກຫຼາຍ (20-50 mm/h)</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #8B0000;"></div>
              <span class="text-sm"><strong>ສີແດງເຂົ້ມ</strong> - ຝົນໜັກສຸດ (>50 mm/h)</span>
            </div>
          </div>
        </div>

        <!-- Cloud Coverage -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 mb-3">ຄຸກເມກ</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #FFFFFF; border: 1px solid #ccc;"></div>
              <span class="text-sm"><strong>ສີຂາວ</strong> - ທ້ອງຟ້າແຈ້ມໃສ</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #E6E6FA;"></div>
              <span class="text-sm"><strong>ສີຂາວອ່ອນ</strong> - ເມກນ້ອຍ</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #C0C0C0;"></div>
              <span class="text-sm"><strong>ສີເທົາອ່ອນ</strong> - ເມກປານກາງ</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #808080;"></div>
              <span class="text-sm"><strong>ສີເທົາ</strong> - ເມກຫຼາຍ</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded" style="background-color: #2F4F4F;"></div>
              <span class="text-sm"><strong>ສີເທົາເຂົ້ມ</strong> - ເມກຝົນຟ້າຄະນອງ</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Weather Alerts -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-l-4 border-blue-500 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-2 flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        ຂໍ້ມູນສຳຄັນ
      </h3>
      <div class="text-sm text-gray-700 space-y-1">
        <p>• <strong>ເວລາຈິງ:</strong> ຂໍ້ມູນອັບເດດທຸກ 10 ນາທີ</p>
        <p>• <strong>ການຄາດຄະເນ:</strong> ສາມາດເບິ່ງການເຄື່ອນໄຫວຂອງເມກໄດ້ 2-3 ຊົ່ວໂມງລ່ວງໜ້າ</p>
        <p>• <strong>ການເຕືອນ:</strong> ຝົນສີແດງ-ແດງເຂົ້ມ ແມ່ນອັນຕະລາຍ ຄວນຫຼີກຫຼ່ຽງການເດີນທາງ</p>
        <p>• <strong>ຄວາມແມ່ນຍໍາ:</strong> ສູງສຸດໃນລັດສະໝີ 50 ກິໂລແມັດ</p>
      </div>
    </div>

    <!-- Usage Guide -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        ຄຳແນະນຳການນຳໃຊ້
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <h4 class="font-semibold mb-2">ການໃຊ້ແຜນທີ່:</h4>
          <ul class="space-y-1">
            <li>• ກົດທີ່ຈຸດໃດໜຶ່ງເພື່ອເບິ່ງຂໍ້ມູນລະອຽດ</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-2">ການວາງແຜນ:</h4>
          <ul class="space-y-1">
            <li>• ເບິ່ງສີແດງ = ຢຸດການເດີນທາງ</li>
            <li>• ເບິ່ງສີສົ້ມ = ລະມັດລະວັງ</li>
            <li>• ເບິ່ງສີຂຽວ = ປອດໄພ</li>
            <li>• ຕິດຕາມທິດທາງການເຄື່ອນໄຫວ</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedOverlay = ref('radar')
const selectedZoom = ref('6')
const selectedLocation = ref('17.97,102.6')
const iframeError = ref(false)

const mapUrl = computed(() => {
  const [lat, lon] = selectedLocation.value.split(',')
  return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=${selectedZoom.value}&level=surface&overlay=${selectedOverlay.value}`
})

const overlayDescriptions = {
  radar: 'ຄວາມແຮງຂອງຝົນແລະພາຍຸຝົນຟ້າຄະນອງ',
  clouds: 'ການກະຈາຍຂອງເມກໃນຊັ້ນບັນຍາກາດຕ່າງໆ',
  rain: 'ປະລິມານຝົນທີ່ຄາດວ່າຈະຕົກ',
  wind: 'ທິດທາງແລະຄວາມແຮງຂອງລົມ',
  temp: 'ການກະຈາຍຂອງອຸນຫະພູມອາກາດ'
}

const handleIframeError = (event) => {
  console.warn('Iframe loading error:', event)
  iframeError.value = true
  // รอ 3 วินาทีแล้วลองโหลดใหม่อัตโนมัติ
  setTimeout(() => {
    iframeError.value = false
  }, 3000)
}

const reloadIframe = () => {
  iframeError.value = false
  updateMap()
}

const updateMap = () => {
  // Force iframe reload with new URL
  const iframe = document.querySelector('iframe')
  if (iframe) {
    iframe.src = mapUrl.value
  }
}
</script>