import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWalletBalance, getTokenBalance, USDT_TOKEN } from '@/lib/tron';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stealthKeyId } = body;

    if (!stealthKeyId) {
      return NextResponse.json({ error: 'Missing stealthKeyId' }, { status: 400 });
    }

    const stealthKey = await prisma.stealthKey.findFirst({
      where: { id: stealthKeyId, userId: session.user.id },
    });

    if (!stealthKey) {
      return NextResponse.json({ error: 'Stealth key not found' }, { status: 404 });
    }

    const trxBalance = await getWalletBalance(stealthKey.address);
    const usdtBalance = await getTokenBalance(stealthKey.address, USDT_TOKEN);

    await prisma.stealthKey.update({
      where: { id: stealthKeyId },
      data: { balance: trxBalance.toString() },
    });

    return NextResponse.json({
      trxBalance: trxBalance.toString(),
      usdtBalance: usdtBalance.toString(),
      address: stealthKey.address,
    });
  } catch (error) {
    console.error('Balance sync error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stealthKeys = await prisma.stealthKey.findMany({
      where: { userId: session.user.id },
    });

    const balances = await Promise.all(
      stealthKeys.map(async (key) => {
        const trxBalance = await getWalletBalance(key.address);
        const usdtBalance = await getTokenBalance(key.address, USDT_TOKEN);

        await prisma.stealthKey.update({
          where: { id: key.id },
          data: { balance: trxBalance.toString() },
        });

        return {
          keyId: key.id,
          address: key.address,
          trxBalance: trxBalance.toString(),
          usdtBalance: usdtBalance.toString(),
        };
      })
    );

    const totalTrx = balances.reduce((acc, b) => acc + parseFloat(b.trxBalance), 0);
    const totalUsdt = balances.reduce((acc, b) => acc + parseFloat(b.usdtBalance), 0);

    return NextResponse.json({
      totalTrx: totalTrx.toString(),
      totalUsdt: totalUsdt.toString(),
      balances,
    });
  } catch (error) {
    console.error('Balance sync error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}