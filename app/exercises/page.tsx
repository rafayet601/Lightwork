import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import ExerciseLibraryClient from './exercise-library-client'

export default async function ExerciseLibraryPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/api/auth/signin')
  }
  
  return <ExerciseLibraryClient />
} 