import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePaymentLinkId } from '@/lib/stealth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await prisma.paymentLink.findMany({
      where: { userId: session.user.id },
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