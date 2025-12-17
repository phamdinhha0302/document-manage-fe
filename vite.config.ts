import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
    plugins: [
        vue(),
        vueJsx(),
        vueDevTools(),

        // Auto import Vue Composition API
        AutoImport({
            imports: ['vue'],
            dts: 'src/auto-imports.d.ts'
        }),

        // Auto import Vue components (excluding Ant Design Vue)
        Components({
            dts: 'src/components.d.ts'
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '/uploads': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false
            },
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false
            }
        }
    },
    preview: {
        port: 3001,
        host: true
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'ant-design': ['ant-design-vue'],
                    icons: ['@ant-design/icons-vue']
                }
            }
        }
    },
    optimizeDeps: {
        include: ['ant-design-vue', '@ant-design/icons-vue', 'leaflet']
    },
    css: {
        preprocessorOptions: {
            css: {
                charset: false
            }
        }
    }
})
