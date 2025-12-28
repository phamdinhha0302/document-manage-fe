<template>
    <div class="search-page">
        <Card class="search-card">
            <template #title>
                <div class="card-title">
                    <span>🔍 Search Documents</span>
                </div>
            </template>

            <!-- Search Bar -->
            <div style="margin-bottom: 32px">
                <InputSearch
                    v-model:value="searchQuery"
                    placeholder="Search by title, description, or content..."
                    enter-button
                    size="large"
                    @search="handleSearch"
                    style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08)"
                />
            </div>

            <!-- Filters Section -->
            <div class="filters-section">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px">
                    <!-- <span style="font-weight: 600; font-size: 14px">📋 Filters</span> -->
                    <Tag v-if="hasActiveFilters" color="blue">{{ activeFilterCount }} active</Tag>
                </div>

                <Row :gutter="[16, 16]" style="margin-bottom: 16px">
                    <!-- Category Filter -->
                    <Col :xs="24" :sm="12" :md="8">
                        <div class="filter-group">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 13px">
                                Category
                            </label>
                            <Select
                                v-model:value="selectedCategory"
                                placeholder="All Categories"
                                @change="handleFilterChange"
                                allow-clear
                                style="width: 100%"
                            >
                                <SelectOption value="">All Categories</SelectOption>
                                <SelectOption v-for="cat in categories" :key="cat._id" :value="cat._id">
                                    {{ cat.name }}
                                </SelectOption>
                            </Select>
                        </div>
                    </Col>

                    <!-- Tags Filter -->
                    <Col :xs="24" :sm="12" :md="10">
                        <div class="filter-group">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 13px">
                                Tags
                            </label>
                            <Select
                                v-model:value="selectedTags"
                                mode="multiple"
                                placeholder="All Tags"
                                @change="handleFilterChange"
                                allow-clear
                                style="width: 100%"
                                :max-tag-count="2"
                            >
                                <SelectOption v-for="tag in tags" :key="tag._id" :value="tag._id">
                                    {{ tag.name }}
                                </SelectOption>
                            </Select>
                        </div>
                    </Col>

                    <!-- Reset Button -->
                    <Col :xs="24" :md="6">
                        <div class="filter-group" style="display: flex; align-items: flex-end; height: 100%">
                            <Button 
                                @click="handleReset" 
                                style="width: 100%"
                                :type="hasActiveFilters ? 'primary' : 'default'"
                            >
                                {{ hasActiveFilters ? 'Clear All' : 'No Filters' }}
                            </Button>
                        </div>
                    </Col>
                </Row>

                <!-- Active Filters Display -->
                <div v-if="hasActiveFilters" class="active-filters">
                    <span v-if="selectedCategory" class="filter-badge">
                        Category: {{ getCategoryName(selectedCategory) }}
                        <CloseOutlined @click="selectedCategory = ''" style="margin-left: 4px; cursor: pointer" />
                    </span>
                    <span v-for="tagId in selectedTags" :key="tagId" class="filter-badge">
                        Tag: {{ getTagName(tagId) }}
                        <CloseOutlined @click="removeTag(tagId)" style="margin-left: 4px; cursor: pointer" />
                    </span>
                </div>
            </div>

            <Divider style="margin: 24px 0" />

            <!-- Results Section -->
            <Spin :spinning="loading">
                <!-- Results Found -->
                <div v-if="searchResults.length > 0" class="results-section">
                    <div class="results-header">
                        <span style="font-weight: 600; font-size: 14px">
                            Found <span style="color: #1890ff">{{ pagination.total }}</span> document(s)
                        </span>
                    </div>

                    <List :data-source="searchResults" class="documents-list">
                        <template #renderItem="{ item }">
                            <ListItem 
                                @click="viewDocument(item._id)" 
                                class="document-item"
                            >
                                <ListItemMeta>
                                    <template #avatar>
                                        <div style="display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #f0f0f0; border-radius: 4px; font-size: 32px">
                                            <component :is="getFileIconComponent(item.fileType)" />
                                        </div>
                                    </template>
                                    <template #title>
                                        <div class="document-title">{{ item.title }}</div>
                                    </template>
                                    <template #description>
                                        <div class="document-info">
                                            <p v-if="item.description" class="document-description">
                                                {{ item.description.substring(0, 100) }}{{ item.description.length > 100 ? '...' : '' }}
                                            </p>
                                            <div class="document-tags" style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px">
                                                <Tag color="blue" :bordered="false">{{ item.category?.name }}</Tag>
                                                <Tag color="green" :bordered="false">{{ item.fileType }}</Tag>
                                                <Tag 
                                                    v-for="tag in item.tags" 
                                                    :key="tag._id" 
                                                    :color="tag.color"
                                                    :bordered="false"
                                                    style="font-size: 12px"
                                                >
                                                    {{ tag.name }}
                                                </Tag>
                                            </div>
                                            <div class="document-stats" style="display: flex; gap: 16px; margin-top: 10px; font-size: 12px; color: #999">
                                                <span>👁️ {{ item.views }} views</span>
                                                <span>📥 {{ item.downloads || 0 }} downloads</span>
                                                <span>By {{ item.uploadedBy?.fullName }}</span>
                                            </div>
                                        </div>
                                    </template>
                                </ListItemMeta>
                            </ListItem>
                        </template>
                    </List>

                    <!-- Pagination -->
                    <div style="text-align: center; margin-top: 32px">
                        <Pagination
                            v-model:current="currentPage"
                            :total="pagination.total"
                            :page-size="pagination.limit"
                            @change="handlePageChange"
                            show-size-changer
                            :show-total="(total) => `Total ${total} documents`"
                        />
                    </div>
                </div>

                <!-- No Results -->
                <div v-else-if="searched" class="empty-state">
                    <Empty
                        description="No documents found"
                        style="margin-top: 48px"
                    >
                        <template #notFoundImage>
                            <div style="font-size: 48px; margin-bottom: 16px">📄</div>
                        </template>
                    </Empty>
                </div>

                <!-- Initial State -->
                <div v-else class="empty-state">
                    <Empty
                        description="Start searching or browsing documents"
                        style="margin-top: 48px"
                    >
                        <template #notFoundImage>
                            <div style="font-size: 48px; margin-bottom: 16px">🔍</div>
                        </template>
                        <template #default>
                            <div style="margin-top: 16px; color: #666; font-size: 14px">
                                <p>Try:</p>
                                <ul style="text-align: left; display: inline-block">
                                    <li>Entering keywords in the search box</li>
                                    <li>Selecting a category or tags</li>
                                    <li>Leaving search empty and clicking search to browse all</li>
                                </ul>
                            </div>
                        </template>
                    </Empty>
                </div>
            </Spin>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDocuments, useCategories, useTags } from '@/composables/useDocumentComposable'
