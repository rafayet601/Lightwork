'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import WorkoutForm from '@/components/WorkoutForm'
import MCPWorkoutAgent from '@/components/MCPWorkoutAgent'
import CoachAgent from '@/components/CoachAgent'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, PlusCircle, Eye, ChevronRight, Calendar, BarChart, Bot, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Set {
  id: string;
  weight: number;
  reps: number;
  rpe?: number | null;
}

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
}

interface Workout {
  id: string;
  name: string;
  date: Date;
  exercises: Exercise[];
}

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardClient() {
  const { data: session } = useSession()
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  React.useEffect(() => {
    const fetchWorkouts = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/workouts?userId=${session.user.id}`)
        if (response.ok) {
          const data = await response.json()
          setWorkouts(data.slice(0, 6)) // Limit to 6 workouts for dashboard
        }
      } catch (error) {
        console.error('Failed to fetch workouts:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWorkouts()
  }, [session?.user?.id])
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name}! Track your fitness journey.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/progress">
              <BarChart className="h-4 w-4 mr-2" />
              View Progress
            </Link>
          </Button>
          <Button onClick={() => setShowWorkoutForm(!showWorkoutForm)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {showWorkoutForm ? 'Hide Form' : 'Log Workout'}
          </Button>
        </div>
      </div>

      {/* Workout Input Section */}
      <AnimatePresence>
        {showWorkoutForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-glow">
              <CardHeader>
                <CardTitle>Log Your Workout</CardTitle>
                <CardDescription>
                  Choose between AI-powered natural language input or manual form entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="coach" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="coach" className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Coach
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Quick Log
                    </TabsTrigger>
                    <TabsTrigger value="manual">Manual Form</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="coach" className="mt-6">
                    <CoachAgent userId={session.user.id!} />
                  </TabsContent>
                  
                  <TabsContent value="ai" className="mt-6">
                    <MCPWorkoutAgent userId={session.user.id!} />
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-6">
                    <WorkoutForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recent Workouts Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Recent Workouts</h2>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/workouts" className="flex items-center gap-1 text-xs">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        
        {!workouts || workouts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 px-6 bg-card/80 rounded-lg border-glow shadow-lg"
          >
            <div className="bg-primary/10 rounded-full p-4 inline-block mb-4">
              <Calendar className="h-8 w-8 text-primary/80" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Workouts Yet!</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start logging your training sessions to track your progress and visualize your fitness journey.
            </p>
            <Button onClick={() => setShowWorkoutForm(true)} className="shadow-lg shadow-primary/20">
              <PlusCircle className="h-4 w-4 mr-2" />
              Log Your First Workout
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {workouts.map((workout: Workout) => (
              <motion.div key={workout.id} variants={itemVariants}>
                <Card className="bg-card/80 backdrop-blur-sm border-glow card-hover-effect flex flex-col overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-semibold text-primary leading-tight">{workout.name}</CardTitle>
                      <span className="text-xs text-muted-foreground whitespace-nowrap px-2 py-1 bg-background/50 rounded-md">
                        {new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow pb-4">
                    <ul className="space-y-2 text-sm mb-4">
                      {workout.exercises.slice(0, 4).map((exercise: Exercise) => (
                        <li key={exercise.id} className="flex justify-between items-center text-muted-foreground">
                          <span>{exercise.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium">{exercise.sets.length} sets</span>
                        </li>
                      ))}
                      {workout.exercises.length > 4 && (
                        <li className="text-xs text-muted-foreground/80 pt-1 text-center">+ {workout.exercises.length - 4} more exercises</li>
                      )}
                    </ul>
                  </CardContent>
                  <div className="mt-auto border-t border-border/40 bg-background/20 backdrop-blur-sm px-4 py-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="ghost" size="sm" asChild className="w-full text-primary hover:text-primary hover:bg-primary/10">
                        <Link href={`/workouts/${workout.id}`} className="flex items-center justify-center">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  )
} 