import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

interface WorkoutImport {
  name: string;
  date: string;
  exercises: {
    name: string;
    sets: {
      weight: number;
      reps: number;
      rpe?: number | null;
    }[];
  }[];
}

// Simple validation function
function isValidWorkoutData(data: any): data is WorkoutImport[] {
  if (!Array.isArray(data)) return false;
  
  for (const workout of data) {
    if (typeof workout.name !== 'string' || !workout.name) return false;
    if (!workout.date || !Date.parse(workout.date)) return false;
    if (!Array.isArray(workout.exercises)) return false;
    
    for (const exercise of workout.exercises) {
      if (typeof exercise.name !== 'string' || !exercise.name) return false;
      if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) return false;
      
      for (const set of exercise.sets) {
        if (typeof set.weight !== 'number' || set.weight < 0) return false;
        if (typeof set.reps !== 'number' || set.reps <= 0) return false;
        if (set.rpe !== undefined && set.rpe !== null && (typeof set.rpe !== 'number' || set.rpe < 0 || set.rpe > 10)) return false;
      }
    }
  }
  
  return true;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const data = await request.json()
    
    // Validate imported data
    if (!isValidWorkoutData(data)) {
      return NextResponse.json({ error: 'Invalid workout data format' }, { status: 400 })
    }
    
    // Import workouts
    const importResults = []
    
    for (const workout of data) {
      // Create workout with exercises and sets
      const createdWorkout = await prisma.workout.create({
        data: {
          name: workout.name,
          date: new Date(workout.date),
          userId: session.user.id,
          exercises: {
            create: workout.exercises.map(exercise => ({
              name: exercise.name,
              sets: {
                create: exercise.sets.map(set => ({
                  weight: set.weight,
                  reps: set.reps,
                  rpe: set.rpe
                }))
              }
            }))
          }
        },
        include: {
          exercises: {
            include: {
              sets: true
            }
          }
        }
      })
      
      importResults.push({
        id: createdWorkout.id,
        name: createdWorkout.name,
        date: createdWorkout.date,
        exerciseCount: createdWorkout.exercises.length,
        setCount: createdWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
      })
    }
    
    return NextResponse.json({
      message: `Successfully imported ${importResults.length} workouts`,
      importedWorkouts: importResults
    })
  } catch (error: any) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while importing data'
        : error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 