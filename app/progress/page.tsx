import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProgressTracker from '@/components/ProgressTracker'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    redirect('/api/auth/signin')
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Progress Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Track your exercise progress over time to see your gains
        </p>
      </div>
      
      <ProgressTracker userId={session.user.id} />
    </div>
  )
} 