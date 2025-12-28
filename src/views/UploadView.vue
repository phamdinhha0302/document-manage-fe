<template>
    <div class="upload-page">
        <Card title="Upload Document" :bordered="false" class="shadow-card">
            <Form
                ref="formRef"
                :model="formState"
                layout="vertical"
                @finish="handleUpload"
            >
                <FormItem
                    label="Document Title"
                    name="title"
                    :rules="[{ required: true, message: 'Please enter document title' }]"
                >
                    <Input v-model:value="formState.title" placeholder="Enter document title" />
                </FormItem>

                <FormItem label="Description" name="description">
                    <Input.TextArea 
                        v-model:value="formState.description" 
                        placeholder="Enter document description" 
                        :rows="4" 
                    />
                </FormItem>

                <FormItem
                    label="Category"
                    name="categoryId"
                    :rules="[{ required: true, message: 'Please select a category' }]"
                >
                    <div class="input-group">
                        <Select
                            v-model:value="formState.categoryId"
                            placeholder="Select a category"
                            :loading="isMetaLoading"
                            class="flex-1"
                        >
                            <SelectOption v-for="cat in categories" :key="cat._id" :value="cat._id">
                                {{ cat.name }}
                            </SelectOption>
                        </Select>
                        <Button @click="showCategoryModal = true">
                            <PlusOutlined />
                        </Button>
                    </div>
                </FormItem>

                <FormItem label="Folder (Optional)" name="folderId">
                    <Select
                        v-model:value="formState.folderId"
                        placeholder="Select a folder"
                        allow-clear
                        :loading="isMetaLoading"
                    >
                        <SelectOption value="">Root Folder</SelectOption>
                        <SelectOption v-for="folder in folders" :key="folder._id" :value="folder._id">
                            {{ folder.name }}
                        </SelectOption>
                    </Select>
                </FormItem>

                <FormItem label="Tags" name="tagIds">
                    <div class="input-group">
                        <Select
                            v-model:value="formState.tagIds"
                            mode="multiple"
                            placeholder="Select tags"
                            :loading="isMetaLoading"
                            class="flex-1"
                        >
                            <SelectOption v-for="tag in tags" :key="tag._id" :value="tag._id">
                                {{ tag.name }}
                            </SelectOption>
                        </Select>
                        <Button @click="showTagModal = true">
                            <PlusOutlined />
                        </Button>
                    </div>
                </FormItem>

                <FormItem
                    label="File"
                    name="file"
                    :rules="[{ required: true, message: 'Please upload a file' }]"
                >
                    <Upload
                        v-model:file-list="fileList"
                        name="file"
                        :max-count="1"
                        accept=".pdf,.jpg,.jpeg,.png,.gif"
                        :before-upload="handleBeforeUpload"
                        @remove="handleRemoveFile"
                    >
                        <Button>
                            <UploadOutlined /> Click to Upload
                        </Button>
                    </Upload>
                </FormItem>

                <FormItem class="submit-row">
                    <Button type="primary" html-type="submit" :loading="loading" size="large">
                        <UploadOutlined /> Upload Document
                    </Button>
                </FormItem>
            </Form>

            <Divider />

            <h3>Uploaded Documents</h3>
            <Table
                :columns="columns"
                :data-source="documents"
                :loading="loading"
                :pagination="{ pageSize: 10 }"
                size="small"
                row-key="_id"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'fileType'">
                        <Tag :color="getFileTypeColor(record.fileType)">{{ record.fileType }}</Tag>
                    </template>
                    <template v-else-if="column.key === 'aiClassification'">
                        <Tag color="blue" v-if="record.aiClassification">{{ record.aiClassification }}</Tag>
                        <span v-else class="text-gray-400">-</span>
                    </template>
                    <template v-else-if="column.key === 'actions'">
                        <Space>
                            <a @click="viewDocument(record._id)">View</a>
                            <Divider type="vertical" />
                            <a class="text-danger" @click="confirmDelete(record._id)">Delete</a>
                        </Space>
                    </template>
                </template>
            </Table>
        </Card>

        <Modal
            v-model:open="showCategoryModal"
            title="Create New Category"
            @ok="handleCreateCategory"
            :confirm-loading="categoryLoading"
        >
            <FormItem label="Category Name" required>
                <Input v-model:value="newCategoryName" @keyup.enter="handleCreateCategory" />
            </FormItem>
        </Modal>

        <Modal
            v-model:open="showTagModal"
            title="Create New Tag"
            @ok="handleCreateTag"
            :confirm-loading="tagLoading"
        >
            <Form layout="vertical">
                <FormItem label="Tag Name" required>
                    <Input v-model:value="newTagName" @keyup.enter="handleCreateTag" />
                </FormItem>
                <FormItem label="Color">
                    <Input v-model:value="newTagColor" type="color" class="color-picker" />
                </FormItem>
            </Form>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal, Form, FormItem, Input, Select, SelectOption, Upload, Button, Divider, Table, Tag, Space } from 'ant-design-vue'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'

// Composables
import { useDocuments, useCategories, useTags } from '@/composables/useDocumentComposable'
import { useFolders } from '@/composables/useFolderComposable'

// --- Interfaces ---
interface IUploadForm {
    title: string;
    description: string;
    categoryId: string | undefined;
    folderId: string | undefined;
    tagIds: string[];
    file: File | null;
}

const router = useRouter()
const route = useRoute()

