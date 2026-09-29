'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import SecurityBanner from '@/components/SecurityBanner';
import ExploitPlayground from '@/components/ExploitPlayground';
import { useSecurityMode } from '@/context/SecurityModeContext';
import {
  Wallet,
  Send,
  History,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  username: string;
  balance: number;
}

interface TransactionItem {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  mode: string;
  status: string;
  note: string | null;
  createdAt: string;
  sender: { username: string; email: string };
  receiver: { username: string; email: string };
}

export default function DashboardPage() {
  const { securityMode, fetchWithSecurityMode } = useSecurityMode();
  const [user, setUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transferring, setTransferring] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Fetch me
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      // Fetch users list
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }

      // Fetch transactions
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferMsg(null);
    setTransferring(true);

    try {
      const res = await fetchWithSecurityMode('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIdentifier: recipient,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details?.join(', ') || 'Transfer failed');
      }

      setTransferMsg({
        type: 'success',
        text: `Successfully transferred $${parseFloat(amount).toFixed(2)} to ${recipient}! (${data.mode} Mode)`,
      });

      setAmount('');
      loadData();
    } catch (err: any) {
      setTransferMsg({
        type: 'error',
        text: err.message,
      });
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fintech-dark text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-medium text-gray-400">Loading Secure Fintech Wallet...</p>
        </div>
      </div>
    );
  }

  const isSecure = securityMode === 'secure';

  return (
    <div className="min-h-screen flex flex-col bg-fintech-dark text-white">
      <Navbar user={user} onRefresh={loadData} />
      <SecurityBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Grid: Balance & Transfer Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Wallet Balance Card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 via-fintech-card to-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet className="w-32 h-32 text-blue-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Available Wallet Balance
                </span>
                <button
                  onClick={loadData}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg transition"
                  title="Refresh Balance"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight mb-2">
                ${user?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div className="text-xs text-gray-400 font-mono flex items-center gap-2 mt-3">
                <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">Account ID:</span>
                <span>{user?.id.substring(0, 13)}...</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
              <div>
                <span>User: </span>
                <strong className="text-white">{user?.username}</strong>
              </div>
              <div>
                <span>Email: </span>
                <strong className="text-gray-300">{user?.email}</strong>
              </div>
            </div>
          </div>

          {/* Fund Transfer Module */}
          <div className="lg:col-span-2 bg-fintech-card border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-400" />
                  Transfer Funds
                </h2>
                <span className="text-xs font-mono text-gray-400">
                  Mode: <strong className={isSecure ? 'text-emerald-400' : 'text-red-400'}>{securityMode.toUpperCase()}</strong>
                </span>
              </div>

              {transferMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    transferMsg.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  {transferMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{transferMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Recipient (Username or Email)
                  </label>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. bob or bob@fast.edu"
                    className="w-full bg-fintech-dark border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full bg-fintech-dark border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={transferring}
                    className={`w-full py-3 px-4 font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                      isSecure
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                        : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white'
                    }`}
                  >
                    {transferring ? 'Processing Transfer...' : `Send Funds (${securityMode.toUpperCase()} Mode)`}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Security Exploit Simulator */}
        {user && (
          <ExploitPlayground
            currentUser={user}
            allUsers={allUsers}
            onRefresh={loadData}
          />
        )}

        {/* Transaction History Table */}
        <div className="bg-fintech-card border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Transaction History</h2>
            </div>
            <span className="text-xs text-gray-400">Total: {transactions.length} Records</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No transaction history recorded yet. Perform a fund transfer or exploit test above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Type</th>
                    <th className="pb-3">Sender</th>
                    <th className="pb-3">Receiver</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Mode</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 pr-2">Note / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {transactions.map((tx) => {
                    const isSender = tx.senderId === user?.id;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-800/30 transition">
                        <td className="py-3 pl-2">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              isSender ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {isSender ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                            {isSender ? 'DEBIT' : 'CREDIT'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-200">
                          {tx.sender.username} ({tx.sender.email})
                        </td>
                        <td className="py-3 text-gray-200">
                          {tx.receiver.username} ({tx.receiver.email})
                        </td>
                        <td className="py-3 font-bold text-white">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                              tx.mode === 'SECURE'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : 'bg-red-950/60 text-red-400 border-red-800'
                            }`}
                          >
                            {tx.mode}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 text-[11px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 pr-2 text-gray-400 text-[11px]">
                          {tx.note || tx.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
