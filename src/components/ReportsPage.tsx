/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, Invoice, Payment, Client, OrderItem, Article } from '../types';
import { TrendingUp, Award, DollarSign, BarChart3, AlertTriangle, Users } from 'lucide-react';

interface ReportsPageProps {
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  clients: Client[];
  orderItems: OrderItem[];
  articles: Article[];
}

export default function ReportsPage({
  orders,
  invoices,
  payments,
  clients,
  orderItems,
  articles,
}: ReportsPageProps) {

  // 1. STATS CALCULATION
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
  const recoveryRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  // 2. ORDER VOLUMES BY STATUS
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. TOP CLIENTS BY VALUE
  const clientSpending = clients.map(c => {
    const clientOrders = orders.filter(o => o.client_id === c.id && o.status !== 'cancelled');
    const spent = clientOrders.reduce((total, ord) => {
      const items = orderItems.filter(i => i.order_id === ord.id);
      return total + items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_price, 0);
    }, 0);
    return { name: c.shop_name, spent };
  }).sort((a, b) => b.spent - a.spent);

  // 4. PRODUCTION BACKLOG AND COMPLETED COUNTS
  const totalManufactureGapNeeded = orderItems.reduce((sum, i) => sum + i.quantity_to_produce, 0);
  const totalManufacturedDone = orderItems.reduce((sum, i) => sum + i.quantity_produced, 0);

  // 5. AGING OUTSTANDING PAYMENTS
  const agingList = invoices.map(inv => {
    const order = orders.find(o => o.id === inv.order_id);
    const client = order ? clients.find(c => c.id === order.client_id) : null;
    const paid = payments.filter(p => p.invoice_id === inv.id).reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, inv.total_amount - paid);
    
    // Calculate days past due
    const dueDate = new Date(inv.due_date);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      invoice_number: inv.invoice_number,
      client_name: client?.shop_name || 'Walk-in Customer',
      outstanding,
      days_past: diffDays > 0 ? diffDays : 0,
    };
  }).filter(item => item.outstanding > 0).sort((a, b) => b.days_past - a.days_past);

  // Custom SVG Bar Chart calculation (Revenue Collected vs Invoiced)
  const maxBarValue = Math.max(totalInvoiced, totalCollected, 50000);
  const getBarHeight = (val: number) => {
    return `${(val / maxBarValue) * 120}px`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
          Executive Reports & Analytics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Review business health, cash conversion ratios, manufacturing yields, and accounts receivable.
        </p>
      </div>

      {/* Financial KPIs row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoiced Billing</span>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="w-5 h-5 text-slate-500" />
            <strong className="text-xl font-mono text-slate-800 font-bold">₹{totalInvoiced.toLocaleString('en-IN')}</strong>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Full receivables generated</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash Collected</span>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <strong className="text-xl font-mono text-slate-800 font-bold">₹{totalCollected.toLocaleString('en-IN')}</strong>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">{recoveryRate.toFixed(1)}% collections conversion</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Receivables</span>
          <div className="flex items-center gap-2 mt-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <strong className="text-xl font-mono text-red-600 font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</strong>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Outstanding client accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders Registered</span>
          <div className="flex items-center gap-2 mt-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <strong className="text-xl font-mono text-slate-800 font-bold">{orders.length}</strong>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Custom client bookings</span>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Revenue Collected vs Invoiced */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-base tracking-tight">
            Revenue Collections & Recoveries
          </h3>
          <p className="text-xs text-slate-500">Visual comparison between gross invoiced tax values versus actual collected receipts.</p>

          <div className="h-48 flex items-end justify-center gap-12 border-b border-slate-100 pb-2">
            
            {/* Invoiced Bar */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700">₹{totalInvoiced.toLocaleString('en-IN')}</span>
              <div
                className="w-16 bg-slate-300 rounded-t-xl transition-all duration-700 hover:bg-slate-400"
                style={{ height: getBarHeight(totalInvoiced) }}
              ></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Invoiced</span>
            </div>

            {/* Collected Bar */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-600">₹{totalCollected.toLocaleString('en-IN')}</span>
              <div
                className="w-16 bg-emerald-500 rounded-t-xl transition-all duration-700 hover:bg-emerald-600"
                style={{ height: getBarHeight(totalCollected) }}
              ></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Collections Receipt</span>
            </div>

            {/* Outstanding Bar */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-600">₹{totalOutstanding.toLocaleString('en-IN')}</span>
              <div
                className="w-16 bg-amber-500 rounded-t-xl transition-all duration-700 hover:bg-amber-600"
                style={{ height: getBarHeight(totalOutstanding) }}
              ></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase font-semibold">Balance Due</span>
            </div>

          </div>
        </div>

        {/* Chart 2: Top Clients Spent */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-base tracking-tight">
            Top B2B Client Lifespent Accounts
          </h3>
          <p className="text-xs text-slate-500">Top business partners based on gross dispatched / design approved order values.</p>

          <div className="space-y-4">
            {clientSpending.slice(0, 4).map((c, idx) => {
              const maxSpent = clientSpending[0]?.spent || 1;
              const widthPct = `${(c.spent / maxSpent) * 100}%`;

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{idx + 1}. {c.name}</span>
                    <span className="font-mono text-slate-900">₹{c.spent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full rounded-full" style={{ width: widthPct }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Outstanding aging list (Aging report) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-base tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
            <span>Accounts Receivable Aging Analysis</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time aging lists. Tracks the number of days outstanding bills are past their payment due dates.
          </p>

          {agingList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Excellent! No accounts receivable balances are currently due.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden">
              {agingList.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <strong className="font-mono text-slate-800">{item.invoice_number}</strong>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{item.client_name}</div>
                  </div>
                  <div className="text-right">
                    <strong className="font-mono text-red-600 block">₹{item.outstanding.toLocaleString('en-IN')}</strong>
                    <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 inline-block mt-1 ${
                      item.days_past > 10 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.days_past === 0 ? 'Due Today' : `${item.days_past} Days past due`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manufacturing yield and pipeline status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-base tracking-tight flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-indigo-500" />
            <span>Custom Manufacturing Pipelines</span>
          </h3>
          <p className="text-xs text-slate-500">
            Yield rates and total quantities of trophies/medals assembled against Store stock checks.
          </p>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Articles Manufactured</span>
              <strong className="text-2xl font-mono text-slate-800 font-extrabold mt-1 block">{totalManufacturedDone}</strong>
              <span className="text-[10px] text-slate-400">Total units processed</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Gap Requirements</span>
              <strong className="text-2xl font-mono text-indigo-600 font-extrabold mt-1 block">{totalManufactureGapNeeded}</strong>
              <span className="text-[10px] text-slate-400">Total gaps routed to Production</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Overall Production Yield:</span>
              <strong className="font-mono text-slate-800">
                {totalManufactureGapNeeded > 0 ? ((totalManufacturedDone / totalManufactureGapNeeded) * 100).toFixed(0) : 100}%
              </strong>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${totalManufactureGapNeeded > 0 ? (totalManufacturedDone / totalManufactureGapNeeded) * 100 : 100}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
