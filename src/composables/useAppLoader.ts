import { ref, onMounted, readonly } from 'vue'

const isAppReady = ref(false)
const isInitialLoad = ref(true)

/**
 * Composable for managing app-level loading states
 */
export function useAppLoader() {
  
  // Mark app as ready (called after all critical resources are loaded)
  const setAppReady = () => {
    isAppReady.value = true
    isInitialLoad.value = false
  }

  // Reset app loading state (useful for page transitions)
  const resetAppLoader = () => {
    isAppReady.value = false
  }

  // Wait for fonts and critical resources to load
  const waitForCriticalResources = async () => {
    const promises: Promise<void>[] = []

    // Wait for fonts if they exist
    if (document.fonts) {
      promises.push(document.fonts.ready.then(() => {}))
    }

    // Wait for critical images to load (if any)
    const criticalImages = document.querySelectorAll('img[loading="eager"]')
    criticalImages.forEach(imgElement => {
      const img = imgElement as HTMLImageElement
      if (!img.complete) {
        promises.push(
          new Promise<void>(resolve => {
            img.onload = () => resolve()
            img.onerror = () => resolve() // Still resolve on error
          })
        )
      }
    })

    // Wait for a minimum time to avoid flash
    promises.push(new Promise(resolve => setTimeout(resolve, 200)))

    await Promise.all(promises)
  }

  onMounted(async () => {
    if (isInitialLoad.value) {
      await waitForCriticalResources()
      setAppReady()
    }
  })

  return {
    isAppReady: readonly(isAppReady),
    isInitialLoad: readonly(isInitialLoad),
    setAppReady,
    resetAppLoader,
    waitForCriticalResources
  }
}