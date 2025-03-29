import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gym Tracker | Your Personal Workout Companion',
  description: 'Track your workouts, monitor your progress, and achieve your fitness goals',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="font-bold text-xl flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M6.5 6.5h11"></path>
                <path d="M6.5 17.5h11"></path>
                <path d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Gym Tracker
            </Link>
            <nav className="flex gap-4 sm:gap-6">
              <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                Home
              </Link>
              {session ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                    Dashboard
                  </Link>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/api/auth/signout">Sign Out</Link>
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" asChild>
                  <Link href="/api/auth/signin">Sign In</Link>
                </Button>
              )}
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-8rem)]">
          {children}
        </main>
        <footer className="border-t bg-muted/40">
          <div className="container py-8 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <h4 className="text-base font-medium">App</h4>
                <ul className="space-y-1 text-sm">
                  <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link></li>
                  <li><Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                  <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-medium">Company</h4>
                <ul className="space-y-1 text-sm">
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-medium">Support</h4>
                <ul className="space-y-1 text-sm">
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-medium">Legal</h4>
                <ul className="space-y-1 text-sm">
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookies</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} Gym Tracker. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
} 