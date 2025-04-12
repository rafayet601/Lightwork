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
    
    // Only allow admin users or the user themselves to access their data
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to access this data' }, { status: 403 })
    }
    
    // Get distinct exercise names from the database
    const exercises = await prisma.exercise.findMany({
      where: {
        workout: {
          userId: userId,
        },
      },
      distinct: ['name'],
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    // Extract and return just the exercise names as an array
    return NextResponse.json(exercises.map(exercise => exercise.name))
  } catch (error: any) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
} 