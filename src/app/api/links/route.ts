import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePaymentLinkId, generateStealthRootKeyPair } from '@/lib/stealth';

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
      where: { userId: session.user.id },
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
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserStealthRoot(session.user.id);

    const linkCode = generatePaymentLinkId();

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
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
