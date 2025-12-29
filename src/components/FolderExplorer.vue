<template>
  <div class="folder-explorer h-full" @contextmenu="(e: MouseEvent) => handleRootContextMenu(e)"
    @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
    <div v-if="isDragOverlay" class="drag-overlay">
      <div class="drag-content">
        <div class="drag-icon">📁</div>
        <p>Thả folder hoặc file vào để upload</p>
      </div>
    </div>

    <Breadcrumb style="margin-bottom: 16px">
      <BreadcrumbItem>
        <a href="javascript:;" @click="navigateToRoot">
          <HomeOutlined />
        </a>
      </BreadcrumbItem>
      <BreadcrumbItem v-for="item in breadcrumb" :key="item._id">
        <a href="javascript:;" @click="navigateToFolder(item._id)">
          {{ item.name }}
        </a>
      </BreadcrumbItem>
    </Breadcrumb>

    <div
      style="margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: space-between">
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <Button type="primary" @click="showCreateFolderModal = true">
          <FolderOutlined /> Thư mục mới
        </Button>
        <Button @click="refreshFolders">
          <ReloadOutlined /> Làm mới
        </Button>
        <Button @click="uploadToCurrentFolder" type="dashed">
          <UploadOutlined /> Tải lên tài liệu
        </Button>
      </div>
      <div style="display: flex; gap: 8px">
        <Button :type="layoutType === 'grid' ? 'primary' : 'default'" @click="layoutType = 'grid'" title="Chế độ lưới">
          ⊞ Lưới
        </Button>
        <Button :type="layoutType === 'list' ? 'primary' : 'default'" @click="layoutType = 'list'"
          title="Chế độ danh sách">
          ☰ Danh sách
        </Button>
      </div>
    </div>

    <Spin :spinning="isLoading || isNavigating" style="position: relative; display: block" class="h-full">

      <Row :gutter="[16, 16]">
        <Col :xs="24">
          <div v-if="folders.length > 0 || isLoading">
            <h3>Thư mục</h3>
            <Row v-if="layoutType === 'grid'" :gutter="[12, 12]">
              <Col v-if="isLoading && folders.length === 0" v-for="i in 4" :key="`skeleton-${i}`" :xs="12" :sm="8"
                :md="6" :lg="4" :xl="3">
                <Card style="height: 100%">
                  <Skeleton active />
                </Card>
              </Col>
              <Col v-for="folder in folders" :key="folder._id" :xs="12" :sm="8" :md="6" :lg="4" :xl="3">
                <div draggable="true" @dragstart="handleFolderDragStart($event, folder)" @dragend="handleFolderDragEnd"
                  style="height: 100%">
                  <Card :hoverable="true" @click="navigateToFolder(folder._id)"
                    @dragover.prevent.stop="handleFolderDragOver($event, folder)"
                    @dragleave="handleFolderDragLeave($event, folder)"
                    @drop.prevent.stop="handleFolderDrop($event, folder)"
                    @contextmenu.prevent.stop="showFolderContextMenu($event, folder)" :style="{
                      cursor: 'pointer', textAlign: 'center', position: 'relative', height: '100%',
                      background: dragOverFolderId === folder._id ? '#e6f7ff' : 'transparent',
                      border: dragOverFolderId === folder._id ? '2px dashed #1890ff' : 'none',
                      transition: 'all 0.2s'
                    }" :body-style="{ padding: '12px' }" :data-folder-id="folder._id">
                    <template #cover>
                      <div
                        style="padding: 15px 0; background: #fafafa; font-size: 32px; display: flex; align-items: center; justify-content: center; height: 80px">
                        <FolderOutlined />
                      </div>
                    </template>
                    <Card.Meta :title="folder.name" :description="folder.description || 'Chưa đặt tên'"
                      style="font-size: 13px" />
                    <div style="margin-top: 8px; font-size: 11px; color: #999">{{ formatDate(folder.createdAt) }}</div>
                  </Card>
                </div>
              </Col>
            </Row>

            <div v-else style="display: flex; flex-direction: column; gap: 8px">
              <div v-if="isLoading && folders.length === 0" v-for="i in 3" :key="`skeleton-${i}`" class="list-skeleton">
                <Skeleton active :paragraph="{ rows: 1 }" />
              </div>
              <div v-for="folder in folders" :key="folder._id" draggable="true"
                @dragstart="handleFolderDragStart($event, folder)" @dragend="handleFolderDragEnd"
                @dragover.prevent.stop="handleFolderDragOver($event, folder)"
                @dragleave="handleFolderDragLeave($event, folder)" @drop.prevent.stop="handleFolderDrop($event, folder)"
                @click="navigateToFolder(folder._id)" @contextmenu.prevent.stop="showFolderContextMenu($event, folder)"
                :data-folder-list-id="folder._id" class="list-item" :style="{
                  background: dragOverFolderId === folder._id ? '#e6f7ff' : '#fff',
                  border: dragOverFolderId === folder._id ? '2px dashed #1890ff' : '1px solid #d9d9d9'
                }">
                <FolderOutlined style="font-size: 20px; color: #faad14" />
                <div style="flex: 1; min-width: 0">
                  <div style="font-weight: 500; font-size: 14px; color: #000">{{ folder.name }}</div>
                  <div style="font-size: 12px; color: #999">{{ folder.description || 'Chưa đặt tên' }} • {{
                    formatDate(folder.createdAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row :gutter="[16, 16]" style="margin-top: 24px" class="h-full">
        <Col :xs="24">
          <div v-if="documents.length > 0 || isLoading">
            <h3>Tài liệu</h3>
            <Row v-if="layoutType === 'grid'" :gutter="[12, 12]">
              <Col v-if="isLoading && documents.length === 0" v-for="i in 4" :key="`doc-skeleton-${i}`" :xs="12" :sm="8"
                :md="6" :lg="4" :xl="3">
                <Card style="height: 100%">
                  <Skeleton active />
                </Card>
              </Col>
              <Col v-for="doc in documents" :key="doc._id" :xs="12" :sm="8" :md="6" :lg="4" :xl="3">
                <Card :hoverable="true" @click="viewDocument(doc._id)"
                  @contextmenu.prevent.stop="showDocumentContextMenu($event, doc)"
                  style="cursor: pointer; text-align: center; height: 100%" :body-style="{ padding: '12px' }"
                  :data-doc-id="doc._id">
                  <template #cover>
                    <div
                      style="padding: 15px 0; background: #f5f5f5; font-size: 32px; display: flex; align-items: center; justify-content: center; height: 80px">
                      <component :is="getFileIconComponent(doc.fileType)" />
                    </div>
                  </template>
                  <Card.Meta :title="doc.title" :description="doc.description || 'Không có mô tả'"
                    style="font-size: 13px" />
                  <div style="margin-top: 6px">
                    <Tag :color="getCategoryColor(doc.category?.name)" style="font-size: 11px">{{ doc.category?.name }}
                    </Tag>
                  </div>
                  <div style="margin-top: 6px; font-size: 11px; color: #999">{{ formatDate(doc.createdAt) }}</div>
                </Card>
              </Col>
            </Row>

            <div v-else style="display: flex; flex-direction: column; gap: 8px">
              <div v-if="isLoading && documents.length === 0" v-for="i in 3" :key="`doc-list-skeleton-${i}`"
                class="list-skeleton">
                <Skeleton active :paragraph="{ rows: 1 }" />
              </div>
              <div v-for="doc in documents" :key="doc._id" @click="viewDocument(doc._id)"
                @contextmenu.prevent.stop="showDocumentContextMenu($event, doc)" :data-doc-list-id="doc._id"
                class="list-item">
                <div style="font-size: 24px">
                  <component :is="getFileIconComponent(doc.fileType)" />
                </div>
                <div style="flex: 1; min-width: 0">
                  <div style="font-weight: 500; font-size: 14px; color: #000">{{ doc.title }}</div>
                  <div style="font-size: 12px; color: #999">
                    <Tag :color="getCategoryColor(doc.category?.name)" style="font-size: 10px; margin-right: 8px">{{
                      doc.category?.name }}</Tag>
                    {{ doc.description || 'Không có mô tả' }} • {{ formatDate(doc.createdAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <div v-if="folders.length === 0 && documents.length === 0 && !isLoading" class="empty-state">
        <FolderOpenOutlined style="font-size: 48px; margin-bottom: 16px" />
        <p>Thư mục này trống</p>
        <Button type="primary" @click="uploadToCurrentFolder" style="margin-top: 16px">
          <UploadOutlined /> Tải lên tài liệu
        </Button>
      </div>
    </Spin>

    <Modal v-model:open="showCreateFolderModal" title="Tạo thư mục mới" @ok="handleCreateFolder">
      <Form :model="folderForm">
        <FormItem label="Tên thư mục" required><Input v-model:value="folderForm.name" /></FormItem>
        <FormItem label="Mô tả"><Input v-model:value="folderForm.description" type="textarea" /></FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="showEditFolderModal" title="Chỉnh sửa thư mục" @ok="handleEditFolder">
      <Form :model="editingFolder">
        <FormItem label="Tên thư mục" required><Input v-model:value="editingFolder.name" /></FormItem>
        <FormItem label="Mô tả"><Input v-model:value="editingFolder.description" type="textarea" /></FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="showUploadModal" title="Tải lên tài liệu" width="700px" @ok="handleUploadDocument"
      :confirm-loading="isUploading">
      <Form :model="uploadForm" layout="vertical">
        <FormItem label="Tiêu đề tài liệu" required>
          <Input v-model:value="uploadForm.title" :disabled="(uploadForm as any).isFolderUpload" />
        </FormItem>
        <FormItem label="Mô tả">
          <Input v-model:value="uploadForm.description" type="textarea" :rows="3" />
        </FormItem>
        <FormItem label="Danh mục" required>
          <div style="display: flex; gap: 8px">
            <Select v-model:value="uploadForm.categoryId" placeholder="Chọn danh mục" style="flex: 1">
              <SelectOption v-for="cat in categories" :key="cat._id" :value="cat._id">{{ cat.name }}</SelectOption>
            </Select>
            <Button @click="showCreateCategoryModal = true" type="dashed">+ Mới</Button>
          </div>
        </FormItem>
        <FormItem label="Thẻ">
          <div style="display: flex; gap: 8px">
            <Select v-model:value="uploadForm.tagIds" mode="multiple" placeholder="Chọn thẻ" style="flex: 1">
              <SelectOption v-for="tag in tags" :key="tag._id" :value="tag._id">{{ tag.name }}</SelectOption>
            </Select>
            <Button @click="showCreateTagModal = true" type="dashed">+ Mới</Button>
          </div>
        </FormItem>

        <div v-if="(uploadForm as any).isFolderUpload" class="folder-upload-info">
          <FolderOutlined style="font-size: 20px; color: #1890ff; margin-top: 4px;" />
          <div>
            <strong>Chế độ tải lên thư mục</strong>
            <p style="margin: 0; font-size: 13px; color: #666;">
              Hệ thống sẽ tạo lại cấu trúc và tải lên các tệp hợp lệ.
            </p>
          </div>
        </div>
        <FormItem v-else label="Tệp" required>
          <Upload v-model:file-list="uploadFileList" name="file" :max-count="1" :before-upload="handleBeforeFileUpload">
            <Button>
              <UploadOutlined /> Nhấp để tải lên
            </Button>
          </Upload>
        </FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="showCreateCategoryModal" title="Tạo danh mục mới" @ok="handleCreateCategory">
      <Form :model="newCategoryForm">
        <FormItem label="Tên" required><Input v-model:value="newCategoryForm.name" /></FormItem>
        <FormItem label="Mô tả"><Input v-model:value="newCategoryForm.description" type="textarea" /></FormItem>
      </Form>
    </Modal>

    <Modal v-model:open="showCreateTagModal" title="Tạo thẻ mới" @ok="handleCreateTag">
      <Form :model="newTagForm">
        <FormItem label="Tên" required><Input v-model:value="newTagForm.name" /></FormItem>
        <FormItem label="Mô tả"><Input v-model:value="newTagForm.description" type="textarea" /></FormItem>
      </Form>
    </Modal>

    <Dropdown :open="contextMenuVisible" :trigger="['contextmenu']" destroyPopupOnHide
      @openChange="(val) => { if (!val) contextMenuVisible = false }">
      <div class="context-menu-trigger" :style="{
        position: 'fixed',
        left: contextMenuPosition.x + 'px',
        top: contextMenuPosition.y + 'px',
        width: '1px',
        height: '1px',
        pointerEvents: 'none'
      }"></div>

      <template #overlay>
        <Menu>
          <template v-for="item in contextMenuItems" :key="item.key">
            <MenuDivider v-if="item.type === 'divider'" />
            <MenuItem v-else :danger="item.danger" @click="handleMenuClick(item)">
            {{ item.label }}
            </MenuItem>
          </template>
        </Menu>
      </template>
    </Dropdown>
  </div>
</template>

<script setup lang="ts">
import { categoryAPI, documentAPI, tagAPI } from '@/api/api.service'
import axios from '@/api/axios.client'
import { useDocuments } from '@/composables/useDocumentComposable'
import { useDocumentWithFolder, useFolders } from '@/composables/useFolderComposable'
import {
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  HomeOutlined,
  ReloadOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import { Breadcrumb, BreadcrumbItem, Button, Card, Col, Dropdown, Form, FormItem, Input, Menu, MenuDivider, MenuItem, message, Modal, Row, Select, SelectOption, Skeleton, Spin, Tag, Upload } from 'ant-design-vue'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// --- Interfaces for File System Access API ---
interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  filesystem: any;
}

interface FileSystemFileEntry extends FileSystemEntry {
  file: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader: () => FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
  readEntries: (
    successCallback: (entries: FileSystemEntry[]) => void,
    errorCallback?: (error: Error) => void
  ) => void;
}

interface ScannedItem {
  type: 'folder' | 'file';
  name: string;
  path: string;
  file?: File;
  parentPath: string;
}

const router = useRouter()
const route = useRoute()
const { folders, rootFolder, currentFolder, breadcrumb, isLoading, fetchRootFolders, fetchFolderHierarchy, createFolder, updateFolder, deleteFolder } = useFolders()
const { documents: folderDocuments, fetchDocumentsInFolder } = useDocumentWithFolder()
const { downloadDocument: downloadDoc, deleteDocument: deleteDoc } = useDocuments()

// State
const layoutType = ref<'grid' | 'list'>('grid')
const documents = ref<any[]>([])
const categories = ref<any[]>([])
const tags = ref<any[]>([])
const isNavigating = ref(false)
const isNavigatingFromComponent = ref(false)

// Forms
const showCreateFolderModal = ref(false)
const showEditFolderModal = ref(false)
const folderForm = ref({ name: '', description: '' })
const editingFolder = ref({ _id: '', name: '', description: '' })

const showUploadModal = ref(false)
const isUploading = ref(false)
const uploadFileList = ref<any[]>([])
const uploadForm = ref({ title: '', description: '', categoryId: '', tagIds: [] })

const showCreateCategoryModal = ref(false)
const newCategoryForm = ref({ name: '', description: '' })
const showCreateTagModal = ref(false)
const newTagForm = ref({ name: '', description: '' })

// Drag & Drop
const isDragOverlay = ref(false)
const draggedFolderId = ref<string | null>(null)
const dragOverFolderId = ref<string | null>(null)
const pendingUploadQueue = ref<ScannedItem[]>([])

// Context Menu
const contextMenuVisible = ref(false)
const contextMenuItems = ref<any[]>([])
const contextMenuPosition = ref({ x: 0, y: 0 })

// --- Utils ---
const getFileIconComponent = (fileType: string) => {
  if (fileType?.toLowerCase().includes('image')) return FileImageOutlined
  if (fileType?.toLowerCase().includes('pdf')) return FilePdfOutlined
  if (fileType?.toLowerCase().includes('text') || fileType?.toLowerCase().includes('doc')) return FileTextOutlined
  return FileOutlined
}
const getCategoryColor = (name: string) => {
  const colors: Record<string, string> = { 'Finance': 'blue', 'Legal': 'red', 'HR': 'green' }
  return colors[name] || 'default'
}
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

// --- File System Traversal ---
const traverseFileTree = async (item: any, path = ''): Promise<ScannedItem[]> => {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file((file: File) => {
        resolve([{ type: 'file', name: item.name, path: path + '/' + item.name, parentPath: path, file }]);
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const currentPath = path ? path + '/' + item.name : item.name;
      const folderItem: ScannedItem = { type: 'folder', name: item.name, path: currentPath, parentPath: path };

      const readEntries = () => {
        dirReader.readEntries(async (entries: any[]) => {
          if (entries.length > 0) {
            const childPromises = entries.map(entry => traverseFileTree(entry, currentPath));
            const children = await Promise.all(childPromises);
            resolve([folderItem, ...children.flat()]);
            readEntries();
          } else {
            resolve([folderItem]);
          }
        });
      };
      readEntries();
    }
  });
};

// --- Init & Watchers ---
const loadCategories = async () => {
  try {
    const res = await categoryAPI.getCategories()
    categories.value = res.data?.data || []
  } catch (e) { console.error(e) }
}
const loadTags = async () => {
  try {
    const res = await tagAPI.getTags()
    tags.value = res.data?.data || []
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  const folderId = route.query.folderId as string
  if (folderId) {
    try {
      await fetchFolderHierarchy(folderId)
      await fetchDocumentsInFolder(folderId)
      documents.value = folderDocuments.value
    } catch (e) { await fetchRootFolders() }
  } else {
    await fetchRootFolders()
    // Load root folder hierarchy if it exists
    if (rootFolder.value?._id) {
      try {
        await fetchFolderHierarchy(rootFolder.value._id)
        await fetchDocumentsInFolder(rootFolder.value._id)
        documents.value = folderDocuments.value
      } catch (e) {
        console.error('Failed to load root folder', e)
      }
    }
  }
  document.addEventListener('click', () => contextMenuVisible.value = false)
})

watch(() => route.query.folderId, async (folderId) => {
  if (isNavigatingFromComponent.value) { isNavigatingFromComponent.value = false; return; }
  if (folderId && typeof folderId === 'string') {
    try {
      await fetchFolderHierarchy(folderId)
      await fetchDocumentsInFolder(folderId)
      documents.value = folderDocuments.value
    } catch (e) { message.error('Failed to load') }
  } else {
    // Navigate to root folder
    await fetchRootFolders()
    if (rootFolder.value?._id) {
      try {
        await fetchFolderHierarchy(rootFolder.value._id)
        await fetchDocumentsInFolder(rootFolder.value._id)
        documents.value = folderDocuments.value
      } catch (e) {
        console.error('Failed to load root folder', e)
      }
    }
  }
})

// --- Navigation ---
const navigateToRoot = async () => {
  try {
    await fetchRootFolders()
    // If root folder exists, load its hierarchy
    if (rootFolder.value?._id) {
      await fetchFolderHierarchy(rootFolder.value._id)
    } else {
      documents.value = []
    }
    router.push({ query: {} })
  }
  catch (e) { message.error('Failed') }
}
const navigateToFolder = async (id: string) => {
  isNavigating.value = true
  isNavigatingFromComponent.value = true
  try {
    await fetchFolderHierarchy(id)
    await fetchDocumentsInFolder(id)
    documents.value = folderDocuments.value
    router.push({ query: { folderId: id } })
  } catch (e) { message.error('Failed'); isNavigatingFromComponent.value = false; }
  finally { isNavigating.value = false }
}
const refreshFolders = async () => {
  if (currentFolder.value?._id) {
    await fetchFolderHierarchy(currentFolder.value._id)
    await fetchDocumentsInFolder(currentFolder.value._id)
  } else {
    await fetchRootFolders()
  }
  documents.value = folderDocuments.value
}
const viewDocument = (id: string) => router.push(`/documents/${id}`)

// --- Context Menu Handlers (FIXED) ---
const handleMenuClick = (item: any) => {
  if (item.onClick) item.onClick()
  contextMenuVisible.value = false
}

const showFolderContextMenu = async (e: MouseEvent, folder: any) => {
  e.preventDefault(); e.stopPropagation();
  contextMenuVisible.value = false // Reset

  contextMenuItems.value = [
    { key: 'open', label: 'Open', onClick: () => navigateToFolder(folder._id) },
    { key: 'rename', label: 'Rename', onClick: () => editFolder(folder) },
    { type: 'divider' },
    { key: 'delete', label: 'Delete', danger: true, onClick: () => confirmDeleteFolder(folder._id) }
  ]

  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  await nextTick()
  contextMenuVisible.value = true
}

const showDocumentContextMenu = async (e: MouseEvent, doc: any) => {
  e.preventDefault(); e.stopPropagation();
  contextMenuVisible.value = false // Reset

  contextMenuItems.value = [
    { key: 'view', label: 'View', onClick: () => viewDocument(doc._id) },
    { key: 'download', label: 'Download', onClick: () => downloadDoc(doc._id, doc.fileName) },
    { type: 'divider' },
    { key: 'delete', label: 'Delete', danger: true, onClick: () => confirmDeleteDocument(doc._id) }
  ]

  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  await nextTick()
  contextMenuVisible.value = true
}

const handleRootContextMenu = (e: MouseEvent) => {
  // Only trigger if not clicking on items (handled by stopPropagation above, but safety check)
  const target = e.target as HTMLElement
  if (target.closest('.ant-card') || target.closest('.list-item')) return

  handleExplorerContextMenu(e)
}

const handleExplorerContextMenu = async (e: MouseEvent) => {
  e.preventDefault(); e.stopPropagation();
  const target = e.target as HTMLElement
  if (target.closest('button')) return

  contextMenuVisible.value = false // Reset

  contextMenuItems.value = [
    { key: 'new-folder', label: 'New Folder', onClick: () => showCreateFolderModal.value = true },
    { key: 'upload', label: 'Upload Document', onClick: () => uploadToCurrentFolder() },
    { key: 'refresh', label: 'Refresh', onClick: () => refreshFolders() }
  ]

  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  await nextTick()
  contextMenuVisible.value = true
}

// --- Action Implementations ---
const uploadToCurrentFolder = async () => {
  uploadForm.value = { title: '', description: '', categoryId: '', tagIds: [] }
    ; (uploadForm.value as any).isFolderUpload = false
  uploadFileList.value = []
  await loadCategories(); await loadTags();
  showUploadModal.value = true
}
const handleBeforeFileUpload = (file: File) => {
  // Auto-fill title with filename (without extension) if title is empty
  if (!uploadForm.value.title) {
    const filename = file.name
    const titleWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename
    uploadForm.value.title = titleWithoutExt
  }
  return false // Prevent automatic upload
}
const handleCreateFolder = async () => {
  if (!folderForm.value.name) return message.error('Name required')
  try {
    await createFolder(folderForm.value.name, folderForm.value.description, currentFolder.value?._id || null)
    message.success('Created')
    showCreateFolderModal.value = false
    refreshFolders()
  } catch (e) { message.error(e as string) }
}
const editFolder = (folder: any) => {
  editingFolder.value = { ...folder }
  showEditFolderModal.value = true
}
const handleEditFolder = async () => {
  try {
    await updateFolder(editingFolder.value._id, editingFolder.value.name, editingFolder.value.description)
    message.success('Updated')
    showEditFolderModal.value = false
    refreshFolders()
  } catch (e) { message.error(e as string) }
}
const confirmDeleteFolder = (id: string) => {
  Modal.confirm({
    title: 'Delete Folder?', content: 'Cannot be undone.', okType: 'danger',
    onOk: async () => {
      try {
        await deleteFolder(id)
        refreshFolders()
      } catch (e) {
        if ((e as string).includes('Cannot delete root folder')) {
          message.error('Cannot delete My Drive folder')
        }
      }
    }
  })
}
const confirmDeleteDocument = (id: string) => {
  Modal.confirm({
    title: 'Delete Document?', okType: 'danger',
    onOk: async () => { await deleteDoc(id); refreshFolders(); }
  })
}
const handleCreateCategory = async () => {
  try {
    const res = await categoryAPI.createCategory(newCategoryForm.value)
    message.success('Category created')
    showCreateCategoryModal.value = false
    await loadCategories()
    uploadForm.value.categoryId = res.data?.data?._id
  } catch (e: any) { message.error(e.message) }
}
const handleCreateTag = async () => {
  try {
    const res = await tagAPI.createTag(newTagForm.value)
    message.success('Tag created')
    showCreateTagModal.value = false
    await loadTags()
    if (!(uploadForm.value.tagIds as string[]).includes(res.data?.data?._id)) (uploadForm.value.tagIds as string[]).push(res.data?.data?._id)
  } catch (e: any) { message.error(e.message) }
}

// --- Upload Logic ---
const handleUploadDocument = async () => {
  if (!uploadForm.value.categoryId) return message.error('Category required')

  if ((uploadForm.value as any).isFolderUpload) {
    await processFolderUpload(uploadForm.value.categoryId, uploadForm.value.tagIds)
    return
  }

  if (!uploadForm.value.title) return message.error('Title required')
  if (!uploadFileList.value.length) return message.error('File required')

  isUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', uploadFileList.value[0].originFileObj)
    fd.append('title', uploadForm.value.title)
    fd.append('description', uploadForm.value.description)
    fd.append('categoryId', uploadForm.value.categoryId)
    uploadForm.value.tagIds.forEach(t => fd.append('tagIds', t))
    if (currentFolder.value?._id) fd.append('folderId', currentFolder.value._id)

    await documentAPI.uploadDocument(fd)
    message.success('Uploaded')
    showUploadModal.value = false
    refreshFolders()
  } catch (e: any) { message.error(e.message || 'Failed') }
  finally { isUploading.value = false }
}

const processFolderUpload = async (catId: string, tagIds: string[]) => {
  isUploading.value = true
  message.loading({ content: 'Processing...', key: 'upload' })
  const map = new Map<string, string>()
  const rootId = currentFolder.value?._id || null
  if (rootId) map.set('', rootId)

  const queue = [...pendingUploadQueue.value].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.path.length - b.path.length
  })

  try {
    for (const item of queue) {
      let pid = rootId
      if (item.parentPath && map.has(item.parentPath)) pid = map.get(item.parentPath)!

      if (item.type === 'folder') {
        try {
          const res = await axios.post('/folders', { name: item.name, parent: pid })
          if (res.data?.data?._id) map.set(item.path, res.data.data._id)
        } catch (e) { }
      } else if (item.type === 'file' && item.file) {
        try {
          const fd = new FormData()
          fd.append('file', item.file)
          fd.append('title', item.name)
          fd.append('description', uploadForm.value.description)
          fd.append('categoryId', catId)
          if (pid) fd.append('folderId', pid)
          tagIds.forEach(t => fd.append('tagIds', t))
          await documentAPI.uploadDocument(fd)
        } catch (e) { }
      }
    }
    message.success({ content: 'Done', key: 'upload' })
    showUploadModal.value = false
    refreshFolders()
  } catch (e: any) { message.error({ content: e.message, key: 'upload' }) }
  finally { isUploading.value = false; pendingUploadQueue.value = [] }
}

// --- Drag & Drop (Folder) ---
const handleFolderDragStart = (e: DragEvent, folder: any) => {
  draggedFolderId.value = folder._id
  if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text', folder._id) }
}
const handleFolderDragEnd = () => { draggedFolderId.value = null; dragOverFolderId.value = null }
const handleFolderDragOver = (e: DragEvent, folder: any) => {
  if (draggedFolderId.value === folder._id) return
  dragOverFolderId.value = folder._id
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}
const handleFolderDragLeave = (e: DragEvent, folder: any) => {
  if (dragOverFolderId.value === folder._id) dragOverFolderId.value = null
}
const handleFolderDrop = async (e: DragEvent, target: any) => {
  if (!draggedFolderId.value || draggedFolderId.value === target._id) return
  try {
    await axios.put(`/folders/${draggedFolderId.value}`, { parent: target._id })
    message.success('Moved')
    refreshFolders()
  } catch (e) { message.error('Failed to move') }
  finally { handleFolderDragEnd() }
}

// --- Drag & Drop (Files) ---
const handleDragOver = (e: DragEvent) => {
  e.preventDefault(); e.stopPropagation()
  if (e.dataTransfer?.types.includes('Files')) { isDragOverlay.value = true; e.dataTransfer.dropEffect = 'copy' }
}
const handleDragLeave = (e: DragEvent) => {
  e.preventDefault(); e.stopPropagation()
  const rel = e.relatedTarget as HTMLElement
  if (!rel || !rel.closest('.drag-overlay')) isDragOverlay.value = false
}
const handleDrop = async (e: DragEvent) => {
  e.preventDefault(); e.stopPropagation(); isDragOverlay.value = false
  const items = e.dataTransfer?.items; if (!items) return

  isUploading.value = true
  const promises = []; for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry(); if (entry) promises.push(traverseFileTree(entry))
  }

  try {
    const results = (await Promise.all(promises)).flat()
    const valid = results.filter(i => {
      if (i.type === 'folder') return true
      const ext = '.' + i.name.split('.').pop()?.toLowerCase()
      return ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'].includes(ext)
    })
    if (!valid.length) return message.error('Invalid files')

    pendingUploadQueue.value = valid
    await loadCategories(); await loadTags()

    uploadForm.value = {
      title: `Batch (${valid.filter(i => i.type === 'file').length} files)`, categoryId: '', tagIds: []
    }
      ; (uploadForm.value as any).isFolderUpload = true
    showUploadModal.value = true
  } catch (e) { console.error(e) }
  finally { isUploading.value = false }
}
</script>

<style scoped>
.folder-explorer {
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #f0f2f5;
}

.drag-overlay {
  position: fixed;
  inset: 0;
  background: rgba(24, 144, 255, 0.1);
  backdrop-filter: blur(2px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drag-content {
  background: white;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  border: 2px dashed #1890ff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.drag-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* List Styles */
.list-item {
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.list-item:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.list-skeleton {
  padding: 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
}

.empty-state {
  position: absolute;
  inset: 0;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  pointer-events: none;
}

.empty-state button {
  pointer-events: auto;
}

.folder-upload-info {
  margin-bottom: 24px;
  padding: 12px;
  background: #e6f7ff;
  border: 1px dashed #1890ff;
  border-radius: 4px;
  display: flex;
  align-items: start;
  gap: 10px;
}

/* Context Menu Trigger - Hidden but positioned */
.context-menu-trigger {
  position: fixed;
  width: 0;
  height: 0;
}
</style>