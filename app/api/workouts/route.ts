import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    
    // Validate request data
    if (!data.name || !data.date || !data.exercises || !data.exercises.length) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }
    
    // Log the session user ID for debugging
    console.log('Creating workout with user ID:', session.user.id)
    
    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      console.error('User not found in database:', session.user.id);
      
      // Try to create the user if it's the demo user
      if (session.user.id === 'demo-1') {
        try {
          const newUser = await prisma.user.create({
            data: {
              id: 'demo-1',
              name: session.user.name || 'Demo User',
              email: session.user.email || 'demo@example.com',
              image: session.user.image || 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
            }
          });
          console.log('Created missing demo user on the fly:', newUser);
        } catch (createError) {
          console.error('Failed to create missing demo user:', createError);
          return NextResponse.json(
            { error: 'Failed to create user account' }, 
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'User not found in database' }, 
          { status: 500 }
        );
      }
    }
    
    // Create workout with exercises and sets
    const workout = await prisma.workout.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        userId: session.user.id,
        exercises: {
          create: data.exercises.map((exercise: any) => ({
            name: exercise.name,
            sets: {
              create: exercise.sets.map((set: any) => ({
                weight: set.weight,
                reps: set.reps,
                rpe: set.rpe || null,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })
    
    console.log('Workout created successfully:', workout.id);
    return NextResponse.json(workout)
  } catch (error: any) {
    console.error('Error creating workout:', error)
    // Add more detailed error information
    if (error.meta) {
      console.error('Error metadata:', error.meta)
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })
    
    return NextResponse.json(workouts)
  } catch (error: any) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 