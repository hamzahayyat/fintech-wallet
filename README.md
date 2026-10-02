# Fintech Mini Wallet

A web application for a mini fintech wallet built with Next.js 14, Prisma ORM (PostgreSQL), and Tailwind CSS.

This project includes a toggle switch in the navigation bar to switch between Vulnerable Mode and Secure Mode to demonstrate security vulnerabilities and how to fix them.

## Features
- User registration and login with JWT cookies
- Wallet balance dashboard
- Fund transfer module (transfer by email or username)
- Transaction history table
- Navbar security mode toggle switch (Vulnerable vs Secure)
- Exploit test buttons on the dashboard

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Styling:** Tailwind CSS
- **Authentication:** JWT tokens stored in HTTP-only cookies

## Vulnerabilities & Controls Covered
1. **BOLA (Broken Object Level Authorization):** Vulnerable mode accepts a `senderId` in the request body to transfer from another account; Secure mode strictly uses the authenticated session user ID.
2. **Race Condition:** Vulnerable mode uses separate update queries; Secure mode wraps debit, credit, and logging inside a Prisma `$transaction`.
3. **Missing Input Validation:** Vulnerable mode accepts negative transfer amounts; Secure mode validates that the amount is greater than 0 and checks for sufficient balance.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env`:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   JWT_SECRET="your-jwt-secret-key"
   ```

3. Push database schema:
   ```bash
   npx prisma db push
   ```

4. Run local development server:
   ```bash
   npm run dev
   ```

5. Seed test accounts (optional):
   Open `/api/seed` in your browser or click "Seed Accounts" on the login page to create demo accounts (alice, bob, attacker).
