import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// GET a single workout by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const workoutId = params.id
    
    const workout = await prisma.workout.findUnique({
      where: {
        id: workoutId,
        userId: session.user.id, // Make sure the workout belongs to the user
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })
    
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }
    
    return NextResponse.json(workout)
  } catch (error: any) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// DELETE a workout
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const workoutId = params.id
    
    // Check if the workout exists and belongs to the user
    const workout = await prisma.workout.findUnique({
      where: {
        id: workoutId,
        userId: session.user.id,
      },
    })
    
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }
    
    // Delete the workout (this will cascade and delete related exercises and sets)
    await prisma.workout.delete({
      where: {
        id: workoutId,
      },
    })
    
    return NextResponse.json({ message: 'Workout deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// UPDATE a workout
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const workoutId = params.id
    const data = await request.json()
    
    // Check if the workout exists and belongs to the user
    const workout = await prisma.workout.findUnique({
      where: {
        id: workoutId,
        userId: session.user.id,
      },
    })
    
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }
    
    // Update the workout basic info
    const updatedWorkout = await prisma.workout.update({
      where: {
        id: workoutId,
      },
      data: {
        name: data.name,
        date: new Date(data.date),
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })
    
    return NextResponse.json(updatedWorkout)
  } catch (error: any) {
    console.error('Error updating workout:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 