import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import GetStartedClient from './get-started-client'

export default async function GetStarted() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    redirect('/auth/signin')
  }
  
  return <GetStartedClient />
} 