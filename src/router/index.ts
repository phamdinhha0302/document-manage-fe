import { clearExpiredToken, isTokenExpired } from '@/utils/auth'
import { createRouter, createWebHistory } from 'vue-router'

export enum RoutePrefix {
    Default = '',
}

export enum RoutePath {
    Login = '/login',
    Register = '/register',
    Dashboard = '/dashboard',
    Documents = '/documents',
    Upload = '/upload',
    Search = '/search',
    Admin = '/admin',
}

export const PUBLIC_ROUTE_PATHS: string[] = ['/login', '/register', '/']

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0, behavior: 'smooth' }
        }
    },
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/DashboardLayout.vue'),
            children: [
                {
                    path: 'dashboard',
                    name: 'Dashboard',
                    component: () => import('@/views/DashboardView.vue'),
                    meta: { requiresAuth: true },
                },
                {
                    path: 'documents',
                    name: 'Documents',
                    component: () => import('@/views/DocumentsView.vue'),
                    meta: { requiresAuth: true },
                },
                {
                    path: 'documents/:id',
                    name: 'DocumentDetail',
                    component: () => import('@/views/DocumentDetailView.vue'),
                    meta: { requiresAuth: true },
                },
                {
                    path: 'upload',
                    name: 'Upload',
                    component: () => import('@/views/UploadView.vue'),
                    meta: { requiresAuth: true },
                },
                {
                    path: 'search',
                    name: 'Search',
                    component: () => import('@/views/SearchView.vue'),
                    meta: { requiresAuth: false },
                },
            ],
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/LoginView.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('@/views/RegisterView.vue'),
            meta: { requiresAuth: false },
        },
    ]
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth) {
        if (!token || isTokenExpired(token)) {
            clearExpiredToken()
            next({ path: '/login', query: { redirect: to.fullPath } })
            return
        }
    }

    next()
})

export default router
