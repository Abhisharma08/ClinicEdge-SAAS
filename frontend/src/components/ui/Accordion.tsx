import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AccordionProps {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
    className?: string
}

export function Accordion({ title, children, defaultOpen = false, className = '' }: AccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={`border border-gray-200 rounded-lg overflow-hidden mb-4 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <span className="font-medium text-gray-800 text-lg">{title}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-white border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    )
}
