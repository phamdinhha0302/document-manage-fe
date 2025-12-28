<template>
    <div class="dashboard-container">
        <Layout style="min-height: 100vh">
            <LayoutSider v-model:collapsed="collapsed" :trigger="null" collapsible width="250">
                <div class="logo">
                    <h2 v-if="!collapsed">Document Manager</h2>
                    <h2 v-else>D</h2>
                </div>

                <Menu 
                    v-model:selectedKeys="selectedKeys" 
                    mode="inline" 
                    theme="dark"
                    @click="handleMenuClick"
                >
                    <MenuItem key="/dashboard">
                        <template #icon>
                            <HomeOutlined />
                        </template>
                        <span>Dashboard</span>
                    </MenuItem>

                    <MenuItem key="/documents">
                        <template #icon>
                            <FileOutlined />
                        </template>
                        <span>My Documents</span>
                    </MenuItem>

                    <MenuItem key="/upload">
                        <template #icon>
                            <UploadOutlined />
                        </template>
                        <span>Upload Document</span>
                    </MenuItem>

                    <MenuItem key="/search">
                        <template #icon>
                            <SearchOutlined />
                        </template>
                        <span>Search</span>
                    </MenuItem>

                    <Divider />

                    <MenuItem v-if="user?.role === 'admin'" key="/admin">
                        <template #icon>
                            <SettingOutlined />
                        </template>
                        <span>Admin</span>
                    </MenuItem>

                    <MenuItem key="logout" @click="handleLogout">
                        <template #icon>
                            <LogoutOutlined />
                        </template>
                        <span>Logout</span>
                    </MenuItem>
                </Menu>
            </LayoutSider>

            <Layout>
                <LayoutHeader class="dashboard-header">
                    <div class="header-content">
                        <Button 
                            type="text" 
                            :icon="h(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)" 
                            @click="collapsed = !collapsed"
                            class="menu-toggle-btn"
                        />
                        <div class="user-section">
                            <span class="user-name">{{ user?.fullName || 'User' }}</span>
                            <Avatar 
                                :src="user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : undefined"
                                class="user-avatar"
                            >
                                {{ user?.fullName?.charAt(0)?.toUpperCase() }}
                            </Avatar>
                        </div>
                    </div>
                </LayoutHeader>

                <LayoutContent class="dashboard-content">
                    <router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </LayoutContent>
            </Layout>
        </Layout>
    </div>
</template>

<script setup lang="ts">
import { ref, h, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuthComposable'
import { message, Layout, LayoutSider, LayoutHeader, LayoutContent, Menu, MenuItem, Divider, Button, Avatar } from 'ant-design-vue'
import { HomeOutlined, FileOutlined, UploadOutlined, SearchOutlined, SettingOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const { user, logout } = useAuth()

const collapsed = ref(false)
const selectedKeys = ref<string[]>([])

// Function to handle standard menu navigation
const handleMenuClick = (e: { key: string }) => {
    if (e.key === 'logout') return; // Logout is handled separately
    router.push(e.key);
}

// Watch the route to update the menu selection automatically
// This fixes the issue where reloading the page resets the menu to "Dashboard"
watch(
    () => route.path,
    (newPath) => {
        selectedKeys.value = [newPath];
    },
    { immediate: true }
)

const handleLogout = async () => {
    try {
        await logout()
        message.success('Logged out successfully')
        router.push('/login')
    } catch (error) {
        message.error('Failed to logout')
    }
}
</script>

<style scoped>
/* Define Theme Variables for easy editing */
.dashboard-container {
    --primary-gold: #48cae4;
    --primary-gold-dim: rgba(187, 147, 86, 0.2);
    --sidebar-bg-start: #0f2438;
    --sidebar-bg-end: #1a3a52;
    --text-white: rgba(255, 255, 255, 0.85);
    
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
}

:deep(.ant-layout-sider) {
    background: linear-gradient(180deg, var(--sidebar-bg-start) 0%, var(--sidebar-bg-end) 100%);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
}

.logo {
    height: 64px;
    margin: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--primary-gold-dim);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    white-space: nowrap;
    transition: all 0.3s;
}

.logo h2 {
    color: #fff;
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-gold);
}

:deep(.ant-menu) {
    background: transparent;
    border-right: none;
}

:deep(.ant-menu-item) {
    margin: 8px 12px;
    width: auto;
    border-radius: 8px;
    color: var(--text-white);
}

:deep(.ant-menu-item:hover) {
    color: #fff;
    background: var(--primary-gold-dim);
}

:deep(.ant-menu-item-selected) {
    background: linear-gradient(90deg, rgba(187, 147, 86, 0.3) 0%, rgba(187, 147, 86, 0.1) 100%);
    color: var(--primary-gold);
    border-left: 3px solid var(--primary-gold);
}

/* Ensure icons inherit color correctly */
:deep(.ant-menu-item .anticon) {
    font-size: 16px;
}

:deep(.ant-menu-item-selected .anticon) {
    color: var(--primary-gold);
}

:deep(.ant-divider) {
    background-color: rgba(255, 255, 255, 0.1);
    margin: 16px 24px;
}

.dashboard-header {
    background: #fff;
    padding: 0 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    z-index: 10;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
}

.menu-toggle-btn {
    font-size: 18px;
    width: 48px;
    height: 48px;
}

.menu-toggle-btn:hover {
    color: var(--primary-gold);
    background: transparent;
}

.user-section {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 4px 12px;
    border-radius: 20px;
    transition: background 0.3s;
}

.user-section:hover {
    background: rgba(0,0,0,0.025);
}

.user-name {
    font-weight: 500;
    color: #333;
}

.user-avatar {
    border: 2px solid var(--primary-gold);
}

.dashboard-content {
    margin: 24px;
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    min-height: 280px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Page Transition Animation */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>