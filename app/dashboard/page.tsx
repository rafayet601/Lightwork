import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import DashboardClient from './dashboard-client'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    redirect('/auth/signin')
  }
  
  // Fetch the workouts server-side
  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      date: 'desc',
    },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
    take: 6, // Limit to the last 6 workouts for the dashboard
  })

  return <DashboardClient workouts={workouts} />
} 