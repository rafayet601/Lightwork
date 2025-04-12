'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'An unknown error occurred'
  
  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'Signin':
        return 'Try signing in with a different account.'
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'OAuthAccountNotLinked':
        return 'Error occurred with your OAuth sign-in. Please try again.'
      case 'EmailCreateAccount':
      case 'EmailSignin':
        return 'The email sign-in failed. Please try again.'
      case 'CredentialsSignin':
        return 'The username or password you entered is incorrect.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      case 'Configuration':
        return 'There is a problem with the server configuration. Please try again later.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }
  
  const errorMessage = getErrorMessage(error)
  
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Authentication Error
          </CardTitle>
          <CardDescription>
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-muted-foreground">
              {errorMessage}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/api/auth/signin" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 