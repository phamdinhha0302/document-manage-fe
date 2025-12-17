import { ref, computed } from 'vue'
import { authAPI } from '@/api/api.service'
import { useRouter } from 'vue-router'

const user = ref<any>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useAuth() {
    const router = useRouter()

    const isAuthenticated = computed(() => !!user.value)

    const register = async (email: string, password: string, fullName: string) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authAPI.register({ email, password, fullName })
            // Auto login after register
            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Registration failed'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const login = async (email: string, password: string) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authAPI.login({ email, password })
            const { token, user: userData } = response.data.data

            // Save token to localStorage
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(userData))

            user.value = userData

            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Login failed'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const logout = () => {
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
    }

    const getProfile = async () => {
        try {
            const response = await authAPI.getProfile()
            user.value = response.data.data
            return response.data.data
        } catch (err) {
            logout()
            throw err
        }
    }

    const initializeAuth = () => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            user.value = JSON.parse(storedUser)
        }
    }

    return {
        user: computed(() => user.value),
        isAuthenticated,
        isLoading: computed(() => isLoading.value),
        error: computed(() => error.value),
        register,
        login,
        logout,
        getProfile,
        initializeAuth,
    }
}
