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
        className="block w-full px-4 py-3 rounded-lg border text-left opacity-60 cursor-not-allowed"
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
      className="block w-full px-4 py-3 rounded-lg border text-left transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-medium)',
        borderColor: 'var(--border-default)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-cyan)';
        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 217, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      }}
    >
      {content}
    </Link>
  );
}
