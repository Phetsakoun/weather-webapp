<template>
  <div class="min-h-screen bg-gray-50 px-2 py-8 flex flex-col items-center">
    <div class="max-w-3xl text-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">ກ່ຽວກັບອົງກອນ</h2>
      <p class="text-gray-700 mb-2">
        ທາງບໍລິຫານກົມອຸຕຸฯປະກອບມີຫົວຫນ້າກົມ ແລະ ຮອງຫົວຫນ້າກົມ<br/>
        ເຊັ່ນການຄຸ້ມຄອງທາງບໍລິຫານຂອງກົມ ລາຍງານໄປຍັງຮອງລັດຖະມົນຕີທີ່ດູແລກົມອຸຕຸ ແລະ ລັດຖະມົນຕີວ່າການກະຊວງຊັບພະຍາກອນທຳມະຊາດ ແລະ ສິ່ງແວດລ້ອມ.
      </p>
    </div>

    <!-- รูปโครงสร้างองค์กร -->
    <img
      src="../assets/image/dmh or laos.png"
      alt="ຮູບໂຄງສ້າງອົງກອນ"
      class="mx-auto my-8 max-w-5xl w-full border rounded shadow"
    />

    <div class="max-w-3xl mt-6 space-y-6 text-gray-800">
      <div>
        <h3 class="text-lg font-bold mb-1 text-blue-900">ພະແນກເຄືອຂ່າຍອຸຕຸນິຍົມ ແລະ ແຜ່ນດິນໄຫວ</h3>
        <p class="mb-1">
          ຮັບຜິດຊອບການຈັດການ ແລະ ບຳລຸງຮັກສາສະຖານີອຸຕຸນິຍົມ, ແຜ່ນດິນໄຫວ, ເລດ້າ, ໂຄງສ້າງ IT, ອຸປະກອນຖ່າຍວິດິໂອ
        </p>
        <ul class="list-disc ml-6">
          <li>ເລດ້າ</li>
          <li>ອຸປະກອນ</li>
          <li>ແຜ່ນດິນໄຫວ</li>
          <li>IT</li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold mb-1 text-blue-900">ພະແນກພະຍາກອນອາກາດ ແລະ ເຕືອນໄພລ່ວງຫນ້າ</h3>
        <p class="mb-1">
          ຮັບຜິດຊອບການພະຍາກອນອາກາດໄລຍະສັ້ນ/ຍາວ, ກວດສອບສະພາບອາກາດ, ເຜີຍແຜ່, ເຕືອນໄພ
        </p>
        <ul class="list-disc ml-6">
          <li>ການສື້ສານ</li>
          <li>ການວິເຄາະ</li>
          <li>ພະຍາກອນອາກາດ ແລະ ເຕືອນໄພລ່ວງຫນ້າ</li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold mb-1 text-blue-900">ພະແນກການບິນ</h3>
        <p class="mb-1">
          ເກັບຂໍ້ມູນສະພາບອາກາດ ແລະ ເຜີຍແຜ່ສູ່ການບໍລິການເດີນອາກາດ, ຮ່ວມກັບການບິນລາວ
        </p>
        <ul class="list-disc ml-6">
          <li>ການສັງເກດສະພາບອາກາດ</li>
          <li>ສະພາບອາກາດກ່ຽວກັບການບິນ</li>
          <li>ການສື່ສານ</li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold mb-1 text-blue-900">ພະແນກພູມອາກາດ ແລະ ອຸຕຸນິຍົມກະເສດສາດ</h3>
        <p class="mb-1">
          ເກັບຂໍ້ມູນ ແລະ ເຜີຍແຜ່ສະພາບອາກາດ, ພະຍາກອນຕາມລະດູການເພື່ອການກະເສດ
        </p>
        <ul class="list-disc ml-6">
          <li>ເກັບຂໍ້ມູນ</li>
          <li>ແຜ່ລະບາດ</li>
          <li>ອຸຕຸນິຍົມ</li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold mb-1 text-blue-900">ພະແນກອຸທົກກະສາດ</h3>
        <p class="mb-1">
          ວິເຄາະ/ພະຍາກອນ ຂໍ້ມູນອຸທົກກະສາດ, ຈັດການ ແລະ ບຳລຸງຮັກສາສະຖານີນ້ຳ
        </p>
        <ul class="list-disc ml-6">
          <li>ເກັບຂໍ້ມູນ</li>
          <li>ກວດສອບສະຖານີນ້ຳ & ຕິດຕັ້ງ</li>
          <li>ພະຍາກອນອຸທົກກະສາດ</li>
          <li>ສູນຝຶກອົບຮົມ</li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold mb-1 text-blue-900">ພະແນກການທົ່ວໄປ</h3>
        <p class="mb-1">
          ສຳນັກງານເລຂາທິການ, ການເງິນ, ກົດຫມາຍ, ແຜນ, ການຮ່ວມມື, ຈັດຊື້, ບໍລິຫານ, ເອກະສານ, ອະນຸຍາດທີ່ປຶກສາຕ່າງປະເທດ
        </p>
        <ul class="list-disc ml-6">
          <li>ການເງິນ</li>
          <li>ກົດຫມາຍ</li>
          <li>ແຜນ ແລະ ຮ່ວມມື</li>
          <li>ຈັດຊື້</li>
          <li>ບໍລິຫານງານທົ່ວໄປ</li>
          <li>ເອກະສານເຂົ້າ/ອອກ</li>
          <li>ອະນຸຍາດໃຫ້ເຮັດວຽກສຳລັບທີ່ປຶກສາຕ່າງປະເທດ</li>
        </ul>
      </div>
    </div>
  </div>
</template>
