import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTRX, getWalletBalance, validateAddress, fromPrivateKeyToAddress } from '@/lib/tron';
import { sendWithdrawalConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const gasReserve = 1;
    if (currentBalance < amountNum + gasReserve) {
      return NextResponse.json({ error: 'Insufficient balance for gas' }, { status: 400 });
    }

    const privateKey = stealthKey.privateKey;
    if (!privateKey) {
      return NextResponse.json({ error: 'Private key not available' }, { status: 400 });
    }

    const result = await sendTRX(privateKey, toAddress, amountNum);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Transaction failed' }, { status: 500 });
    }

    const newBalance = (parseFloat(stealthKey.balance) - amountNum).toString();
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

    await sendWithdrawalConfirmationEmail(
      session.user.email,
      amountNum.toString(),
      toAddress,
      result.txid!
    );

    return NextResponse.json({
      success: true,
      txHash: result.txid,
      newBalance,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}