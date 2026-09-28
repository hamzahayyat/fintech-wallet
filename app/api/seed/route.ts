import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    const defaultPassword = await hashPassword('password123');

    const accounts = [
      { email: 'alice@fast.edu', username: 'alice', balance: 1000.0 },
      { email: 'bob@fast.edu', username: 'bob', balance: 1000.0 },
      { email: 'attacker@fast.edu', username: 'attacker', balance: 250.0 },
    ];

    const createdUsers = [];

    for (const acc of accounts) {
      const user = await prisma.user.upsert({
        where: { email: acc.email },
        update: {
          balance: acc.balance,
        },
        create: {
          email: acc.email,
          username: acc.username,
          password: defaultPassword,
          balance: acc.balance,
        },
        select: {
          id: true,
          email: true,
          username: true,
          balance: true,
        },
      });
      createdUsers.push(user);
    }

    return NextResponse.json({
      message: 'Database successfully seeded with demo accounts!',
      demoPassword: 'password123',
      users: createdUsers,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
