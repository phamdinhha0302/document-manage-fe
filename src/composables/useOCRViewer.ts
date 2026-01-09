import { ref, computed } from 'vue'
import apiClient from '@/api/axios.client'

export interface BoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface OCRField {
  text: string
  confidence: number
  bbox: BoundingBox
  type?: string
}

export interface OCRResult {
  text: string
  confidence: number
  language: string
  fields: OCRField[]
}

export function useOCRViewer() {
  const ocrResult = ref<OCRResult | null>(null)
  const imageUrl = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fields = computed(() => ocrResult.value?.fields || [])
  const confidence = computed(() => ocrResult.value?.confidence || 0)
  const fullText = computed(() => ocrResult.value?.text || '')

  /**
   * Load OCR result from API based on document ID
   */
  const loadOCRResult = async (documentId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiClient.get(`/api/documents/${documentId}`)
      
      if (response.data?.data) {
        const doc = response.data.data
        
        // Set image URL
        if (doc.fileUrl) {
          imageUrl.value = doc.fileUrl
        }
        
        // Build OCR result from document
        ocrResult.value = {
          text: doc.ocrContent || '',
          confidence: (doc.ocrConfidence || 0) / 100,
          language: doc.ocrLanguage || 'vi',
          fields: doc.ocrFields || [],
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load OCR result'
      console.error('Error loading OCR result:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Extract OCR from image file
   */
  const extractOCRFromFile = async (file: File, language: string = 'vi') => {
    try {
      isLoading.value = true
      error.value = null

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', language)

      // Call OCR API
      const response = await apiClient.post('/ocr/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data) {
        ocrResult.value = {
          text: response.data.text || '',
          confidence: response.data.confidence || 0,
          language: response.data.language || language,
          fields: response.data.fields || []
        }

        // Create preview URL
        imageUrl.value = URL.createObjectURL(file)
      }

      return ocrResult.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to extract OCR'
      console.error('Error extracting OCR:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get field by type
   */
  const getFieldByType = (fieldType: string): OCRField | undefined => {
    return fields.value.find(f => f.type === fieldType)
  }

  /**
   * Get all fields of specific type
   */
  const getFieldsByType = (fieldType: string): OCRField[] => {
    return fields.value.filter(f => f.type === fieldType)
  }

  /**
   * Get high-confidence fields (>= 0.8)
   */
  const getHighConfidenceFields = (): OCRField[] => {
    return fields.value.filter(f => f.confidence >= 0.8)
  }

  /**
   * Clear OCR result
   */
  const clearOCR = () => {
    ocrResult.value = null
    imageUrl.value = ''
    error.value = null
  }

  return {
    // State
    ocrResult,
    imageUrl,
    isLoading,
    error,
    
    // Computed
    fields,
    documentType,
    confidence,
    fullText,
    
    // Methods
    loadOCRResult,
    extractOCRFromFile,
    getFieldByType,
    getFieldsByType,
    getHighConfidenceFields,
    clearOCR,
  }
}
