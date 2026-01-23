/**
 * Card Component
 * Container component for content sections
 */

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', children, style, ...props }, ref) => {
    const paddingStyles = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-none border border-t-2 border-t-accent-cyan/20 border-l-4 border-l-accent-cyan/30 transition-all duration-300 hover:border-t-accent-cyan/40 hover:border-l-accent-cyan/50',
          paddingStyles[padding],
          className
        )}
        style={{
          background: 'var(--bg-medium)',
          borderColor: 'var(--border-default)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)',
          ...style
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-5 mb-5', className)}
      style={{
        borderBottom: '2px solid transparent',
        backgroundImage: 'linear-gradient(90deg, var(--accent-cyan) 0%, transparent 100%)',
        backgroundSize: '100% 2px',
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
      className={cn('text-2xl font-extrabold uppercase tracking-wide', className)}
      style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
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
