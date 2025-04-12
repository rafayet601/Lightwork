import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Calendar, Dumbbell, Edit, Trash2 } from 'lucide-react'
import DeleteWorkoutButton from '../../../components/DeleteWorkoutButton'

// Define interfaces for types
interface Set {
  id: string;
  weight: number;
  reps: number;
  rpe: number | null;
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

interface Props {
  params: {
    id: string;
  };
}

export default async function WorkoutDetails({ params }: Props) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    redirect('/api/auth/signin');
  }
  
  // Fetch the workout with the given ID
  const workout = await prisma.workout.findUnique({
    where: {
      id: params.id,
      userId: session.user.id, // Ensure the workout belongs to the logged-in user
    },
    include: {
      exercises: {
        include: {
          sets: true,
        },
        orderBy: {
          createdAt: 'asc', // Order exercises by creation time
        },
      },
    },
  });
  
  // If workout doesn't exist or doesn't belong to the user, show 404
  if (!workout) {
    notFound();
  }
  
  // Format date for display
  const formattedDate = new Date(workout.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">{workout.name}</h1>
          <div className="flex items-center mt-2 md:mt-0">
            <div className="flex items-center mr-4 text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              {formattedDate}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workouts/${workout.id}/edit`} className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              
              <DeleteWorkoutButton workoutId={workout.id} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Dumbbell className="h-5 w-5 mr-2" />
          Exercises
        </h2>
        
        {workout.exercises.length === 0 ? (
          <div className="text-center p-10 bg-card rounded-lg border">
            <p className="text-muted-foreground">No exercises found for this workout.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workout.exercises.map((exercise: Exercise) => (
              <Card key={exercise.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {exercise.sets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sets recorded for this exercise.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-medium py-2 pr-4">Set</th>
                            <th className="text-left font-medium py-2 px-4">Weight</th>
                            <th className="text-left font-medium py-2 px-4">Reps</th>
                            <th className="text-left font-medium py-2 pl-4">RPE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set: Set, index: number) => (
                            <tr key={set.id} className="border-b border-opacity-50">
                              <td className="py-2 pr-4">{index + 1}</td>
                              <td className="py-2 px-4">{set.weight} kg</td>
                              <td className="py-2 px-4">{set.reps}</td>
                              <td className="py-2 pl-4">{set.rpe !== null ? set.rpe : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 