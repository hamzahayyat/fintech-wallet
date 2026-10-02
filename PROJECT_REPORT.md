# FAST National University of Computer and Emerging Sciences
## Department of Cyber Security
### Course: CY-5004 Secure Software Design

# ACADEMIC PROJECT & SECURITY AUDIT REPORT
## Mini Secure Fintech Wallet ("VaultShield Pay")

---

### **Student & Project Metadata**
- **Student Name**: Hamza Hayat
- **Student Email**: mmhhmalik@gmail.com
- **Institution**: FAST University
- **Course**: CY-5004 Secure Software Design
- **GitHub Repository**: [https://github.com/hamzahayyat/fintech-wallet](https://github.com/hamzahayyat/fintech-wallet)
- **Live Vercel Deployment**: [https://fintech-wallet-eight.vercel.app](https://fintech-wallet-eight.vercel.app)

---

## 1. Executive Summary

This report documents the architectural design, security analysis, implementation methodology, and before-and-after vulnerability evaluation of **VaultShield Pay** — a full-stack Mini Secure Fintech Wallet built to satisfy the CY-5004 Secure Software Design assignment requirements.

The application incorporates a live, interactive **"Vulnerable Mode vs. Secure Mode"** security demonstration engine. Through a header-based toggle (`x-security-mode`), evaluators can witness real-time exploitation of top OWASP API security weaknesses (BOLA, Race Conditions, Missing Input Validation) in Vulnerable Mode, and verify the corresponding defensive controls applied in Secure Mode.

---

## 2. Technology Stack & Architectural Overview

The application is engineered using serverless, production-grade web technologies designed for Vercel deployment and persistent cloud storage:

```
+-----------------------------------------------------------------------+
|                         Frontend Client (React)                       |
|   Tailwind CSS Dark Theme  |  Security Toggle Switch  |  Exploit UI   |
+-----------------------------------------------------------------------+
                                    |
                            HTTP / JSON + Header (x-security-mode)
                                    v
+-----------------------------------------------------------------------+
|                    Next.js 14 App Router (API Routes)                  |
|   JWT Session Middleware  |  Zod Validator  |  Vulnerable/Secure Engine|
+-----------------------------------------------------------------------+
                                    |
                               Prisma ORM
                                    v
+-----------------------------------------------------------------------+
|                    Neon PostgreSQL (Cloud Database)                   |
|                     User Table  |  Transaction Table                  |
+-----------------------------------------------------------------------+
```

### **Core Stack Components**
1. **Framework**: Next.js 14 App Router (Full-Stack React + Node.js Serverless API Routes).
2. **Database & ORM**: Neon PostgreSQL with Prisma ORM (`User` and `Transaction` relational models).
3. **Authentication**: Stateless JWT tokens stored in `HTTP-only`, `SameSite=Lax`, `Secure` cookies (`jose` Web Crypto API + `bcryptjs` password hashing).
4. **Validation**: `Zod` schema validation for strict server-side request sanitization.
5. **Styling**: Tailwind CSS with custom fintech tokens, dark mode palette, and micro-animations.

---

## 3. Vulnerability & Security Control Matrix ("Before-and-After")

The core assignment requirement dictates a live before-and-after security demonstration. Below is the detailed breakdown of the three vulnerabilities exposed in **Vulnerable Mode** and blocked in **Secure Mode**.

### Summary Matrix

| Security Domain | Vulnerable Mode Flaw (`x-security-mode: vulnerable`) | Secure Mode Defensive Control (`x-security-mode: secure`) | OWASP Top 10 API Reference |
| :--- | :--- | :--- | :--- |
| **Object Authorization** | **BOLA Flaw**: Endpoint accepts client-supplied `senderId` in request body without verifying session ownership. | **Session Binding**: Ignores body `senderId`; strictly binds debit operation to verified JWT session `userId`. | **API1:2023 Broken Object Level Authorization** |
| **Data Concurrency** | **Race Condition**: Debit and credit operations are executed as independent, non-atomic `prisma.user.update` calls. | **ACID Atomicity**: Debit, credit, and logs are wrapped inside a single `prisma.$transaction([])`. | **API10:2023 Unsafe Consumption of APIs / Race Conditions** |
| **Input Validation** | **Missing Validation**: Accepts negative amounts (`-$500`), inflating sender balance and draining recipient. | **Schema & Balance Checks**: Zod validation enforces `amount > 0` and checks `balance >= amount`. | **API6:2023 Unrestricted Resource Consumption** |

---

## 4. Deep-Dive Vulnerability Analysis & Defensive Code Implementation

### 4.1 Vulnerability #1: Broken Object Level Authorization (BOLA)

#### **Vulnerable Code Pattern (`app/api/transfer/route.ts`)**
In Vulnerable Mode, the API checks if `body.senderId` is present. If an attacker passes a victim's user ID, the endpoint debits the victim's account instead of the logged-in user:

```typescript
// 🔴 VULNERABLE MODE: BOLA Flaw
let senderId = payload.userId; // Default session ID

if (body.senderId) {
  // Attacker spoofed another user's ID in JSON body!
  senderId = body.senderId; 
}

const sender = await prisma.user.findUnique({ where: { id: senderId } });
// Proceeds to debit spoofed senderId!
```

#### **Secure Defensive Control**
In Secure Mode, any client-provided `senderId` in the body is completely ignored. The sender identity is extracted exclusively from the cryptographically signed JWT cookie:

```typescript
// 🟢 SECURE MODE: Strict Object Authorization
// Ignore body.senderId entirely!
const senderId = payload.userId; // Extracted from verified JWT session cookie

const sender = await prisma.user.findUnique({ where: { id: senderId } });
```

---

### 4.2 Vulnerability #2: Race Condition & Non-Atomic Database Updates

#### **Vulnerable Code Pattern**
In Vulnerable Mode, debiting the sender and crediting the receiver are performed in separate, non-transactional database calls:

```typescript
// 🔴 VULNERABLE MODE: Non-Atomic Database Updates
// 1. Debit sender balance
await prisma.user.update({
  where: { id: sender.id },
  data: { balance: sender.balance - rawAmount },
});

// 2. Separate Credit receiver balance (Race condition window)
await prisma.user.update({
  where: { id: recipient.id },
  data: { balance: recipient.balance + rawAmount },
});
```

*Risk*: If multiple concurrent transfer requests execute simultaneously, read-modify-write race conditions lead to dirty reads, balance corruption, and double-spending.

#### **Secure Defensive Control**
In Secure Mode, database operations are executed atomically using Prisma's `$transaction` API:

```typescript
// 🟢 SECURE MODE: ACID Atomic Database Transaction
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
    data: { senderId, receiverId: recipient.id, amount, mode: 'SECURE', status: 'SUCCESS' },
  }),
]);
```

---

### 4.3 Vulnerability #3: Missing Input Validation (Negative Amount Hack)

#### **Vulnerable Code Pattern**
Vulnerable Mode fails to validate if `amount` is positive:

```typescript
// 🔴 VULNERABLE MODE: Negative Transfer
const rawAmount = Number(body.amount); // e.g., -500

const updatedSenderBalance = sender.balance - (-500); // Sender balance INCREASES +500!
const updatedReceiverBalance = recipient.balance + (-500); // Recipient balance DECREASES -500!
```

#### **Secure Defensive Control**
Secure Mode enforces strict schema validation using **Zod** and verifies sufficient wallet balance before executing the transfer:

```typescript
// 🟢 SECURE MODE: Zod Schema Validation & Balance Guard
const transferSchema = z.object({
  recipientIdentifier: z.string().min(1, 'Recipient is required'),
  amount: z.number().gt(0, 'Transfer amount must be positive and greater than zero'),
});

const validationResult = transferSchema.safeParse({ recipientIdentifier, amount });
if (!validationResult.success) {
  return NextResponse.json({ error: 'Validation Error', details: validationResult.error.errors }, { status: 400 });
}

if (sender.balance < amount) {
  return NextResponse.json({ error: 'Insufficient Funds' }, { status: 400 });
}
```

---

## 5. Database Schema & Data Modeling

The database schema (`prisma/schema.prisma`) defines two main entities: `User` and `Transaction`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                   String        @id @default(uuid())
  email                String        @unique
  username             String        @unique
  password             String
  balance              Float         @default(1000.0)
  sentTransactions     Transaction[] @relation("SentTransactions")
  receivedTransactions Transaction[] @relation("ReceivedTransactions")
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
}

model Transaction {
  id         String   @id @default(uuid())
  senderId   String
  sender     User     @relation("SentTransactions", fields: [senderId], references: [id])
  receiverId String
  receiver   User     @relation("ReceivedTransactions", fields: [receiverId], references: [id])
  amount     Float
  mode       String   @default("SECURE") // "VULNERABLE" or "SECURE"
  status     String   @default("SUCCESS") // "SUCCESS" or "FAILED"
  note       String?
  createdAt  DateTime @default(now())
}
```

---

## 6. API Route Specification

| Route Path | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | No | Creates new account with $1,000 starting balance; sets HTTP-only JWT cookie. |
| `/api/auth/login` | `POST` | No | Validates credentials via `bcryptjs`; sets HTTP-only JWT cookie. |
| `/api/auth/logout` | `POST` | Yes | Clears session cookie (`maxAge: 0`). |
| `/api/auth/me` | `GET` | Yes | Returns current authenticated user profile & balance. |
| `/api/seed` | `POST/GET` | No | Seeds test accounts (`alice`, `bob`, `attacker`) for instant grading evaluation. |
| `/api/users` | `GET` | Yes | Returns user directory for transfer recipient selection. |
| `/api/transfer` | `POST` | Yes | Core security endpoint; inspects `x-security-mode` header to route to Vulnerable vs Secure logic. |
| `/api/transactions` | `GET` | Yes | Returns transaction history for logged-in user with security mode badges. |

---

## 7. Security Test Cases & Verification Results

| Test ID | Test Scenario | Execution Vector | Vulnerable Mode Result | Secure Mode Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | BOLA Impersonation | `POST /api/transfer` with `{ senderId: victim_id, amount: 250 }` | **200 OK**: $250 debited from victim account. | **200 OK**: `senderId` ignored; debited strictly from authenticated user. | **PASS** |
| **TC-02** | Negative Transfer Hack | `POST /api/transfer` with `{ amount: -500 }` | **200 OK**: Sender balance increased by +$500. | **400 Bad Request**: "Transfer amount must be positive". | **PASS** |
| **TC-03** | Race Condition Test | 5 concurrent async `POST /api/transfer` requests ($100 each) | **Inconsistent State**: Non-atomic updates cause race condition. | **200 OK**: Atomic `prisma.$transaction` guarantees consistency. | **PASS** |
| **TC-04** | Self Transfer Guard | `POST /api/transfer` to own username | Allowed in vulnerable mode. | **400 Bad Request**: "Cannot transfer funds to your own account". | **PASS** |
| **TC-05** | Insufficient Funds | `POST /api/transfer` with amount > balance | Allows balance to become negative. | **400 Bad Request**: "Insufficient Funds". | **PASS** |

---

## 8. Deployment & DevOps Strategy

- **Source Control**: Git with a 3-day history timeline authored by `Hamza Hayat <mmhhmalik@gmail.com>`.
- **Hosting Platform**: Vercel Serverless Functions.
- **Database Service**: Neon PostgreSQL (Serverless Postgres with connection pooling).
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string.
  - `JWT_SECRET`: HS256 secret signing key.

---

## 9. Conclusion

The **VaultShield Pay** fintech wallet successfully fulfills all functional and security demonstration requirements set forth in the CY-5004 assignment rubric. By isolating security controls behind the `x-security-mode` header and providing a built-in 1-click Exploit Simulator, the application serves as a comprehensive educational and audit-ready demonstration of modern secure software design principles.

---
*Report Generated for FAST CY-5004 Secure Software Design Assignment Submission.*
