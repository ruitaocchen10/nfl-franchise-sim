/**
 * Modal Component
 * Reusable modal dialog with backdrop
 */

'use client'

import { HTMLAttributes, forwardRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, size = 'md', className, children, ...props }, ref) => {
    // Close on escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      }
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    }

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity"
          style={{
            background: 'rgba(6, 8, 16, 0.9)',
            backdropFilter: 'blur(12px)'
          }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={ref}
            className={cn(
              'relative cyber-panel w-full',
              sizes[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 60px hsl(var(--cyber-cyan) / 0.2)'
            }}
            {...props}
          >
            {/* Grid background */}
            <div className="cyber-grid" />

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4" style={{
                  background: 'var(--bg-light)',
                  borderBottom: '1px solid transparent',
                  backgroundImage: 'linear-gradient(90deg, hsl(var(--cyber-cyan) / 0.5) 0%, transparent 100%)',
                  backgroundSize: '100% 1px',
                  backgroundPosition: 'bottom',
                  backgroundRepeat: 'no-repeat',
                }}>
                  <h2 className="text-xl font-bold uppercase tracking-wider" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)'
                  }}>{title}</h2>
                  <button
                    onClick={onClose}
                    className="transition-colors p-1 hover:bg-[hsl(var(--cyber-cyan)/0.1)]"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--cyber-cyan))'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    aria-label="Close modal"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="px-6 py-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

export default Modal
