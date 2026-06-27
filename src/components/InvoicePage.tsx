/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice, Order, Client, OrderItem, Article, Payment, PaymentMode, BusinessInfo } from '../types';
import { Search, Filter, Printer, CreditCard, ChevronRight, ArrowDown, ShieldAlert, Plus, Check, DollarSign } from 'lucide-react';
import { generateId } from '../db';

interface InvoicePageProps {
  invoices: Invoice[];
  orders: Order[];
  clients: Client[];
  orderItems: OrderItem[];
  articles: Article[];
  payments: Payment[];
  businessInfo: BusinessInfo;
  onAddPayment: (payment: Payment) => void;
  onUpdateInvoice: (updatedInvoice: Invoice) => void;
}

export default function InvoicePage({
  invoices,
  orders,
  clients,
  orderItems,
  articles,
  payments,
  businessInfo,
  onAddPayment,
  onUpdateInvoice,
}: InvoicePageProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(invoices[0]?.id || null);

  // Partial Payment Form States
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('upi');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');

  // Discount & GST tuning states
  const [editDiscountType, setEditDiscountType] = useState<'percent' | 'flat'>('flat');
  const [editDiscountVal, setEditDiscountVal] = useState('0');
  const [gstApplied, setGstApplied] = useState(true);

  const getInvoiceTotalPayments = (invId: string) => {
    return payments
      .filter(p => p.invoice_id === invId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.shop_name || 'Generic Client';
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const order = orders.find(o => o.id === inv.order_id);
    const clientName = order ? getClientName(order.client_id).toLowerCase() : '';
    const invoiceNo = inv.invoice_number.toLowerCase();

    const matchesSearch = clientName.includes(search.toLowerCase()) || invoiceNo.includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];
  const activeOrder = activeInvoice ? orders.find(o => o.id === activeInvoice.order_id) : null;
  const activeClient = activeOrder ? clients.find(c => c.id === activeOrder.client_id) : null;
  const activeItems = activeInvoice ? orderItems.filter(i => i.order_id === activeInvoice.order_id) : [];
  const activePayments = activeInvoice ? payments.filter(p => p.invoice_id === activeInvoice.id) : [];

  const activePaidTotal = activeInvoice ? getInvoiceTotalPayments(activeInvoice.id) : 0;
  const activeBalance = activeInvoice ? Math.max(0, activeInvoice.total_amount - activePaidTotal) : 0;

  // Recalculate invoice details
  const applyTuning = (discVal: number, discType: 'percent' | 'flat', useGst: boolean) => {
    if (!activeInvoice) return;

    const sub = activeInvoice.subtotal;
    let discount = discVal;
    if (discType === 'percent') {
      discount = (sub * discVal) / 100;
    }

    const taxedBase = Math.max(0, sub - discount);
    const gstPercent = useGst ? 18 : 0;
    const total = taxedBase + (taxedBase * gstPercent) / 100;

    const updated: Invoice = {
      ...activeInvoice,
      discount_amount: discount,
      gst_percent: gstPercent,
      total_amount: Math.round(total),
      status: activePaidTotal >= total ? 'paid' : activePaidTotal > 0 ? 'partial' : 'sent',
    };

    onUpdateInvoice(updated);
  };

  // Payment Recording
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const amountNum = Number(payAmount);

    // Business Rule Check: "Payment amount cannot exceed invoice balance"
    if (amountNum > activeBalance) {
      alert(`Amount exceeds outstanding balance! Maximum payable amount is ₹${activeBalance.toLocaleString('en-IN')}`);
      return;
    }

    const payment: Payment = {
      id: generateId('pay-'),
      invoice_id: activeInvoice.id,
      amount: amountNum,
      payment_date: payDate,
      mode: payMode,
      reference_number: payRef,
      recorded_by: 'John Sales',
      notes: payNotes,
    };

    onAddPayment(payment);

    // Update invoice status based on new totals
    const newPaidTotal = activePaidTotal + amountNum;
    const isPaidFully = newPaidTotal >= activeInvoice.total_amount;

    const updatedInvoice: Invoice = {
      ...activeInvoice,
      status: isPaidFully ? 'paid' : 'partial',
    };
    onUpdateInvoice(updatedInvoice);

    // Reset Form
    setShowPaymentForm(false);
    setPayAmount('');
    setPayRef('');
    setPayNotes('');
  };

  // Printable simulation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Invoicing & Payment Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage partial client payments, customize billing discounts, and retrieve print-friendly bills.
          </p>
        </div>
      </div>

      {/* Main Grid Double Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Invoice Listing Directory */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Quick Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 text-xs">
            {/* Search */}
            <input
              type="text"
              placeholder="Search Invoice No or Shop Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
            />
            
            {/* Status Select */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
            >
              <option value="all">All Invoices</option>
              <option value="draft">Drafts</option>
              <option value="sent">Sent / Pending</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue Alerts</option>
            </select>
          </div>

          {/* List items */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs">No matching invoices found.</p>
            ) : (
              filteredInvoices.map(inv => {
                const order = orders.find(o => o.id === inv.order_id);
                const clientName = order ? getClientName(order.client_id) : 'Generic';
                const isActive = selectedInvoiceId === inv.id;
                const paid = getInvoiceTotalPayments(inv.id);
                const outstanding = Math.max(0, inv.total_amount - paid);

                return (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setGstApplied(inv.gst_percent > 0);
                      setEditDiscountVal('0');
                    }}
                    className={`w-full text-left p-4 hover:bg-slate-50/40 transition flex justify-between items-start cursor-pointer ${
                      isActive ? 'bg-slate-50 border-r-4 border-slate-900' : ''
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 text-xs block">{inv.invoice_number}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{clientName} • Due: {inv.due_date}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded block text-center mb-1 ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                      <span className="font-mono font-bold text-slate-700 block">₹{inv.total_amount.toLocaleString('en-IN')}</span>
                      {outstanding > 0 && (
                        <span className="text-[9px] text-red-500 font-bold block mt-0.5">Bal: ₹{outstanding.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Printable/Detail Layout */}
        <div className="lg:col-span-2 space-y-6">
          {activeInvoice ? (
            <div className="space-y-6">

              {/* TUNING CONTROLS FOR DISCOUNT / TAX INVOICE */}
              {activeInvoice.status !== 'paid' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
                  <h4 className="font-display font-bold text-slate-800 text-sm">Invoice Configuration Controls</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    
                    {/* Discount Type */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Type</label>
                      <select
                        value={editDiscountType}
                        onChange={e => setEditDiscountType(e.target.value as 'percent' | 'flat')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5"
                      >
                        <option value="flat">Flat Value (₹)</option>
                        <option value="percent">Percent Off (%)</option>
                      </select>
                    </div>

                    {/* Discount Value */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Deduction</label>
                      <input
                        type="number"
                        min="0"
                        value={editDiscountVal}
                        onChange={e => setEditDiscountVal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono"
                      />
                    </div>

                    {/* GST toggle */}
                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="gst_toggle"
                        checked={gstApplied}
                        onChange={e => setGstApplied(e.target.checked)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-400 border-slate-300"
                      />
                      <label htmlFor="gst_toggle" className="text-slate-700 font-semibold cursor-pointer">
                        Apply 18% B2B GST Tax
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => applyTuning(Number(editDiscountVal), editDiscountType, gstApplied)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    Recalculate & Apply Configuration
                  </button>
                </div>
              )}

              {/* OUTSTANDING ALERTS & PAYMENTS LOG ACTION CARD */}
              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm ring-2 ring-emerald-400/10 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accounts Outstanding Balance</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <strong className="text-2xl font-mono text-slate-800 font-extrabold">₹{activeBalance.toLocaleString('en-IN')}</strong>
                    <span className="text-slate-400 text-xs font-medium">due from ₹{activeInvoice.total_amount.toLocaleString('en-IN')} total</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Total partial payments collected: ₹{activePaidTotal.toLocaleString('en-IN')}</p>
                </div>

                {activeBalance > 0 ? (
                  <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Payment Receipt</span>
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Fully Paid Up
                  </span>
                )}
              </div>

              {/* RECORD PAYMENT FORM POPUP/COLLAPSIBLE */}
              {showPaymentForm && (
                <form onSubmit={handleRecordPayment} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 text-xs">
                  <h4 className="font-display font-bold text-slate-800 text-sm">Add Partial Payment Entry</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Amount Received *</label>
                      <input
                        type="number"
                        min="1"
                        max={activeBalance}
                        required
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder={`Max: ₹${activeBalance}`}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</label>
                      <select
                        value={payMode}
                        onChange={e => setPayMode(e.target.value as PaymentMode)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-semibold"
                      >
                        <option value="upi">UPI / GPay / PhonePe</option>
                        <option value="bank_transfer">Net Banking / Transfer</option>
                        <option value="cash">Hard Cash Receipt</option>
                        <option value="cheque">Bank Cheque</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Reference ID / Txn No</label>
                      <input
                        type="text"
                        placeholder="e.g. TXN9988221"
                        value={payRef}
                        onChange={e => setPayRef(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Receipt Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Received advance payment for trophies"
                      value={payNotes}
                      onChange={e => setPayNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5"
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3.5 py-1.5 bg-slate-200 text-slate-600 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                    >
                      Save Receipt Entry
                    </button>
                  </div>
                </form>
              )}

              {/* THE WRAPPED PRINTABLE INVOICE SHEET */}
              <div id="printable-tax-invoice" className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 relative space-y-6">
                
                {/* Printable Header actions */}
                <div className="absolute right-4 top-4 print:hidden">
                  <button
                    onClick={handlePrint}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition border border-slate-100 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Printer className="w-4 h-4" /> Print / PDF
                  </button>
                </div>

                {/* Company & Invoice info */}
                <div className="flex flex-wrap justify-between gap-6 pb-6 border-b border-slate-100">
                  <div>
                    <h1 className="font-display font-extrabold text-slate-800 text-xl flex items-center gap-2">
                      <span>🏆 {businessInfo.name}</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-wider">OFFICIAL B2B TAX INVOICE</p>
                    <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">{businessInfo.address}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">GSTIN: {businessInfo.gst_number}</p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">INVOICE NUMBER</span>
                    <strong className="text-slate-800 font-mono font-extrabold text-base block mt-0.5">{activeInvoice.invoice_number}</strong>
                    
                    <div className="mt-4 space-y-1">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Invoice Date</span>
                        <strong className="text-slate-700 font-mono">{activeInvoice.invoice_date}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Payment Due Date</span>
                        <strong className="text-slate-700 font-mono">{activeInvoice.due_date}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address and Delivery Address details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Billed To (B2B Client)</span>
                    <strong className="text-slate-800 text-sm font-semibold block">{activeClient?.shop_name}</strong>
                    <p>{activeClient?.owner_name}</p>
                    <p>{activeClient?.phone}</p>
                    {activeClient?.gst_number && <p className="font-mono mt-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded inline-block">GST: {activeClient.gst_number}</p>}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Consignee Delivery Location</span>
                    <p className="font-medium text-slate-800">{activeClient?.address || 'No direct logistics address saved.'}</p>
                    {activeOrder?.special_instructions && (
                      <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-100/40">
                        * Special Instructions: "{activeOrder.special_instructions}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-widest">Billable Items Breakdown</span>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                        <th className="px-3 py-2.5">Article Specifics</th>
                        <th className="px-3 py-2.5 text-right">Unit Price</th>
                        <th className="px-3 py-2.5 text-center">Qty Packed</th>
                        <th className="px-3 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeItems.map(item => {
                        const art = articles.find(a => a.id === item.article_id);
                        // Subtotal based on packed quantity (since we bill what is actually dispatched!)
                        const qty = item.quantity_packed || item.quantity_ordered;
                        const sub = qty * item.unit_price;

                        return (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="px-3 py-3">
                              <span className="font-semibold text-slate-800">{art?.name || 'Custom Article'}</span>
                              {item.custom_text && <span className="text-[10px] text-slate-400 block mt-0.5">Engrave: "{item.custom_text}"</span>}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-slate-600">₹{item.unit_price.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-center font-mono text-slate-700">{qty} pcs</td>
                            <td className="px-3 py-3 text-right font-mono text-slate-800 font-semibold">₹{sub.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="border-t border-slate-100 pt-4 flex flex-col items-end space-y-1.5 text-xs">
                  <div className="w-64 space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span className="font-mono text-slate-800">₹{activeInvoice.subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {activeInvoice.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount Deduction:</span>
                        <span className="font-mono font-semibold">-₹{activeInvoice.discount_amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>B2B GST Tax ({activeInvoice.gst_percent}%):</span>
                      <span className="font-mono text-slate-800">₹{((activeInvoice.subtotal - activeInvoice.discount_amount) * (activeInvoice.gst_percent / 100)).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-950 text-sm">
                      <span>Total Tax-Paid Bill:</span>
                      <span className="font-mono text-slate-900 font-extrabold">₹{activeInvoice.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* PAYMENTS HISTORY SECTION IN THE INVOICE SHEET */}
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Payment Receipts Ledger</span>
                  
                  {activePayments.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No receipts recorded for this ledger.</p>
                  ) : (
                    <div className="space-y-2">
                      {activePayments.map(p => (
                        <div key={p.id} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center text-slate-600">
                          <div>
                            <strong>₹{p.amount.toLocaleString('en-IN')}</strong> via <span className="uppercase font-semibold">{p.mode}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Ref: {p.reference_number || 'N/A'} • {p.payment_date}</span>
                          </div>
                          {p.notes && <span className="text-[10px] italic text-slate-500 max-w-xs text-right">"{p.notes}"</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
              <p className="text-slate-400 text-xs">Please generate billing statements inside order details first.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
