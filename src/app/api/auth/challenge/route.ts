import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const nonce = crypto.randomBytes(32).toString('hex');

    await prisma.authChallenge.create({
      data: {
        nonce,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
