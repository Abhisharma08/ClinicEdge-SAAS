'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Login failed')
            }

            const { accessToken, user } = await res.json()

            // Store token
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('user', JSON.stringify(user))

            // Redirect based on role
            switch (user.role) {
                case 'SUPER_ADMIN':
                    router.push('/admin')
                    break
                case 'CLINIC_ADMIN':
                    router.push('/clinic')
                    break
                case 'DOCTOR':
                    router.push('/doctor')
                    break
                default:
                    router.push('/')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">C</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Clinic Edge</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                    <p className="text-gray-600">Sign in to your account</p>
                </div>

                <div className="card p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-10"
                                    placeholder="you@clinic.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                'Signing in...'
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-gray-600">
                    Need to book an appointment?{' '}
                    <Link href="/book" className="text-primary-600 hover:underline font-medium">
                        Book Now
                    </Link>
                </p>
            </div>
        </div>
    )
}
