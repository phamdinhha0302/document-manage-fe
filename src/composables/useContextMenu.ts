import { ref } from 'vue'

export interface ContextMenuItem {
    key: string
    label: string
    danger?: boolean
    type?: 'divider' | 'group'
    onClick?: () => void
}

export interface ContextMenuPosition {
    x: number
    y: number
}

export const useContextMenu = () => {
    const visible = ref(false)
    const position = ref<ContextMenuPosition>({ x: 0, y: 0 })
    const items = ref<ContextMenuItem[]>([])

    const showContextMenu = (e: MouseEvent, menuItems: ContextMenuItem[]) => {
        e.preventDefault()
        e.stopPropagation()
        
        position.value = {
            x: e.clientX,
            y: e.clientY,
        }
        items.value = menuItems
        visible.value = true
    }

    const hideContextMenu = () => {
        visible.value = false
    }

    const handleContextMenuClick = (item: ContextMenuItem) => {
        if (item.onClick) {
            item.onClick()
        }
        hideContextMenu()
    }

    return {
        visible,
        position,
        items,
        showContextMenu,
        hideContextMenu,
        handleContextMenuClick,
    }
}
