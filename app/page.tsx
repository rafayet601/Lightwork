import React from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]/route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, LineChart, TrendingUp, Users, Calendar, Shield } from 'lucide-react'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Track Your Fitness Journey with Precision
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Your personal workout companion that helps you monitor progress, optimize training, and achieve your fitness goals.
              </p>
            </div>
            <div className="space-x-4">
              {session ? (
                <Button asChild size="lg" className="h-12 px-8">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="h-12 px-8">
                  <Link href="/api/auth/signin">Get Started</Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="h-12 px-8">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Everything You Need for Your Fitness Journey
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Our comprehensive fitness tracking app has all the tools to help you succeed.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 pt-12">
            <Card>
              <CardHeader>
                <Dumbbell className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Workout Logging</CardTitle>
                <CardDescription>
                  Easily log your exercises, sets, reps, and weights in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Track your entire workout routine with our intuitive interface that makes recording your progress simple and fast.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Progressive Overload</CardTitle>
                <CardDescription>
                  Get smart suggestions for weight increases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Our intelligent algorithm provides recommendations for gradual weight increases to optimize your strength gains.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <LineChart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Progress Charts</CardTitle>
                <CardDescription>
                  Visualize your improvements over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>See your strength metrics and volume progress with detailed charts and analytics that highlight your improvements.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Workout History</CardTitle>
                <CardDescription>
                  Access your complete workout history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Review your past workouts in a calendar view to track consistency and analyze your training patterns.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Personal Records</CardTitle>
                <CardDescription>
                  Track and celebrate your PRs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>We automatically detect and highlight your personal bests to keep you motivated and aware of your achievements.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Personalized Programs</CardTitle>
                <CardDescription>
                  Get custom workout programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Receive personalized training programs based on your goals, whether you're focused on strength, hypertrophy, or general fitness.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial/CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Your Training?
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Join thousands of fitness enthusiasts who are achieving their goals with our app.
              </p>
            </div>
            {session ? (
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/api/auth/signin">Start For Free</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
} 