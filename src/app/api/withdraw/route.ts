import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTRX, getWalletBalance, validateAddress } from '@/lib/tron';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`withdraw:${session.user.id}`, 3, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { stealthKeyId, toAddress, amount } = body;

    if (!toAddress || !amount || !stealthKeyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!validateAddress(toAddress)) {
      return NextResponse.json({ error: 'Invalid TRON address' }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const decimalParts = amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 6) {
      return NextResponse.json({ error: 'Amount has too many decimal places (max 6)' }, { status: 400 });
    }

    if (amountNum > 1000000) {
      return NextResponse.json({ error: 'Amount exceeds maximum (1,000,000 TRX)' }, { status: 400 });
    }

    const stealthKey = await prisma.stealthKey.findFirst({
      where: { id: stealthKeyId, userId: session.user.id },
    });

    if (!stealthKey) {
      return NextResponse.json({ error: 'Stealth key not found' }, { status: 404 });
    }

    const currentBalance = await getWalletBalance(stealthKey.address);
    if (currentBalance < amountNum) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const gasReserve = 2;
    if (currentBalance < amountNum + gasReserve) {
      return NextResponse.json({ error: 'Insufficient balance (need extra for network fees)' }, { status: 400 });
    }

    const privateKey = stealthKey.privateKey;
    if (!privateKey) {
      return NextResponse.json({ error: 'Private key not available' }, { status: 400 });
    }

    const result = await sendTRX(privateKey, toAddress, amountNum);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Transaction failed' }, { status: 500 });
    }

    const currentDbBalance = parseFloat(stealthKey.balance) || 0;
    const newBalance = Math.max(0, currentDbBalance - amountNum).toString();
    await prisma.stealthKey.update({
      where: { id: stealthKeyId },
      data: { balance: newBalance },
    });

    await prisma.transaction.create({
      data: {
        stealthKeyId,
        txHash: result.txid!,
        fromAddress: stealthKey.address,
        toAddress,
        amount: amountNum.toString(),
        status: 'confirmed',
      },
    });

    return NextResponse.json({
      success: true,
      txHash: result.txid,
      newBalance,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
