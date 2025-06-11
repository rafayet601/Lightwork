import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { createMCPAgent } from '@/lib/mcp-agent'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, goalId, goalType, exercise, currentProgress, timeframe } = body

    if (!userId || !goalType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's workout history
    const recentWorkouts = await prisma.workout.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        exercises: {
          include: {
            sets: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Create MCP agent for workout generation
    const agent = createMCPAgent(userId)
    
    // Generate personalized workout based on goal and history
    const workout = await agent.generateWorkout({
      goalType,
      exercise,
      currentProgress,
      timeframe,
      recentWorkouts
    })

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error generating workout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 