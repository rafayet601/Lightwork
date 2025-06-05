import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import AchievementsClient from './achievements-client'
import prisma from '@/lib/prisma'

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/api/auth/signin')
  }
  
  // Fetch user data to calculate achievements
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true }
  })
  
  if (!user) {
    redirect('/api/auth/signin')
  }
  
  // Get workout count
  const workoutCount = await prisma.workout.count({
    where: { userId: user.id }
  })
  
  // Get total exercises completed
  const exercises = await prisma.exercise.findMany({
    where: {
      workout: {
        userId: user.id
      }
    },
    include: {
      sets: true
    }
  })
  
  const totalExercises = exercises.length
  
  // Calculate total sets
  const totalSets = exercises.reduce((acc, exercise) => acc + exercise.sets.length, 0)
  
  // Calculate total weight lifted (simplified calculation)
  const totalWeightLifted = exercises.reduce((acc, exercise) => {
    return acc + exercise.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0)
  }, 0)
  
  // Calculate workout streak (simplified)
  // In a real app, you'd implement a more sophisticated algorithm
  const workoutStreak = 0 // Placeholder
  
  const achievements = [
    {
      id: 'first-workout',
      title: 'First Workout',
      description: 'Completed your first workout',
      icon: '🏋️‍♂️',
      unlocked: workoutCount >= 1,
      progress: Math.min(workoutCount, 1),
      maxProgress: 1
    },
    {
      id: 'workout-warrior',
      title: 'Workout Warrior',
      description: 'Complete 10 workouts',
      icon: '💪',
      unlocked: workoutCount >= 10,
      progress: Math.min(workoutCount, 10),
      maxProgress: 10
    },
    {
      id: 'exercise-explorer',
      title: 'Exercise Explorer',
      description: 'Try 20 different exercises',
      icon: '🔍',
      unlocked: totalExercises >= 20,
      progress: Math.min(totalExercises, 20),
      maxProgress: 20
    },
    {
      id: 'consistency-king',
      title: 'Consistency King',
      description: 'Workout 5 days in a row',
      icon: '👑',
      unlocked: workoutStreak >= 5,
      progress: Math.min(workoutStreak, 5),
      maxProgress: 5
    },
    {
      id: 'ton-of-steel',
      title: 'Ton of Steel',
      description: 'Lift a cumulative weight of 1000kg',
      icon: '🏆',
      unlocked: totalWeightLifted >= 1000,
      progress: Math.min(totalWeightLifted, 1000),
      maxProgress: 1000
    },
    {
      id: 'century-club',
      title: 'Century Club',
      description: 'Complete 100 sets',
      icon: '💯',
      unlocked: totalSets >= 100,
      progress: Math.min(totalSets, 100),
      maxProgress: 100
    }
  ]
  
  return <AchievementsClient achievements={achievements} />
} 