import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth from 'next-auth/next'

// Create a demo user if it doesn't exist
const createDemoUserIfNotExists = async () => {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id: 'demo-1' },
          { email: 'demo@example.com' }
        ]
      }
    });
    
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          id: 'demo-1',
          name: 'Demo User',
          email: 'demo@example.com',
          image: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
        }
      });
      console.log('Created demo user:', newUser);
      return newUser;
    }
    
    return user;
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
};

// Run this once at startup
createDemoUserIfNotExists().catch(console.error);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt', // Use JWT for credential provider compatibility
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
  adapter: PrismaAdapter(prisma),
  providers: [
    // Only include GitHub provider if credentials are provided
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
    // Only include Google provider if credentials are provided
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
          }),
        ]
      : []),
    // Only include Apple provider if credentials are provided
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
          }),
        ]
      : []),
    // Include a fallback Credentials provider for development
    CredentialsProvider({
      id: 'credentials',
      name: 'Development Login',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "demo-user" },
        password: { label: "Password", type: "password", placeholder: "password" }
      },
      async authorize(credentials) {
        // Log the attempt for debugging
        console.log("Attempting to authorize with credentials:", credentials?.username);
        
        // Check if credentials exist
        if (!credentials?.username || !credentials?.password) {
          console.error("Missing username or password");
          return null;
        }
        
        // For development demo purposes - NEVER use hard-coded credentials in production
        if (credentials.username === "demo-user" && credentials.password === "password") {
          console.log("Development credentials authorized successfully");
          
          // Make sure demo user exists
          const user = await createDemoUserIfNotExists();
          
          // Return a user object that will be stored in the JWT token
          return { 
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          };
        }
        
        console.error("Development credentials failed - username:", credentials.username, "password length:", credentials.password.length);
        return null;
      }
    }),
  ],
  callbacks: {
    // JWT callback to add user ID to the token
    jwt: async ({ token, user }) => {
      console.log("JWT callback called", { tokenUserId: token.id, userId: user?.id });
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Session callback to add user ID to the session
    session: async ({ session, token }) => {
      console.log("Session callback called", { hasToken: !!token, hasUser: !!session.user });
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      console.log("Redirect callback called", { url, baseUrl });
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      console.debug("NextAuth Debug:", code, metadata);
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 