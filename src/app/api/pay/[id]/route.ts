import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const address = link.stealthKey?.address || '';

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error resolving link:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}