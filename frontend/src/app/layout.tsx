import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Clinic Edge - Book Your Appointment',
    description: 'Book appointments with specialist doctors at your preferred clinic',
    keywords: ['clinic', 'doctor', 'appointment', 'booking', 'healthcare'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="min-h-screen gradient-bg">
                {children}
            </body>
        </html>
    )
}
