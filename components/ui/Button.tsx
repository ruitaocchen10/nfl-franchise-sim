/**
 * Button Component
 * Reusable button with variant styles
 */

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      style,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-none transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider";

    const variants = {
      primary: "btn-primary-glow text-white hover:-translate-y-0.5",
      secondary:
        "border-2 border-accent-cyan text-accent-cyan bg-transparent hover:bg-accent-cyan hover:bg-opacity-10 focus:ring-accent-cyan",
      danger: "bg-bg-medium text-error border border-error hover:bg-opacity-10 focus:ring-error",
      ghost:
        "bg-transparent text-text-secondary border border-border-default hover:bg-bg-light hover:text-text-primary hover:border-border-bright focus:ring-accent-cyan",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const variantStyles = variant === "primary" ? {
      fontFamily: "var(--font-display)",
      background: "linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)",
      ...style
    } : {
      fontFamily: "var(--font-display)",
      ...style
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        style={variantStyles}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
