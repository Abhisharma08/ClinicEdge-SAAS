import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
