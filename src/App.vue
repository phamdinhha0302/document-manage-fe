<script setup lang="ts">
import { useAppLoader } from '@/composables/useAppLoader'
import DefaultLayout from '@/layouts/default.vue'
import { ConfigProvider } from 'ant-design-vue'
import { markRaw, ref, watch, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const layouts: Record<string, typeof DefaultLayout> = {
    default: DefaultLayout,
}

const layout = ref<typeof DefaultLayout | undefined>(DefaultLayout)
const route = useRoute()

// Use app loader to handle loading states
const { isAppReady, setAppReady } = useAppLoader()

// Mark app as ready when component mounts
onMounted(() => {
    setAppReady()
})

watch(
    () => route.meta.layout as string | undefined,
    (layoutName: string | undefined) => {
        if (layoutName === '404') {
            layout.value = undefined
            return
        }
        layout.value = markRaw(layouts[layoutName || 'default'] ?? DefaultLayout)
    },
    { immediate: true }
)
</script>

<template>
    <ConfigProvider :theme="{ token: { colorPrimary: '#48cae4' } }">
        <Transition 
            name="app-fade"
            enter-active-class="transition-opacity duration-300 ease-in-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100">
            <component v-if="isAppReady" :is="layout">
                <RouterView />
            </component>
        </Transition>
    </ConfigProvider>
</template>

<style scoped>
html {
    scroll-behavior: smooth;
}
</style>
