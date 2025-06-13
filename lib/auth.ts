import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import crypto from 'crypto'

// Generate a secure secret if not provided
const generateSecureSecret = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Get or generate a consistent secret for development
const getAuthSecret = () => {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET
  }
  
  if (process.env.NODE_ENV === 'development') {
    // Use a consistent secret for development to avoid JWT issues
    return 'development-secret-key-do-not-use-in-production-' + crypto.createHash('md5').update('lightwork-dev').digest('hex')
  }
  
  throw new Error('NEXTAUTH_SECRET must be set in production')
}

// Create a demo user if it doesn't exist - ONLY FOR DEVELOPMENT
const createDemoUserIfNotExists = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  try {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id: 'demo-1' },
          { email: 'demo@example.com' }
        ]
      }
    })
    
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          id: 'demo-1',
          name: 'Demo User',
          email: 'demo@example.com',
          image: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
        }
      })
      console.log('Created demo user for development')
      return newUser
    }
    
    return user
  } catch (error) {
    console.error('Error creating demo user:', error)
    return null
  }
}

// Initialize demo user in development
if (process.env.NODE_ENV === 'development') {
  createDemoUserIfNotExists().catch(console.error)
}

// Get the NextAuth URL from environment variables
const nextAuthUrl = process.env.NEXTAUTH_URL || (process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : undefined);

if (!nextAuthUrl && process.env.NODE_ENV === 'production') {
  console.warn('No NEXTAUTH_URL environment variable set in production!');
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  debug: process.env.NODE_ENV === 'development',
  adapter: PrismaAdapter(prisma),
  providers: [
    // GitHub Provider (production ready)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            allowDangerousEmailAccountLinking: process.env.NODE_ENV === 'development',
          }),
        ]
      : []),
    
    // Google Provider (production ready)
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: process.env.NODE_ENV === 'development',
          }),
        ]
      : []),
    
    // Development-only credentials provider
    ...(process.env.NODE_ENV === 'development' ? [
      CredentialsProvider({
        id: 'credentials',
        name: 'Development Login',
        credentials: {
          username: { label: "Username", type: "text", placeholder: "demo-user" },
          password: { label: "Password", type: "password", placeholder: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials?.password) {
            return null
          }
          
          // Development credentials only
          if (credentials.username === "demo-user" && credentials.password === "password") {
            const user = await createDemoUserIfNotExists()
            
            if (!user) return null
            
            return { 
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image
            }
          }
          
          return null
        }
      })
    ] : []),
  ],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      
      // Subsequent requests
      if (account) {
        token.accessToken = account.access_token
      }
      
      return token
    },
    
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
    
    redirect: async ({ url, baseUrl }) => {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL?.includes('://') 
            ? new URL(process.env.NEXTAUTH_URL).hostname 
            : undefined
          : 'localhost'
      },
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed in:', { userId: user.id, email: user.email })
      }
    },
    async signOut({ token, session }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed out')
      }
    },
  },
  logger: {
    error(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.error("NextAuth Error:", code, metadata)
      }
    },
    warn(code) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("NextAuth Warning:", code)
      }
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.debug("NextAuth Debug:", code, metadata)
      }
    },
  },
} 