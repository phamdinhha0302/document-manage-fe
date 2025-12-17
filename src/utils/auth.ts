// Token utility functions that can be used both in Vue and non-Vue contexts
export function parseTokenPayload(token: string) {
    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch (error) {
        console.error('Error parsing token:', error)
        return null
    }
}

export function isTokenExpired(token: string | null): boolean {
    if (!token) return true

    const payload = parseTokenPayload(token)
    if (!payload || !payload.exp) return true

    const currentTime = Math.floor(Date.now() / 1000)
    // Token is expired if current time is past expiration
    return payload.exp <= currentTime
}

export function clearExpiredToken() {
    localStorage.removeItem('token')
}

export function getValidToken(): string | null {
    const token = localStorage.getItem('token')
    if (!token || isTokenExpired(token)) {
        clearExpiredToken()
        return null
    }
    return token
}

export function redirectToLogin(currentPath?: string) {
    const loginUrl = '/admin/login'
    const redirectQuery =
        currentPath && currentPath !== '/admin/login'
            ? `?redirect=${encodeURIComponent(currentPath)}`
            : ''

    window.location.href = loginUrl + redirectQuery
}
