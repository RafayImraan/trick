import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateStealthRootKeyPair } from '@/lib/stealth';

async function ensureReceiverRootKeys(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stealthRootPublicKey: true,
      stealthRootPrivateKey: true,
    },
  });

  if (user?.stealthRootPublicKey && user.stealthRootPrivateKey) {
    return user;
  }

  const rootKeys = generateStealthRootKeyPair();
  return prisma.user.update({
    where: { id: userId },
    data: {
      stealthRootPublicKey: rootKeys.publicKey,
      stealthRootPrivateKey: rootKeys.privateKey,
    },
    select: {
      stealthRootPublicKey: true,
      stealthRootPrivateKey: true,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const link = await prisma.paymentLink.findUnique({
      where: { linkCode: id },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await prisma.paymentLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    const receiverRoot = await ensureReceiverRootKeys(link.userId);

    return NextResponse.json({
      linkId: link.id,
      linkCode: link.linkCode,
      receiverPublicKey: receiverRoot.stealthRootPublicKey,
      paymentContext: `payment-link:${link.linkCode}`,
    });
  } catch (error) {
    console.error('Error resolving link:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
