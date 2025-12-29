<template>
    <div class="dashboard-page">
        <Row :gutter="[24, 24]">
            <Col v-for="stat in statCards" :key="stat.key" :xs="24" :sm="12" :lg="6">
                <Card :bordered="false" class="stat-card">
                    <Skeleton :loading="loading" active paragraph="{ rows: 1 }">
                        <Statistic :title="stat.title" :value="stat.value" :value-style="{ color: stat.color }">
                            <template #prefix>
                                <component :is="stat.icon" />
                            </template>
                        </Statistic>
                    </Skeleton>
                </Card>
            </Col>
        </Row>

        <div class="section-title">Thao tác nhanh</div>
        <Row :gutter="[24, 24]">
            <Col v-for="action in quickActions" :key="action.route" :xs="24" :sm="12" :lg="8">
                <Card hoverable class="action-card" @click="$router.push(action.route)">
                    <Meta :title="action.title" :description="action.description">
                        <template #avatar>
                            <div class="action-icon" :style="{ color: action.color, background: action.bg }">
                                <component :is="action.icon" />
                            </div>
                        </template>
                    </Meta>
                </Card>
            </Col>
        </Row>

        <div class="section-title">Tải lên gần đây</div>
        <Card :bordered="false" class="list-card">
            <List item-layout="horizontal" :data-source="recentDocuments" :loading="loading">
                <template #renderItem="{ item }">
                    <ListItem>
                        <ListItemMeta>
                            <template #avatar>
                                <div class="file-avatar">
                                    <component :is="getFileIcon(item.fileType)" />
                                </div>
                            </template>
                            <template #title>
                                <a @click="viewDocument(item._id)">{{ item.title }}</a>
                            </template>
                            <template #description>
                                <Space divider type="vertical">
                                    <Tag color="blue">{{ item.category?.name || 'Uncategorized' }}</Tag>
                                    <span>{{ formatDate(item.createdAt) }}</span>
                                    <span>
                                        <EyeOutlined /> {{ item.views }}
                                    </span>
                                </Space>
                            </template>
                        </ListItemMeta>
                        <template #actions>
                            <Button type="link" @click="viewDocument(item._id)">Xem</Button>
                        </template>
                    </ListItem>
                </template>
            </List>
        </Card>
    </div>
</template>

<script setup lang="ts">
import {
    DownloadOutlined,
    EyeOutlined,
    FileImageOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    FolderOutlined,
    SearchOutlined,
    UploadOutlined
} from '@ant-design/icons-vue'
import { Button, Card, Col, List, ListItem, ListItemMeta, CardMeta as Meta, Row, Skeleton, Space, Statistic, Tag } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// Composables
import { useCategories, useDocuments } from '@/composables/useDocumentComposable'
import { useStats } from '@/composables/useStatsComposable'

// --- Interfaces ---
interface IDocument {
    _id: string;
    title: string;
    fileType: string;
    views: number;
    downloads: number;
    createdAt: string;
    category?: { name: string };
}

interface IStatCard {
    key: string;
    title: string;
    value: number;
    icon: any;
    color: string;
}

// --- Setup ---
const router = useRouter()
const { documents, fetchDocuments, isLoading: loading } = useDocuments()
const { categories, fetchCategories } = useCategories()
const { stats, isLoading: statsLoading, fetchStats } = useStats()

// State for calculated stats
const totalViews = ref(0)
const totalDownloads = ref(0)
const totalDocsCount = ref(0)

// --- Configuration Data (Cleaner Template) ---

// 1. Stats Configuration
const statCards = computed<IStatCard[]>(() => [
    {
        key: 'docs',
        title: 'Tổng số tài liệu',
        value: totalDocsCount.value,
        icon: FileOutlined,
        color: '#1890ff'
    },
    {
        key: 'cats',
        title: 'Danh mục',
        value: categories.value.length,
        icon: FolderOutlined,
        color: '#722ed1'
    },
    {
        key: 'views',
        title: 'Tổng lượt xem',
        value: totalViews.value,
        icon: EyeOutlined,
        color: '#52c41a'
    },
    {
        key: 'downloads',
        title: 'Tải xuống',
        value: totalDownloads.value,
        icon: DownloadOutlined,
        color: '#fa8c16'
    }
])

// 2. Quick Actions Configuration
const quickActions = [
    {
        title: 'Tải lên tài liệu',
        description: 'Tải lên PDF hoặc hình ảnh',
        route: '/upload',
        icon: UploadOutlined,
        color: '#1890ff',
        bg: '#e6f7ff'
    },
    {
        title: 'Tìm kiếm',
        description: 'Tìm tài liệu',
        route: '/search',
        icon: SearchOutlined,
        color: '#13c2c2',
        bg: '#e6fffb'
    },
    {
        title: 'Tài liệu của tôi',
        description: 'Quản lý các tệp',
        route: '/documents',
        icon: FileOutlined,
        color: '#722ed1',
        bg: '#f9f0ff'
    }
]

// 3. Recent Docs (Computed wrapper for strict typing)
const recentDocuments = computed<IDocument[]>(() => documents.value as unknown as IDocument[])

// --- Helpers ---
const getFileIcon = (type?: string) => {
    if (!type) return FileOutlined
    if (type.includes('pdf')) return FilePdfOutlined
    if (type.includes('image')) return FileImageOutlined
    if (type.includes('text')) return FileTextOutlined
    return FileOutlined
}

const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })
const viewDocument = (id: string) => router.push(`/documents/${id}`)

// --- Initialization ---
onMounted(async () => {
    try {
        // Parallel fetching
        await Promise.all([
            fetchDocuments({ limit: 5 }), // Fetch only recent 5 for the list
            fetchCategories(),
            fetchStats() // Fetch real stats from API
        ])

        // Update stats from API response
        if (stats.value) {
            totalDocsCount.value = stats.value.totalDocuments
            totalViews.value = stats.value.totalViews
            totalDownloads.value = stats.value.totalDownloads
        }
    } catch (err) {
        console.error('Dashboard init failed', err)
    }
})
</script>

<style scoped>
.dashboard-page {
    padding: 0;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    margin: 24px 0 16px;
    color: #262626;
}

.stat-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    transition: all 0.3s;
}

.stat-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.action-card {
    border-radius: 8px;
}

.action-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.list-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.file-avatar {
    width: 40px;
    height: 40px;
    background: #f5f5f5;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #595959;
}
</style>