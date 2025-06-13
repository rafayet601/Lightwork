'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dumbbell, ArrowRight, Star, Zap, Target } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If user is authenticated, redirect to get-started
    if (session?.user) {
      router.push('/get-started')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-32 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 p-4 rounded-full">
              <Dumbbell className="h-16 w-16 text-primary animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-6">
            Transform Your Fitness Journey
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track workouts, monitor progress, and achieve your fitness goals with AI-powered coaching and personalized training plans.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30">
              <Link href="/api/auth/signin">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link href="/test-advanced">
                Try Advanced Features
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Liftit?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Coaching</h3>
              <p className="text-muted-foreground">
                Get personalized workout recommendations with advanced DUP-HPS periodization and velocity-based training.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your performance with readiness assessments, RPE tracking, and autoregulation features.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Science-Based Training</h3>
              <p className="text-muted-foreground">
                Built on the latest exercise science research with evidence-based training methodologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of athletes already using Liftit to reach their fitness goals.
          </p>
          
          <Button size="lg" asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30">
            <Link href="/api/auth/signin">
              Sign Up Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
} 