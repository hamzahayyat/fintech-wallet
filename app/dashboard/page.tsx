'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { TabType } from '@/components/Sidebar';
import Header from '@/components/Header';
import ExploitPlayground from '@/components/ExploitPlayground';
import { useSecurityMode } from '@/context/SecurityModeContext';
import {
  Wallet,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Search,
  UserCheck,
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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [user, setUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Transfer Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transferring, setTransferring] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }

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
        text: `Transferred $${parseFloat(amount).toFixed(2)} to ${recipient} (${data.mode} Mode)`,
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
      <div className="min-h-screen bg-[#131722] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const isSecure = securityMode === 'secure';

  const totalSent = transactions
    .filter((tx) => tx.senderId === user?.id)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalReceived = transactions
    .filter((tx) => tx.receiverId === user?.id)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    return (
      tx.sender.username.toLowerCase().includes(q) ||
      tx.receiver.username.toLowerCase().includes(q) ||
      tx.mode.toLowerCase().includes(q) ||
      tx.amount.toString().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#131722] text-white flex">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Balance Card */}
                <div className="bg-[#c5f946] text-slate-950 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Total Wallet Balance
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-950/10 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-slate-950" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight mb-2">
                    ${user?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800">Available Balance</p>
                </div>

                {/* Total Sent Card */}
                <div className="bg-[#1e2330] border border-[#2a3142] rounded-2xl p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total Sent
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight mb-2">
                    ${totalSent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Debited Transfers</p>
                </div>

                {/* Total Received Card */}
                <div className="bg-[#1e2330] border border-[#2a3142] rounded-2xl p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total Received
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight mb-2">
                    ${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400">Credited Deposits</p>
                </div>
              </div>

              {/* Transfer Form */}
              <div className="bg-[#1e2330] border border-[#2a3142] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-400" />
                    Send Money
                  </h3>
                  <span className="text-xs text-slate-400">
                    Mode: <strong className={isSecure ? 'text-emerald-400' : 'text-red-400'}>{securityMode.toUpperCase()}</strong>
                  </span>
                </div>

                {transferMsg && (
                  <div
                    className={`mb-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      transferMsg.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
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
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Recipient Username or Email
                    </label>
                    <input
                      type="text"
                      required
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. bob or alice@fast.edu"
                      className="w-full bg-[#181c27] border border-[#2a3142] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Amount ($ USD)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100.00"
                      className="w-full bg-[#181c27] border border-[#2a3142] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={transferring}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {transferring ? 'Processing...' : 'Send Money'}
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: WALLET */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div className="bg-[#1e2330] border border-[#2a3142] rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#181c27] border border-[#2a3142] rounded-xl">
                    <p className="text-slate-400 mb-1">Account Holder</p>
                    <p className="text-base font-bold text-white">{user?.username}</p>
                    <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
                  </div>

                  <div className="p-4 bg-[#181c27] border border-[#2a3142] rounded-xl">
                    <p className="text-slate-400 mb-1">Current Balance</p>
                    <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                      ${user?.balance.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Available for transfers</p>
                  </div>

                  <div className="p-4 bg-[#181c27] border border-[#2a3142] rounded-xl">
                    <p className="text-slate-400 mb-1">Account ID</p>
                    <p className="font-mono text-xs text-slate-200">{user?.id}</p>
                  </div>

                  <div className="p-4 bg-[#181c27] border border-[#2a3142] rounded-xl">
                    <p className="text-slate-400 mb-1">Account Status</p>
                    <p className="text-xs font-bold text-blue-400">Active & Verified</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="bg-[#1e2330] border border-[#2a3142] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Transaction History</h3>
                  <p className="text-xs text-slate-400">{transactions.length} total records</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full bg-[#181c27] border border-[#2a3142] text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No transactions found matching your search.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#2a3142] text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Type</th>
                        <th className="pb-3">Sender</th>
                        <th className="pb-3">Receiver</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Mode</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3 pr-2">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3142] font-mono text-xs">
                      {filteredTransactions.map((tx) => {
                        const isSender = tx.senderId === user?.id;
                        return (
                          <tr key={tx.id} className="hover:bg-[#252b3b] transition">
                            <td className="py-3.5 pl-2">
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
                            <td className="py-3.5 text-slate-200">
                              {tx.sender.username}
                            </td>
                            <td className="py-3.5 text-slate-200">
                              {tx.receiver.username}
                            </td>
                            <td className="py-3.5 font-bold text-white">
                              ${tx.amount.toFixed(2)}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  tx.mode === 'SECURE'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {tx.mode}
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-400 text-[11px]">
                              {new Date(tx.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3.5 pr-2 text-slate-400 text-[11px]">
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
          )}

          {/* TAB 4: EXPLOIT TESTS */}
          {activeTab === 'exploits' && user && (
            <ExploitPlayground
              currentUser={user}
              allUsers={allUsers}
              onRefresh={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
