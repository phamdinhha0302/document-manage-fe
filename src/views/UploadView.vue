<template>
    <div class="upload-page">
        <Card title="Tải lên tài liệu" :bordered="false" class="shadow-card">
            <Form ref="formRef" :model="formState" layout="vertical" @finish="handleUpload">
                <FormItem label="Tiêu đề tài liệu" name="title"
                    :rules="[{ required: true, message: 'Vui lòng nhập tiêu đề tài liệu' }]">
                    <Input v-model:value="formState.title" placeholder="Nhập tiêu đề tài liệu" />
                </FormItem>

                <FormItem label="Mô tả" name="description">
                    <Input.TextArea v-model:value="formState.description" placeholder="Nhập mô tả tài liệu" :rows="4" />
                </FormItem>

                <FormItem label="Danh mục" name="categoryId"
                    :rules="[{ required: true, message: 'Vui lòng chọn danh mục' }]">
                    <div class="input-group">
                        <Select v-model:value="formState.categoryId" placeholder="Chọn danh mục"
                            :loading="isMetaLoading" class="flex-1">
                            <SelectOption v-for="cat in categories" :key="cat._id" :value="cat._id">
                                {{ cat.name }}
                            </SelectOption>
                        </Select>
                        <Button @click="showCategoryModal = true">
                            <PlusOutlined />
                        </Button>
                    </div>
                </FormItem>

                <FormItem label="Thư mục (Tùy chọn)" name="folderId">
                    <Select v-model:value="formState.folderId" placeholder="Chọn thư mục" allow-clear
                        :loading="isMetaLoading">
                        <SelectOption value="">Thư mục gốc</SelectOption>
                        <SelectOption v-for="folder in folders" :key="folder._id" :value="folder._id">
                            {{ folder.name }}
                        </SelectOption>
                    </Select>
                </FormItem>

                <FormItem label="Thẻ" name="tagIds">
                    <div class="input-group">
                        <Select v-model:value="formState.tagIds" mode="multiple" placeholder="Chọn thẻ"
                            :loading="isMetaLoading" class="flex-1">
                            <SelectOption v-for="tag in tags" :key="tag._id" :value="tag._id">
                                {{ tag.name }}
                            </SelectOption>
                        </Select>
                        <Button @click="showTagModal = true">
                            <PlusOutlined />
                        </Button>
                    </div>
                </FormItem>

                <FormItem label="Tệp" name="file" :rules="[{ required: true, message: 'Vui lòng tải lên tệp' }]">
                    <Upload v-model:file-list="fileList" name="file" :max-count="1" accept=".pdf,.jpg,.jpeg,.png,.gif"
                        :before-upload="handleBeforeUpload" @remove="handleRemoveFile">
                        <Button>
                            <UploadOutlined /> Nhấp để tải lên
                        </Button>
                    </Upload>
                </FormItem>

                <FormItem class="submit-row">
                    <Button type="primary" html-type="submit" :loading="loading" size="large">
                        <UploadOutlined /> Tải lên tài liệu
                    </Button>
                </FormItem>
            </Form>

            <Divider />

            <h3>Tài liệu đã tải lên</h3>
            <Table :columns="columns" :data-source="documents" :loading="loading" :pagination="{ pageSize: 10 }"
                size="small" row-key="_id">
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
                            <a @click="viewDocument(record._id)">Xem</a>
                            <Divider type="vertical" />
                            <a class="text-danger" @click="confirmDelete(record._id)">Xóa</a>
                        </Space>
                    </template>
                </template>
            </Table>
        </Card>

        <Modal v-model:open="showCategoryModal" title="Tạo danh mục mới" @ok="handleCreateCategory"
            :confirm-loading="categoryLoading">
            <FormItem label="Tên danh mục" required>
                <Input v-model:value="newCategoryName" @keyup.enter="handleCreateCategory" />
            </FormItem>
        </Modal>

        <Modal v-model:open="showTagModal" title="Tạo thẻ mới" @ok="handleCreateTag" :confirm-loading="tagLoading">
            <Form layout="vertical">
                <FormItem label="Tên thẻ" required>
                    <Input v-model:value="newTagName" @keyup.enter="handleCreateTag" />
                </FormItem>
                <FormItem label="Màu sắc">
                    <Input v-model:value="newTagColor" type="color" class="color-picker" />
                </FormItem>
            </Form>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import { Button, Divider, Form, FormItem, Input, message, Modal, Select, SelectOption, Space, Table, Tag, Upload } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Composables
import { useCategories, useDocuments, useTags } from '@/composables/useDocumentComposable'
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
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', width: 250 },
    { title: 'Loại', dataIndex: 'fileType', key: 'fileType', width: 100 },
    { title: 'Phân loại AI', dataIndex: 'aiClassification', key: 'aiClassification', width: 150 },
    { title: 'Lượt xem', dataIndex: 'views', key: 'views', width: 80, align: 'center' },
    { title: 'Thao tác', key: 'actions', width: 150, align: 'right' },
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
    if (!formState.file) return message.error('Vui lòng chọn tệp')

    try {
        const formData = new FormData()
        formData.append('title', formState.title)
        formData.append('description', formState.description || '')
        formData.append('categoryId', formState.categoryId!) // rules ensure this is present

        if (formState.folderId) formData.append('folderId', formState.folderId)

        formState.tagIds.forEach(id => formData.append('tagIds', id))
        formData.append('file', formState.file)

        await apiUpload(formData)

        message.success('Tài liệu đã được tải lên thành công!')
        resetForm()
        await fetchDocuments()
    } catch (err: any) {
        message.error(err.message || 'Tải lên thất bại')
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
    if (!newCategoryName.value.trim()) return message.warning('Tên là bắt buộc')

    categoryLoading.value = true
    try {
        const newCat = await createCategory({ name: newCategoryName.value })
        formState.categoryId = newCat._id
        showCategoryModal.value = false
        newCategoryName.value = ''
        message.success('Danh mục đã được tạo')
        // Refresh categories list implicitly handled by composable reactive state usually, 
        // but if not, call fetchCategories() here.
    } catch (err: any) {
        message.error(err.message || 'Thất bại')
    } finally {
        categoryLoading.value = false
    }
}

const handleCreateTag = async () => {
    if (!newTagName.value.trim()) return message.warning('Tên là bắt buộc')

    tagLoading.value = true
    try {
        const newTag = await createTag({ name: newTagName.value, color: newTagColor.value })
        formState.tagIds.push(newTag._id)
        showTagModal.value = false
        newTagName.value = ''
        newTagColor.value = '#1890ff'
        message.success('Thẻ đã được tạo')
    } catch (err: any) {
        message.error(err.message || 'Thất bại')
    } finally {
        tagLoading.value = false
    }
}

// Actions
const viewDocument = (id: string) => router.push(`/documents/${id}`)

const confirmDelete = (id: string) => {
    Modal.confirm({
        title: 'Xóa tài liệu',
        content: 'Hành động này không thể hoàn tác. Tiếp tục?',
        okText: 'Xóa',
        okType: 'danger',
        onOk: async () => {
            try {
                await deleteDocument(id)
                message.success('Đã xóa')
                await fetchDocuments()
            } catch (err) { message.error('Xóa thất bại') }
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