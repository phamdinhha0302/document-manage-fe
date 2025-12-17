import { ref, computed } from 'vue'
import { documentAPI, categoryAPI, tagAPI } from '@/api/api.service'

const documents = ref<any[]>([])
const categories = ref<any[]>([])
const tags = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
})

export function useDocuments() {
    const fetchDocuments = async (params?: {
        category?: string
        tags?: string[]
        search?: string
        page?: number
        limit?: number
    }) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await documentAPI.getDocuments(params)
            documents.value = response.data.data
            pagination.value = response.data.pagination
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch documents'
        } finally {
            isLoading.value = false
        }
    }

    const getDocument = async (id: string) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await documentAPI.getDocument(id)
            return response.data.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch document'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const uploadDocument = async (formData: FormData) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await documentAPI.uploadDocument(formData)
            documents.value.unshift(response.data.data)
            return response.data.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to upload document'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const updateDocument = async (id: string, data: any) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await documentAPI.updateDocument(id, data)
            const index = documents.value.findIndex((d) => d._id === id)
            if (index !== -1) {
                documents.value[index] = response.data.data
            }
            return response.data.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to update document'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const deleteDocument = async (id: string) => {
        isLoading.value = true
        error.value = null
        try {
            await documentAPI.deleteDocument(id)
            documents.value = documents.value.filter((d) => d._id !== id)
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to delete document'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const searchDocuments = async (query: string, page: number = 1, limit: number = 10) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await documentAPI.searchDocuments({ q: query, page, limit })
            documents.value = response.data.data
            pagination.value = response.data.pagination
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Search failed'
        } finally {
            isLoading.value = false
        }
    }

    const downloadDocument = async (id: string, fileName: string) => {
        try {
            const response = await documentAPI.downloadDocument(id)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.parentElement?.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Download failed'
            throw err
        }
    }

    return {
        documents: computed(() => documents.value),
        isLoading: computed(() => isLoading.value),
        error: computed(() => error.value),
        pagination: computed(() => pagination.value),
        fetchDocuments,
        getDocument,
        uploadDocument,
        updateDocument,
        deleteDocument,
        searchDocuments,
        downloadDocument,
    }
}

export function useCategories() {
    const fetchCategories = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await categoryAPI.getCategories()
            categories.value = response.data.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch categories'
        } finally {
            isLoading.value = false
        }
    }

    const createCategory = async (data: any) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await categoryAPI.createCategory(data)
            categories.value.push(response.data.data)
            return response.data.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to create category'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        categories: computed(() => categories.value),
        isLoading: computed(() => isLoading.value),
        error: computed(() => error.value),
        fetchCategories,
        createCategory,
    }
}

export function useTags() {
    const fetchTags = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await tagAPI.getTags()
            tags.value = response.data.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch tags'
        } finally {
            isLoading.value = false
        }
    }

    const createTag = async (data: { name: string; color?: string }) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await tagAPI.createTag(data)
            tags.value.push(response.data.data)
            return response.data.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to create tag'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        tags: computed(() => tags.value),
        isLoading: computed(() => isLoading.value),
        error: computed(() => error.value),
        fetchTags,
        createTag,
    }
}
