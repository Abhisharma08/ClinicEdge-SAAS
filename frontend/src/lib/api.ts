const API_BASE = '' // Use relative path to leverage Next.js rewrites

class ApiClient {
    private token: string | null = null

    setToken(token: string) {
        this.token = token
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token)
        }
    }

    getToken(): string | null {
        if (!this.token && typeof window !== 'undefined') {
            this.token = localStorage.getItem('accessToken')
        }
        return this.token
    }

    clearToken() {
        this.token = null
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
        }
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        }

        const token = this.getToken()
        if (token) {
            headers.Authorization = `Bearer ${token}`
        }

        const res = await fetch(`${API_BASE}/api${endpoint}`, { ...options, headers, cache: 'no-store' })

        if (res.status === 401) {
            this.clearToken()
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        }

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Request failed' }))
            console.error('API Error:', error) // Log full error details for debugging

            // Extract raw ValidationPipe errors
            if (error.error?.code === 'VALIDATION_ERROR' && Array.isArray(error.error.details)) {
                // Collect inner constraints strings (e.g. {"isEmail": "email must be an email"})
                const validationMessages = error.error.details.flatMap((detail: any) => {
                    return detail.constraints ? Object.values(detail.constraints) : []
                });

                if (validationMessages.length > 0) {
                    throw new Error(validationMessages.join(' \n '));
                }
            }

            // Standard error string
            const errorMsg = error.error?.message || error.message;
            throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg)
        }

        return res.json()
    }

    get<T>(endpoint: string) { return this.request<T>(endpoint) }
    post<T>(endpoint: string, data: unknown) { return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }) }
    put<T>(endpoint: string, data: unknown) { return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }) }
    patch<T>(endpoint: string, data: unknown) { return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }) }
    delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }) }
}

export const api = new ApiClient()
