/**
 * FranchiseWizard Client Component
 * Handles the multi-step wizard state and form submission
 */

"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import TeamSelector from "@/components/franchises/TeamSelector";
import { createFranchise } from "@/app/actions/franchises";
import type { Database } from "@/lib/types/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];

interface FranchiseWizardProps {
  teams: Team[];
}

export default function FranchiseWizard({ teams }: FranchiseWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [franchiseName, setFranchiseName] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const handleNext = () => {
    if (step === 1 && !selectedTeamId) {
      setError("Please select a team");
      return;
    }
    if (step === 2 && !franchiseName.trim()) {
      setError("Please enter a franchise name");
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!selectedTeamId || !franchiseName.trim()) {
      setError("Please complete all steps");
      return;
    }

    startTransition(async () => {
      try {
        await createFranchise({
          teamId: selectedTeamId,
          franchiseName: franchiseName.trim(),
          difficulty,
        });
        // Redirect happens in the server action
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create franchise",
        );
      }
    });
  };

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${step >= i ? "text-white" : ""}
              `}
                style={{
                  background: step >= i ? 'linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)' : 'var(--bg-light)',
                  color: step >= i ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: step >= i ? '0 0 15px rgba(255, 41, 67, 0.4)' : 'none',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {i}
              </div>
              {i < 3 && (
                <div
                  className="w-16 h-1"
                  style={{
                    background: step > i ? 'var(--accent-red)' : 'var(--border-default)'
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8 mt-3">
          <span
            className={`text-sm uppercase tracking-wider font-semibold`}
            style={{
              fontFamily: 'var(--font-display)',
              color: step >= 1 ? 'var(--accent-cyan)' : 'var(--text-muted)'
            }}
          >
            Team
          </span>
          <span
            className={`text-sm uppercase tracking-wider font-semibold`}
            style={{
              fontFamily: 'var(--font-display)',
              color: step >= 2 ? 'var(--accent-cyan)' : 'var(--text-muted)'
            }}
          >
            Name
          </span>
          <span
            className={`text-sm uppercase tracking-wider font-semibold`}
            style={{
              fontFamily: 'var(--font-display)',
              color: step >= 3 ? 'var(--accent-cyan)' : 'var(--text-muted)'
            }}
          >
            Difficulty
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border" style={{ background: 'rgba(255, 41, 67, 0.1)', borderColor: 'var(--error)' }}>
          <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Choose Your Team"}
            {step === 2 && "Name Your Franchise"}
            {step === 3 && "Select Difficulty"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Team Selection */}
          {step === 1 && (
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onSelectTeam={setSelectedTeamId}
            />
          )}

          {/* Step 2: Franchise Name */}
          {step === 2 && (
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label
                  htmlFor="franchise-name"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Franchise Name
                </label>
                <input
                  type="text"
                  id="franchise-name"
                  value={franchiseName}
                  onChange={(e) => setFranchiseName(e.target.value)}
                  placeholder={`My ${selectedTeam?.name} Dynasty`}
                  maxLength={100}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-1 focus:outline-none transition-all"
                  style={{
                    background: 'var(--bg-light)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-cyan)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 217, 255, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-default)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  }}
                  autoFocus
                />
                <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  This is how you'll identify this save file. You can create
                  multiple franchises.
                </p>
              </div>

              {selectedTeam && (
                <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-light)', borderColor: 'var(--border-default)' }}>
                  <p className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)' }}>
                    Selected Team
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-md"
                      style={{ backgroundColor: selectedTeam.primary_color }}
                    />
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedTeam.city} {selectedTeam.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Difficulty Selection */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-4">
              <DifficultyOption
                value="easy"
                title="Easy"
                description="Generous salary cap, AI makes poor trades, higher development rates"
                isSelected={difficulty === "easy"}
                onSelect={() => setDifficulty("easy")}
              />
              <DifficultyOption
                value="medium"
                title="Medium"
                description="Balanced gameplay, realistic AI decisions, normal progression"
                isSelected={difficulty === "medium"}
                onSelect={() => setDifficulty("medium")}
              />
              <DifficultyOption
                value="hard"
                title="Hard"
                description="Strict salary cap, smart AI trades, slower player development"
                isSelected={difficulty === "hard"}
                onSelect={() => setDifficulty("hard")}
              />

              {selectedTeam && (
                <div className="mt-6 p-4 rounded-lg border" style={{ background: 'var(--bg-light)', borderColor: 'var(--accent-cyan)', boxShadow: '0 0 15px rgba(0, 217, 255, 0.2)' }}>
                  <p className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    Franchise Summary
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Team:</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {selectedTeam.city} {selectedTeam.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Name:</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{franchiseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Difficulty:</span>
                      <span className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                        {difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1 || isPending}
            >
              Back
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext} disabled={isPending}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Creating..." : "Create Franchise"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DifficultyOptionProps {
  value: string;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

function DifficultyOption({
  title,
  description,
  isSelected,
  onSelect,
}: DifficultyOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full px-6 py-4 rounded-lg border-2 text-left transition-all hover:-translate-y-0.5
        ${
          isSelected
            ? "ring-2"
            : ""
        }
      `}
      style={{
        background: isSelected ? 'var(--bg-light)' : 'var(--bg-medium)',
        borderColor: isSelected ? 'var(--accent-red)' : 'var(--border-default)',
        boxShadow: isSelected ? '0 0 20px rgba(255, 41, 67, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
        ...(isSelected ? { '--tw-ring-color': 'rgba(255, 41, 67, 0.3)' } as any : {})
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5"
          style={{
            borderColor: isSelected ? 'var(--accent-red)' : 'var(--border-default)',
            background: isSelected ? 'var(--accent-red)' : 'transparent'
          }}
        >
          {isSelected && (
            <svg
              className="w-full h-full text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        </div>
      </div>
    </button>
  );
}
