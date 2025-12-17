import { ref, onMounted } from 'vue'

export interface UseImageLoaderOptions {
  /** Enable lazy loading for images below the fold */
  lazy?: boolean
  /** Delay before loading (in milliseconds) - useful for lazy loading */
  delay?: number
  /** Enable preloading on mount */
  preload?: boolean
}

/**
 * Composable for managing image loading states with performance optimizations
 * @param src - Image source URL
 * @param options - Configuration options
 */
export function useImageLoader(src: string, options: UseImageLoaderOptions = {}) {
  const { lazy = false, delay = 0, preload = true } = options

  // Loading states
  const imageLoading = ref(true)
  const imageError = ref(false)

  // Image loading handlers
  const handleImageLoad = () => {
    imageLoading.value = false
    imageError.value = false
  }

  const handleImageError = () => {
    imageLoading.value = false
    imageError.value = true
    console.warn('Failed to load image:', src)
  }

  // Preload image for better performance
  const preloadImage = (imageSrc: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`))
      img.src = imageSrc
    })
  }

  // Load image based on options
  const loadImage = async () => {
    if (!src) {
      imageError.value = true
      imageLoading.value = false
      return
    }

    try {
      if (preload) {
        await preloadImage(src)
      }
      imageLoading.value = false
    } catch (error) {
      imageError.value = true
      imageLoading.value = false
    }
  }

  // Initialize image loading on mount
  onMounted(() => {
    if (lazy && delay > 0) {
      // Delayed loading for lazy images
      setTimeout(loadImage, delay)
    } else if (lazy) {
      // Immediate lazy loading (useful for below-the-fold content)
      requestIdleCallback ? requestIdleCallback(loadImage) : setTimeout(loadImage, 100)
    } else {
      // Immediate loading for above-the-fold content
      loadImage()
    }
  })

  return {
    imageLoading,
    imageError,
    handleImageLoad,
    handleImageError,
    loadImage
  }
}