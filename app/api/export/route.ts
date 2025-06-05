import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch all user's workouts with exercises and sets
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        exercises: {
          include: {
            sets: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    // Generate a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    // Return the data as JSON
    return new NextResponse(JSON.stringify(workouts, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="workout-data-${timestamp}.json"`
      }
    })
  } catch (error: any) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while exporting data'
        : error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 