import { useRouter } from 'vue-router'
import { Card, InputSearch, Spin, List, ListItem, ListItemMeta, Tag, Pagination, Empty, Select, SelectOption, Button, Row, Col, Divider } from 'ant-design-vue'
import { CloseOutlined, FilePdfOutlined, FileImageOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const { documents, fetchDocuments, isLoading: loading, pagination } = useDocuments()
const { categories, fetchCategories } = useCategories()
const { tags, fetchTags } = useTags()

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedTags = ref<string[]>([])
const currentPage = ref(1)
const searched = ref(false)

const searchResults = computed(() => documents.value)

const hasActiveFilters = computed(() => {
    return selectedCategory.value !== '' || selectedTags.value.length > 0
})

const activeFilterCount = computed(() => {
    return (selectedCategory.value ? 1 : 0) + selectedTags.value.length
})

const getFileIconComponent = (fileType: string | undefined) => {
    const type = fileType?.toLowerCase() || 'file'
    
    switch (type) {
        case 'pdf':
            return FilePdfOutlined
        case 'image':
            return FileImageOutlined
        case 'text':
            return FileTextOutlined
        default:
            return FileOutlined
    }
}

const getCategoryName = (categoryId: string) => {
    return categories.value.find(c => c._id === categoryId)?.name || ''
}

const getTagName = (tagId: string) => {
    return tags.value.find(t => t._id === tagId)?.name || ''
}

const removeTag = (tagId: string) => {
    selectedTags.value = selectedTags.value.filter(id => id !== tagId)
    handleFilterChange()
}

const handleSearch = async (query: string) => {
    currentPage.value = 1
    
    // If search is empty, show all documents
    if (!query.trim() && selectedCategory.value === '' && selectedTags.value.length === 0) {
        searched.value = false
    }

    searched.value = true
    try {
        await fetchDocuments({
            search: query.trim() || undefined,
            category: selectedCategory.value || undefined,
            tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
            page: 1,
            limit: 10,
        })
    } catch (err) {
        console.error('Search error:', err)
    }
}

const handleFilterChange = async () => {
    currentPage.value = 1
    
    // If any filter is selected, show results
    if (searchQuery.value.trim() || selectedCategory.value || selectedTags.value.length > 0) {
        searched.value = true
        try {
            await fetchDocuments({
                search: searchQuery.value.trim() || undefined,
                category: selectedCategory.value || undefined,
                tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
                page: 1,
                limit: 10,
            })
        } catch (err) {
            console.error('Filter error:', err)
        }
    }
}

const handleReset = async () => {
    searchQuery.value = ''
    selectedCategory.value = ''
    selectedTags.value = []
    currentPage.value = 1
    searched.value = true
    
    try {
        await fetchDocuments({
            page: 1,
            limit: 10,
        })
    } catch (err) {
        console.error('Reset error:', err)
    }
}

const handlePageChange = (page: number) => {
    currentPage.value = page
    fetchDocuments({
        search: searchQuery.value.trim() || undefined,
        category: selectedCategory.value || undefined,
        tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
        page,
        limit: 10,
    })
}

const viewDocument = (id: string) => {
    router.push(`/documents/${id}`)
}

onMounted(async () => {
    // Load categories and tags for filters
    try {
        await fetchCategories()
        await fetchTags()
    } catch (err) {
        console.error('Error loading filter data:', err)
    }
})
</script>

<style scoped>
.search-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
}

