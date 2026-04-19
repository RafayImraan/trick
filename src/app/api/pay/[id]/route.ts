import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRandomPrivateKey, fromPrivateKeyToAddress } from '@/lib/tron';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const link = await prisma.paymentLink.findUnique({
      where: { linkCode: id },
      include: { stealthKey: true },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await prisma.paymentLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    let stealthKey = link.stealthKey;
    let address = stealthKey?.address;

    if (!stealthKey) {
      const privateKey = createRandomPrivateKey();
      const newAddress = fromPrivateKeyToAddress(privateKey);

      stealthKey = await prisma.stealthKey.create({
        data: {
          userId: link.userId,
          publicKey: '',
          privateKey,
          address: newAddress,
          balance: '0',
          isActive: true,
        },
      });

      await prisma.paymentLink.update({
        where: { id: link.id },
        data: { stealthKeyId: stealthKey.id },
      });

      address = newAddress;
    }

    return NextResponse.json({
      address,
      linkId: id,
      keyId: stealthKey?.id,
    });
  } catch (error) {
    console.error('Error resolving link:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}