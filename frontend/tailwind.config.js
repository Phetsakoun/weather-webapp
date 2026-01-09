// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ใช้คลาส .font-lao เพื่อเรียก Noto Sans Lao
        lao: ['"Noto Sans Lao"', 'sans-serif'],
        // ตั้งให้ sans เป็น Noto Sans Lao โดย default
        sans: ['"Noto Sans Lao"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
