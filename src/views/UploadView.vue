<template>
    <div class="upload-page">
        <Card title="Upload Document">
            <Form
                :model="formData"
                layout="vertical"
                @finish="handleUpload"
            >
                <FormItem
                    label="Document Title"
                    name="title"
                    :rules="[{ required: true, message: 'Please enter document title' }]"
                >
                    <Input v-model:value="formData.title" placeholder="Enter document title" />
                </FormItem>

                <FormItem
                    label="Description"
                    name="description"
                >
                    <Input.TextArea v-model:value="formData.description" placeholder="Enter document description" :rows="4" />
                </FormItem>

                <FormItem
                    label="Category"
                    name="categoryId"
                    :rules="[{ required: true, message: 'Please select a category' }]"
                >
                    <div style="display: flex; gap: 8px;">
                        <Select
                            v-model:value="formData.categoryId"
                            placeholder="Select a category"
                            @change="loadCategories"
                            style="flex: 1;"
                        >
                            <SelectOption v-for="cat in categories" :key="cat._id" :value="cat._id">
                                {{ cat.name }}
                            </SelectOption>
                        </Select>
                        <Button @click="showCategoryModal = true">
                            <template #icon>
                                <PlusOutlined />
                            </template>
                        </Button>
                    </div>
                </FormItem>

                <FormItem
                    label="Tags"
                    name="tagIds"
                >
                    <div style="display: flex; gap: 8px;">
                        <Select
                            v-model:value="formData.tagIds"
                            mode="multiple"
                            placeholder="Select tags"
                            @change="loadTags"
                            style="flex: 1;"
                        >
                            <SelectOption v-for="tag in tags" :key="tag._id" :value="tag._id">
                                {{ tag.name }}
                            </SelectOption>
                        </Select>
                        <Button @click="showTagModal = true">
                            <template #icon>
                                <PlusOutlined />
                            </template>
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
                        @change="handleFileChange"
                    >
                        <Button>
                            <template #icon>
                                <UploadOutlined />
                            </template>
                            Click to Upload
                        </Button>
                    </Upload>
                </FormItem>

                <FormItem>
                    <Button type="primary" html-type="submit" :loading="loading">
                        Upload Document
                    </Button>
                </FormItem>
            </Form>

            <Divider />

            <h3>Uploaded Documents</h3>
            <Table
                :columns="columns"
                :data-source="documents"
                :loading="loading"
                :pagination="false"
                size="small"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'fileType'">
                        <Tag :color="getFileTypeColor(record.fileType)">{{ record.fileType }}</Tag>
                    </template>
                    <template v-else-if="column.key === 'aiClassification'">
                        <Tag color="blue">{{ record.aiClassification }}</Tag>
                    </template>
                    <template v-else-if="column.key === 'actions'">
                        <Space>
                            <Button type="link" size="small" @click="viewDocument(record._id)">View</Button>
                            <Button type="link" danger size="small" @click="confirmDelete(record._id)">Delete</Button>
                        </Space>
                    </template>
                </template>
            </Table>
        </Card>

        <!-- Create Category Modal -->
        <Modal
            v-model:visible="showCategoryModal"
            title="Create New Category"
            @ok="handleCreateCategory"
            :confirm-loading="categoryLoading"
        >
            <FormItem label="Category Name">
                <Input
                    v-model:value="newCategoryName"
                    placeholder="Enter category name"
                    @keyup.enter="handleCreateCategory"
                />
            </FormItem>
        </Modal>

        <!-- Create Tag Modal -->
        <Modal
            v-model:visible="showTagModal"
            title="Create New Tag"
            @ok="handleCreateTag"
            :confirm-loading="tagLoading"
        >
            <FormItem label="Tag Name">
                <Input
                    v-model:value="newTagName"
                    placeholder="Enter tag name"
                    @keyup.enter="handleCreateTag"
                />
            </FormItem>
            <FormItem label="Tag Color">
                <Input
                    v-model:value="newTagColor"
                    type="color"
                    style="width: 60px;"
                />
            </FormItem>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDocuments, useCategories, useTags } from '@/composables/useDocumentComposable'
