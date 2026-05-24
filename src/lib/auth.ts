import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

declare module 'next-auth' {
  interface User {
    role?: string
    firm?: string
    organizationId?: string
    subscriptionStatus?: string
    isAdmin?: boolean
    creditsRemaining?: number
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      firm?: string
      organizationId?: string
      subscriptionStatus: string
      isAdmin: boolean
      creditsRemaining: number
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    firm?: string
    organizationId?: string
    subscriptionStatus: string
    isAdmin: boolean
    creditsRemaining: number
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages:   { signIn: '/login', error: '/login' },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Demo mode bypass (staging only)
        if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
          return {
            id: 'demo-user',
            email: credentials.email,
            name: 'Demo Attorney',
            role: 'attorney',
            subscriptionStatus: 'active',
            isAdmin: false,
            creditsRemaining: 999,
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })
        if (!user)           throw new Error('No account found with this email')
        if (!user.password)  throw new Error('This account uses social login — please sign in with Google')
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid)          throw new Error('Incorrect password')

        return {
          id:                 user.id,
          email:              user.email,
          name:               user.name,
          image:              user.image,
          role:               user.role,
          firm:               user.firm ?? undefined,
          organizationId:     user.organizationId ?? undefined,
          subscriptionStatus: user.subscriptionStatus,
          isAdmin:            user.isAdmin,
          creditsRemaining:   user.creditsRemaining,
        }
      },
    }),

    ...(process.env.GOOGLE_CLIENT_ID ? [
      GoogleProvider({
        clientId:     process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        profile(profile) {
          return {
            id:    profile.sub,
            email: profile.email,
            name:  profile.name,
            image: profile.picture,
            role:  'attorney',
            subscriptionStatus: 'inactive',
            isAdmin: false,
            creditsRemaining: 0,
          }
        },
      }),
    ] : []),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id                 = user.id
        token.role               = (user as any).role ?? 'attorney'
        token.firm               = (user as any).firm
        token.organizationId     = (user as any).organizationId
        token.subscriptionStatus = (user as any).subscriptionStatus ?? 'inactive'
        token.isAdmin            = (user as any).isAdmin ?? false
        token.creditsRemaining   = (user as any).creditsRemaining ?? 0
      }
      // Allow client-side session.update() to refresh credits/subscription
      if (trigger === 'update' && session) {
        if (session.subscriptionStatus) token.subscriptionStatus = session.subscriptionStatus
        if (session.creditsRemaining !== undefined) token.creditsRemaining = session.creditsRemaining
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id                 = token.id
        session.user.role               = token.role
        session.user.firm               = token.firm
        session.user.organizationId     = token.organizationId
        session.user.subscriptionStatus = token.subscriptionStatus
        session.user.isAdmin            = token.isAdmin
        session.user.creditsRemaining   = token.creditsRemaining
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// ── Role helpers ──────────────────────────────────────────────
export type UserRoleType = 'attorney' | 'client' | 'admin' | 'partner'

export function hasRole(sessionRole: string, allowed: UserRoleType[]): boolean {
  return allowed.includes(sessionRole as UserRoleType)
}

export function isPro(subscriptionStatus: string): boolean {
  return ['active', 'trialing'].includes(subscriptionStatus)
}
