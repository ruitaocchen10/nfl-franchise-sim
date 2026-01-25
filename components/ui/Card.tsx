/**
 * Card Component - Cyberpunk Edition
 * Container component for content sections with cyber styling
 */

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'glass' | 'glow'
  showGrid?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', variant = 'default', showGrid = false, children, style, ...props }, ref) => {
    const paddingStyles = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }

    const variantClasses = {
      default: '',
      glass: 'backdrop-blur-sm',
      glow: 'shadow-[0_0_20px_-5px_hsl(var(--cyber-cyan)/0.3)]'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'cyber-panel relative',
          paddingStyles[padding],
          variantClasses[variant],
          className
        )}
        style={style}
        {...props}
      >
        {/* Optional grid background */}
        {showGrid && <div className="cyber-grid" />}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-4 mb-4', className)}
      style={{
        borderBottom: '1px solid transparent',
        backgroundImage: 'linear-gradient(90deg, hsl(var(--cyber-cyan) / 0.5) 0%, transparent 100%)',
        backgroundSize: '100% 1px',
        backgroundPosition: 'bottom',
        backgroundRepeat: 'no-repeat',
        ...style
      }}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, style, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-bold uppercase tracking-wider', className)}
      style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)',
        ...style
      }}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

export default Card
