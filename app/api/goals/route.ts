import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch user's goals from the database
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate progress percentage and onTrack status for each goal
    const goalsWithProgress = goals.map(goal => {
      const progressPercentage = Math.round((goal.current / goal.target) * 100)
      const timeElapsed = Date.now() - new Date(goal.createdAt).getTime()
      const totalTime = goal.timeframe * 7 * 24 * 60 * 60 * 1000
      const expectedProgress = Math.round((timeElapsed / totalTime) * 100)
      const onTrack = progressPercentage >= expectedProgress

      return {
        ...goal,
        progressPercentage,
        onTrack
      }
    })

    return NextResponse.json(goalsWithProgress)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, exercise, current, target, timeframe, priority, userId } = body

    if (!type || !current || !target || !timeframe || !priority || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create new goal
    const goal = await prisma.goal.create({
      data: {
        type,
        exercise,
        current,
        target,
        timeframe,
        priority,
        status: 'active',
        userId,
        deadline: new Date(Date.now() + timeframe * 7 * 24 * 60 * 60 * 1000)
      }
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, current, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    // Update goal
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(current !== undefined && { current }),
        ...(status && { status })
      }
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 