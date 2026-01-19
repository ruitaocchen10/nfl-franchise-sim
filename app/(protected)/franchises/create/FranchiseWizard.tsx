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
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${step >= i ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}
              `}
              >
                {i}
              </div>
              {i < 3 && (
                <div
                  className={`w-16 h-1 ${step > i ? "bg-blue-600" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8 mt-3">
          <span
            className={`text-sm ${step >= 1 ? "text-blue-600 font-semibold" : "text-gray-500"}`}
          >
            Team
          </span>
          <span
            className={`text-sm ${step >= 2 ? "text-blue-600 font-semibold" : "text-gray-500"}`}
          >
            Name
          </span>
          <span
            className={`text-sm ${step >= 3 ? "text-blue-600 font-semibold" : "text-gray-500"}`}
          >
            Difficulty
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
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
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  This is how you'll identify this save file. You can create
                  multiple franchises.
                </p>
              </div>

              {selectedTeam && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Team
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedTeam.primary_color }}
                    />
                    <span className="font-semibold">
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
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Franchise Summary
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team:</span>
                      <span className="font-semibold">
                        {selectedTeam.city} {selectedTeam.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold">{franchiseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-semibold capitalize">
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
        w-full px-6 py-4 rounded-lg border-2 text-left transition-all
        ${
          isSelected
            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
          w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
          ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300"}
        `}
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
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}
