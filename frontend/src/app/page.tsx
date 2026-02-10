import Link from 'next/link'
import { Calendar, Users, Clock, Shield, Star, ArrowRight } from 'lucide-react'

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 gradient-primary opacity-5" />
                <nav className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                <span className="text-white font-bold text-xl">C</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Clinic Edge</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                                Login
                            </Link>
                            <Link href="/book" className="btn-primary">
                                Book Appointment
                            </Link>
                        </div>
                    </div>
                </nav>

                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            Book Your Doctor Appointment
                            <span className="gradient-primary bg-clip-text text-transparent"> in Minutes</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Connect with specialist doctors at your preferred clinic. Easy booking,
                            instant confirmation, and WhatsApp reminders.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Link href="/book" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
                                <Calendar className="w-5 h-5" />
                                <span>Book Now</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/login" className="btn-outline text-lg px-8 py-4">
                                Staff Login
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Choose Clinic Edge?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8" />}
                            title="Easy Booking"
                            description="Select your clinic, specialist, and preferred time slot in just a few clicks."
                        />
                        <FeatureCard
                            icon={<Clock className="w-8 h-8" />}
                            title="Real-time Availability"
                            description="See available slots instantly and book without waiting for confirmation calls."
                        />
                        <FeatureCard
                            icon={<Shield className="w-8 h-8" />}
                            title="Secure & Private"
                            description="Your health data is encrypted and handled with the highest security standards."
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 gradient-primary">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 text-white text-center">
                        <StatCard number="10+" label="Partner Clinics" />
                        <StatCard number="50+" label="Specialist Doctors" />
                        <StatCard number="5000+" label="Appointments Booked" />
                        <StatCard number="4.8" label="Average Rating" icon={<Star className="w-5 h-5 inline" />} />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="card p-12 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Ready to Book Your Appointment?
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Join thousands of patients who trust Clinic Edge for their healthcare needs.
                        </p>
                        <Link href="/book" className="btn-primary text-lg px-8 py-4">
                            Get Started
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <span className="font-bold">C</span>
                            </div>
                            <span className="font-bold">Clinic Edge</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            © 2026 Clinic Edge. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({
    icon,
    title,
    description
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="card-hover p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}

function StatCard({
    number,
    label,
    icon
}: {
    number: string
    label: string
    icon?: React.ReactNode
}) {
    return (
        <div>
            <div className="text-4xl font-bold mb-2">
                {number} {icon}
            </div>
            <div className="text-white/80">{label}</div>
        </div>
    )
}
