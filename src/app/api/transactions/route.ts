import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId, txHash, amount, toAddress } = body;

    const link = await prisma.paymentLink.findFirst({
      where: { linkCode: linkId },
    });

    if (!link || !link.stealthKeyId) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await prisma.transaction.create({
      data: {
        stealthKeyId: link.stealthKeyId,
        txHash,
        fromAddress: '',
        toAddress,
        amount,
        status: 'confirmed',
      },
    });

    const currentKey = await prisma.stealthKey.findUnique({
      where: { id: link.stealthKeyId },
    });

    const newBalance = (parseFloat(currentKey?.balance || '0') + parseFloat(amount)).toString();

    await prisma.stealthKey.update({
      where: { id: link.stealthKeyId },
      data: { balance: newBalance },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}