import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import WorkoutForm from '@/components/WorkoutForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    redirect('/api/auth/signin')
  }
  
  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      date: 'desc',
    },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  })
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Your Workouts</h1>
      
      <div className="mb-10 p-6 bg-card rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Add New Workout</h2>
        <WorkoutForm />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>
        
        {workouts.length === 0 ? (
          <div className="text-center p-10 bg-card rounded-lg border">
            <p className="text-muted-foreground">You haven't logged any workouts yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the form above to create your first workout.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workouts.map((workout: Workout) => (
              <Card key={workout.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{workout.name}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {new Date(workout.date).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {workout.exercises.map((exercise: Exercise) => (
                      <li key={exercise.id} className="flex justify-between">
                        <span>{exercise.name}</span>
                        <span className="text-muted-foreground">{exercise.sets.length} sets</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/workouts/${workout.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 