'use client'

import React from 'react'
import { AuthWrapper } from '@/components/auth-wrapper'
import DashboardClient from './dashboard-client'

export default function Dashboard() {
  return (
    <AuthWrapper requireAuth={true}>
      <DashboardClient />
    </AuthWrapper>
  )
} 