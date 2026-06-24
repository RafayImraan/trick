import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePaymentLinkId, generateStealthRootKeyPair } from '@/lib/stealth';
import { rateLimit } from '@/lib/rate-limit';

async function ensureUserStealthRoot(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stealthRootPrivateKey: true,
      stealthRootPublicKey: true,
    },
  });

  if (user?.stealthRootPrivateKey && user.stealthRootPublicKey) {
    return user;
  }

  const rootKeys = generateStealthRootKeyPair();
  return prisma.user.update({
    where: { id: userId },
    data: {
      stealthRootPrivateKey: rootKeys.privateKey,
      stealthRootPublicKey: rootKeys.publicKey,
    },
    select: {
      stealthRootPrivateKey: true,
      stealthRootPublicKey: true,
    },
  });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await prisma.paymentLink.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        _count: {
          select: { stealthKeys: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rateLimit(`create-link:${session.user.id}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    await ensureUserStealthRoot(session.user.id);

    const linkCode = generatePaymentLinkId();

    await prisma.paymentLink.updateMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const link = await prisma.paymentLink.create({
      data: {
        userId: session.user.id,
        linkCode,
        isActive: true,
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
