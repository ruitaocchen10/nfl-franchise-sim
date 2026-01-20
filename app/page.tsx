/**
 * Home Page - Landing/Root
 * Landing page for unauthenticated users, redirects authenticated users to dashboard
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg-darkest">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center fade-in">
                <h1
                  className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl uppercase"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.05em",
                  }}
                >
                  <span
                    className="block text-text-primary"
                    style={{ textShadow: "0 0 30px var(--glow-red)" }}
                  >
                    NFL Franchise
                  </span>
                  <span className="block text-accent-red">Simulator</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-text-secondary sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Take control of your NFL franchise. Draft players, manage
                  rosters, make trades, and build a championship dynasty in this
                  immersive cyberpunk sports management experience.
                </p>
                <div className="mt-10 sm:flex sm:justify-center gap-4">
                  <div className="rounded-md">
                    <Link
                      href="/signup"
                      className="btn-primary-glow w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:-translate-y-0.5 md:py-4 md:text-lg md:px-10"
                      style={{
                        fontFamily: "var(--font-display)",
                        background:
                          "linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)",
                      }}
                    >
                      Start Your Dynasty
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 rounded-md">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border-2 border-accent-cyan text-base font-bold uppercase tracking-wider rounded-lg text-accent-cyan bg-transparent hover:bg-accent-cyan hover:bg-opacity-10 transition-all md:py-4 md:text-lg md:px-10"
                      style={{
                        fontFamily: "var(--font-display)",
                        boxShadow: "0 0 15px rgba(0, 217, 255, 0.2)",
                      }}
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center slide-up">
            <h2
              className="text-base text-accent-cyan font-semibold tracking-wide uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Features
            </h2>
            <p
              className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-text-primary sm:text-4xl uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Everything you need to dominate
            </p>
            <p className="mt-4 max-w-2xl text-xl text-text-secondary lg:mx-auto">
              A complete NFL franchise simulation with cutting-edge management
              tools.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="Choose Your Team"
                description="Select from all 32 NFL teams and take control of your favorite franchise."
                icon="🏈"
              />
              <FeatureCard
                title="Manage Rosters"
                description="Build your perfect 53-man roster with strategic player management."
                icon="📋"
              />
              <FeatureCard
                title="Draft Future Stars"
                description="Scout prospects and draft the next generation of NFL superstars."
                icon="⭐"
              />
              <FeatureCard
                title="Make Trades"
                description="Negotiate deals with other teams to strengthen your roster."
                icon="🔄"
              />
              <FeatureCard
                title="Simulate Games"
                description="Watch your team compete in realistic game simulations."
                icon="🎮"
              />
              <FeatureCard
                title="Build a Dynasty"
                description="Win championships and create a lasting legacy of dominance."
                icon="🏆"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-bg-medium">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2
            className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="block">Ready to dominate?</span>
            <span className="block text-accent-cyan">
              Start your franchise today.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md">
              <Link
                href="/signup"
                className="btn-primary-glow inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-display)",
                  background:
                    "linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)",
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div
      className="relative p-6 bg-bg-medium border border-border-default rounded-lg hover:border-border-bright transition-all hover:-translate-y-1"
      style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)" }}
    >
      <div>
        <span className="text-4xl mb-3 block">{icon}</span>
        <h3
          className="text-lg font-bold text-text-primary uppercase tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <p className="mt-2 text-base text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