// Composable Destructuring
const { documents, uploadDocument: apiUpload, fetchDocuments, isLoading: loading, deleteDocument } = useDocuments()
const { categories, fetchCategories, createCategory } = useCategories()
const { tags, fetchTags, createTag } = useTags()
const { folders, fetchRootFolders } = useFolders()

// --- State ---
const formRef = ref()
const isMetaLoading = ref(false)
const fileList = ref<UploadProps['fileList']>([])

const formState = reactive<IUploadForm>({
    title: '',
    description: '',
    categoryId: undefined,
    folderId: undefined,
    tagIds: [],
    file: null,
})

// Modals State
const showCategoryModal = ref(false)
const newCategoryName = ref('')
const categoryLoading = ref(false)

const showTagModal = ref(false)
const newTagName = ref('')
const newTagColor = ref('#1890ff')
const tagLoading = ref(false)

// --- Table Configuration ---
const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', width: 250 },
    { title: 'Type', dataIndex: 'fileType', key: 'fileType', width: 100 },
    { title: 'AI Class', dataIndex: 'aiClassification', key: 'aiClassification', width: 150 },
    { title: 'Views', dataIndex: 'views', key: 'views', width: 80, align: 'center' },
    { title: 'Actions', key: 'actions', width: 150, align: 'right' },
]

// --- Handlers ---

// File Handling: prevent default upload and bind to state
const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    fileList.value = [file]
    formState.file = file
    // Auto-fill title with filename (without extension) if title is empty
    if (!formState.title) {
        const filename = file.name
        const titleWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename
        formState.title = titleWithoutExt
    }
    return false // Prevent automatic upload
}

const handleRemoveFile = () => {
    fileList.value = []
    formState.file = null
}

const handleUpload = async () => {
    if (!formState.file) return message.error('Please select a file')

    try {
        const formData = new FormData()
        formData.append('title', formState.title)
        formData.append('description', formState.description || '')
        formData.append('categoryId', formState.categoryId!) // rules ensure this is present
        
        if (formState.folderId) formData.append('folderId', formState.folderId)
        
        formState.tagIds.forEach(id => formData.append('tagIds', id))
        formData.append('file', formState.file)

        await apiUpload(formData)
        
        message.success('Document uploaded successfully!')
        resetForm()
        await fetchDocuments()
    } catch (err: any) {
        message.error(err.message || 'Upload failed')
    }
}

const resetForm = () => {
    formRef.value?.resetFields()
    formState.title = ''
    formState.description = ''
    formState.categoryId = undefined
    formState.folderId = undefined
    formState.tagIds = []
    handleRemoveFile()
}

// Quick Add Handlers
const handleCreateCategory = async () => {
    if (!newCategoryName.value.trim()) return message.warning('Name is required')
    
    categoryLoading.value = true
    try {
        const newCat = await createCategory({ name: newCategoryName.value })
        formState.categoryId = newCat._id
        showCategoryModal.value = false
        newCategoryName.value = ''
        message.success('Category created')
        // Refresh categories list implicitly handled by composable reactive state usually, 
        // but if not, call fetchCategories() here.
    } catch (err: any) {
        message.error(err.message || 'Failed')
    } finally {
        categoryLoading.value = false
    }
}

const handleCreateTag = async () => {
    if (!newTagName.value.trim()) return message.warning('Name is required')
    
    tagLoading.value = true
    try {
        const newTag = await createTag({ name: newTagName.value, color: newTagColor.value })
        formState.tagIds.push(newTag._id)
        showTagModal.value = false
        newTagName.value = ''
        newTagColor.value = '#1890ff'
        message.success('Tag created')
    } catch (err: any) {
        message.error(err.message || 'Failed')
    } finally {
        tagLoading.value = false
    }
}

// Actions
const viewDocument = (id: string) => router.push(`/documents/${id}`)

const confirmDelete = (id: string) => {
    Modal.confirm({
        title: 'Delete Document',
        content: 'This action cannot be undone. Continue?',
        okText: 'Delete',
        okType: 'danger',
        onOk: async () => {
            try {
                await deleteDocument(id)
                message.success('Deleted')
                await fetchDocuments()
            } catch (err) { message.error('Delete failed') }
        },
    })
}

// Helpers
const getFileTypeColor = (type: string) => {
    if (!type) return 'default'
    if (type.includes('pdf')) return 'red'
    if (type.includes('image')) return 'blue'
    if (type.includes('text') || type.includes('doc')) return 'green'
    return 'default'
}

// Lifecycle
onMounted(async () => {
    isMetaLoading.value = true
    try {
        // Parallel data fetching for speed
        await Promise.all([
            fetchDocuments(),
            fetchCategories(),
            fetchTags(),
            fetchRootFolders()
        ])
        
        const qFolderId = route.query.folderId as string
        if (qFolderId) formState.folderId = qFolderId
    } catch (err) {
        console.error('Init error', err)
    } finally {
        isMetaLoading.value = false
    }
})
</script>

<style scoped>
.upload-page {
    max-width: 1000px;
    margin: 24px auto;
    padding: 0 16px;
}

.shadow-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
}

.input-group {
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

.flex-1 {
    flex: 1;
}

.color-picker {
    width: 60px;
    padding: 2px;
    height: 32px;
}

.submit-row {
    margin-top: 24px;
    margin-bottom: 0;
}

.text-danger {
    color: #ff4d4f;
}

.text-gray-400 {
    color: #bdbdbd;
}
</style>