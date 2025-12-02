import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Simple in-memory rate limiting (for production, use Redis)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);
  
  if (!attempt || now > attempt.resetTime) {
    // Reset or first attempt
    loginAttempts.set(identifier, { count: 1, resetTime: now + LOCKOUT_DURATION });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    // Too many attempts
    return { allowed: false, remaining: 0, resetTime: attempt.resetTime };
  }
  
  // Increment attempt count
  attempt.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - attempt.count };
}

function clearAttempt(identifier: string) {
  loginAttempts.delete(identifier);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 [AUTH] Login attempt:', { username: credentials?.username });
        
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ [AUTH] Missing credentials');
          return null;
        }

        // Rate limiting by username
        const identifier = credentials.username.toLowerCase();
        const rateCheck = checkRateLimit(identifier);
        
        if (!rateCheck.allowed) {
          const minutesLeft = Math.ceil((rateCheck.resetTime! - Date.now()) / 60000);
          console.log('❌ [AUTH] Rate limit exceeded');
          throw new Error(`Too many login attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`);
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          select: {
            id: true,
            username: true,
            password: true,
            role: true,
          },
        });

        console.log('🔍 [AUTH] User lookup:', { 
          found: !!user, 
          username: user?.username,
          role: user?.role 
        });

        if (!user) {
          console.log('❌ [AUTH] User not found');
          // Show remaining attempts
          throw new Error(`Invalid username or password. ${rateCheck.remaining} attempt${rateCheck.remaining !== 1 ? 's' : ''} remaining.`);
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log('🔑 [AUTH] Password check:', { isValid });

        if (!isValid) {
          console.log('❌ [AUTH] Invalid password');
          // Show remaining attempts
          throw new Error(`Invalid username or password. ${rateCheck.remaining} attempt${rateCheck.remaining !== 1 ? 's' : ''} remaining.`);
        }

        // Clear attempts on successful login
        clearAttempt(identifier);
        console.log('✅ [AUTH] Login successful');

        return { 
          id: user.id, 
          name: user.username, 
          email: `${user.username}@example.com`,
          role: user.role // Pass role to JWT
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, add role to token
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role and id to session
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);

export const runtime = "nodejs";
export { handler as GET, handler as POST };
