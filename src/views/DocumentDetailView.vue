<template>
    <div class="document-detail-page">
        <div class="header-actions">
            <Button @click="handleBack">
                <ArrowLeftOutlined /> Quay lại tài liệu
            </Button>
        </div>

        <Spin :spinning="loading">
            <Row :gutter="[24, 24]">
                <Col :xs="24" :lg="18">
                    <Card class="main-card">
                        <div class="doc-header">
                            <div class="icon-wrapper">
                                <component :is="getFileIconComponent(document?.fileType)" />
                            </div>
                            <div class="doc-info">
                                <h1 class="doc-title">{{ document?.title }}</h1>
                                <p class="doc-desc">{{ document?.description }}</p>

                                <Space class="meta-tags" wrap>
                                    <Tag :color="getCategoryColor(document?.category?.name)">
                                        {{ document?.category?.name || 'Uncategorized' }}
                                    </Tag>
                                    <Tag color="cyan">{{ document?.fileType?.toUpperCase() }}</Tag>
                                    <Tag v-for="tag in document?.tags" :key="tag._id" color="blue">
                                        #{{ tag.name }}
                                    </Tag>
                                </Space>

                                <div class="action-buttons">
                                    <Space>
                                        <Button type="primary" @click="handleDownload">
                                            <DownloadOutlined /> Tải xuống
                                        </Button>
                                        <template v-if="isOwner">
                                            <Button @click="openEditModal">Chỉnh sửa</Button>
                                            <Button danger @click="confirmDelete">Xóa</Button>
                                        </template>
                                    </Space>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <Tabs v-model:activeKey="activeTab">
                            <TabPane key="preview" tab="Xem trước">
                                <div class="preview-container">
                                    <iframe v-if="isPdfFile" :src="`${document?.fileUrl}#toolbar=0`"
                                        class="pdf-frame" />

                                    <div v-else-if="isImageFile" class="image-wrapper">
                                        <Image :src="document?.fileUrl" :alt="document?.title" />
                                    </div>

                                    <div v-else-if="isTextFile" class="text-wrapper">
                                        <Spin :spinning="textPreviewLoading">
                                            <pre class="code-block">{{ filePreviewContent }}</pre>
                                        </Spin>
                                    </div>

                                    <Empty v-else description="Xem trước không khả dụng">
                                        <Button type="primary" @click="handleDownload">
                                            Tải xuống tệp
                                        </Button>
                                    </Empty>
                                </div>
                            </TabPane>

                            <TabPane v-if="isImageFile || isPdfFile" key="ocr" tab="Nội dung OCR">
                                <div class="text-content-area">
                                    <p v-if="document?.ocrContent">{{ document.ocrContent }}</p>
                                    <Empty v-else description="Chưa trích xuất nội dung OCR" />
                                </div>
                            </TabPane>

                            <TabPane key="summary" tab="Tóm tắt AI">
                                <div class="summary-section">
                                    <div v-if="!document?.summary && !summaryLoading" class="summary-empty">
                                        <Button type="primary" size="large" @click="generateSummary">
                                            ✨ Tạo tóm tắt bằng AI
                                        </Button>
                                        <p class="hint-text">Sử dụng Gemini AI để phân tích ngữ cảnh tài liệu</p>
                                    </div>

                                    <Spin :spinning="summaryLoading">
                                        <div v-if="document?.summary" class="summary-content">
                                            <p>{{ document.summary }}</p>
                                            <div class="summary-actions">
                                                <Button type="link" size="small" @click="regenerateSummary">
                                                    <ReloadOutlined /> Tạo lại
                                                </Button>
                                            </div>
                                        </div>
                                    </Spin>
                                </div>
                            </TabPane>

                            <TabPane key="details" tab="Chi tiết">
                                <Descriptions bordered column="{ xs: 1, sm: 2 }">
                                    <DescriptionsItem label="Loại tệp">{{ document?.fileType }}</DescriptionsItem>
                                    <DescriptionsItem label="Kích thước">{{ formatFileSize(document?.fileSize || 0) }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Tải lên bởi">{{ document?.uploadedBy?.fullName || 'Không xác định' }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Ngày">{{ formatDate(document?.createdAt) }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Phân loại">
                                        <Tag color="purple">{{ document?.aiClassification || 'N/A' }}</Tag>
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Độ tin cậy AI">
                                        <Progress :percent="Math.round((document?.aiConfidence || 0) * 100)"
                                            size="small" :status="getConfidenceStatus(document?.aiConfidence)" />
                                    </DescriptionsItem>
                                </Descriptions>
                            </TabPane>
                        </Tabs>

                        <Divider orientation="left">Ghi chú</Divider>
                        <div class="notes-section">
                            <p v-if="document?.notes">{{ document.notes }}</p>
                            <span v-else class="text-muted">Chưa có ghi chú.</span>
                        </div>
                    </Card>
                </Col>

                <Col :xs="24" :lg="6">
                    <Card title="Thống kê" class="stats-card">
                        <Row :gutter="16">
                            <Col :span="12">
                                <Statistic title="Lượt xem" :value="document?.views">
                                    <template #prefix>
                                        <EyeOutlined />
                                    </template>
                                </Statistic>
                            </Col>
                            <Col :span="12">
                                <Statistic title="Tải xuống" :value="document?.downloads">
                                    <template #prefix>
                                        <DownloadOutlined />
                                    </template>
                                </Statistic>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </Spin>

        <Modal v-model:open="showEditModal" title="Chỉnh sửa tài liệu" @ok="handleUpdate" :confirmLoading="isUpdating">
            <Form layout="vertical">
                <FormItem label="Tiêu đề" required>
                    <Input v-model:value="editForm.title" />
                </FormItem>
                <FormItem label="Mô tả">
                    <Input.TextArea v-model:value="editForm.description" :rows="3" />
                </FormItem>
                <FormItem label="Ghi chú">
                    <Input.TextArea v-model:value="editForm.notes" :rows="3" />
                </FormItem>
            </Form>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import {
    ArrowLeftOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileImageOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    ReloadOutlined
} from '@ant-design/icons-vue'
import { Button, Card, Col, Descriptions, DescriptionsItem, Divider, Empty, Form, FormItem, Image, Input, message, Modal, Progress, Row, Space, Spin, Statistic, TabPane, Tabs, Tag } from 'ant-design-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Composables
import { documentAPI } from '@/api/api.service'
import { useAuth } from '@/composables/useAuthComposable'
import { useDocuments } from '@/composables/useDocumentComposable'

// --- Types ---
interface ITag { _id: string; name: string; }
interface IUser { _id: string; fullName: string; }
interface IDocument {
    _id: string;
    title: string;
    description?: string;
    notes?: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    fileName: string;
    views: number;
    downloads: number;
    createdAt: string;
    uploadedBy: IUser;
    category?: { name: string };
    tags?: ITag[];
    ocrContent?: string;
    summary?: string;
    aiClassification?: string;
    aiConfidence?: number;
}

const route = useRoute()
const router = useRouter()
const { getDocument, updateDocument, deleteDocument, downloadDocument, isLoading: loading } = useDocuments()
const { user } = useAuth()

// --- State ---
const document = ref<IDocument | null>(null)
const activeTab = ref('preview')
const showEditModal = ref(false)
const isUpdating = ref(false)
const summaryLoading = ref(false)
const textPreviewLoading = ref(false)
const filePreviewContent = ref('')

const editForm = reactive({
    title: '',
    description: '',
    notes: '',
})

// --- Computed ---
const isOwner = computed(() => user.value?._id === document.value?.uploadedBy._id)

const isImageFile = computed(() => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(document.value?.fileType?.toLowerCase() || ''))
const isTextFile = computed(() => ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(document.value?.fileType?.toLowerCase() || ''))
const isPdfFile = computed(() => document.value?.fileType?.toLowerCase() === 'pdf')

// --- Actions ---

const handleBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/documents')
}

const handleDownload = async () => {
    if (!document.value) return
    try {
        await downloadDocument(document.value._id, document.value.fileName)
        message.success('Tải xuống bắt đầu')
        document.value.downloads++ // Optimistic update
    } catch (err) { message.error('Tải xuống thất bại') }
}

const openEditModal = () => {
    if (!document.value) return
    editForm.title = document.value.title
    editForm.description = document.value.description || ''
    editForm.notes = document.value.notes || ''
    showEditModal.value = true
}

const handleUpdate = async () => {
    if (!document.value) return
    isUpdating.value = true
    try {
        await updateDocument(document.value._id, editForm)
        message.success('Cập nhật thành công')

        // Update local state to avoid full re-fetch
        document.value.title = editForm.title
        document.value.description = editForm.description
        document.value.notes = editForm.notes

        showEditModal.value = false
    } catch (err) { message.error('Cập nhật thất bại') }
    finally { isUpdating.value = false }
}

const confirmDelete = () => {
    Modal.confirm({
        title: 'Xóa tài liệu?',
        content: 'Hành động này không thể hoàn tác.',
        okType: 'danger',
        onOk: async () => {
            if (!document.value) return
            try {
                await deleteDocument(document.value._id)
                message.success('Đã xóa')
                router.replace('/documents')
            } catch (err) { message.error('Xóa thất bại') }
        }
    })
}

// --- AI & Logic ---

const generateSummary = async () => {
    if (!document.value) return
    summaryLoading.value = true
    try {
        const res = await documentAPI.summarizeDocument(document.value._id)
        const summary = res.data?.data?.summary || res.data?.summary

        if (summary) {
            document.value.summary = summary
            message.success('Tóm tắt đã được tạo')
        } else {
            throw new Error('Không có dữ liệu tóm tắt được trả về')
        }
    } catch (err: any) {
        message.error(err.message || 'Tạo thất bại')
    } finally {
        summaryLoading.value = false
    }
}

const regenerateSummary = async () => {
    if (document.value) document.value.summary = ''
    await generateSummary()
}

const loadTextFilePreview = async () => {
    if (!isTextFile.value || !document.value?.fileUrl) return

    textPreviewLoading.value = true
    try {
        const res = await fetch(document.value.fileUrl)
        if (!res.ok) throw new Error('Phản hồi mạng không hợp lệ')
        filePreviewContent.value = await res.text()
    } catch (err) {
        filePreviewContent.value = 'Không thể tải xem trước văn bản. Vui lòng tải xuống tệp.'
    } finally {
        textPreviewLoading.value = false
    }
}

// --- Visual Helpers ---
const getFileIconComponent = (type?: string) => {
    const t = type?.toLowerCase() || 'file'
    if (t === 'pdf') return FilePdfOutlined
    if (t.includes('image')) return FileImageOutlined
    if (['txt', 'doc', 'docx'].some(x => t.includes(x))) return FileTextOutlined
    return FileOutlined
}

const getCategoryColor = (name?: string) => {
    const colors: Record<string, string> = { 'Contract': 'blue', 'Invoice': 'green', 'Report': 'orange' }
    return colors[name || ''] || 'default'
}

const getConfidenceStatus = (score?: number) => {
    if (!score) return 'normal'
    if (score > 0.8) return 'success'
    if (score > 0.5) return 'normal'
    return 'exception'
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : '-'

// --- Lifecycle ---
onMounted(async () => {
    const id = route.params.id as string
    if (!id) return router.push('/documents')

    try {
        document.value = await getDocument(id)
        if (isTextFile.value) await loadTextFilePreview()
    } catch (err) {
        message.error('Tài liệu không tìm thấy')
        router.push('/documents')
    }
})
</script>

<style scoped>
.document-detail-page {
    background: #f0f2f5;
    min-height: 100vh;
    padding: 24px;
}

.header-actions {
    margin-bottom: 16px;
}

.main-card,
.stats-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

/* Header Section */
.doc-header {
    display: flex;
    gap: 24px;
}

.icon-wrapper {
    flex-shrink: 0;
    width: 100px;
    height: 100px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: #1890ff;
}

.doc-info {
    flex: 1;
    min-width: 0;
}

.doc-title {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
}

.doc-desc {
    color: #8c8c8c;
    margin-bottom: 12px;
}

.meta-tags {
    margin-bottom: 16px;
}

/* Preview Section */
.preview-container {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.pdf-frame {
    width: 100%;
    height: 600px;
    border: none;
}

.image-wrapper img {
    max-width: 100%;
    max-height: 600px;
    object-fit: contain;
}

.text-wrapper {
    width: 100%;
    padding: 24px;
    max-height: 600px;
    overflow: auto;
    background: #fff;
}

.code-block {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    white-space: pre-wrap;
    margin: 0;
}

/* Summary Section */
.summary-empty {
    text-align: center;
    padding: 40px;
    background: #f9f9f9;
    border-radius: 8px;
}

.hint-text {
    margin-top: 12px;
    color: #8c8c8c;
    font-size: 13px;
}

.summary-content {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    padding: 20px;
    border-radius: 6px;
}

.summary-content p {
    margin: 0;
    line-height: 1.6;
    color: #262626;
    white-space: pre-wrap;
}

.summary-actions {
    margin-top: 12px;
    text-align: right;
}

/* OCR Section */
.text-content-area {
    padding: 16px;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    min-height: 200px;
    white-space: pre-wrap;
}

/* Notes */
.notes-section {
    color: #595959;
    white-space: pre-wrap;
    line-height: 1.6;
}

.text-muted {
    color: #bfbfbf;
    font-style: italic;
}

.action-buttons {
    justify-content: center;
    margin-top: 16px;
}

/* Responsive adjustments */
@media (max-width: 576px) {
    .doc-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
}
</style>