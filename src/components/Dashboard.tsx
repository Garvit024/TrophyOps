/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Order, OrderItem, Article, Client, Invoice, Payment, OrderLog } from '../types';
import {
  TrendingUp,
  Clock,
  Package,
  Wrench,
  Palette,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  DollarSign,
  Users,
  Layers,
  History
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  orders: Order[];
  orderItems: OrderItem[];
  articles: Article[];
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
  logs: OrderLog[];
  onNavigate: (tab: string, arg?: string) => void;
  onSetFilterStatus?: (status: string) => void;
}

export default function Dashboard({
  currentUser,
  orders,
  orderItems,
  articles,
  clients,
  invoices,
  payments,
  logs,
  onNavigate,
  onSetFilterStatus,
}: DashboardProps) {

  // Helper values
  const totalOrdersCount = orders.length;
  const pendingStoreChecksCount = orders.filter(o => o.status === 'received' || o.status === 'inventory_check').length;
  const activeProductionCount = orders.filter(o => o.status === 'in_production').length;
  const awaitingDesignCount = orders.filter(o => o.status === 'design_in_progress' || o.status === 'production_done').length;
  const readyToPackCount = orders.filter(o => o.status === 'design_approved' || o.status === 'packing').length;
  const dispatchedCount = orders.filter(o => o.status === 'dispatched').length;

  const lowStockArticles = articles.filter(a => a.stock_qty <= a.min_stock_alert && a.is_active);
  const outOfStockCount = articles.filter(a => a.stock_qty === 0 && a.is_active).length;

  // Outstanding calculation
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalReceived = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const outstandingAmount = Math.max(0, totalInvoiced - totalReceived);

  // Stats for Admin
  const totalClientSpent = clients.map(c => {
    const clientInvoices = invoices.filter(inv => {
      const ord = orders.find(o => o.id === inv.order_id);
      return ord && ord.client_id === c.id;
    });
    const total = clientInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    return { name: c.shop_name, total };
  }).sort((a, b) => b.total - a.total).slice(0, 3);

  // Render different dashboards based on role
  const role = currentUser.role;

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Hello, {currentUser.name}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back to <span className="font-semibold text-slate-700">TrophyOps</span>. Here's a summary of the operations in your department today.
          </p>
        </div>
        {role === 'sales' || role === 'admin' ? (
          <button
            onClick={() => onNavigate('new_order')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Order</span>
          </button>
        ) : null}
      </div>

      {/* ================= ADMIN / GENERAL STATS OVERVIEW ================= */}
      {(role === 'admin' || role === 'sales') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
              <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-slate-800 mt-2">
              ₹{totalInvoiced.toLocaleString('en-IN')}
            </p>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Across {invoices.length} billing records
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payments Collected</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-slate-800 mt-2">
              ₹{totalReceived.toLocaleString('en-IN')}
            </p>
            <div className="text-[11px] text-slate-500 mt-1">
              {((totalReceived / (totalInvoiced || 1)) * 100).toFixed(0)}% recovery rate
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Payments</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-red-600 mt-2">
              ₹{outstandingAmount.toLocaleString('en-IN')}
            </p>
            <div className="text-[11px] text-slate-500 mt-1">
              Pending client balance
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Client Count</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-slate-800 mt-2">
              {clients.length}
            </p>
            <div className="text-[11px] text-slate-500 mt-1">
              Registered business buyers
            </div>
          </div>
        </div>
      )}

      {/* ================= DEPARTMENT STATS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Role specific workflow focus */}
        <div className="lg:col-span-2 space-y-6">

          {/* STATUS GRID SUMMARY */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Current Orders by Stage</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div
                onClick={() => {
                  if (onSetFilterStatus) onSetFilterStatus('received');
                  onNavigate('orders');
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-amber-500 flex justify-center mb-1">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="font-mono text-xl font-bold text-slate-800">
                  {orders.filter(o => o.status === 'received').length}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Received</div>
              </div>

              <div
                onClick={() => {
                  if (onSetFilterStatus) onSetFilterStatus('inventory_check');
                  onNavigate('orders');
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-cyan-500 flex justify-center mb-1">
                  <Package className="w-5 h-5" />
                </div>
                <div className="font-mono text-xl font-bold text-slate-800">
                  {orders.filter(o => o.status === 'inventory_check').length}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Store Check</div>
              </div>

              <div
                onClick={() => {
                  if (onSetFilterStatus) onSetFilterStatus('in_production');
                  onNavigate('orders');
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-indigo-500 flex justify-center mb-1">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="font-mono text-xl font-bold text-slate-800">
                  {orders.filter(o => o.status === 'in_production' || o.status === 'production_done').length}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Production</div>
              </div>

              <div
                onClick={() => {
                  if (onSetFilterStatus) onSetFilterStatus('design_in_progress');
                  onNavigate('orders');
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-purple-500 flex justify-center mb-1">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="font-mono text-xl font-bold text-slate-800">
                  {orders.filter(o => o.status === 'design_in_progress' || o.status === 'design_approved').length}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Design</div>
              </div>

              <div
                onClick={() => {
                  if (onSetFilterStatus) onSetFilterStatus('packing');
                  onNavigate('orders');
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center col-span-2 sm:col-span-1 hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-emerald-500 flex justify-center mb-1">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="font-mono text-xl font-bold text-slate-800">
                  {orders.filter(o => o.status === 'packing').length}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Assembly</div>
              </div>
            </div>
          </div>

          {/* ROLE SPECIFIC COMPONENT OR BACKLOGS */}
          
          {/* SALES SPECIFIC VIEW */}
          {(role === 'sales' || role === 'admin') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight">
                  Outstanding Billing & Overdue Payments
                </h3>
                <button
                  onClick={() => onNavigate('invoices')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Invoices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {invoices.filter(inv => inv.status !== 'paid').length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Excellent! There are no outstanding payments due at the moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5">Invoice No</th>
                        <th className="py-2.5">Due Date</th>
                        <th className="py-2.5 text-right">Amount</th>
                        <th className="py-2.5 text-right">Outstanding</th>
                        <th className="py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices
                        .filter(inv => inv.status !== 'paid')
                        .map(inv => {
                          const order = orders.find(o => o.id === inv.order_id);
                          const client = order ? clients.find(c => c.id === order.client_id) : null;
                          const paidTotal = payments
                            .filter(p => p.invoice_id === inv.id)
                            .reduce((sum, p) => sum + p.amount, 0);
                          const balance = Math.max(0, inv.total_amount - paidTotal);
                          const isOverdue = new Date(inv.due_date) < new Date();

                          return (
                            <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-3 font-mono font-medium text-slate-700">
                                {inv.invoice_number}
                                <div className="text-[10px] text-slate-400 font-sans mt-0.5">{client?.shop_name || 'Generic Client'}</div>
                              </td>
                              <td className="py-3 text-slate-500 font-mono">
                                {inv.due_date}
                                {isOverdue && (
                                  <span className="ml-1.5 px-1 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold uppercase rounded">
                                    Overdue
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right font-mono text-slate-700">₹{inv.total_amount.toLocaleString('en-IN')}</td>
                              <td className="py-3 text-right font-mono text-red-600 font-semibold">₹{balance.toLocaleString('en-IN')}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                  inv.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {inv.status}
                                </span>
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

          {/* STORE SPECIFIC VIEW */}
          {(role === 'store' || role === 'admin') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight">
                  Pending Inventory Checks
                </h3>
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {orders.filter(o => o.status === 'received').length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No orders currently awaiting inventory check.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter(o => o.status === 'received')
                    .map(o => {
                      const client = clients.find(c => c.id === o.client_id);
                      const items = orderItems.filter(item => item.order_id === o.id);
                      return (
                        <div
                          key={o.id}
                          className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50 flex flex-wrap justify-between items-center gap-4 cursor-pointer"
                          onClick={() => onNavigate('orders', o.id)}
                        >
                          <div>
                            <div className="font-mono font-bold text-slate-800">{o.order_number}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{client?.shop_name} • {items.length} unique articles</div>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <span>Perform Stock Check</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* PRODUCTION SPECIFIC VIEW */}
          {(role === 'production' || role === 'admin') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight">
                  Articles to Manufacture Queue (Store Flagged Gaps)
                </h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium">
                  {orders.filter(o => o.status === 'in_production').length} active jobs
                </span>
              </div>

              {orders.filter(o => o.status === 'in_production').length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Excellent! No custom articles currently need to be manufactured.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter(o => o.status === 'in_production')
                    .map(o => {
                      const items = orderItems.filter(item => item.order_id === o.id && item.quantity_to_produce > 0);
                      return (
                        <div
                          key={o.id}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition cursor-pointer"
                          onClick={() => onNavigate('orders', o.id)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono font-bold text-slate-800">{o.order_number}</span>
                            <span className="text-[11px] text-slate-500 font-mono">Due: {o.expected_delivery_date}</span>
                          </div>
                          <div className="space-y-1.5 pl-3 border-l-2 border-indigo-400">
                            {items.map(item => {
                              const art = articles.find(a => a.id === item.article_id);
                              return (
                                <div key={item.id} className="text-xs text-slate-600 flex items-center justify-between">
                                  <span>{art?.name || 'Unknown'}</span>
                                  <strong className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                    Qty Needed: {item.quantity_to_produce}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                              Log Completed Quantities <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* DESIGN SPECIFIC VIEW */}
          {(role === 'design' || role === 'admin') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight">
                  Design & Customisation Pipeline
                </h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium">
                  {orders.filter(o => o.status === 'production_done' || o.status === 'design_in_progress').length} active designs
                </span>
              </div>

              {orders.filter(o => o.status === 'production_done' || o.status === 'design_in_progress').length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No custom engraving layouts waiting for designers.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter(o => o.status === 'production_done' || o.status === 'design_in_progress')
                    .map(o => {
                      const items = orderItems.filter(item => item.order_id === o.id);
                      return (
                        <div
                          key={o.id}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition cursor-pointer"
                          onClick={() => onNavigate('orders', o.id)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{o.order_number}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                o.status === 'production_done' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {o.status === 'production_done' ? 'Prod Done' : 'Designing'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">Expected: {o.expected_delivery_date}</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-2 line-clamp-2 italic bg-slate-100 p-2 rounded">
                            Brief: "{items.map(i => i.design_brief).filter(Boolean).join(' | ') || 'No specific text/design brief supplied'}"
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className="text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                              Upload Design & Approve <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* PACKING SPECIFIC VIEW */}
          {(role === 'packing' || role === 'admin') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight">
                  Fitting, Assembly & Dispatch Backlog
                </h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium">
                  {orders.filter(o => o.status === 'design_approved' || o.status === 'packing').length} packing items
                </span>
              </div>

              {orders.filter(o => o.status === 'design_approved' || o.status === 'packing').length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Excellent! No orders are currently waiting to be assembled or packed.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter(o => o.status === 'design_approved' || o.status === 'packing')
                    .map(o => {
                      const client = clients.find(c => c.id === o.client_id);
                      const items = orderItems.filter(item => item.order_id === o.id);
                      const totalQty = items.reduce((sum, i) => sum + i.quantity_ordered, 0);

                      return (
                        <div
                          key={o.id}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition cursor-pointer"
                          onClick={() => onNavigate('orders', o.id)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-mono font-bold text-slate-800">{o.order_number}</span>
                              <div className="text-[11px] text-slate-500">{client?.shop_name}</div>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">Expected: {o.expected_delivery_date}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-600">
                            <strong>Total items to pack:</strong> {totalQty} pieces
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              Open Packing Checklist <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right column: Action alerts, low stock warnings, logs */}
        <div className="space-y-6">
          
          {/* LOW STOCK ALERTS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              <span>Low Stock Alerts</span>
            </h3>

            {lowStockArticles.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-medium">
                ✅ All stock quantities above safety thresholds.
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockArticles.map(a => (
                  <div key={a.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition">
                    <div>
                      <div className="font-semibold text-slate-800">{a.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.article_code} • {a.category}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${a.stock_qty === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {a.stock_qty === 0 ? 'OUT OF STOCK' : `${a.stock_qty} left`}
                      </div>
                      <div className="text-[9px] text-slate-400">Min Alert: {a.min_stock_alert}</div>
                    </div>
                  </div>
                ))}
                {role === 'admin' && (
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  >
                    Adjust Article Stocks Manually
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RECENT SYSTEM LOGS / AUDIT TRAIL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-4 flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-slate-500" />
              <span>Recent Activity (Audit Log)</span>
            </h3>

            <div className="space-y-4">
              {logs.slice(0, 5).map(l => {
                const order = orders.find(o => o.id === l.order_id);
                return (
                  <div key={l.id} className="text-xs relative pl-4 border-l border-slate-100 pb-3 last:pb-0">
                    <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-slate-300"></span>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800">{l.changed_by}</strong>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      {order ? `${order.order_number}: ` : ''}
                      {l.notes}
                    </p>
                  </div>
                );
              })}

              <button
                onClick={() => onNavigate('orders')}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                View Full Audit Logs on Orders
              </button>
            </div>
          </div>

          {/* TOP CLIENTS WIDGET FOR ADMIN */}
          {role === 'admin' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-3">
                Top B2B Buyers This Month
              </h3>
              <div className="space-y-3">
                {totalClientSpent.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{item.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
