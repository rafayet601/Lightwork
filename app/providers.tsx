'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { Toaster } from '@/components/ui/toaster'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInDemo: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signInDemo: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check for demo session first
    const demoSession = localStorage.getItem('demo-session')
    if (demoSession) {
      const demoData = JSON.parse(demoSession)
      setUser(demoData.user)
      setSession(demoData.session)
      setLoading(false)
      return
    }

    // Check if we have proper Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If no Supabase config or placeholder config, skip auth check (demo mode)
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'https://placeholder.supabase.co' || 
        supabaseAnonKey === 'placeholder-anon-key') {
      console.log('No valid Supabase config - skipping auth check (demo mode)')
      setLoading(false)
      return
    }

    // Get initial session from Supabase with timeout
    const authTimeout = setTimeout(() => {
      console.warn('Supabase auth timeout - continuing without auth')
      setLoading(false)
    }, 5000) // 5 second timeout

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(authTimeout)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      clearTimeout(authTimeout)
      console.warn('Supabase auth failed:', error)
      setLoading(false)
    })

    // Only set up auth state listener if we have valid Supabase config
    let subscription: any = null
    if (supabaseUrl && supabaseAnonKey && 
        supabaseUrl !== 'https://placeholder.supabase.co' && 
        supabaseAnonKey !== 'placeholder-anon-key') {
      // Listen for auth changes
      const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle sign in
        if (event === 'SIGNED_IN' && session?.user) {
          // Sync user data with our database
          const { error } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              image: session.user.user_metadata?.avatar_url || null,
              updated_at: new Date().toISOString(),
            })
          
          if (error) {
            console.error('Error syncing user data:', error)
          }
        }
      })
      subscription = authListener.data.subscription
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase.auth])

  const signOut = async () => {
    // Check if demo session
    const demoSession = localStorage.getItem('demo-session')
    if (demoSession) {
      localStorage.removeItem('demo-session')
      setUser(null)
      setSession(null)
      return
    }

    // Regular Supabase sign out
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const signInDemo = async () => {
    // Create mock demo user and session
    const demoUser: User = {
      id: 'demo-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'demo@liftit.app',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {
        name: 'Demo User',
        full_name: 'Demo User',
        avatar_url: null,
      },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_anonymous: false,
    }

    const demoSession: Session = {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: demoUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }

    // Store demo session in localStorage
    localStorage.setItem('demo-session', JSON.stringify({
      user: demoUser,
      session: demoSession,
    }))

    // Update state
    setUser(demoUser)
    setSession(demoSession)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        signInDemo,
      }}
    >
      {children}
      <Toaster />
    </AuthContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

export default Providers 