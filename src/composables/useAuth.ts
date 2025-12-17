import { clearExpiredToken, isTokenExpired, parseTokenPayload } from '@/utils/auth'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const token = ref<string | null>(localStorage.getItem('token'))

export function useAuth() {
    const router = useRouter()

    // Check if user is authenticated
    const isAuthenticated = computed(() => {
        return token.value && !isTokenExpired(token.value)
    })

    // Login function
    const login = (newToken: string) => {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    // Logout function
    const logout = (redirectToLogin = true) => {
        token.value = null
        clearExpiredToken()

        if (redirectToLogin) {
            // Always redirect to login page when logging out
            router.push('/login')
        }
    }

    // Check token validity and logout if expired
    const checkTokenValidity = () => {
        if (token.value && isTokenExpired(token.value)) {
            console.warn('Token has expired, logging out...')
            logout()
            return false
        }
        return true
    }

    // Get user info from token
    const getUserInfo = () => {
        if (!token.value || isTokenExpired(token.value)) return null

        const payload = parseTokenPayload(token.value)
        if (!payload) return null

        return {
            id: payload.sub || payload.id,
            email: payload.email,
            name: payload.name,
            exp: payload.exp
        }
    }

    // Periodic token check (call this in main.ts or App.vue)
    const startTokenValidityCheck = () => {
        // Check every 5 minutes
        const interval = setInterval(
            () => {
                checkTokenValidity()
            },
            5 * 60 * 1000
        )

        // Return cleanup function
        return () => clearInterval(interval)
    }

    return {
        token: computed(() => token.value),
        isAuthenticated,
        login,
        logout,
        checkTokenValidity,
        getUserInfo,
        startTokenValidityCheck
    }
}
