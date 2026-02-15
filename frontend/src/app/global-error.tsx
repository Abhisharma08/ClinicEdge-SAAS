'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <html>
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, sans-serif',
                    background: '#f9fafb',
                }}>
                    <div style={{
                        textAlign: 'center',
                        maxWidth: '480px',
                        padding: '2rem',
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '1.5rem',
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '0.5rem',
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '1.5rem',
                        }}>
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={() => reset()}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 2rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
