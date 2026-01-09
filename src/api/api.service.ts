import apiClient from './axios.client'
import ocrClient from './ocr.client'

export const authAPI = {
    register(data: { email: string; password: string; fullName: string }) {
        return apiClient.post('/auth/register', data)
    },

    login(data: { email: string; password: string }) {
        return apiClient.post('/auth/login', data)
    },

    getProfile() {
        return apiClient.get('/auth/profile')
    },
}

export const documentAPI = {
    getDocuments(params?: {
        category?: string
        tags?: string[]
        search?: string
        page?: number
        limit?: number
    }) {
        return apiClient.get('/documents', { params })
    },

    getDocument(id: string) {
        return apiClient.get(`/documents/${id}`)
    },

    uploadDocument(formData: FormData) {
        return apiClient.post('/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    uploadAndProcessOCR(formData: FormData) {
        return apiClient.post('/documents/ocr/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    processOCR(documentId: string, language: string = 'eng') {
        return apiClient.post(`/documents/${documentId}/ocr`, { language })
    },

    updateDocument(id: string, data: any) {
        return apiClient.put(`/documents/${id}`, data)
    },

    deleteDocument(id: string) {
        return apiClient.delete(`/documents/${id}`)
    },

    searchDocuments(params: { q: string; page?: number; limit?: number }) {
        return apiClient.get('/search/documents', { params })
    },

    downloadDocument(id: string) {
        return apiClient.get(`/documents/${id}/download`, {
            responseType: 'blob',
        })
    },

    summarizeDocument(id: string) {
        return apiClient.post(`/documents/${id}/summarize`, {})
    },
}

export const categoryAPI = {
    getCategories() {
        return apiClient.get('/categories')
    },

    getCategory(id: string) {
        return apiClient.get(`/categories/${id}`)
    },

    createCategory(data: any) {
        return apiClient.post('/categories', data)
    },

    updateCategory(id: string, data: any) {
        return apiClient.put(`/categories/${id}`, data)
    },

    deleteCategory(id: string) {
        return apiClient.delete(`/categories/${id}`)
    },
}

export const tagAPI = {
    getTags() {
        return apiClient.get('/tags')
    },

    createTag(data: { name: string; color?: string }) {
        return apiClient.post('/tags', data)
    },

    deleteTag(id: string) {
        return apiClient.delete(`/tags/${id}`)
    },
}

export const statsAPI = {
    getStats() {
        return apiClient.get('/stats')
    },
}

export const ocrAPI = {
    extractText(formData: FormData) {
        return ocrClient.post('/ocr/extract', formData)
    },

    uploadAndSave(formData: FormData) {
        return ocrClient.post('/ocr/upload-and-save', formData)
    },

    getSupportedLanguages() {
        return ocrClient.get('/ocr/supported-languages')
    },
}
