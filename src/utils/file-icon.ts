import { h } from 'vue'
import {
    FilePdfOutlined,
    FileImageOutlined,
    FileTextOutlined,
    FileOutlined,
} from '@ant-design/icons-vue'

export function getFileIcon(fileType: string | undefined) {
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

export function getFileIconElement(fileType: string | undefined, size: number | string = '3em') {
    const IconComponent = getFileIcon(fileType)
    return h(IconComponent, { 
        style: { 
            fontSize: typeof size === 'number' ? `${size}px` : size,
            color: '#1890ff'
        } 
    })
}

export function getFileColor(fileType: string | undefined) {
    const type = fileType?.toLowerCase() || 'file'
    
    switch (type) {
        case 'pdf':
            return '#ff4d4f' // Red
        case 'image':
            return '#13c2c2' // Cyan
        case 'text':
            return '#1890ff' // Blue
        default:
            return '#8c8c8c' // Gray
    }
}