import { useRouter } from 'vue-router'
import { message, Modal, Card, Form, FormItem, Input, Select, SelectOption, Upload, Button, Divider, Table, Tag, Space } from 'ant-design-vue'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const { documents, uploadDocument, fetchDocuments, isLoading: loading, deleteDocument } = useDocuments()
const { categories, fetchCategories, createCategory } = useCategories()
const { tags, fetchTags, createTag } = useTags()

const formData = ref({
    title: '',
    description: '',
    categoryId: undefined,
    tagIds: [],
    file: null,
})

const fileList = ref<any[]>([])

// Category creation modal
const showCategoryModal = ref(false)
const newCategoryName = ref('')
const categoryLoading = ref(false)

// Tag creation modal
const showTagModal = ref(false)
const newTagName = ref('')
const newTagColor = ref('#1890ff')
const tagLoading = ref(false)

const columns = [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        width: 200,
    },
    {
        title: 'Type',
        dataIndex: 'fileType',
        key: 'fileType',
        width: 100,
    },
    {
        title: 'AI Classification',
        dataIndex: 'aiClassification',
        key: 'aiClassification',
        width: 150,
    },
    {
        title: 'Views',
        dataIndex: 'views',
        key: 'views',
        width: 80,
    },
    {
        title: 'Actions',
        key: 'actions',
        width: 150,
    },
]

const getFileTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        pdf: 'red',
        image: 'blue',
        text: 'green',
    }
    return colors[type] || 'default'
}

const handleFileChange = (info: any) => {
    const file = info.fileList[0]?.originFileObj
    if (file) {
        formData.value.file = file
    }
}

const handleUpload = async () => {
    try {
        if (!formData.value.file) {
            message.error('Please select a file')
            return
        }

        const formDataObj = new FormData()
        formDataObj.append('title', formData.value.title)
        formDataObj.append('description', formData.value.description)
        formDataObj.append('categoryId', formData.value.categoryId || '')
        
        // Append each tag ID individually
        formData.value.tagIds.forEach((tagId) => {
            formDataObj.append('tagIds', tagId)
        })
        
        formDataObj.append('file', formData.value.file)

        await uploadDocument(formDataObj)
        message.success('Document uploaded successfully!')

        // Reset form
        formData.value = {
            title: '',
            description: '',
            categoryId: undefined,
            tagIds: [],
            file: null,
        }
        fileList.value = []

        // Refresh list
        await fetchDocuments()
    } catch (err: any) {
        message.error(err.message || 'Upload failed')
    }
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

const loadCategories = async () => {
    if (categories.value.length === 0) {
        await fetchCategories()
    }
}

const loadTags = async () => {
    if (tags.value.length === 0) {
        await fetchTags()
    }
}

const handleCreateCategory = async () => {
    if (!newCategoryName.value.trim()) {
        message.error('Please enter a category name')
        return
    }
    
    categoryLoading.value = true
    try {
        const newCategory = await createCategory({ name: newCategoryName.value })
        formData.value.categoryId = newCategory._id
        showCategoryModal.value = false
        newCategoryName.value = ''
        message.success('Category created successfully!')
    } catch (err: any) {
        message.error(err.message || 'Failed to create category')
    } finally {
        categoryLoading.value = false
    }
}

const handleCreateTag = async () => {
    if (!newTagName.value.trim()) {
        message.error('Please enter a tag name')
        return
    }
    
    tagLoading.value = true
    try {
        const newTag = await createTag({ name: newTagName.value, color: newTagColor.value })
        formData.value.tagIds.push(newTag._id)
        showTagModal.value = false
        newTagName.value = ''
        newTagColor.value = '#1890ff'
        message.success('Tag created successfully!')
    } catch (err: any) {
        message.error(err.message || 'Failed to create tag')
    } finally {
        tagLoading.value = false
    }
}

onMounted(async () => {
    try {
        await fetchDocuments()
        await fetchCategories()
        await fetchTags()
    } catch (err) {
        console.error('Error loading data:', err)
    }
})
</script>

<style scoped>
.upload-page {
    max-width: 1200px;
    margin: 0 auto;
}

:deep(.ant-form) {
    margin-bottom: 24px;
}
</style>
