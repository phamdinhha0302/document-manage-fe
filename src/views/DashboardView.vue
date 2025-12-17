<template>
    <div class="dashboard-page">
        <Row :gutter="[24, 24]">
            <!-- Stats Cards -->
            <Col :xs="24" :sm="12" :lg="6">
                <Statistic title="Total Documents" :value="stats.totalDocuments">
                    <template #prefix>
                        <FileOutlined />
                    </template>
                </Statistic>
            </Col>
            <Col :xs="24" :sm="12" :lg="6">
                <Statistic title="Categories" :value="stats.categories">
                    <template #prefix>
                        <FolderOutlined />
                    </template>
                </Statistic>
            </Col>
            <Col :xs="24" :sm="12" :lg="6">
                <Statistic title="Total Views" :value="stats.totalViews">
                    <template #prefix>
                        <EyeOutlined />
                    </template>
                </Statistic>
            </Col>
            <Col :xs="24" :sm="12" :lg="6">
                <Statistic title="Total Downloads" :value="stats.totalDownloads">
                    <template #prefix>
                        <DownloadOutlined />
                    </template>
                </Statistic>
            </Col>
        </Row>

        <!-- Quick Actions -->
        <Row :gutter="[24, 24]" style="margin-top: 24px">
            <Col :xs="24" :sm="12" :lg="8">
                <Card hoverable @click="$router.push('/upload')">
                    <template #title>
                        <UploadOutlined /> Upload New Document
                    </template>
                    <p>Click to upload a PDF or image document</p>
                </Card>
            </Col>
            <Col :xs="24" :sm="12" :lg="8">
                <Card hoverable @click="$router.push('/search')">
                    <template #title>
                        <SearchOutlined /> Search Documents
                    </template>
                    <p>Search through all documents using keywords</p>
                </Card>
            </Col>
            <Col :xs="24" :sm="12" :lg="8">
                <Card hoverable @click="$router.push('/documents')">
                    <template #title>
                        <FileOutlined /> My Documents
                    </template>
                    <p>View and manage your uploaded documents</p>
                </Card>
            </Col>
        </Row>

        <!-- Recent Documents -->
        <Card title="Recent Documents" style="margin-top: 24px">
            <Spin :spinning="loading">
                <List :data-source="recentDocuments" :loading="loading">
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
                                    <a href="javascript:;">{{ item.title }}</a>
                                </template>
                                <template #description>
                                    <span>{{ item.category?.name }}</span>
                                    <Divider type="vertical" />
                                    <span>{{ formatDate(item.createdAt) }}</span>
                                </template>
                            </ListItemMeta>
                            <template #actions>
                                <Button type="primary" size="small" @click="viewDocument(item._id)">View</Button>
                            </template>
                        </ListItem>
                    </template>
                </List>
            </Spin>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDocuments, useCategories } from '@/composables/useDocumentComposable'
import { useRouter } from 'vue-router'
import { Row, Col, Statistic, Card, Spin, List, ListItem, ListItemMeta, Badge, Divider, Button } from 'ant-design-vue'
import { FileOutlined, FolderOutlined, EyeOutlined, DownloadOutlined, UploadOutlined, SearchOutlined, FilePdfOutlined, FileImageOutlined, FileTextOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const { documents, fetchDocuments, isLoading: loading } = useDocuments()
const { categories, fetchCategories } = useCategories()

const stats = ref({
    totalDocuments: 0,
    categories: 0,
    totalViews: 0,
    totalDownloads: 0,
})

const recentDocuments = ref<any[]>([])

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

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

const viewDocument = (id: string) => {
    router.push(`/documents/${id}`)
}

onMounted(async () => {
    try {
        await fetchDocuments({ limit: 5 })
        await fetchCategories()

        recentDocuments.value = documents.value
        stats.value.totalDocuments = documents.value.length
        stats.value.categories = categories.value.length
        stats.value.totalViews = documents.value.reduce((sum, doc) => sum + doc.views, 0)
        stats.value.totalDownloads = documents.value.reduce((sum, doc) => sum + doc.downloads, 0)
    } catch (err) {
        console.error('Error loading dashboard data:', err)
    }
})
</script>

<style scoped>
:deep(.ant-statistic-title) {
    font-size: 14px;
}

:deep(.ant-statistic-content) {
    font-size: 32px;
}

:deep(.ant-card) {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
