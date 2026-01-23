"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface PhaseInfoProps {
  phase: 'offseason' | 'free_agency' | 'draft' | 'training_camp' | 'preseason' | 'regular_season' | 'postseason';
  teamLeaders?: {
    passing?: { name: string; yards: number; };
    rushing?: { name: string; yards: number; };
    receiving?: { name: string; yards: number; };
  } | null;
  standingsData: {
    points_for: number;
    points_against: number;
  } | null;
  gamesPlayed: number;
}

export default function PhaseInfo({
  phase,
  teamLeaders,
  standingsData,
  gamesPlayed,
}: PhaseInfoProps) {
  const getTitle = () => {
    switch (phase) {
      case 'regular_season':
        return 'Season Stats';
      case 'preseason':
        return 'Training Camp';
      case 'postseason':
        return 'Playoff Status';
      case 'offseason':
        return 'Offseason Priorities';
      case 'draft':
        return 'Draft Board';
      case 'free_agency':
        return 'Free Agent Market';
      case 'training_camp':
        return 'Training Camp';
      default:
        return 'Team Info';
    }
  };

  const renderContent = () => {
    switch (phase) {
      case 'regular_season':
        const ppg = gamesPlayed > 0 && standingsData
          ? (standingsData.points_for / gamesPlayed).toFixed(1)
          : '0.0';
        const oppg = gamesPlayed > 0 && standingsData
          ? (standingsData.points_against / gamesPlayed).toFixed(1)
          : '0.0';

        return (
          <div className="space-y-4">
            <div>
              <p
                className="text-lg font-bold mb-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                }}
              >
                PPG: {ppg} (3rd)
              </p>
              <p
                className="text-lg font-bold mb-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                }}
              >
                OPPG: {oppg} (8th)
              </p>
            </div>

            <div>
              <p
                className="text-sm font-bold uppercase tracking-wider mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-tertiary)',
                }}
              >
                Team Leaders
              </p>
              <div className="space-y-2">
                <p
                  className="font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Passing: {teamLeaders?.passing?.name || 'No data'} ({teamLeaders?.passing?.yards || 0})
                </p>
                <p
                  className="font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Rushing: {teamLeaders?.rushing?.name || 'No data'} ({teamLeaders?.rushing?.yards || 0})
                </p>
                <p
                  className="font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Receiving: {teamLeaders?.receiving?.name || 'No data'} ({teamLeaders?.receiving?.yards || 0})
                </p>
              </div>
            </div>
          </div>
        );

      case 'preseason':
        return (
          <div className="space-y-3">
            <p style={{ color: 'var(--text-secondary)' }}>
              Training camp is in progress. Monitor player development and depth chart adjustments.
            </p>
            <div className="space-y-2">
              <p style={{ color: 'var(--text-primary)' }}>• Depth Chart: 85% Complete</p>
              <p style={{ color: 'var(--text-primary)' }}>• Injuries: None</p>
              <p style={{ color: 'var(--text-primary)' }}>• Morale: High</p>
            </div>
          </div>
        );

      case 'postseason':
        return (
          <div className="space-y-3">
            <p style={{ color: 'var(--text-secondary)' }}>
              Your team has made the playoffs! Prepare for your first postseason matchup.
            </p>
            <div className="space-y-2">
              <p
                className="font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Playoff Round: Wild Card
              </p>
              <p style={{ color: 'var(--text-primary)' }}>
                Home Field: TBD
              </p>
            </div>
          </div>
        );

      case 'offseason':
        return (
          <div className="space-y-3">
            <p style={{ color: 'var(--text-secondary)' }}>
              Focus on building your team for next season.
            </p>
            <div className="space-y-2">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                Priorities:
              </p>
              <p style={{ color: 'var(--text-primary)' }}>• Sign key free agents</p>
              <p style={{ color: 'var(--text-primary)' }}>• Scout draft prospects</p>
              <p style={{ color: 'var(--text-primary)' }}>• Review roster needs</p>
            </div>
          </div>
        );

      case 'draft':
        return (
          <div className="space-y-3">
            <p style={{ color: 'var(--text-secondary)' }}>
              Top prospects available at your pick position.
            </p>
            <div className="space-y-2">
              <p style={{ color: 'var(--text-primary)' }}>1. QB - John Smith (92 OVR)</p>
              <p style={{ color: 'var(--text-primary)' }}>2. WR - Mike Jones (90 OVR)</p>
              <p style={{ color: 'var(--text-primary)' }}>3. DL - Tom Brown (89 OVR)</p>
            </div>
          </div>
        );

      case 'free_agency':
        return (
          <div className="space-y-3">
            <p style={{ color: 'var(--text-secondary)' }}>
              Top free agents available to sign.
            </p>
            <div className="space-y-2">
              <p style={{ color: 'var(--text-primary)' }}>• QB - Free Agent (85 OVR)</p>
              <p style={{ color: 'var(--text-primary)' }}>• WR - Free Agent (83 OVR)</p>
              <p style={{ color: 'var(--text-primary)' }}>• LB - Free Agent (82 OVR)</p>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>
              No additional information available for this phase.
            </p>
          </div>
        );
    }
  };

  return (
    <Card style={{ background: 'var(--bg-medium)' }}>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
