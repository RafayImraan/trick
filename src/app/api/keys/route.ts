import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await prisma.stealthKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        address: true,
        balance: true,
        createdAt: true,
        isActive: true,
        paymentLink: {
          select: { id: true, linkCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error fetching keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rateLimit(`create-key:${session.user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const { createTronAccount } = await import('@/lib/tron');
    const account = createTronAccount();

    const key = await prisma.stealthKey.create({
      data: {
        userId: session.user.id,
        publicKey: account.publicKey,
        privateKey: account.privateKey,
        address: account.address,
        balance: '0',
        isActive: true,
      },
      select: {
        id: true,
        address: true,
        balance: true,
        createdAt: true,
        isActive: true,
      },
    });

    return NextResponse.json({ key });
  } catch (error) {
    console.error('Error creating key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
