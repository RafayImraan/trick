import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TronWeb } = require('tronweb');
const providers = [];

if (process.env.AUTH_GOOGLE_ID) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
      allowDangerousEmailAccountLinking: false,
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
      signature: { label: 'Signature', type: 'text' },
      nonce: { label: 'Nonce', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.walletAddress || !credentials?.signature || !credentials?.nonce) {
        return null;
      }

      const walletAddress = credentials.walletAddress as string;
      const signature = credentials.signature as string;
      const nonce = credentials.nonce as string;

      const challenge = await prisma.authChallenge.findUnique({
        where: { nonce },
      });

      if (!challenge) {
        return null;
      }

      if (challenge.usedAt) {
        return null;
      }

      if (new Date() > challenge.expiresAt) {
        return null;
      }

      const messageHex = Buffer.from(`trick-auth:${nonce}`).toString('hex');

      try {
        const tronWebInstance = new TronWeb({ fullHost: 'https://api.nile.org' });
        const isValid = tronWebInstance.trx.verifyMessage(messageHex, signature, walletAddress);

        if (!isValid) {
          return null;
        }
      } catch {
        return null;
      }

      await prisma.authChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      });

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
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as unknown as Record<string, unknown>).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async signIn() {
      return true;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
