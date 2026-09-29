# Vercel Deployment & Setup Guide
## Mini Secure Fintech Wallet (FAST University CY-5004 Assignment)

This guide provides exact step-by-step instructions to deploy the **Mini Secure Fintech Wallet** to **Vercel** with a live **PostgreSQL** database using Prisma ORM.

---

### Prerequisites
- A [Vercel Account](https://vercel.com)
- A [GitHub Account](https://github.com)
- Git installed on your machine

---

### Step 1: Initialize Git & Push Code to GitHub

1. Open your terminal in the project directory:
   ```bash
   cd /Users/hamzahayat/.gemini/antigravity/scratch/mini-fintech-wallet
   ```

2. Initialize a Git repository and commit all files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Mini Secure Fintech Wallet for FAST CY-5004"
   ```

3. Create a new repository on GitHub named `mini-fintech-wallet`.

4. Link and push your local code:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/mini-fintech-wallet.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Import Project to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Select your `mini-fintech-wallet` GitHub repository and click **Import**.
4. In the Project Configuration screen:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `prisma generate && next build` (Already configured in `package.json`).

---

### Step 3: Attach Vercel Postgres Database

1. On the Vercel deployment setup page (or under your Project Settings -> **Storage** tab):
   - Click **Create Database** -> Select **Vercel Postgres** (powered by Neon).
   - Choose a region close to you and click **Create**.
2. Vercel will automatically add the environment variable `DATABASE_URL` (and `POSTGRES_URL`) to your Vercel Project Environment Variables.

3. Add your `JWT_SECRET` environment variable under **Settings -> Environment Variables**:
   - **Key**: `JWT_SECRET`
   - **Value**: `a-very-secure-secret-key-for-fast-university-cy5004`
   - Click **Save**.

---

### Step 4: Run Database Migration & Create Tables

Once your Vercel Postgres database is connected, you need to push the Prisma schema (`User` & `Transaction` tables) to the remote database:

Option A: **Using Vercel CLI (Recommended)**
```bash
# Link your local repo to your Vercel project
npx vercel link

# Pull environment variables from Vercel locally
npx vercel env pull .env.development.local

# Run Prisma schema push using Vercel DB credentials
npx prisma db push
```

Option B: **Using Local `.env` with Vercel Postgres Connection String**
1. Copy the `POSTGRES_URL` connection string from Vercel Storage settings into your local `.env` file as `DATABASE_URL`.
2. Run:
   ```bash
   npx prisma db push
   ```

---

### Step 5: Seed Initial Demo Accounts

After deploying and creating the database tables, seed the demo accounts by making a single POST or GET request to the `/api/seed` endpoint on your live Vercel app:

```bash
curl -X POST https://your-app-name.vercel.app/api/seed
```

Or simply open `https://your-app-name.vercel.app/login` in your web browser and click the **"Seed Accounts"** button!

This will populate:
- **Alice**: `alice@fast.edu` (Password: `password123`, Balance: `$1,000.00`)
- **Bob**: `bob@fast.edu` (Password: `password123`, Balance: `$1,000.00`)
- **Attacker**: `attacker@fast.edu` (Password: `password123`, Balance: `$250.00`)

---

### Step 6: Live Grading Demonstration Workflow

To demonstrate compliance with the CY-5004 rubric during presentation or submission:

1. **Toggle Switch**: Use the **Vulnerable Mode / Secure Mode** switch in the top Navbar.
2. **Demonstrate Flaw 1 (BOLA)**:
   - In **Vulnerable Mode**, select a victim ID from the *Exploit Playground* and click **"Test BOLA Exploit"**. Notice money is stolen from the victim account!
   - Switch to **Secure Mode** and click the same button. Notice it is blocked and strictly bound to the authenticated JWT session.
3. **Demonstrate Flaw 2 (Negative Amount)**:
   - In **Vulnerable Mode**, click **"Test Negative Transfer"** (-$500). Notice the sender's balance increases by +$500!
   - Switch to **Secure Mode** and repeat. Notice Zod validation blocks negative transfers with `400 Bad Request`.
4. **Demonstrate Flaw 3 (Race Condition / Non-Atomic DB Updates)**:
   - Click **"Test Race Condition"** to fire 5 parallel transfers. Observe non-transactional execution in Vulnerable Mode vs atomic `prisma.$transaction` in Secure Mode.
