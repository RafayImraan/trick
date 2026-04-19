import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyPaymentReceived } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId, txHash, amount, toAddress } = body;

    const link = await prisma.paymentLink.findFirst({
      where: { linkCode: linkId },
      include: { user: true },
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

    if (link.user?.email) {
      await notifyPaymentReceived(
        link.user.email,
        amount,
        txHash,
        toAddress
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        stealthKey: {
          userId: session.user.id,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}