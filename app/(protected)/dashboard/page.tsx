/**
 * Dashboard Page
 * Main hub for authenticated users
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Fetch user's franchises
  const franchises = []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back! Manage your franchises and build your dynasty.
            </p>
          </div>

          {/* Main Content */}
          {franchises.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  You don't have any franchises yet. Create your first franchise to start your GM career!
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    What You Can Do:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-blue-800">
                    <li>Choose from all 32 NFL teams</li>
                    <li>Manage your 53-man roster</li>
                    <li>Draft future stars</li>
                    <li>Make trades with other teams</li>
                    <li>Simulate games and seasons</li>
                    <li>Build a championship dynasty</li>
                  </ul>
                </div>

                <Link
                  href="/franchises/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Create Your First Franchise
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Franchise cards will go here */}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
