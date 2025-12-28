import { ref, computed } from 'vue'
import axios from '@/api/axios.client'

export const useFolders = () => {
    const folders = ref([])
    const rootFolder = ref(null)
    const currentFolder = ref(null)
    const breadcrumb = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Fetch root folders for the user
    const fetchRootFolders = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axios.get('/folders')
            rootFolder.value = response.data.data?.rootFolder || null
            folders.value = response.data.data?.folders || []
            currentFolder.value = rootFolder.value
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to load folders'
            console.error(error.value)
        } finally {
            isLoading.value = false
        }
    }

    // Fetch folder hierarchy (contents of a specific folder)
    const fetchFolderHierarchy = async (folderId) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axios.get(`/folders/${folderId}/hierarchy`)
            const data = response.data.data
            currentFolder.value = data.folder
            folders.value = data.subfolders || []
            
            // Also fetch breadcrumb
            await fetchBreadcrumb(folderId)
            
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to load folder'
            console.error(error.value)
        } finally {
            isLoading.value = false
        }
    }

    // Fetch breadcrumb path
    const fetchBreadcrumb = async (folderId) => {
        try {
            const response = await axios.get(`/folders/${folderId}/breadcrumb`)
            breadcrumb.value = response.data.data || []
        } catch (err) {
            console.error('Failed to load breadcrumb:', err)
        }
    }

    // Create a new folder
    const createFolder = async (name, description = '', parentId = null) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axios.post('/folders', {
                name,
                description,
                parent: parentId,
            })
            
            // Refresh the current folder list
            if (parentId) {
                await fetchFolderHierarchy(parentId)
            } else {
                await fetchRootFolders()
            }
            
            return response.data.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to create folder'
            console.error(error.value)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    // Update a folder
    const updateFolder = async (folderId, name, description) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axios.put(`/folders/${folderId}`, {
                name,
                description,
            })
            
            // Refresh the current folder
            if (currentFolder.value?._id === folderId) {
                currentFolder.value = response.data.data
                const parentId = currentFolder.value.parent
                if (parentId) {
                    await fetchFolderHierarchy(parentId)
                } else {
                    await fetchRootFolders()
                }
            } else {
                await fetchRootFolders()
            }
            
            return response.data.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update folder'
            console.error(error.value)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    // Delete a folder
    const deleteFolder = async (folderId) => {
        isLoading.value = true
        error.value = null
        try {
            await axios.delete(`/folders/${folderId}`)
            
            // Refresh the current view
            if (currentFolder.value?._id === folderId) {
                const parentId = currentFolder.value.parent
                if (parentId) {
                    await fetchFolderHierarchy(parentId)
                } else {
                    await fetchRootFolders()
                }
            } else {
                const parentId = currentFolder.value?._id
                if (parentId) {
                    await fetchFolderHierarchy(parentId)
                } else {
                    await fetchRootFolders()
                }
            }
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete folder'
            console.error(error.value)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    // Share folder
    const shareFolder = async (folderId, isPublic) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axios.put(`/folders/${folderId}/share`, {
                isPublic,
            })
            
            if (currentFolder.value?._id === folderId) {
                currentFolder.value = response.data.data
            }
            
            return response.data.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to share folder'
            console.error(error.value)
            throw error.value
        } finally {
            isLoading.value = false
        }
    }

    // Navigate to folder
    const navigateToFolder = async (folderId) => {
        if (folderId) {
            await fetchFolderHierarchy(folderId)
        } else {
            await fetchRootFolders()
            currentFolder.value = null
            breadcrumb.value = []
        }
    }

    return {
        folders,
        rootFolder,
        currentFolder,
        breadcrumb,
        isLoading,
        error,
        fetchRootFolders,
        fetchFolderHierarchy,
        fetchBreadcrumb,
        createFolder,
        updateFolder,
        deleteFolder,
        shareFolder,
        navigateToFolder,
    }
}

export const useDocumentWithFolder = () => {
    const documents = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const pagination = ref({
        total: 0,
        page: 1,
        limit: 10,
        pages: 1,
    })

    // Fetch documents in a specific folder
    const fetchDocumentsInFolder = async (folderId, page = 1, limit = 10) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axios.get('/documents', {
                params: {
                    folder: folderId,
                    page,
                    limit,
                },
            })
            
            documents.value = response.data.data || []
            pagination.value = response.data.pagination || {
                total: 0,
                page: 1,
                limit: 10,
                pages: 1,
            }
            
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to load documents'
            console.error(error.value)
        } finally {
            isLoading.value = false
        }
    }

    // Get all documents (without folder filter)
    const fetchAllDocuments = async (page = 1, limit = 10, category = null) => {
        isLoading.value = true
        error.value = null
        try {
            const params = { page, limit }
            if (category) params.category = category
            
            const response = await axios.get('/documents', { params })
            documents.value = response.data.data || []
            pagination.value = response.data.pagination || {
                total: 0,
                page: 1,
                limit: 10,
                pages: 1,
            }
            
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to load documents'
            console.error(error.value)
        } finally {
            isLoading.value = false
        }
    }

    return {
        documents,
        isLoading,
        error,
        pagination,
        fetchDocumentsInFolder,
        fetchAllDocuments,
    }
}
