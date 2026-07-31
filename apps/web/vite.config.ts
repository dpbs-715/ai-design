import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'
import { vunioUIResolver } from '@vunio/ui/resolver'

const environmentDirectory = fileURLToPath(new URL('../../env', import.meta.url))

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, environmentDirectory, 'VITE_')

  return {
    envDir: environmentDirectory,
    plugins: [
      vue(),
      tailwindcss(),
      AutoImport({
        dts: fileURLToPath(new URL('./auto-imports.d.ts', import.meta.url)),
        imports: ['vue'],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        dts: fileURLToPath(new URL('./components.d.ts', import.meta.url)),
        resolvers: [
          ElementPlusResolver({
            importStyle: false,
          }),
          vunioUIResolver({ importStyle: true }),
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: environment.VITE_SERVER_PROXY_TARGET || 'http://127.0.0.1:3000',
          changeOrigin: true,
          xfwd: true,
        },
      },
    },
  }
})
