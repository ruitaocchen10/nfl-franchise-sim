"use client";

import Link from "next/link";

interface QuickActionButtonProps {
  href: string;
  title: string;
  description: string;
  disabled?: boolean;
}

export default function QuickActionButton({
  href,
  title,
  description,
  disabled = false,
}: QuickActionButtonProps) {
  const content = (
    <>
      <p className="font-semibold uppercase tracking-wide" style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)'
      }}>{title}</p>
      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {disabled && (
        <span className="inline-block mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          Coming soon
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <div
        className="block w-full px-4 py-3 rounded-none border text-left opacity-60 cursor-not-allowed"
        style={{
          background: 'var(--bg-light)',
          borderColor: 'var(--border-default)'
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block w-full px-4 py-3 rounded-none border border-l-2 text-left transition-all duration-300 ease-out hover:scale-[1.01] hover:border-l-accent-cyan"
      style={{
        background: 'var(--bg-medium)',
        borderColor: 'var(--border-default)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        borderLeftColor: 'var(--border-default)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-cyan)';
        e.currentTarget.style.borderLeftColor = 'var(--accent-cyan)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 217, 255, 0.15)';
        e.currentTarget.style.background = 'var(--bg-light)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.borderLeftColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.background = 'var(--bg-medium)';
      }}
    >
      {content}
    </Link>
  );
}
