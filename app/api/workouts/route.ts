import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// Simple validation function for workout data
function validateWorkoutData(data: any) {
  // Check required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return { valid: false, error: 'Workout name is required' };
  }

  if (!data.date || !Date.parse(data.date)) {
    return { valid: false, error: 'Valid date is required' };
  }

  if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
    return { valid: false, error: 'At least one exercise is required' };
  }

  // Validate each exercise
  for (const exercise of data.exercises) {
    if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim() === '') {
      return { valid: false, error: 'Each exercise must have a name' };
    }

    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      return { valid: false, error: 'Each exercise must have at least one set' };
    }

    // Validate each set
    for (const set of exercise.sets) {
      if (typeof set.weight !== 'number' || set.weight < 0) {
        return { valid: false, error: 'Each set must have a valid weight' };
      }

      if (typeof set.reps !== 'number' || set.reps <= 0) {
        return { valid: false, error: 'Each set must have a valid rep count' };
      }

      if (set.rpe !== undefined && (typeof set.rpe !== 'number' || set.rpe < 0 || set.rpe > 10)) {
        return { valid: false, error: 'RPE must be between 0 and 10' };
      }
    }
  }

  return { valid: true };
}

// Rate limiting - a simple in-memory implementation
// Note: For production, use a Redis-based solution or a service like Upstash
const REQUESTS_PER_MINUTE = 60;
const ipRequests = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const requestData = ipRequests.get(ip) || { count: 0, resetTime: now + 60000 };
  
  // Reset counter if needed
  if (now > requestData.resetTime) {
    requestData.count = 0;
    requestData.resetTime = now + 60000;
  }
  
  requestData.count++;
  ipRequests.set(ip, requestData);
  
  return requestData.count <= REQUESTS_PER_MINUTE;
}

export async function POST(request: Request) {
  // Rate limiting - This is a basic implementation
  // In production, use a more robust solution like Redis or a rate-limiting service
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (process.env.NODE_ENV === 'production' && !checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 }
    );
  }
  
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const data = await request.json()
    
    // Validate request data
    const validation = validateWorkoutData(data);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error }, 
        { status: 400 }
      );
    }
    
    // Log the session user ID for debugging - only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating workout with user ID:', session.user.id);
    }
    
    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('User not found in database:', session.user.id);
      }
      
      // Try to create the user if it's the demo user and we're in development
      if (session.user.id === 'demo-1' && process.env.NODE_ENV === 'development') {
        try {
          const newUser = await prisma.user.create({
            data: {
              id: 'demo-1',
              name: session.user.name || 'Demo User',
              email: session.user.email || 'demo@example.com',
              image: session.user.image || 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
            }
          });
          if (process.env.NODE_ENV === 'development') {
            console.log('Created missing demo user on the fly:', newUser);
          }
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
        name: data.name.trim(),
        date: new Date(data.date),
        userId: session.user.id,
        exercises: {
          create: data.exercises.map((exercise: any) => ({
            name: exercise.name.trim(),
            sets: {
              create: exercise.sets.map((set: any) => ({
                weight: Math.max(0, Number(set.weight)),
                reps: Math.max(1, Number(set.reps)),
                rpe: set.rpe !== undefined ? Math.min(10, Math.max(0, Number(set.rpe))) : null,
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Workout created successfully:', workout.id);
    }
    
    return NextResponse.json(workout)
  } catch (error: any) {
    console.error('Error creating workout:', error)
    // Add more detailed error information - but only in development
    if (process.env.NODE_ENV === 'development' && error.meta) {
      console.error('Error metadata:', error.meta)
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while creating the workout'  // Generic message for production
        : error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (process.env.NODE_ENV === 'production' && !checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 }
    );
  }
  
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit');
    let limit = 10; // Default limit
    
    // Validate limit parameter
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        // Cap maximum limit to prevent resource abuse
        limit = Math.min(parsedLimit, 100);
      }
    }
    
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
      { error: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while fetching workouts'  // Generic message for production
        : error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 