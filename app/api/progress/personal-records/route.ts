import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { identifyPersonalRecords } from '@/lib/progressiveOverload'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const exerciseName = searchParams.get('exercise')
    
    // Only allow the user to access their own data
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to access this data' }, { status: 403 })
    }
    
    if (!exerciseName) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 })
    }
    
    // Get the most recent workout containing this exercise
    const latestWorkout = await prisma.workout.findFirst({
      where: {
        userId: userId,
        exercises: {
          some: {
            name: exerciseName,
          }
        }
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        exercises: {
          where: {
            name: exerciseName,
          },
          include: {
            sets: true,
          },
        },
      },
    })
    
    if (!latestWorkout || latestWorkout.exercises.length === 0) {
      return NextResponse.json({ error: 'No workouts found with this exercise' }, { status: 404 })
    }
    
    // Get the exercise history (excluding the most recent one)
    const exerciseHistory = await prisma.exercise.findMany({
      where: {
        name: exerciseName,
        workout: {
          userId: userId,
          date: {
            lt: latestWorkout.date, // Only include workouts before the most recent one
          },
        },
      },
      include: {
        sets: true,
        workout: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        workout: {
          date: 'desc',
        },
      },
    })
    
    // Format the history for the PR calculation
    const formattedHistory = exerciseHistory.map(exercise => ({
      name: exercise.name,
      date: exercise.workout.date,
      sets: exercise.sets.map(set => ({
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
      })),
    }))
    
    // Current exercise
    const currentExercise = {
      name: exerciseName,
      sets: latestWorkout.exercises[0].sets.map(set => ({
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
      })),
    }
    
    // Identify personal records
    const personalRecords = identifyPersonalRecords(currentExercise, formattedHistory)
    
    return NextResponse.json({
      exercise: exerciseName,
      date: latestWorkout.date,
      personalRecords,
    })
  } catch (error: any) {
    console.error('Error fetching personal records:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 