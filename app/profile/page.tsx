import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import ProfileClient from './profile-client'
import prisma from '@/lib/prisma'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/api/auth/signin')
  }
  
  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      // In a real app, you'd include more user profile fields here
    }
  })
  
  if (!user) {
    // This shouldn't happen with proper session handling
    redirect('/api/auth/signin')
  }
  
  // Get workout statistics
  const workoutCount = await prisma.workout.count({
    where: { userId: user.id }
  })
  
  const userStats = {
    workoutCount,
    memberSince: new Date(), // In a real app, you'd store this in the user model
    // Add more stats as needed
  }
  
  return <ProfileClient user={user} stats={userStats} />
} 