import './assets/styles/index.less'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'

import App from './App.vue'
import { useAuth } from './composables/useAuth'
import router from './router'

import { ConfigProvider } from 'ant-design-vue'
import viVN from 'ant-design-vue/es/locale/vi_VN'
import 'swiper/css'

import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Initialize app immediately but hide content until ready
startApp()

async function startApp() {
    try {
        // Create and configure app
        const app = createApp(App)

        app.use(VueQueryPlugin)
        app.use(router)
        app.use(ConfigProvider, {
            locale: viVN
        })

        // Wait for router to be ready
        await router.isReady()

        // Mount the app
        app.mount('#app')

        // Start token validity checker for admin routes
        const { startTokenValidityCheck } = useAuth()
        startTokenValidityCheck()

        // Wait for next tick to ensure app is fully rendered
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Hide loading screen and show app
        hideLoadingScreen()

        console.info(':::startApp -> App initialized successfully')
    } catch (error) {
        console.error(':::startApp -> Failed to initialize app:', error)
        hideLoadingScreen() // Still hide loading even on error
    }
}

function hideLoadingScreen() {
    // Remove loading state from body
    document.body.classList.remove('loading')

    // Hide loading spinner
    const loadingEl = document.getElementById('app-loading')
    if (loadingEl) {
        loadingEl.style.opacity = '0'
        setTimeout(() => {
            loadingEl.remove()
        }, 300)
    }

    // Show app with fade-in effect
    const appEl = document.getElementById('app')
    if (appEl) {
        appEl.classList.add('loaded')
    }
}
