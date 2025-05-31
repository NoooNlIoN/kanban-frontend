import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    build: {
      // Отключаем минификацию для ускорения сборки в CI (опционально)
      // minify: isProduction ? 'esbuild' : false,
      
      // Отключаем sourcemaps в продакшене для уменьшения размера
      sourcemap: !isProduction,
    },
    // Отключаем некоторые проверки в продакшене
    esbuild: {
      // Убираем console.log в продакшене
      drop: isProduction ? ['console', 'debugger'] : [],
    },
  };
});
