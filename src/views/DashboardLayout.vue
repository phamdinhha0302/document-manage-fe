<template>
    <div class="dashboard-container">
        <Layout style="min-height: 100vh">
            <!-- Sidebar -->
            <LayoutSider v-model:collapsed="collapsed" :trigger="null" collapsible>
                <Menu v-model:selectedKeys="selectedKeys" mode="inline">
                    <MenuItem key="1">
                        <template #icon>
                            <HomeOutlined />
                        </template>
                        <router-link to="/dashboard">Dashboard</router-link>
                    </MenuItem>

                    <MenuItem key="2">
                        <template #icon>
                            <FileOutlined />
                        </template>
                        <router-link to="/documents">My Documents</router-link>
                    </MenuItem>

                    <MenuItem key="3">
                        <template #icon>
                            <UploadOutlined />
                        </template>
                        <router-link to="/upload">Upload Document</router-link>
                    </MenuItem>

                    <MenuItem key="4">
                        <template #icon>
                            <SearchOutlined />
                        </template>
                        <router-link to="/search">Search</router-link>
                    </MenuItem>

                    <Divider />

                    <MenuItem v-if="user?.role === 'admin'" key="5">
                        <template #icon>
                            <SettingOutlined />
                        </template>
                        <router-link to="/admin">Admin</router-link>
                    </MenuItem>

                    <MenuItem key="6">
                        <template #icon>
                            <LogoutOutlined />
                        </template>
                        <span @click="handleLogout" style="cursor: pointer">Logout</span>
                    </MenuItem>
                </Menu>
            </LayoutSider>

            <Layout>
                <!-- Header -->
                <LayoutHeader class="dashboard-header">
                    <div class="header-content">
                        <Button 
                            type="text" 
                            :icon="h(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)" 
                            @click="collapsed = !collapsed"
                            class="menu-toggle-btn"
                        />
                        <div class="user-section">
                            <span class="user-name">{{ user?.fullName }}</span>
                            <Avatar 
                                :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`"
                                class="user-avatar"
                            />
                        </div>
                    </div>
                </LayoutHeader>

                <!-- Content -->
                <LayoutContent class="dashboard-content">
                    <router-view />
                </LayoutContent>
            </Layout>
        </Layout>
    </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuthComposable'
import { message, Layout, LayoutSider, LayoutHeader, LayoutContent, Menu, MenuItem, Divider, Button, Avatar } from 'ant-design-vue'
import { HomeOutlined, FileOutlined, UploadOutlined, SearchOutlined, SettingOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const { user, logout } = useAuth()

const collapsed = ref(false)
const selectedKeys = ref(['1'])

const handleLogout = () => {
    logout()
    message.success('Logged out successfully')
    router.push('/login')
}
</script>

<style scoped>
.dashboard-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

:deep(.ant-layout-sider) {
    background: linear-gradient(180deg, #0f2438 0%, #1a3a52 100%);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-layout-sider .logo) {
    height: 64px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(187, 147, 86, 0.2) 0%, rgba(187, 147, 86, 0.1) 100%);
    margin-bottom: 24px;
    margin-left: 12px;
    margin-right: 12px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(187, 147, 86, 0.3);
    transition: all 0.3s ease;
}

:deep(.ant-layout-sider .logo:hover) {
    background: linear-gradient(135deg, rgba(187, 147, 86, 0.3) 0%, rgba(187, 147, 86, 0.2) 100%);
    border-color: rgba(187, 147, 86, 0.5);
    transform: translateY(-2px);
}

:deep(.ant-layout-sider .logo h2) {
    color: #fff;
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

:deep(.ant-menu) {
    background: transparent;
    border: none;
    padding: 8px 0;
}

:deep(.ant-menu-item) {
    margin: 8px 12px !important;
    border-radius: 8px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    height: 44px !important;
    line-height: 44px !important;
    padding-left: 12px !important;
}

:deep(.ant-menu-item:hover) {
    background: rgba(187, 147, 86, 0.15) !important;
    transform: translateX(6px);
}

:deep(.ant-menu-item-selected) {
    background: linear-gradient(90deg, rgba(187, 147, 86, 0.3) 0%, rgba(187, 147, 86, 0.1) 100%) !important;
    border-left: 3px solid #BB9356 !important;
    padding-left: 9px !important;
}

:deep(.ant-menu-item-selected:hover) {
    background: linear-gradient(90deg, rgba(187, 147, 86, 0.4) 0%, rgba(187, 147, 86, 0.2) 100%) !important;
}

:deep(.ant-menu-item a) {
    color: rgba(255, 255, 255, 0.8) !important;
    font-weight: 500 !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    transition: all 0.3s ease !important;
}

:deep(.ant-menu-item-selected a) {
    color: #BB9356 !important;
    font-weight: 600 !important;
}

:deep(.ant-menu-item a:hover) {
    color: #fff !important;
}

:deep(.ant-menu-item .anticon) {
    font-size: 16px !important;
    transition: all 0.3s ease !important;
}

:deep(.ant-menu-item:hover .anticon) {
    transform: scale(1.1);
}

:deep(.ant-menu-item-selected .anticon) {
    color: #BB9356 !important;
}

:deep(.ant-divider) {
    background-color: rgba(187, 147, 86, 0.2) !important;
    margin: 16px 12px !important;
}

.dashboard-header {
    background: #fff !important;
    padding: 0 24px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
    border-bottom: 1px solid #f0f0f0 !important;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
}

.menu-toggle-btn {
    font-size: 16px !important;
    transition: all 0.3s ease !important;
}

.menu-toggle-btn:hover {
    color: #BB9356 !important;
    transform: scale(1.1);
}

.user-section {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 12px;
}

.user-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}

.user-avatar {
    width: 40px !important;
    height: 40px !important;
    border: 2px solid #BB9356 !important;
    transition: all 0.3s ease !important;
}

.user-avatar:hover {
    box-shadow: 0 2px 8px rgba(187, 147, 86, 0.3) !important;
    transform: scale(1.05);
}

.dashboard-content {
    margin: 24px 16px !important;
    background: #fff !important;
    padding: 24px !important;
    border-radius: 12px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}
</style>
