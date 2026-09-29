import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const transferSchema = z.object({
  recipientIdentifier: z.string().min(1, 'Recipient username or email is required'),
  amount: z.number().gt(0, 'Transfer amount must be positive and greater than zero'),
});

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const headersList = headers();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const body = await req.json();

    // Determine security mode from Header ('x-security-mode') or Body override ('mode')
    const headerMode = headersList.get('x-security-mode');
    const isVulnerable =
      (headerMode && headerMode.toLowerCase() === 'vulnerable') ||
      (body.mode && body.mode.toLowerCase() === 'vulnerable');

    const modeTag = isVulnerable ? 'VULNERABLE' : 'SECURE';

    // =========================================================================
    // VULNERABLE MODE IMPLEMENTATION
    // Exposes 3 security flaws: BOLA, Race Condition/Non-Atomic DB, Missing Validation
    // =========================================================================
    if (isVulnerable) {
      let senderId = payload.userId;

      // FLAW 1: BOLA (Broken Object Level Authorization)
      // Blindly trusts senderId or senderIdentifier passed in JSON body instead of JWT session!
      if (body.senderId) {
        senderId = body.senderId;
      } else if (body.senderIdentifier) {
        const spoofedUser = await prisma.user.findFirst({
          where: { OR: [{ email: body.senderIdentifier }, { username: body.senderIdentifier }] },
        });
        if (spoofedUser) senderId = spoofedUser.id;
      }

      // FLAW 3: Missing Input Validation
      // Does NOT validate amount > 0, does NOT check sender balance, allows negative amounts.
      const rawAmount = Number(body.amount);
      if (isNaN(rawAmount)) {
        return NextResponse.json({ error: 'Invalid amount provided' }, { status: 400 });
      }

      // Find recipient without strict checking
      const recipient = await prisma.user.findFirst({
        where: {
          OR: [{ email: body.recipientIdentifier }, { username: body.recipientIdentifier }],
        },
      });

      if (!recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
      }

      const sender = await prisma.user.findUnique({ where: { id: senderId } });
      if (!sender) {
        return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
      }

      // FLAW 2: Race Condition / Non-Atomic DB Updates (No $transaction)
      // Executes debit and credit in separate independent non-atomic queries
      const updatedSenderBalance = sender.balance - rawAmount;
      const updatedReceiverBalance = recipient.balance + rawAmount;

      // 1. Separate Debit UPDATE
      await prisma.user.update({
        where: { id: sender.id },
        data: { balance: updatedSenderBalance },
      });

      // Optional artificial delay to heighten race condition risk if concurrent
      if (body.simulateDelay) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // 2. Separate Credit UPDATE
      await prisma.user.update({
        where: { id: recipient.id },
        data: { balance: updatedReceiverBalance },
      });

      // 3. Separate Transaction Log Creation
      const tx = await prisma.transaction.create({
        data: {
          senderId: sender.id,
          receiverId: recipient.id,
          amount: rawAmount,
          mode: 'VULNERABLE',
          status: 'SUCCESS',
          note: body.senderId
            ? `BOLA Exploit Executed (Debit Account: ${sender.username})`
            : rawAmount < 0
            ? `Negative Transfer Exploit Executed`
            : `Vulnerable Non-Atomic Transfer`,
        },
      });

      return NextResponse.json({
        success: true,
        mode: 'VULNERABLE',
        warning: 'Transaction completed in VULNERABLE mode without transaction atomicity or authorization checks!',
        transaction: tx,
        senderBalance: updatedSenderBalance,
        receiverBalance: updatedReceiverBalance,
      });
    }

    // =========================================================================
    // SECURE MODE IMPLEMENTATION
    // Applies 3 security controls: Strict JWT Authorization, Zod Validation, Prisma $transaction
    // =========================================================================

    // CONTROL 3: Schema & Business Logic Validation via Zod
    const validationResult = transferSchema.safeParse({
      recipientIdentifier: body.recipientIdentifier,
      amount: Number(body.amount),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: validationResult.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { recipientIdentifier, amount } = validationResult.data;

    // CONTROL 1: Object-Level Access Control
    // Strictly rely on authenticated session payload.userId, IGNORE body.senderId
    const senderId = payload.userId;

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) {
      return NextResponse.json({ error: 'Sender user not found' }, { status: 404 });
    }

    const recipient = await prisma.user.findFirst({
      where: {
        OR: [{ email: recipientIdentifier }, { username: recipientIdentifier }],
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient account does not exist' }, { status: 404 });
    }

    if (recipient.id === sender.id) {
      return NextResponse.json({ error: 'Cannot transfer funds to your own account' }, { status: 400 });
    }

    // CONTROL 3 (Continued): Sufficient Balance Check
    if (sender.balance < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient Funds',
          currentBalance: sender.balance,
          requestedAmount: amount,
        },
        { status: 400 }
      );
    }

    // CONTROL 2: Data Integrity & Atomicity via Prisma $transaction
    const [updatedSender, updatedReceiver, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: sender.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.user.update({
        where: { id: recipient.id },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          senderId: sender.id,
          receiverId: recipient.id,
          amount,
          mode: 'SECURE',
          status: 'SUCCESS',
          note: 'Secure Atomic Transfer',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      mode: 'SECURE',
      message: 'Transfer processed securely with atomic transaction guarantees.',
      transaction,
      senderBalance: updatedSender.balance,
      receiverBalance: updatedReceiver.balance,
    });
  } catch (error: any) {
    console.error('Transfer API Error:', error);
    return NextResponse.json({ error: 'Server error processing transaction' }, { status: 500 });
  }
}
