import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

const providers = [];

if (process.env.AUTH_GOOGLE_ID) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  );
}

providers.push(
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
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user, token }: { session: any; user: any; token: any }) {
      if (session.user) {
        session.user.id = token.id || user?.id;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === 'credentials' && profile) {
        token.walletAddress = profile.walletAddress;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' || account?.provider === 'apple') {
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });
          if (existingAccount) {
            return true;
          }
          
          const email = profile?.email;
          if (!email) {
            return true;
          }
          
          let existingUser = await prisma.user.findFirst({
            where: { email },
          });
          
          if (!existingUser && user) {
            existingUser = await prisma.user.findFirst({
              where: { id: user.id },
            });
          }
          
          if (existingUser) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type || 'oauth',
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token as string | undefined,
                access_token: account.access_token as string | undefined,
                expires_at: account.expires_at ?? undefined,
                token_type: account.token_type ?? undefined,
                scope: account.scope ?? undefined,
                id_token: account.id_token as string | undefined,
                session_state: account.session_state as string | undefined,
              },
            });
          }
        }
      } catch (error) {
        console.error('SignIn callback error:', error);
      }
      return true;
    },
  },
  session: {
    strategy: 'database',
  },
});