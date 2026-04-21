import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyPaymentReceived } from '@/lib/notifications';
import { deriveReceiverStealthKey } from '@/lib/stealth';
import { getWalletBalance, verifyTrxPayment } from '@/lib/tron';

async function reconcileTransaction(transaction: {
  id: string;
  txHash: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  emailSentAt: Date | null;
  stealthKeyId: string;
  stealthKey: {
    id: string;
    address: string;
    user: { email: string | null };
  };
}) {
  const amountSun = Math.floor(parseFloat(transaction.amount) * 1e6);
  const verification = await verifyTrxPayment(transaction.txHash, {
    toAddress: transaction.toAddress,
    amountSun,
    fromAddress: transaction.fromAddress || undefined,
  });

  const nextStatus = verification.status;
  const blockNumber = verification.blockNumber ?? null;
  const fromAddress = verification.fromAddress || transaction.fromAddress;

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: nextStatus,
      blockNumber,
      fromAddress,
    },
  });

  if (nextStatus !== 'confirmed') {
    return;
  }

  const onChainBalance = await getWalletBalance(transaction.stealthKey.address);
  await prisma.stealthKey.update({
    where: { id: transaction.stealthKeyId },
    data: { balance: onChainBalance.toString() },
  });

  if (!transaction.emailSentAt && transaction.stealthKey.user.email) {
    await notifyPaymentReceived(
      transaction.stealthKey.user.email,
      transaction.amount,
      transaction.txHash,
      transaction.toAddress
    );

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { emailSentAt: new Date() },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId, txHash, amount, fromAddress, toAddress, stealthAddress, ephemeralPublicKey } = body;

    if (!linkId || !txHash || !amount || !stealthAddress || !ephemeralPublicKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const link = await prisma.paymentLink.findFirst({
      where: { linkCode: linkId, isActive: true },
      include: {
        user: {
          select: {
            email: true,
            stealthRootPrivateKey: true,
          },
        },
      },
    });

    if (!link?.user?.stealthRootPrivateKey) {
      return NextResponse.json({ error: 'Receiver stealth profile not configured' }, { status: 400 });
    }

    const derivedStealth = deriveReceiverStealthKey(
      link.user.stealthRootPrivateKey,
      ephemeralPublicKey,
      `payment-link:${link.linkCode}`
    );

    if (derivedStealth.stealthAddress !== stealthAddress || derivedStealth.stealthAddress !== toAddress) {
      return NextResponse.json({ error: 'Stealth address mismatch' }, { status: 400 });
    }

    const stealthKey = await prisma.stealthKey.upsert({
      where: { address: derivedStealth.stealthAddress },
      update: {
        userId: link.userId,
        linkId: link.id,
        publicKey: derivedStealth.stealthPublicKey,
        privateKey: derivedStealth.stealthPrivateKey,
        ephemeralPublicKey,
        isActive: true,
      },
      create: {
        userId: link.userId,
        linkId: link.id,
        publicKey: derivedStealth.stealthPublicKey,
        privateKey: derivedStealth.stealthPrivateKey,
        address: derivedStealth.stealthAddress,
        balance: '0',
        ephemeralPublicKey,
        isActive: true,
      },
    });

    const verification = await verifyTrxPayment(txHash, {
      toAddress: derivedStealth.stealthAddress,
      amountSun: Math.floor(parseFloat(amount) * 1e6),
      fromAddress: fromAddress || undefined,
    });

    const transaction = await prisma.transaction.upsert({
      where: { txHash },
      update: {
        stealthKeyId: stealthKey.id,
        fromAddress: verification.fromAddress || fromAddress || '',
        toAddress: derivedStealth.stealthAddress,
        amount,
        status: verification.status,
        blockNumber: verification.blockNumber ?? null,
      },
      create: {
        stealthKeyId: stealthKey.id,
        txHash,
        fromAddress: verification.fromAddress || fromAddress || '',
        toAddress: derivedStealth.stealthAddress,
        amount,
        status: verification.status,
        blockNumber: verification.blockNumber ?? null,
      },
      include: {
        stealthKey: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (verification.status === 'confirmed') {
      await reconcileTransaction(transaction);
    }

    return NextResponse.json({
      success: verification.ok,
      status: verification.status,
      txHash,
      stealthAddress: derivedStealth.stealthAddress,
      message: verification.status === 'pending' ? 'Transaction recorded and awaiting confirmation' : undefined,
      error: verification.ok ? undefined : verification.error,
    });
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

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'pending',
        stealthKey: {
          userId: session.user.id,
        },
      },
      include: {
        stealthKey: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    await Promise.all(pendingTransactions.map(reconcileTransaction));

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
