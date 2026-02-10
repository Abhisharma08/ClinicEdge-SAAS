'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Lock } from 'lucide-react'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!token) {
            setError('Invalid reset link')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            })

            if (!res.ok) {
                throw new Error('Failed to reset password. The link may have expired.')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                    Invalid or missing reset token.
                </div>
                <Link href="/forgot-password" className="text-primary-600 hover:underline">
                    Request a new link
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {success ? (
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        You can now login with your new password. Redirecting...
                    </p>
                    <Link href="/login" className="btn-primary w-full block">
                        Login Now
                    </Link>
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Min 6 characters"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Re-enter password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Set new password
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}