.search-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border-radius: 8px;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
}

.filters-section {
    background-color: #fafafa;
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 16px;
}

.filter-group {
    width: 100%;
}

.active-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
}

.filter-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background-color: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 6px;
    font-size: 12px;
    color: #0050b3;
}

.results-section {
    margin-top: 24px;
}

.results-header {
    margin-bottom: 16px;
    padding: 12px 0;
    border-bottom: 2px solid #f0f0f0;
}

.documents-list {
    margin-top: 16px;
}

:deep(.ant-list-item) {
    padding: 16px 0 !important;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
}

:deep(.ant-list-item:hover) {
    background-color: #fafafa;
    border-radius: 4px;
    cursor: pointer;
    padding-left: 12px !important;
    padding-right: 12px !important;
}

.document-item {
    transition: all 0.2s ease;
}

.document-title {
    font-size: 15px;
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 4px;
}

.document-description {
    margin: 4px 0 8px 0;
    color: #666;
    font-size: 13px;
    line-height: 1.5;
}

.document-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 8px;
}

.document-stats {
    display: flex;
    gap: 16px;
    margin-top: 10px;
    font-size: 12px;
    color: #999;
}

.document-info {
    margin-top: 8px;
}

.empty-state {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.ant-select) {
    border-radius: 6px;
}

:deep(.ant-btn) {
    border-radius: 6px;
}

:deep(.ant-input-search) {
    border-radius: 8px;
}

@media (max-width: 768px) {
    .search-page {
        padding: 12px;
    }

    .filters-section {
        padding: 12px;
    }

    .filter-badge {
        font-size: 11px;
        padding: 3px 8px;
    }

    .card-title {
        font-size: 16px;
    }
}
</style>
