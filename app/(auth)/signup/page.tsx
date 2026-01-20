/**
 * Signup Page
 * Allows users to create a new account
 */

import { signup } from "@/app/actions/auth";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-darkest py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 fade-in">
        <div>
          <h1 className="text-center text-5xl font-bold text-text-primary uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", textShadow: "0 0 20px var(--glow-red)" }}>
            NFL Franchise Simulator
          </h1>
          <h2 className="mt-8 text-center text-3xl font-bold text-text-primary uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
            Create your account
          </h2>
          <p className="mt-3 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-accent-cyan hover:text-accent-cyan-dark transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" action={signup}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 bg-bg-light border border-border-default text-text-primary placeholder-text-muted rounded-md focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan sm:text-sm transition-all"
                placeholder="Email address"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-4 py-3 bg-bg-light border border-border-default text-text-primary placeholder-text-muted rounded-md focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan sm:text-sm transition-all"
                placeholder="Password (min 6 characters)"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-4 py-3 bg-bg-light border border-border-default text-text-primary placeholder-text-muted rounded-md focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan sm:text-sm transition-all"
                placeholder="Confirm password"
                style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 bg-bg-light border-border-default rounded focus:ring-accent-cyan accent-accent-red"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-text-secondary">
              I agree to the{" "}
              <a href="#" className="text-accent-cyan hover:text-accent-cyan-dark transition-colors">
                Terms and Conditions
              </a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary-glow group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:-translate-y-0.5"
              style={{
                fontFamily: "var(--font-display)",
                background: "linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)",
              }}
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
