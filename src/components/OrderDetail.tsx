/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Order,
  Client,
  OrderItem,
  Article,
  OrderLog,
  Invoice,
  Payment,
  OrderStatus,
  User,
  UserRole
} from '../types';
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Truck,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
  Upload,
  Check,
  CreditCard,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Palette,
  Hammer
} from 'lucide-react';
import { validateProductionStart, validatePackingQty, generateId } from '../db';

interface OrderDetailProps {
  orderId: string;
  orders: Order[];
  clients: Client[];
  orderItems: OrderItem[];
  articles: Article[];
  logs: OrderLog[];
  invoices: Invoice[];
  payments: Payment[];
  currentUser: User;
  onBack: () => void;
  onUpdateOrder: (updatedOrder: Order, items: OrderItem[], logMsg: string, logAction: string) => void;
  onGenerateInvoice: (orderId: string) => void;
  onNavigateToInvoice: (invoiceId: string) => void;
}

export default function OrderDetail({
  orderId,
  orders,
  clients,
  orderItems,
  articles,
  logs,
  invoices,
  payments,
  currentUser,
  onBack,
  onUpdateOrder,
  onGenerateInvoice,
  onNavigateToInvoice,
}: OrderDetailProps) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
        <p className="text-red-500 font-bold">Order not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl">Back</button>
      </div>
    );
  }

  const client = clients.find(c => c.id === order.client_id);
  const items = orderItems.filter(item => item.order_id === order.id);
  const orderLogs = logs.filter(log => log.order_id === order.id);
  const invoice = invoices.find(inv => inv.order_id === order.id);

  // Status index for timeline
  const STAGES: OrderStatus[] = [
    'received',
    'inventory_check',
    'in_production',
    'production_done',
    'design_in_progress',
    'design_approved',
    'packing',
    'dispatched',
  ];
  const currentStageIndex = STAGES.indexOf(order.status);

  // States for interactive forms
  // 1. Store stock check state
  const [storeInventory, setStoreInventory] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(item => {
      initial[item.id] = item.quantity_available_in_store || 0;
    });
    return initial;
  });

  // 2. Production quantity state
  const [prodQty, setProdQty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(item => {
      initial[item.id] = item.quantity_produced || 0;
    });
    return initial;
  });

  // 3. Design Upload State
  const [designBriefs, setDesignBriefs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    items.forEach(item => {
      initial[item.id] = item.design_brief || '';
    });
    return initial;
  });
  const [designFiles, setDesignFiles] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    items.forEach(item => {
      initial[item.id] = item.design_file_url || '';
    });
    return initial;
  });
  const [designDone, setDesignDone] = useState(false);

  // 4. Packing State
  const [packedQty, setPackedQty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(item => {
      initial[item.id] = item.quantity_packed || 0;
    });
    return initial;
  });
  const [packVarianceReason, setPackVarianceReason] = useState<Record<string, string>>({});
  const [packOverridden, setPackOverridden] = useState<Record<string, boolean>>({});

  // 5. Courier Details
  const [courierName, setCourierName] = useState(order.courier_name || '');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [dispatchPhoto, setDispatchPhoto] = useState('');

  // 6. Quantity Change State (for Sales / Admin)
  const [showQtyChangeModal, setShowQtyChangeModal] = useState(false);
  const [editQty, setEditQty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(item => {
      initial[item.id] = item.quantity_ordered;
    });
    return initial;
  });
  const [qtyChangeReason, setQtyChangeReason] = useState('');

  // 7. Cancellation State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Form Submission Handlers
  // A. STORE STOCK CONFIRMATION
  const handleStoreConfirm = () => {
    // Save stock levels
    const updatedItems = items.map(item => {
      const available = Number(storeInventory[item.id] || 0);
      const toProduce = Math.max(0, item.quantity_ordered - available);
      return {
        ...item,
        quantity_available_in_store: available,
        quantity_to_produce: toProduce,
      };
    });

    // Auto-calculate whether to bypass production
    const totalToProduce = updatedItems.reduce((sum, i) => sum + i.quantity_to_produce, 0);
    const nextStatus: OrderStatus = totalToProduce > 0 ? 'in_production' : 'design_in_progress';

    const logMsg = totalToProduce > 0
      ? `Stock audit submitted: Gap of ${totalToProduce} units flagged. Order routed to Production.`
      : `Stock audit submitted: All items found available in store. Production bypassed! Order routed to Design.`;

    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    onUpdateOrder(updatedOrder, updatedItems, logMsg, 'inventory_checked');
  };

  // B. PRODUCTION LOGGING
  const handleProductionConfirm = () => {
    const updatedItems = items.map(item => {
      const produced = Number(prodQty[item.id] || 0);
      return {
        ...item,
        quantity_produced: produced,
      };
    });

    // Check if fully produced
    const incomplete = updatedItems.some(i => i.quantity_produced < i.quantity_to_produce);
    if (incomplete) {
      alert('Production must log fully completed quantities (must be >= gap required) before completion.');
      return;
    }

    const updatedOrder: Order = {
      ...order,
      status: 'production_done',
      updated_at: new Date().toISOString(),
    };

    const totalProducedCount = updatedItems.reduce((sum, i) => sum + i.quantity_produced, 0);
    const logMsg = `Production completed: Manufactured ${totalProducedCount} required gap articles. Order routed to Design.`;

    onUpdateOrder(updatedOrder, updatedItems, logMsg, 'production_logged');
  };

  // C. DESIGN SUBMISSION
  const handleDesignConfirm = () => {
    const updatedItems = items.map(item => {
      return {
        ...item,
        design_brief: designBriefs[item.id] || '',
        design_file_url: designFiles[item.id] || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300', // default mock asset
      };
    });

    const updatedOrder: Order = {
      ...order,
      status: 'design_approved',
      updated_at: new Date().toISOString(),
    };

    const logMsg = `Customization design layouts uploaded and approved. Forwarded to Fitting/Packing.`;
    onUpdateOrder(updatedOrder, updatedItems, logMsg, 'design_approved');
  };

  // D. PACKING & ASSEMBLY
  const handlePackingConfirm = () => {
    let hasVarianceError = false;
    let hasVarianceNotesMissing = false;

    // Check packing quantity limits
    items.forEach(item => {
      const packed = Number(packedQty[item.id] || 0);
      const validation = validatePackingQty(item, packed, currentUser.role === 'admin' || packOverridden[item.id]);
      if (!validation.allowed) {
        hasVarianceError = true;
      }
      if (packed < item.quantity_ordered && !packVarianceReason[item.id]) {
        hasVarianceNotesMissing = true;
      }
    });

    if (hasVarianceError) {
      alert('Error: Some packed quantities exceed the ordered limits. Admin clearance/override is required.');
      return;
    }

    if (hasVarianceNotesMissing) {
      alert('Please provide a reason for the packing quantity variance (shortages).');
      return;
    }

    if (!courierName || !trackingNumber) {
      alert('Courier / Transport Details (Courier Name, Tracking Number) are mandatory to seal dispatch.');
      return;
    }

    // Update packed quantities and close out dispatch
    const updatedItems = items.map(item => ({
      ...item,
      quantity_packed: Number(packedQty[item.id] || 0),
      variance_reason: packVarianceReason[item.id] || '',
    }));

    const updatedOrder: Order = {
      ...order,
      status: 'dispatched',
      courier_name: courierName,
      tracking_number: trackingNumber,
      dispatch_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    // Calculate logs
    const packMsg = items.map(item => {
      const art = articles.find(a => a.id === item.article_id);
      const name = art ? art.name : 'Item';
      const packed = Number(packedQty[item.id] || 0);
      const reason = packVarianceReason[item.id] ? ` (Variance: ${packVarianceReason[item.id]})` : '';
      return `${name}: ${packed}/${item.quantity_ordered} packed${reason}`;
    }).join('; ');

    const logMsg = `Order packed and dispatched! Details: ${packMsg}. Courier: ${courierName}, Tracking: ${trackingNumber}`;

    onUpdateOrder(updatedOrder, updatedItems, logMsg, 'dispatched');
  };

  // E. SALES QUANTITY CHANGE RULE (Section 06 / 11)
  const handleQtyChangeConfirm = () => {
    if (!qtyChangeReason) {
      alert('A reason is mandatory for auditing mid-order quantity modifications.');
      return;
    }

    // Business Rule Check: "Quantity change on an order in production requires admin approval"
    if (order.status === 'in_production' && currentUser.role !== 'admin') {
      alert('Quantity changes for orders actively in Production requires Admin override approval.');
      return;
    }

    // Apply Qty Changes
    const updatedItems = items.map(item => {
      const newQty = Number(editQty[item.id] || 0);
      // Auto recalculate gap as well if store check already happened
      const storeAvailable = item.quantity_available_in_store || 0;
      const newToProduce = Math.max(0, newQty - storeAvailable);

      return {
        ...item,
        quantity_ordered: newQty,
        quantity_to_produce: newToProduce,
      };
    });

    const changeDetails = items.map(item => {
      const art = articles.find(a => a.id === item.article_id);
      const oldVal = item.quantity_ordered;
      const newVal = Number(editQty[item.id] || 0);
      return `${art ? art.name : 'Item'}: ${oldVal} ➔ ${newVal}`;
    }).join(', ');

    const logMsg = `⚠️ Quantity changed by ${currentUser.name}. Reason: ${qtyChangeReason}. Modifications: ${changeDetails}`;

    const updatedOrder: Order = {
      ...order,
      updated_at: new Date().toISOString(),
    };

    onUpdateOrder(updatedOrder, updatedItems, logMsg, 'qty_updated');
    setShowQtyChangeModal(false);
  };

  // F. CANCELLATION
  const handleCancelConfirm = () => {
    if (!cancelReason) {
      alert('Cancellation reason is required.');
      return;
    }

    const updatedOrder: Order = {
      ...order,
      status: 'cancelled',
      cancellation_reason: cancelReason,
      updated_at: new Date().toISOString(),
    };

    const logMsg = `❌ Order cancelled by ${currentUser.name}. Reason: ${cancelReason}`;
    onUpdateOrder(updatedOrder, items, logMsg, 'cancelled');
    setShowCancelModal(false);
  };

  // Quick helper to see if active role matches owner of current status
  const getStageOwner = (status: OrderStatus): UserRole => {
    switch (status) {
      case 'received': return 'store';
      case 'inventory_check': return 'store';
      case 'in_production': return 'production';
      case 'production_done': return 'design';
      case 'design_in_progress': return 'design';
      case 'design_approved': return 'packing';
      case 'packing': return 'packing';
      default: return 'admin';
    }
  };

  const isCurrentStatusActionable = () => {
    if (currentUser.role === 'admin') return true;
    const ownerRole = getStageOwner(order.status);
    return currentUser.role === ownerRole;
  };

  return (
    <div className="space-y-6">
      {/* Back & Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition bg-white px-3.5 py-2 border border-slate-100 rounded-xl shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center gap-2">
          {order.status !== 'dispatched' && order.status !== 'cancelled' && (currentUser.role === 'admin' || currentUser.role === 'sales') && (
            <>
              <button
                onClick={() => setShowQtyChangeModal(true)}
                className="px-3.5 py-2 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 text-xs font-semibold border border-slate-200 rounded-xl shadow-sm transition cursor-pointer"
              >
                Modify Quantities (Audit)
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-900 text-xs font-semibold border border-rose-100 rounded-xl shadow-sm transition cursor-pointer"
              >
                Cancel Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Order Card Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display font-extrabold text-slate-800 text-2xl tracking-tight">
                {order.order_number}
              </h2>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                order.status === 'dispatched' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                order.status === 'cancelled' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
              }`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              B2B Shop: <strong className="text-slate-700 font-medium">{client?.shop_name || 'Generic Client'}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-right border-r border-slate-100 pr-4">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Order Date</span>
              <strong className="text-slate-700 font-mono text-xs block mt-0.5">{order.order_date}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Expected Delivery</span>
              <strong className="text-slate-700 font-mono text-xs block mt-0.5">{order.expected_delivery_date}</strong>
            </div>
          </div>
        </div>

        {/* Visual Timeline Bar */}
        <div className="py-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Operations Status Timeline</h4>
          {order.status === 'cancelled' ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 text-sm">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong>Order Cancelled:</strong> {order.cancellation_reason || 'No reason logged.'}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -translate-y-1/2 z-0 hidden md:block"></div>
              <div
                className="absolute left-0 top-1/2 h-1 bg-slate-900 -translate-y-1/2 z-0 transition-all duration-500 hidden md:block"
                style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
              ></div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                {STAGES.map((st, idx) => {
                  const isActive = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  return (
                    <div key={st} className="flex md:flex-col items-center gap-2 bg-white md:px-2 py-1">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition duration-300 ${
                        isCurrent ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-4 ring-slate-100 scale-110' :
                        isActive ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-50 border-slate-100 text-slate-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold capitalize tracking-tight ${
                        isCurrent ? 'text-slate-900 font-semibold' : isActive ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        {st.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Order Items and Uploads */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Items Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-500" />
              <span>Line Items & Production Gaps</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Article Code / Name</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-center">Ordered Qty</th>
                    <th className="px-4 py-3 text-center bg-slate-100/50">Store Stock</th>
                    <th className="px-4 py-3 text-center">Mfg Gap</th>
                    <th className="px-4 py-3 text-center">Produced</th>
                    <th className="px-4 py-3 text-center">Packed</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const art = articles.find(a => a.id === item.article_id);
                    return (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-800 block">{art?.article_code || 'CODE'}</span>
                          <span className="text-slate-500 font-medium block mt-0.5">{art?.name || 'Unknown Article'}</span>
                          {item.custom_text && (
                            <div className="text-[10px] text-slate-400 mt-1 italic">
                              Engraving Text: "{item.custom_text}"
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          ₹{item.unit_price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                          {item.quantity_ordered}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-700 bg-slate-50">
                          {order.status === 'received' || order.status === 'inventory_check' ? (
                            <span className="text-slate-400 italic">Unchecked</span>
                          ) : (
                            item.quantity_available_in_store
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-indigo-600 font-bold">
                          {order.status === 'received' || order.status === 'inventory_check' ? (
                            <span className="text-slate-400 font-normal italic">Pending</span>
                          ) : (
                            item.quantity_to_produce
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-700">
                          {item.quantity_produced}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-emerald-600 font-bold">
                          {item.quantity_packed}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departmental Intercommunication & Dispatch Reconciliation Report */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                <span>Interdepartmental Operations & Dispatch Reconciliation</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                Anti-Overproduction Safeguard Active
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This panel provides instant transparency across the <strong>Store, Production, Design, and Packing</strong> departments.
              By strictly binding production requirements to the physical inventory gap (Ordered minus Store Stock), it prevents manufacturing surplus articles. It also provides an auditable tracking record of what actual quantity is loaded and shipped at final dispatch, automatically updating the invoice calculations.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-3 py-2">Article Spec</th>
                    <th className="px-3 py-2 text-center">1. Ordered</th>
                    <th className="px-3 py-2 text-center">2. Store Stock</th>
                    <th className="px-3 py-2 text-center">3. Mfg Gap</th>
                    <th className="px-3 py-2 text-center">4. Produced</th>
                    <th className="px-3 py-2 text-center">5. Dispatched</th>
                    <th className="px-3 py-2 text-center">Variance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const art = articles.find(a => a.id === item.article_id);
                    const storeStock = order.status === 'received' || order.status === 'inventory_check' ? 0 : (item.quantity_available_in_store || 0);
                    const mfgGap = order.status === 'received' || order.status === 'inventory_check' ? 0 : (item.quantity_to_produce || 0);
                    const totalAssembled = storeStock + (item.quantity_produced || 0);
                    const packed = item.quantity_packed || 0;
                    const variance = packed - item.quantity_ordered;
                    
                    return (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          <span className="font-semibold block">{art?.name || 'Unknown Article'}</span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{art?.article_code}</span>
                          {item.variance_reason && (
                            <div className="text-[10px] text-amber-600 mt-1 italic font-sans font-medium">
                              Reason: "{item.variance_reason}"
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-semibold">{item.quantity_ordered}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500 bg-slate-50/50">{storeStock}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-indigo-600 font-bold">{mfgGap}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500">{item.quantity_produced || 0}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-emerald-600 font-bold bg-slate-50/50">
                          {order.status === 'dispatched' ? packed : <span className="text-slate-400 italic font-sans font-normal">Pending dispatch</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {order.status !== 'dispatched' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              Awaiting Fitting
                            </span>
                          ) : variance === 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold inline-block">
                              ✓ Perfect Match (0)
                            </span>
                          ) : variance < 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold inline-block">
                              ⚠️ Shortage ({variance})
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-semibold inline-block">
                              Surplus (+{variance})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visual Flow diagram */}
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2">
              <strong className="text-xs text-slate-700 block font-bold">Automatic Department Handover Timeline:</strong>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-[11px]">
                <div className={`p-2 rounded-lg border ${order.status === 'received' || order.status === 'inventory_check' ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold animate-pulse' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <span className="block font-semibold">1. Store Check</span>
                  <span>Logs stock to calc mfg gap</span>
                </div>
                <div className={`p-2 rounded-lg border ${order.status === 'in_production' ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold animate-pulse' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <span className="block font-semibold">2. Production</span>
                  <span>Produces gap only (Locks over-mfg)</span>
                </div>
                <div className={`p-2 rounded-lg border ${order.status === 'production_done' || order.status === 'design_in_progress' || order.status === 'design_approved' ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <span className="block font-semibold">3. Design & Fitting</span>
                  <span>Engraves, fits & visualizes</span>
                </div>
                <div className={`p-2 rounded-lg border ${order.status === 'packing' || order.status === 'dispatched' ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <span className="block font-semibold">4. Packing / Dispatch</span>
                  <span>Verifies final shipped qty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Design Details & Graphic Brief */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              <span>Design Brief & Uploaded Mockup Layouts</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item, index) => {
                const art = articles.find(a => a.id === item.article_id);
                return (
                  <div key={item.id} className="p-4 border border-slate-100 rounded-xl space-y-2">
                    <strong className="text-xs text-slate-700 block">{art?.name}</strong>
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded font-mono">
                      <span className="font-bold text-[10px] text-slate-400 block uppercase">ENGRAVING TEXT</span>
                      {item.custom_text || 'No Custom Text'}
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded">
                      <span className="font-bold text-[10px] text-slate-400 block uppercase">DESIGN BRIEF / DIRECTION</span>
                      {item.design_brief || 'No design brief uploaded.'}
                    </div>
                    {item.design_file_url ? (
                      <div className="border border-slate-100 rounded-lg overflow-hidden">
                        <span className="font-bold text-[9px] text-slate-400 block bg-slate-50 px-2 py-1 uppercase">Artwork File</span>
                        <img
                          src={item.design_file_url}
                          alt="mockup brief"
                          className="w-full h-36 object-cover bg-slate-50"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-12 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                        No mockup artwork uploaded yet.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* INVOICE & BILLING SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <span>Invoice & Payment Status</span>
            </h3>

            {invoice ? (
              <div className="p-4 border border-slate-100 rounded-xl flex flex-wrap justify-between items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Billing Account</span>
                  <div className="font-mono text-slate-800 font-bold text-sm mt-0.5">{invoice.invoice_number}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Total Amount: ₹{invoice.total_amount.toLocaleString('en-IN')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToInvoice(invoice.id)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Open Full Invoice
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-slate-500 text-xs">No invoice generated for this order yet.</p>
                {(order.status === 'design_approved' || order.status === 'packing' || order.status === 'dispatched') && (currentUser.role === 'admin' || currentUser.role === 'sales') ? (
                  <button
                    onClick={() => onGenerateInvoice(order.id)}
                    className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Auto-Generate Invoice (18% GST)
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Invoice can be auto-generated once Design is Approved or Dispatched.</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Role Actions Panel and Logs */}
        <div className="space-y-6">

          {/* ACTION CONSOLE PANEL (CRITICAL WORKFLOW) */}
          {isCurrentStatusActionable() && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm ring-2 ring-emerald-400/20 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight">
                  {currentUser.role.toUpperCase()} Operations Console
                </h3>
              </div>

              {/* STORE STOCK-CHECK ACTION */}
              {order.status === 'received' && (currentUser.role === 'store' || currentUser.role === 'admin') && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Verify physical stock levels in the store. Specify available stock for each article. Gaps will automatically route to the Production department.
                  </p>
                  <div className="space-y-3">
                    {items.map(item => {
                      const art = articles.find(a => a.id === item.article_id);
                      return (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-2">
                          <strong className="text-xs text-slate-700 block">{art?.name}</strong>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-400">Ordered: {item.quantity_ordered} pcs</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500">In Store:</span>
                              <input
                                type="number"
                                min="0"
                                max={item.quantity_ordered}
                                value={storeInventory[item.id] ?? ''}
                                onChange={e => {
                                  const val = Math.min(item.quantity_ordered, Math.max(0, Number(e.target.value)));
                                  setStoreInventory({ ...storeInventory, [item.id]: val });
                                }}
                                className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleStoreConfirm}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Submit Stock Audit</span>
                  </button>
                </div>
              )}

              {/* PRODUCTION JOB-LOGGING ACTION */}
              {order.status === 'in_production' && (currentUser.role === 'production' || currentUser.role === 'admin') && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Log completed manufactured quantities for flagged stock gaps. This automatically updates Article Master price master stock once fully processed.
                  </p>
                  <div className="space-y-3">
                    {items.filter(item => item.quantity_to_produce > 0).map(item => {
                      const art = articles.find(a => a.id === item.article_id);
                      return (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-2">
                          <strong className="text-xs text-slate-700 block">{art?.name}</strong>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">Required Gap: {item.quantity_to_produce} pcs</span>
                            <div className="flex items-center gap-2">
                              <span>Mfg Completed:</span>
                              <input
                                type="number"
                                min="0"
                                value={prodQty[item.id] ?? ''}
                                onChange={e => {
                                  setProdQty({ ...prodQty, [item.id]: Math.max(0, Number(e.target.value)) });
                                }}
                                className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-semibold text-indigo-600"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleProductionConfirm}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Hammer className="w-4 h-4" />
                    <span>Complete Production Stage</span>
                  </button>
                </div>
              )}

              {/* DESIGN ACTION */}
              {(order.status === 'production_done' || order.status === 'design_in_progress') && (currentUser.role === 'design' || currentUser.role === 'admin') && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Enter customization setup briefs (font details, engraving color themes) and simulated digital artwork links.
                  </p>
                  <div className="space-y-3">
                    {items.map(item => {
                      const art = articles.find(a => a.id === item.article_id);
                      return (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-2">
                          <strong className="text-xs text-slate-700 block">{art?.name}</strong>
                          <div className="space-y-1.5 text-xs">
                            <textarea
                              placeholder="Describe font types, alignment guidelines, size constraints..."
                              value={designBriefs[item.id] ?? ''}
                              onChange={e => setDesignBriefs({ ...designBriefs, [item.id]: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Artwork Image URL link (Optional)"
                              value={designFiles[item.id] ?? ''}
                              onChange={e => setDesignFiles({ ...designFiles, [item.id]: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleDesignConfirm}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Approve Design & Forward to Fitting</span>
                  </button>
                </div>
              )}

              {/* PACKING ASSEMBLY & DISPATCH */}
              {(order.status === 'design_approved' || order.status === 'packing') && (currentUser.role === 'packing' || currentUser.role === 'admin') && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Verify assembled quantities. Packed quantities cannot exceed limits unless cleared by an Admin override. Gaps/shortages require a recorded explanation.
                  </p>
                  <div className="space-y-3">
                    {items.map(item => {
                      const art = articles.find(a => a.id === item.article_id);
                      const packedVal = Number(packedQty[item.id] || 0);
                      const isOverLimit = packedVal > item.quantity_ordered;
                      const isShort = packedVal < item.quantity_ordered && packedVal > 0;

                      return (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-2">
                          <strong className="text-xs text-slate-700 block">{art?.name}</strong>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Ordered: {item.quantity_ordered} pcs</span>
                            <div className="flex items-center gap-2">
                              <span>Assembled:</span>
                              <input
                                type="number"
                                min="0"
                                value={packedQty[item.id] ?? ''}
                                onChange={e => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setPackedQty({ ...packedQty, [item.id]: val });
                                }}
                                className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-bold"
                              />
                            </div>
                          </div>

                          {isOverLimit && currentUser.role !== 'admin' && !packOverridden[item.id] && (
                            <div className="p-2 bg-red-50 text-red-700 text-[10px] rounded flex flex-col gap-1.5">
                              <span>⚠️ Limit Exceeded. Admin authorization is mandatory.</span>
                              <button
                                onClick={() => setPackOverridden({ ...packOverridden, [item.id]: true })}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] self-start"
                              >
                                Clear with Override
                              </button>
                            </div>
                          )}

                          {isShort && (
                            <div className="space-y-1 mt-1.5">
                              <span className="text-[10px] text-amber-600 block">⚠️ Shortage detected. Add explanation:</span>
                              <input
                                type="text"
                                placeholder="e.g. 1 base broken, dispatching 29"
                                value={packVarianceReason[item.id] ?? ''}
                                onChange={e => setPackVarianceReason({ ...packVarianceReason, [item.id]: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 border border-slate-100 rounded-xl space-y-2 bg-slate-50/50">
                    <strong className="text-xs text-slate-700 block">Courier / Dispatch Details</strong>
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Courier Name (e.g., Professional, DTDC)"
                        value={courierName}
                        onChange={e => setCourierName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5"
                      />
                      <input
                        type="text"
                        placeholder="Tracking Number"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePackingConfirm}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Seal Dispatch & Close Order</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DELIVERED DISPATCH METADATA DETAILS */}
          {order.status === 'dispatched' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <Truck className="w-4.5 h-4.5 text-emerald-500" />
                <span>Courier Dispatch Handover</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Courier Partner:</span>
                  <strong className="text-slate-800">{order.courier_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tracking Reference:</span>
                  <strong className="text-slate-800 font-mono">{order.tracking_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dispatch Date:</span>
                  <strong className="text-slate-800 font-mono">{order.dispatch_date}</strong>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOG TRAIL SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" />
              <span>Audit Trail (Order Logs)</span>
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {orderLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No activity logs recorded.</p>
              ) : (
                orderLogs.map(l => (
                  <div key={l.id} className="text-xs relative pl-4 border-l border-slate-100 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-300"></span>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800 font-semibold">{l.changed_by}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(l.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                      Action: {l.action.replace(/_/g, ' ')}
                    </div>
                    <p className="text-slate-600 mt-1">{l.notes}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ================= MODALS ================= */}

      {/* 1. QUANTITY CHANGE MODAL (Sales / Admin) */}
      {showQtyChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="font-display font-bold text-slate-800 text-lg">Modify Order Quantities</h3>
            <p className="text-xs text-slate-500">
              Modifying quantity triggers automated adjustments downstream. If the order is already in production, admin overrides apply.
            </p>

            <div className="space-y-3">
              {items.map(item => {
                const art = articles.find(a => a.id === item.article_id);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-700 truncate max-w-[200px]">{art?.name}</span>
                    <input
                      type="number"
                      min="1"
                      value={editQty[item.id] ?? ''}
                      onChange={e => setEditQty({ ...editQty, [item.id]: Math.max(1, Number(e.target.value)) })}
                      className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-mono font-semibold"
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Audit Log (Mandatory)</label>
              <textarea
                value={qtyChangeReason}
                onChange={e => setQtyChangeReason(e.target.value)}
                placeholder="e.g. Client requested 10 extra medals over WhatsApp"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl p-2.5 text-xs focus:outline-none transition"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setShowQtyChangeModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleQtyChangeConfirm}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
              >
                Confirm Modification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CANCELLATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="font-display font-bold text-slate-800 text-lg">Cancel Customization Order</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this order? This cancels all downstream manufacturing or design pipelines. This action is irreversible.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. School athletic event cancelled"
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
