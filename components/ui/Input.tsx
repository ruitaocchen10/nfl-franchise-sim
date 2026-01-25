/**
 * Input Component - Cyberpunk Edition
 * Reusable input field with cyberpunk styling and validation states
 */

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold font-mono uppercase tracking-wider mb-2"
            style={{ color: 'hsl(var(--cyber-cyan))' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 border',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all',
            'font-mono',
            error
              ? 'border-[hsl(var(--cyber-red))] focus:ring-[hsl(var(--cyber-red)/0.3)] focus:border-[hsl(var(--cyber-red))]'
              : 'border-border-default focus:ring-[hsl(var(--cyber-cyan)/0.3)] focus:border-[hsl(var(--cyber-cyan))]',
            className
          )}
          style={{
            background: 'var(--bg-light)',
            color: 'var(--text-primary)',
            borderRadius: '0',
            ...style
          }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-xs font-mono" style={{ color: 'hsl(var(--cyber-red))' }}>
            ⚠ {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-2 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
