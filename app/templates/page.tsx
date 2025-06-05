import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import TemplatesClient from './templates-client'
import prisma from '@/lib/prisma'

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/api/auth/signin')
  }
  
  // In a real app, we would fetch templates from the database
  // This is a simplified implementation for demonstration
  const templates = [
    {
      id: "template1",
      name: "Upper Body Strength",
      description: "Focus on chest, back, and arms",
      exercises: [
        { id: "ex1", name: "Bench Press", sets: 4 },
        { id: "ex4", name: "Pull-up", sets: 4 },
        { id: "ex7", name: "Bicep Curl", sets: 3 },
        { id: "ex12", name: "Tricep Extension", sets: 3 }
      ]
    },
    {
      id: "template2",
      name: "Lower Body Power",
      description: "Focus on legs and glutes",
      exercises: [
        { id: "ex2", name: "Squat", sets: 5 },
        { id: "ex3", name: "Deadlift", sets: 4 },
        { id: "ex9", name: "Leg Press", sets: 3 },
        { id: "ex13", name: "Leg Curl", sets: 3 }
      ]
    },
    {
      id: "template3",
      name: "Full Body Workout",
      description: "Complete body workout for general fitness",
      exercises: [
        { id: "ex2", name: "Squat", sets: 3 },
        { id: "ex1", name: "Bench Press", sets: 3 },
        { id: "ex3", name: "Deadlift", sets: 3 },
        { id: "ex10", name: "Shoulder Press", sets: 3 },
        { id: "ex8", name: "Plank", sets: 3 }
      ]
    }
  ]
  
  return <TemplatesClient templates={templates} />
} 