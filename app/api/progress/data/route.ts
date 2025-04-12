import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const exerciseName = searchParams.get('exercise')
    const timeFrame = searchParams.get('timeFrame') || '30days'
    
    // Only allow the user to access their own data
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to access this data' }, { status: 403 })
    }
    
    if (!exerciseName) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 })
    }
    
    // Calculate the date range based on the timeFrame
    const now = new Date()
    let startDate = new Date()
    
    switch (timeFrame) {
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '90days':
        startDate.setDate(now.getDate() - 90)
        break
      case '365days':
        startDate.setDate(now.getDate() - 365)
        break
      default:
        startDate.setDate(now.getDate() - 30) // Default to 30 days
    }
    
    // Find all sets for the specified exercise within the time frame
    const exercises = await prisma.exercise.findMany({
      where: {
        name: exerciseName,
        workout: {
          userId: userId,
          date: {
            gte: startDate,
            lte: now,
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
          date: 'asc',
        },
      },
    })
    
    // Process the data to find the best set (highest weight*reps) for each workout date
    const progressByDate = new Map()
    
    exercises.forEach((exercise) => {
      const date = exercise.workout.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      
      if (exercise.sets.length === 0) return
      
      // Find the set with the highest volume (weight * reps)
      exercise.sets.sort((a, b) => (b.weight * b.reps) - (a.weight * a.reps))
      const bestSet = exercise.sets[0]
      
      // Use the date as the key and store the best set
      if (!progressByDate.has(date) || 
          (bestSet.weight * bestSet.reps) > (progressByDate.get(date).weight * progressByDate.get(date).reps)) {
        progressByDate.set(date, {
          date: date,
          weight: bestSet.weight,
          reps: bestSet.reps,
        })
      }
    })
    
    // Convert the Map to an array and sort by date
    const progressData = Array.from(progressByDate.values())
    progressData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return NextResponse.json(progressData)
  } catch (error: any) {
    console.error('Error fetching progress data:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 