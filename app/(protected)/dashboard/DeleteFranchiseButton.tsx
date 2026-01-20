"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFranchise } from "@/app/actions/franchises";

interface DeleteFranchiseButtonProps {
  franchiseId: string;
  franchiseName: string;
}

export default function DeleteFranchiseButton({
  franchiseId,
  franchiseName,
}: DeleteFranchiseButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    const result = await deleteFranchise(franchiseId);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete franchise");
      setDeleting(false);
    }

    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className="p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--accent-red)';
          e.currentTarget.style.background = 'rgba(255, 41, 67, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-tertiary)';
          e.currentTarget.style.background = 'transparent';
        }}
        title="Delete franchise"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(6, 8, 16, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(false);
          }}
        >
          <div
            className="rounded-2xl p-6 max-w-md mx-4"
            style={{
              background: 'var(--bg-medium)',
              border: '1px solid var(--border-bright)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 60px rgba(255, 41, 67, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-3 uppercase tracking-wide" style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)'
            }}>
              Delete Franchise?
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete "<span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{franchiseName}</span>"? This will
              remove the franchise from your dashboard. This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                disabled={deleting}
                className="px-4 py-2 border rounded-lg transition-all disabled:opacity-50 uppercase tracking-wider font-semibold text-sm"
                style={{
                  fontFamily: 'var(--font-display)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-light)'
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.borderColor = 'var(--border-bright)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 uppercase tracking-wider font-bold text-sm"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(255, 41, 67, 0.3), 0 0 20px rgba(255, 41, 67, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 41, 67, 0.4), 0 0 30px rgba(255, 41, 67, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 41, 67, 0.3), 0 0 20px rgba(255, 41, 67, 0.2)';
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
