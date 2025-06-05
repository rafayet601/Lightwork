import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dumbbell, LayoutDashboard, BarChart2, Award, BookOpen, FileText, UserCircle } from 'lucide-react'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Liftit | Modern Fitness Tracking',
  description: 'Track your workouts, monitor your progress, and achieve your fitness goals with Liftit.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gradient-sleek antialiased min-h-screen flex flex-col`}>
        <Providers>
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/20 animate-fadeIn">
            <div className="container flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2 gradient-text font-semibold text-lg group">
                <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-all duration-300">
                  <Dumbbell className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <span className="font-bold">Liftit</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4 text-sm">
                {session ? (
                  <>
                    <Link 
                      href="/dashboard"
                      className="transition-all duration-300 hover:text-primary text-foreground/60 hover:translate-y-[-1px] flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/progress"
                      className="transition-all duration-300 hover:text-primary text-foreground/60 hover:translate-y-[-1px] flex items-center gap-1.5"
                    >
                      <BarChart2 className="h-4 w-4" />
                      Progress
                    </Link>
                    <Link
                      href="/exercises"
                      className="transition-all duration-300 hover:text-primary text-foreground/60 hover:translate-y-[-1px] flex items-center gap-1.5"
                    >
                      <BookOpen className="h-4 w-4" />
                      Exercises
                    </Link>
                    <Link
                      href="/templates"
                      className="transition-all duration-300 hover:text-primary text-foreground/60 hover:translate-y-[-1px] flex items-center gap-1.5"
                    >
                      <FileText className="h-4 w-4" />
                      Templates
                    </Link>
                    <Link
                      href="/achievements"
                      className="transition-all duration-300 hover:text-primary text-foreground/60 hover:translate-y-[-1px] flex items-center gap-1.5"
                    >
                      <Award className="h-4 w-4" />
                      Achievements
                    </Link>
                    <div className="w-px h-6 bg-border/60 mx-1"></div>
                    <Button variant="outline" size="sm" asChild className="border-glow">
                      <Link href="/profile" className="flex items-center gap-1.5">
                        <UserCircle className="h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button variant="default" size="sm" asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
                    <Link href="/api/auth/signin">Sign In</Link>
                  </Button>
                )}
              </nav>
              
              {/* Mobile menu - simplified for small screens */}
              <div className="md:hidden flex items-center">
                {session ? (
                  <Button variant="outline" size="sm" asChild className="border-glow">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <Button variant="default" size="sm" asChild className="shadow-lg shadow-primary/20">
                    <Link href="/api/auth/signin">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 container py-8 page-enter">
            {children}
          </main>
          <footer className="py-6 md:px-8 md:py-0 border-t border-border/40 bg-background/80 backdrop-blur-sm">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built by <a href="#" target="_blank" rel="noreferrer" className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4">Your Name/Company</a>.
                The source code is available on <a href="#" target="_blank" rel="noreferrer" className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4">GitHub</a>.
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
} 