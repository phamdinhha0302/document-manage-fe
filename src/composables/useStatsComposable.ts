import { ref } from 'vue'
import { statsAPI } from '@/api/api.service'

interface CategoryStats {
    categoryId: string
    categoryName: string
    count: number
}

interface RecentDocument {
    _id: string
    title: string
    category: { name: string }
    views: number
    downloads: number
    createdAt: string
    fileType: string
}

interface StatsData {
    totalDocuments: number
    totalViews: number
    totalDownloads: number
    totalCategories: number
    documentsByCategory: CategoryStats[]
    recentDocuments: RecentDocument[]
}

const stats = ref<StatsData | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useStats() {
    const fetchStats = async () => {
        isLoading.value = true
        error.value = null
        try {
            const response = await statsAPI.getStats()
            stats.value = response.data.data
            return stats.value
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch stats'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        stats,
        isLoading,
        error,
        fetchStats,
    }
}
