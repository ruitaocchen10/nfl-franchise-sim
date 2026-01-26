/**
 * Schedule Debug Page
 * Test and validate schedule generation
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/layout/Navigation";
import ScheduleDebugger from "@/components/debug/ScheduleDebugger";

export default async function ScheduleDebugPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg-darkest">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 slide-up">
            <h1
              className="text-3xl font-bold text-text-primary uppercase tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Schedule Generator Debug
            </h1>
            <p className="mt-2 text-text-secondary">
              Test schedule generation with different parameters. This generates schedules
              in-memory without affecting your database.
            </p>
          </div>

          {/* Debugger Component */}
          <ScheduleDebugger />
        </div>
      </main>
    </div>
  );
}
