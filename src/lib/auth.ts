import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Credentials({
      name: 'wallet',
      credentials: {
        walletAddress: { label: 'Wallet Address', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress) {
          return null;
        }
        
        const walletAddress = credentials.walletAddress as string;
        
        let user = await prisma.user.findFirst({
          where: { email: `${walletAddress}@tron.wallet` },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: `${walletAddress}@tron.wallet`,
              name: `Tron Wallet (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'database',
  },
});