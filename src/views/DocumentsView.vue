<template>
    <div class="documents-page">
        <Card title="My Documents">
            <template #extra>
                <Space>
                    <Button @click="showCategoryFilter = !showCategoryFilter">
                        Filter by Category
                    </Button>
                    <Button type="primary" @click="$router.push('/upload')">
                        Upload New Document
                    </Button>
                </Space>
            </template>

            <Row v-if="showCategoryFilter" :gutter="[16, 16]" style="margin-bottom: 16px">
                <Col :xs="24" :sm="12" :lg="6">
                    <Select
                        v-model:value="selectedCategory"
                        placeholder="Select category"
                        @change="handleCategoryChange"
                        allow-clear
                    >
                        <SelectOption value="">All Categories</SelectOption>
                        <SelectOption v-for="cat in categories" :key="cat._id" :value="cat._id">
                            {{ cat.name }}
                        </SelectOption>
                    </Select>
                </Col>
            </Row>

            <Spin :spinning="loading">
                <List :data-source="documents" :loading="loading">
                    <template #renderItem="{ item }">
                        <ListItem>
                            <ListItemMeta>
                                <template #avatar>
                                    <Badge :count="item.views">
                                        <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #f0f0f0; border-radius: 4px; font-size: 24px">
                                            <component :is="getFileIconComponent(item.fileType)" />
                                        </div>
                                    </Badge>
                                </template>
                                <template #title>
                                    <a href="javascript:;" @click="viewDocument(item._id)">{{ item.title }}</a>
                                </template>
                                <template #description>
                                    <div>
                                        <p v-if="item.description">{{ item.description }}</p>
                                        <div style="margin-top: 8px">
                                            <Tag :color="getCategoryColor(item.category?.name)">
                                                {{ item.category?.name }}
                                            </Tag>
                                            <Tag color="green">{{ item.fileType }}</Tag>
                                            <Tag v-for="tag in item.tags" :key="tag._id" :color="tag.color">
                                                {{ tag.name }}
                                            </Tag>
                                        </div>
                                        <div style="margin-top: 8px; font-size: 12px; color: #999">
                                            <span>{{ formatDate(item.createdAt) }}</span>
                                            <Divider type="vertical" />
                                            <span>AI: {{ item.aiClassification }}</span>
                                            <Divider type="vertical" />
                                            <span>Confidence: {{ (item.aiConfidence * 100).toFixed(0) }}%</span>
                                        </div>
                                    </div>
                                </template>
                            </ListItemMeta>
                            <template #actions>
                                <Button type="primary" size="small" @click="viewDocument(item._id)">View</Button>
                                <Button size="small" @click="downloadDocument(item._id, item.fileName)">Download</Button>
                                <Button danger size="small" @click="confirmDelete(item._id)">Delete</Button>
                            </template>
                        </ListItem>
                    </template>
                </List>
            </Spin>

            <!-- Pagination -->
            <Pagination
                v-model:current="currentPage"
                :total="pagination.total"
                :page-size="pagination.limit"
                @change="handlePageChange"
                style="text-align: center; margin-top: 24px"
            />
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDocuments, useCategories } from '@/composables/useDocumentComposable'
import { useRouter } from 'vue-router'
import { message, Modal, Card, Space, Button, Row, Col, Select, SelectOption, Spin, List, ListItem, ListItemMeta, Badge, Tag, Divider, Pagination } from 'ant-design-vue'
import { FilePdfOutlined, FileImageOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const { documents, fetchDocuments, isLoading: loading, pagination, deleteDocument, downloadDocument } = useDocuments()
const { categories, fetchCategories } = useCategories()

const selectedCategory = ref('')
const showCategoryFilter = ref(false)
const currentPage = ref(1)

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

const getCategoryColor = (name?: string) => {
    const colors: Record<string, string> = {
        'Contract': 'blue',
        'Invoice': 'green',
        'Report': 'orange',
        'Other': 'default',
    }
    return colors[name || 'Other'] || 'default'
}

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

const handleCategoryChange = async () => {
    currentPage.value = 1
    await fetchDocuments({
        category: selectedCategory.value || undefined,
        page: 1,
        limit: 10,
    })
}

const handlePageChange = async (page: number) => {
    currentPage.value = page
    await fetchDocuments({
        category: selectedCategory.value || undefined,
        page,
        limit: 10,
    })
}

const viewDocument = (id: string) => {
    router.push(`/documents/${id}`)
}

const confirmDelete = (id: string) => {
    Modal.confirm({
        title: 'Delete Document',
        content: 'Are you sure you want to delete this document?',
        okText: 'Yes',
        cancelText: 'No',
        onOk: async () => {
            try {
                await deleteDocument(id)
                message.success('Document deleted successfully')
                await fetchDocuments()
            } catch (err) {
                message.error('Delete failed')
            }
        },
    })
}

const handleDownload = async (id: string, fileName: string) => {
    try {
        await downloadDocument(id, fileName)
        message.success('Download started')
    } catch (err) {
        message.error('Download failed')
    }
}

onMounted(async () => {
    try {
        await fetchDocuments({ page: 1, limit: 10 })
        await fetchCategories()
    } catch (err) {
        console.error('Error loading data:', err)
    }
})
</script>

<style scoped>
.documents-page {
    max-width: 1200px;
    margin: 0 auto;
}
</style>
