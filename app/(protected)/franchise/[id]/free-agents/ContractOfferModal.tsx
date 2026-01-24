"use client";

import { useState } from "react";
import { makeContractOffer } from "@/app/actions/freeAgency";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  player_id: string;
  market_value: number;
  player: {
    first_name: string;
    last_name: string;
    position: string;
  };
  player_attributes: {
    age: number;
    overall_rating: number;
    development_trait: string;
  } | null;
}

interface ContractOfferModalProps {
  player: Player;
  franchiseId: string;
  capSpace: number;
  onClose: () => void;
}

function formatCurrency(amount: number): string {
  return `$${(amount / 1000000).toFixed(1)}M`;
}

export default function ContractOfferModal({
  player,
  franchiseId,
  capSpace,
  onClose,
}: ContractOfferModalProps) {
  const router = useRouter();
  const [years, setYears] = useState(3);
  const [totalValue, setTotalValue] = useState(player.market_value);
  const [guaranteedPercent, setGuaranteedPercent] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const annualSalary = Math.round(totalValue / years);
  const guaranteedMoney = Math.round((totalValue * guaranteedPercent) / 100);
  const canAfford = annualSalary <= capSpace;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await makeContractOffer(
        franchiseId,
        player.player_id,
        years,
        totalValue,
        guaranteedMoney,
      );

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Failed to make offer");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="rounded-lg p-8 max-w-2xl w-full mx-4"
        style={{ background: "var(--bg-medium)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Contract Offer
            </h2>
            <p
              className="text-lg"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--accent-cyan)",
              }}
            >
              {player.player.first_name} {player.player.last_name}
            </p>
            <p style={{ color: "var(--text-secondary)" }}>
              {player.player.position} • {player.player_attributes?.age} yrs old • OVR{" "}
              {player.player_attributes?.overall_rating}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>

        {/* Market Value Reference */}
        <div
          className="p-4 rounded mb-6"
          style={{ background: "var(--bg-dark)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Market Value Estimate
          </p>
          <p
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--accent-cyan)",
            }}
          >
            {formatCurrency(player.market_value)} / year
          </p>
        </div>

        {/* Contract Inputs */}
        <div className="space-y-6">
          {/* Years */}
          <div>
            <label
              className="block text-sm mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-secondary)",
              }}
            >
              Contract Length: {years} {years === 1 ? "year" : "years"}
            </label>
            <input
              type="range"
              min="1"
              max="7"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              <span>1 yr</span>
              <span>7 yrs</span>
            </div>
          </div>

          {/* Total Value */}
          <div>
            <label
              className="block text-sm mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-secondary)",
              }}
            >
              Total Contract Value: {formatCurrency(totalValue)}
            </label>
            <input
              type="range"
              min={player.market_value * 0.5}
              max={player.market_value * 2}
              step={100000}
              value={totalValue}
              onChange={(e) => setTotalValue(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              <span>{formatCurrency(player.market_value * 0.5)}</span>
              <span>{formatCurrency(player.market_value * 2)}</span>
            </div>
          </div>

          {/* Guaranteed Money */}
          <div>
            <label
              className="block text-sm mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-secondary)",
              }}
            >
              Guaranteed: {guaranteedPercent}% ({formatCurrency(guaranteedMoney)})
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={guaranteedPercent}
              onChange={(e) => setGuaranteedPercent(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Contract Summary */}
        <div
          className="mt-6 p-4 rounded"
          style={{ background: "var(--bg-dark)" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Annual Salary
              </p>
              <p
                className="text-xl font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: canAfford ? "var(--accent-cyan)" : "#ef4444",
                }}
              >
                {formatCurrency(annualSalary)}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Cap Space After Signing
              </p>
              <p
                className="text-xl font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: canAfford ? "var(--text-primary)" : "#ef4444",
                }}
              >
                {formatCurrency(Math.max(0, capSpace - annualSalary))}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mt-4 p-3 rounded"
            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded font-bold uppercase text-sm transition-all hover:opacity-80"
            style={{
              background: "var(--bg-dark)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canAfford || isSubmitting}
            className="flex-1 py-3 rounded font-bold uppercase text-sm transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canAfford ? "var(--accent-cyan)" : "#6b7280",
              color: "var(--bg-darkest)",
              fontFamily: "var(--font-display)",
            }}
          >
            {isSubmitting
              ? "Signing..."
              : canAfford
              ? "Sign Player"
              : "Can't Afford"}
          </button>
        </div>
      </div>
    </div>
  );
}
