# Mini Secure Fintech Wallet (FAST University CY-5004)

A full-stack Next.js web application built for the **CY-5004 Secure Software Design** university assignment. Features an interactive **"Vulnerable Mode vs Secure Mode"** toggle for before-and-after vulnerability demonstrations.

## Features & Security Flaws Covered

### Vulnerable Mode:
1. **BOLA (Broken Object Level Authorization)**: `/api/transfer` trusts `sender_id` provided in JSON request body.
2. **Race Condition / Non-Atomic DB Updates**: Updates debit and credit balance independently without Prisma `$transaction`.
3. **Missing Input Validation**: Accepts negative numbers, allowing attackers to credit their own balance.

### Secure Mode:
1. **Object-Level Access Control**: Strictly derives sender ID from verified HTTP-only JWT session cookie.
2. **Data Integrity / Atomicity**: Wraps all balance updates and logs inside `prisma.$transaction`.
3. **Schema & Business Rule Validation**: Zod schema validation ensuring `amount > 0` and sufficient funds.

---

## Tech Stack
- **Framework**: Next.js 14 App Router (React + Serverless API routes)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS (Dark Fintech Theme)
- **Auth**: Stateless JWT via HTTP-only Cookies (JOSE + bcryptjs)

---

## Deployment Instructions

Refer to [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for full deployment instructions.
