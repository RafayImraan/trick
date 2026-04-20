import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRandomPrivateKey, fromPrivateKeyToAddress, validateAddress, getTronWebInstance, FULL_NODE } from '@/lib/tron';

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
      console.log('Creating new stealth key for link:', id);
      
      const privateKey = createRandomPrivateKey();
      console.log('Generated private key:', privateKey.substring(0, 8) + '...');
      
      const newAddress = fromPrivateKeyToAddress(privateKey);
      console.log('Generated address:', newAddress);
      console.log('Address valid:', validateAddress(newAddress));
      
      if (!newAddress || !validateAddress(newAddress)) {
        const tron = getTronWebInstance();
        console.log('Using TronWeb fullNode:', FULL_NODE);
        console.log('TronWeb instance:', !!tron);
        return NextResponse.json({ error: 'Failed to generate valid address' }, { status: 500 });
      }

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
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}