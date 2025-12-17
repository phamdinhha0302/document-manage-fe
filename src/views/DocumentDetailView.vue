<template>
    <div class="document-detail-page">
        <Spin :spinning="loading">
            <Button type="primary" @click="$router.back()" style="margin-bottom: 16px">
                Back to Documents
            </Button>

            <Row :gutter="[24, 24]">
                <!-- Main Content -->
                <Col :xs="24" :lg="18">
                    <Card>
                        <Row :gutter="[16, 16]">
                            <Col :xs="24" :sm="4">
                                <div style="display: flex; align-items: center; justify-content: center; width: 120px; height: 120px; background: #f0f0f0; border-radius: 4px; font-size: 64px">
                                    <component :is="getFileIconComponent(document?.fileType)" />
                                </div>
                            </Col>
                            <Col :xs="24" :sm="20">
                                <h1 style="margin: 0 0 8px 0">{{ document?.title }}</h1>
                                <p style="margin: 0; color: #999">{{ document?.description }}</p>

                                <Space style="margin-top: 12px">
                                    <Tag :color="getCategoryColor(document?.category?.name)">
                                        {{ document?.category?.name }}
                                    </Tag>
                                    <Tag color="green">{{ document?.fileType }}</Tag>
                                    <Tag v-for="tag in document?.tags" :key="tag._id" :color="tag.color">
                                        {{ tag.name }}
                                    </Tag>
                                </Space>

                                <Divider />

                                <Space>
                                    <Button type="primary" @click="handleDownload">
                                        Download Document
                                    </Button>
                                    <Button v-if="isOwner" @click="showEditModal = true">
                                        Edit
                                    </Button>
                                    <Button v-if="isOwner" danger @click="confirmDelete">
                                        Delete
                                    </Button>
                                </Space>
                            </Col>
                        </Row>

                        <Divider />

                        <Tabs>
                            <TabPane key="1" tab="Preview">
                                <div class="file-preview">
                                    <!-- PDF Preview -->
                                    <div v-if="isPdfFile" class="pdf-preview">
                                        <iframe
                                            :src="`${document?.fileUrl}#toolbar=0`"
                                            style="width: 100%; height: 600px; border: none; border-radius: 4px"
                                        />
                                    </div>

                                    <!-- Image Preview -->
                                    <div v-else-if="isImageFile" class="image-preview">
                                        <img
                                            :src="document?.fileUrl"
                                            style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1)"
                                            alt="Document preview"
                                        />
                                    </div>

                                    <!-- Text File Preview -->
                                    <div v-else-if="isTextFile" class="text-preview">
                                        <div style="background: #f5f5f5; padding: 16px; border-radius: 4px; overflow: auto; max-height: 600px">
                                            <pre style="margin: 0; font-family: 'Monaco', 'Menlo', 'Consolas', monospace; font-size: 12px; line-height: 1.5">{{ filePreviewContent }}</pre>
                                        </div>
                                    </div>

                                    <!-- Unsupported File Type -->
                                    <div v-else class="unsupported-preview">
                                        <Empty description="Preview not available for this file type">
                                            <template #notFoundImage>
                                                <div style="font-size: 48px; margin-bottom: 16px">📁</div>
                                            </template>
                                            <Button type="primary" @click="handleDownload" style="margin-top: 16px">
                                                Download {{ document?.fileType }} File
                                            </Button>
                                        </Empty>
                                    </div>
                                </div>
                            </TabPane>

                            <TabPane v-if="isImageFile" key="2" tab="OCR Content">
                                <p v-if="document?.ocrContent" style="white-space: pre-wrap; line-height: 1.6">
                                    {{ document?.ocrContent }}
                                </p>
                                <Empty v-else description="No OCR content available" />
                            </TabPane>

                            <TabPane key="2.5" tab="AI Summary">
                                <div>
                                    <div v-if="!document?.summary && !summaryLoading" style="text-align: center; padding: 32px">
                                        <Button type="primary" size="large" @click="generateSummary" :loading="summaryLoading">
                                            📝 Generate Summary
                                        </Button>
                                        <p style="margin-top: 16px; color: #999; font-size: 12px">
                                            Uses Gemini AI to analyze and summarize the document file
                                        </p>
                                    </div>
                                    <Spin :spinning="summaryLoading">
                                        <div v-if="document?.summary" style="padding: 16px; background: #f5f5f5; border-radius: 4px">
                                            <p style="white-space: pre-wrap; line-height: 1.8; margin: 0">{{ document?.summary }}</p>
                                            <Button type="link" size="small" style="margin-top: 16px" @click="regenerateSummary" :loading="summaryLoading">
                                                🔄 Regenerate Summary
                                            </Button>
                                        </div>
                                    </Spin>
                                </div>
                            </TabPane>

                            <TabPane key="3" tab="AI Analysis">
                                <Descriptions :column="1" bordered>
                                    <DescriptionsItem label="Classification">
                                        <Tag color="blue">{{ document?.aiClassification }}</Tag>
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Confidence">
                                        <Progress
                                            :percent="(document?.aiConfidence || 0) * 100"
                                            :format="(percent) => `${percent.toFixed(2)}%`"
                                        />
                                    </DescriptionsItem>
                                </Descriptions>
                            </TabPane>

                            <TabPane key="4" tab="Details">
                                <Descriptions :column="1" bordered>
                                    <DescriptionsItem label="File Type">
                                        {{ document?.fileType }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="File Size">
                                        {{ formatFileSize(document?.fileSize || 0) }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Uploaded By">
                                        {{ document?.uploadedBy?.fullName }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Upload Date">
                                        {{ formatDate(document?.createdAt) }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Views">
                                        {{ document?.views }}
                                    </DescriptionsItem>
                                    <DescriptionsItem label="Downloads">
                                        {{ document?.downloads }}
                                    </DescriptionsItem>
                                </Descriptions>
                            </TabPane>
                        </Tabs>

                        <Divider />

                        <h3>Notes</h3>
                        <p v-if="document?.notes" style="white-space: pre-wrap">{{ document?.notes }}</p>
                        <p v-else style="color: #999">No notes added</p>
                    </Card>
                </Col>

                <!-- Sidebar -->
                <Col :xs="24" :lg="6">
                    <Card title="Statistics">
                        <Statistic title="Views" :value="document?.views">
                            <template #prefix>
                                <EyeOutlined />
                            </template>
                        </Statistic>
                        <Divider />
                        <Statistic title="Downloads" :value="document?.downloads">
                            <template #prefix>
                                <DownloadOutlined />
                            </template>
                        </Statistic>
                    </Card>
                </Col>
            </Row>

            <!-- Edit Modal -->
            <Modal v-model:visible="showEditModal" title="Edit Document" @ok="handleUpdate">
                <Form :model="editForm" layout="vertical">
                    <FormItem label="Title">
                        <Input v-model:value="editForm.title" />
                    </FormItem>
                    <FormItem label="Description">
                        <Input.TextArea v-model:value="editForm.description" :rows="4" />
                    </FormItem>
                    <FormItem label="Notes">
                        <Input.TextArea v-model:value="editForm.notes" :rows="4" />
                    </FormItem>
                </Form>
            </Modal>
        </Spin>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocuments } from '@/composables/useDocumentComposable'
import { useAuth } from '@/composables/useAuthComposable'
import { message, Modal, Spin, Button, Row, Col, Card, Space, Tag, Divider, Tabs, TabPane, Empty, Descriptions, DescriptionsItem, Progress, Statistic, Form, FormItem, Input } from 'ant-design-vue'
import { EyeOutlined, DownloadOutlined, FilePdfOutlined, FileImageOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons-vue'
import { getFileColor } from '@/utils/file-icon'
import { documentAPI } from '@/api/api.service'

const route = useRoute()
const router = useRouter()
const { getDocument, updateDocument, deleteDocument, downloadDocument, isLoading: loading } = useDocuments()
const { user } = useAuth()

const document = ref<any>(null)
const showEditModal = ref(false)
const editForm = ref({
    title: '',
    description: '',
    notes: '',
})
const filePreviewContent = ref('')
const summaryLoading = ref(false)

const isOwner = computed(() => {
    return user.value?._id === document.value?.uploadedBy._id
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

const isImageFile = computed(() => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'image']
    const fileType = document.value?.fileType?.toLowerCase() || ''
    return imageTypes.includes(fileType)
})

const isTextFile = computed(() => {
    const textTypes = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'text']
    const fileType = document.value?.fileType?.toLowerCase() || ''
    return textTypes.includes(fileType)
})

const isPdfFile = computed(() => {
    const fileType = document.value?.fileType?.toLowerCase() || ''
    return fileType === 'pdf'
})

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
        hour: '2-digit',
        minute: '2-digit',
    })
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const handleDownload = async () => {
    try {
        await downloadDocument(document.value._id, document.value.fileName)
        message.success('Download started')
    } catch (err) {
        message.error('Download failed')
    }
}

const generateSummary = async () => {
    if (!document.value?.fileUrl) {
        message.warning('Document file not found')
        return
    }

    summaryLoading.value = true
    try {
        const response = await documentAPI.summarizeDocument(document.value._id)
        console.log('Summary response:', response)
        
        // Handle axios response structure: response.data contains { success, data: { summary, ... } }
        const summaryText = response.data?.data?.summary || response.data?.summary
        
        if (!summaryText) {
            message.error('No summary content received from server')
            return
        }
        
        document.value.summary = summaryText
        message.success('Summary generated successfully')
        
        // Refresh document from server to ensure summary is persisted
        document.value = await getDocument(route.params.id as string)
    } catch (err: any) {
        console.error('Summary error:', err)
        const errorMsg = err.response?.data?.message || err.message || 'Failed to generate summary'
        message.error(errorMsg)
    } finally {
        summaryLoading.value = false
    }
}

const regenerateSummary = async () => {
    // Clear existing summary to force regeneration
    document.value.summary = ''
    await generateSummary()
    // Refresh document from server to ensure summary is persisted
    document.value = await getDocument(route.params.id as string)
}

const handleUpdate = async () => {
    try {
        await updateDocument(document.value._id, editForm.value)
        message.success('Document updated successfully')
        showEditModal.value = false
        // Reload document
        document.value = await getDocument(route.params.id as string)
    } catch (err) {
        message.error('Update failed')
    }
}

const confirmDelete = () => {
    Modal.confirm({
        title: 'Delete Document',
        content: 'Are you sure you want to delete this document?',
        okText: 'Yes',
        cancelText: 'No',
        onOk: async () => {
            try {
                await deleteDocument(document.value._id)
                message.success('Document deleted successfully')
                router.push('/documents')
            } catch (err) {
                message.error('Delete failed')
            }
        },
    })
}

const loadTextFilePreview = async () => {
    try {
        if (isTextFile.value && document.value?.fileUrl) {
            const response = await fetch(document.value.fileUrl)
            filePreviewContent.value = await response.text()
        }
    } catch (err) {
        console.error('Failed to load text file preview:', err)
        filePreviewContent.value = 'Failed to load file preview'
    }
}

onMounted(async () => {
    try {
        const id = route.params.id as string
        document.value = await getDocument(id)
        editForm.value = {
            title: document.value.title,
            description: document.value.description,
            notes: document.value.notes,
        }
        // Load text file preview if applicable
        await loadTextFilePreview()
    } catch (err) {
        message.error('Failed to load document')
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

.file-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.pdf-preview {
    width: 100%;
}

.image-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
    background: #f5f5f5;
    border-radius: 4px;
}

.image-preview img {
    max-width: 100%;
    height: auto;
}

.text-preview {
    width: 100%;
}

.text-preview pre {
    word-wrap: break-word;
    white-space: pre-wrap;
}

.unsupported-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 400px;
}
</style>
