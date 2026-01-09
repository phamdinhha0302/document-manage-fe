import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { documentAPI } from '@/api/api.service'

export const useOCR = () => {
    const ocrLoading = ref(false)
    const ocrError = ref<string | null>(null)

    const performOCR = async (documentId: string, language: string = 'eng') => {
        ocrLoading.value = true
        ocrError.value = null

        try {
            const response = await documentAPI.processOCR(documentId, language)
            const data = response.data?.data || response.data

            if (!data?.ocrContent) {
                throw new Error('No OCR content returned')
            }

            message.success('OCR processing completed')
            return {
                ocrContent: data.ocrContent,
                ocrLanguage: data.ocrLanguage,
                ocrConfidence: data.ocrConfidence,
            }
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err.message || 'OCR processing failed'
            ocrError.value = errorMsg
            message.error(errorMsg)
            throw err
        } finally {
            ocrLoading.value = false
        }
    }

    const uploadWithOCR = async (formData: FormData) => {
        ocrLoading.value = true
        ocrError.value = null

        try {
            const response = await documentAPI.uploadAndProcessOCR(formData)
            const data = response.data?.data || response.data

            message.success('Document uploaded and OCR processing started')
            return data
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err.message || 'Upload with OCR failed'
            ocrError.value = errorMsg
            message.error(errorMsg)
            throw err
        } finally {
            ocrLoading.value = false
        }
    }

    return {
        ocrLoading,
        ocrError,
        performOCR,
        uploadWithOCR,
    }
}
