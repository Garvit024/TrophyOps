/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getDatabase,
  saveDatabase,
  addOrderLog,
  addNotification,
  handleStatusNotificationTrigger,
  generateId
} from './db';
import {
  User,
  Client,
  Article,
  Order,
  OrderItem,
  OrderLog,
  Invoice,
  Payment,
  Notification,
  BusinessInfo,
  OrderStatus,
  UserRole
} from './types';

// Sub-components
import RoleSelector from './components/RoleSelector';
import Dashboard from './components/Dashboard';
import OrdersList from './components/OrdersList';
import OrderDetail from './components/OrderDetail';
import NewOrderForm from './components/NewOrderForm';
import InventoryPage from './components/InventoryPage';
import ClientsPage from './components/ClientsPage';
import InvoicePage from './components/InvoicePage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';

// Icons for navigation sidebar
import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  Users2,
  FileSpreadsheet,
  BarChart4,
  Settings as SettingsIcon,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  // DB State
  const [db, setDb] = useState(() => getDatabase());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [ordersFilterStatus, setOrdersFilterStatus] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync state back to local storage whenever DB modifies
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // Current User Helpers
  const currentUser = db.currentUser;

  // Handlers
  const handleLogin = (user: User) => {
    setDb(prev => ({
      ...prev,
      currentUser: user,
    }));
    setActiveTab('dashboard');
    setSelectedOrderId(null);
    setSelectedInvoiceId(null);
  };

  const handleLogout = () => {
    setDb(prev => ({
      ...prev,
      currentUser: null,
    }));
    setActiveTab('dashboard');
    setSelectedOrderId(null);
    setSelectedInvoiceId(null);
  };

  const handleMarkNotificationRead = (notifId: string) => {
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === notifId ? { ...n, is_read: true } : n),
    }));
  };

  const handleClearNotifications = () => {
    if (!currentUser) return;
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.recipient_role !== currentUser.role && n.recipient_role !== 'all'),
    }));
  };

  const handleNavigateToOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveTab('order_detail');
  };

  const handleNavigateToInvoiceFromList = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('invoices');
  };

  // Add clients CRM
  const handleAddNewClient = (client: Client) => {
    setDb(prev => ({
      ...prev,
      clients: [client, ...prev.clients],
    }));
  };

  // Update Inventory Articles price master list
  const handleUpdateArticles = (updatedArticles: Article[]) => {
    setDb(prev => ({
      ...prev,
      articles: updatedArticles,
    }));
  };

  // Create Order Workflow (Sales -> Store Notified)
  const handleCreateOrder = (newOrder: Order, items: OrderItem[]) => {
    let updatedDb = { ...db };

    // 1. Insert order and items
    updatedDb.orders = [newOrder, ...updatedDb.orders];
    updatedDb.orderItems = [...items, ...updatedDb.orderItems];

    // 2. Add audit log
    updatedDb = addOrderLog(
      updatedDb,
      newOrder.id,
      'status_changed',
      'None',
      'received',
      `Order ${newOrder.order_number} submitted. Waiting for Store inventory stock verification.`,
      currentUser?.name || 'System'
    );

    // 3. Dispatch automated real-time notification to Store
    updatedDb = addNotification(
      updatedDb,
      'store',
      `New order ${newOrder.order_number} needs inventory check`,
      newOrder.id
    );

    setDb(updatedDb);
    setActiveTab('orders');
  };

  // Update/Coordinate existing Order transition (Store / Production / Design / Packing / Admin updates)
  const handleUpdateOrder = (updatedOrder: Order, items: OrderItem[], logMsg: string, logAction: string) => {
    let updatedDb = { ...db };

    // 1. Update order status
    const prevOrder = db.orders.find(o => o.id === updatedOrder.id);
    const prevStatus = prevOrder ? prevOrder.status : 'received';

    updatedDb.orders = updatedDb.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);

    // 2. Update order items quantities/briefs/files
    updatedDb.orderItems = updatedDb.orderItems.map(item => {
      const match = items.find(i => i.id === item.id);
      return match ? match : item;
    });

    // 3. Log Audit Trail
    updatedDb = addOrderLog(
      updatedDb,
      updatedOrder.id,
      logAction,
      prevStatus,
      updatedOrder.status,
      logMsg,
      currentUser?.name || 'System'
    );

    // 4. Handle auto updates like updating inventory stocks when production completes
    if (logAction === 'production_logged') {
      updatedDb.orderItems.filter(i => i.order_id === updatedOrder.id).forEach(item => {
        if (item.quantity_produced > 0) {
          updatedDb.articles = updatedDb.articles.map(a => {
            if (a.id === item.article_id) {
              return { ...a, stock_qty: a.stock_qty + item.quantity_produced };
            }
            return a;
          });
        }
      });
    }

    // 5. Trigger notifications depending on new status
    if (currentUser) {
      updatedDb = handleStatusNotificationTrigger(updatedDb, updatedOrder, prevStatus, currentUser);
    }

    setDb(updatedDb);
  };

  // Auto Generate Invoice (18% B2B Tax)
  const handleGenerateInvoice = (orderId: string) => {
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return;

    const items = db.orderItems.filter(i => i.order_id === orderId);
    
    // Subtotal based on actual packed quantities if dispatched, else ordered quantities
    const subtotal = items.reduce((sum, item) => {
      const qty = item.quantity_packed || item.quantity_ordered;
      return sum + qty * item.unit_price;
    }, 0);

    const discountAmount = Math.round(subtotal * ((order.discount_percent || 0) / 100));
    const netSubtotal = subtotal - discountAmount;

    const gstPercent = 18; // default 18% GST
    const totalAmount = Math.round(netSubtotal * 1.18);

    const invoiceId = generateId('inv-');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      order_id: orderId,
      generated_by: currentUser?.name || 'System',
      subtotal,
      discount_amount: discountAmount,
      gst_percent: gstPercent,
      total_amount: totalAmount,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + db.businessInfo.payment_due_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'sent',
    };

    let updatedDb = { ...db };
    updatedDb.invoices = [invoice, ...updatedDb.invoices];

    updatedDb = addOrderLog(
      updatedDb,
      orderId,
      'invoice_generated',
      order.status,
      order.status,
      `B2B tax Invoice ${invoice.invoice_number} auto-generated for amount ₹${totalAmount.toLocaleString('en-IN')}`,
      currentUser?.name || 'System'
    );

    setDb(updatedDb);
    setSelectedInvoiceId(invoiceId);
    setActiveTab('invoices');
  };

  // Add Payment Receipt (partial/full cash, bank transfer, cheque, upi)
  const handleAddPayment = (payment: Payment) => {
    setDb(prev => ({
      ...prev,
      payments: [payment, ...prev.payments],
    }));
  };

  // Update Invoices properties (discount/GST tweaks)
  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setDb(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv),
    }));
  };

  // Update Department Users active states / roles
  const handleUpdateUsers = (updatedUsers: User[]) => {
    setDb(prev => ({
      ...prev,
      users: updatedUsers,
    }));
  };

  const handleUpdateBusinessInfo = (updatedInfo: BusinessInfo) => {
    setDb(prev => ({
      ...prev,
      businessInfo: updatedInfo,
    }));
  };

  // Tab View Permissions Checker (Department Isolation)
  const isTabAccessible = (tab: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    switch (tab) {
      case 'dashboard':
        return true;
      case 'orders':
      case 'order_detail':
        return true; // Everyone can see order list & detail, but actions are restricted inside OrderDetail.tsx
      case 'new_order':
        return currentUser.role === 'sales';
      case 'inventory':
        return currentUser.role === 'store';
      case 'clients':
        return currentUser.role === 'sales';
      case 'invoices':
        return currentUser.role === 'sales';
      case 'reports':
        return false; // Admin only
      case 'settings':
        return false; // Admin only
      default:
        return false;
    }
  };

  // Main navigation items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders Directory', icon: ClipboardList },
    { id: 'new_order', label: 'Create Order', icon: ClipboardList, restrict: ['sales'] },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, restrict: ['store'] },
    { id: 'clients', label: 'Clients B2B (CRM)', icon: Users2, restrict: ['sales'] },
    { id: 'invoices', label: 'Invoices & Payments', icon: FileSpreadsheet, restrict: ['sales'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart4, restrict: ['admin'] },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon, restrict: ['admin'] },
  ];

  if (!currentUser) {
    return <LoginPage users={db.users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Global Header with Role selector */}
      <RoleSelector
        currentUser={currentUser}
        onLogout={handleLogout}
        notifications={db.notifications}
        onMarkRead={handleMarkNotificationRead}
        onClearAll={handleClearNotifications}
        onNavigateToOrder={handleNavigateToOrder}
      />

      {/* 2. Main content wrap */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Mobile menu trigger */}
        <div className="md:hidden bg-white p-3 border-b border-slate-100 flex items-center justify-between z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-display font-bold text-xs tracking-wider uppercase text-slate-400">Navigation Menu</span>
        </div>

        {/* Navigation Sidebar */}
        <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 z-30 transition-transform duration-300 md:translate-x-0 absolute md:static inset-y-0 left-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="py-4 space-y-1">
            <div className="px-4 pb-3 border-b border-slate-800/60 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Role: {currentUser.role} Navigation
            </div>
            {menuItems
              .filter(item => {
                if (currentUser.role === 'admin') return true;
                if (item.restrict) return item.restrict.includes(currentUser.role);
                return isTabAccessible(item.id);
              })
              .map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedOrderId(null);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-semibold flex items-center gap-3 hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
                      isActive ? 'bg-slate-800 text-emerald-400 border-l-4 border-emerald-400 font-bold' : ''
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>

          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
            TrophyOps v1.0.0 © 2026
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {/* Active page renderer */}
          {activeTab === 'dashboard' && isTabAccessible('dashboard') && (
            <Dashboard
              currentUser={currentUser}
              orders={db.orders}
              orderItems={db.orderItems}
              articles={db.articles}
              clients={db.clients}
              invoices={db.invoices}
              payments={db.payments}
              logs={db.orderLogs}
              onNavigate={(tab, arg) => {
                if (tab === 'orders' && arg) {
                  setSelectedOrderId(arg);
                  setActiveTab('order_detail');
                } else {
                  setActiveTab(tab);
                }
              }}
              onSetFilterStatus={setOrdersFilterStatus}
            />
          )}

          {activeTab === 'orders' && isTabAccessible('orders') && (
            <OrdersList
              orders={db.orders}
              clients={db.clients}
              orderItems={db.orderItems}
              onNavigateToOrderDetail={handleNavigateToOrder}
              initialFilterStatus={ordersFilterStatus}
              currentUser={currentUser.role}
            />
          )}

          {activeTab === 'order_detail' && selectedOrderId && (
            <OrderDetail
              orderId={selectedOrderId}
              orders={db.orders}
              clients={db.clients}
              orderItems={db.orderItems}
              articles={db.articles}
              logs={db.orderLogs}
              invoices={db.invoices}
              payments={db.payments}
              currentUser={currentUser}
              onBack={() => {
                setSelectedOrderId(null);
                setActiveTab('orders');
              }}
              onUpdateOrder={handleUpdateOrder}
              onGenerateInvoice={handleGenerateInvoice}
              onNavigateToInvoice={handleNavigateToInvoiceFromList}
            />
          )}

          {activeTab === 'new_order' && isTabAccessible('new_order') && (
            <NewOrderForm
              clients={db.clients}
              articles={db.articles}
              onSubmitOrder={handleCreateOrder}
              onAddNewClient={handleAddNewClient}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'inventory' && isTabAccessible('inventory') && (
            <InventoryPage
              articles={db.articles}
              orders={db.orders}
              orderItems={db.orderItems}
              clients={db.clients}
              onUpdateArticles={handleUpdateArticles}
              onNavigateToOrder={handleNavigateToOrder}
              currentUserRole={currentUser.role}
            />
          )}

          {activeTab === 'clients' && isTabAccessible('clients') && (
            <ClientsPage
              clients={db.clients}
              orders={db.orders}
              orderItems={db.orderItems}
              onAddNewClient={handleAddNewClient}
              onNavigateToOrder={handleNavigateToOrder}
            />
          )}

          {activeTab === 'invoices' && isTabAccessible('invoices') && (
            <InvoicePage
              invoices={db.invoices}
              orders={db.orders}
              clients={db.clients}
              orderItems={db.orderItems}
              articles={db.articles}
              payments={db.payments}
              businessInfo={db.businessInfo}
              onAddPayment={handleAddPayment}
              onUpdateInvoice={handleUpdateInvoice}
            />
          )}

          {activeTab === 'reports' && isTabAccessible('reports') && (
            <ReportsPage
              orders={db.orders}
              invoices={db.invoices}
              payments={db.payments}
              clients={db.clients}
              orderItems={db.orderItems}
              articles={db.articles}
            />
          )}

          {activeTab === 'settings' && isTabAccessible('settings') && (
            <SettingsPage
              users={db.users}
              articles={db.articles}
              businessInfo={db.businessInfo}
              onUpdateUsers={handleUpdateUsers}
              onUpdateArticles={handleUpdateArticles}
              onUpdateBusinessInfo={handleUpdateBusinessInfo}
            />
          )}

        </main>
      </div>
    </div>
  );
}
