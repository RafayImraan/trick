import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await prisma.stealthKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error fetching keys:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { generateRandomKey, tronAddressFromPrivateKey } = await import('@/lib/stealth');
    const { privateKey, address } = generateRandomKey();

    const key = await prisma.stealthKey.create({
      data: {
        userId: session.user.id,
        publicKey: '',
        privateKey,
        address,
        balance: '0',
        isActive: true,
      },
    });

    return NextResponse.json({ key });
  } catch (error) {
    console.error('Error creating key:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}