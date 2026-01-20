"use client";

interface SimButtonProps {
  onClick?: () => void;
}

export default function SimButton({ onClick }: SimButtonProps) {
  return (
    <button
      className="text-xs transition-colors"
      style={{ color: 'var(--accent-cyan)' }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan-dark)'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
      onClick={onClick}
    >
      Sim
    </button>
  );
}
