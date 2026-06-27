/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Client, OrderItem, OrderStatus, UserRole } from '../types';
import { Search, Filter, Calendar, FileText, ArrowRight, X } from 'lucide-react';

interface OrdersListProps {
  orders: Order[];
  clients: Client[];
  orderItems: OrderItem[];
  onNavigateToOrderDetail: (id: string) => void;
  initialFilterStatus?: string;
  currentUser: UserRole;
}

export default function OrdersList({
  orders,
  clients,
  orderItems,
  onNavigateToOrderDetail,
  initialFilterStatus = 'all',
  currentUser,
}: OrdersListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus);
  const [filterClient, setFilterClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all'); // 'all' | 'today' | 'week' | 'month'

  // Helper to calculate total order price
  const calculateOrderTotal = (orderId: string) => {
    const items = orderItems.filter(i => i.order_id === orderId);
    return items.reduce((sum, i) => sum + i.quantity_ordered * i.unit_price, 0);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.shop_name : 'Unknown Client';
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'inventory_check':
        return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'in_production':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'production_done':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'design_in_progress':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'design_approved':
        return 'bg-pink-50 text-pink-700 border-pink-100';
      case 'packing':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'dispatched':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const formatStatus = (status: OrderStatus) => {
    return status.replace(/_/g, ' ');
  };

  // Filter Logic
  const filteredOrders = orders.filter(o => {
    // Search Order No or Client Shop Name
    const clientName = getClientName(o.client_id).toLowerCase();
    const orderNo = o.order_number.toLowerCase();
    const matchesSearch = clientName.includes(search.toLowerCase()) || orderNo.includes(search.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;

    // Client filter
    const matchesClient = filterClient === 'all' || o.client_id === filterClient;

    // Date range filter
    let matchesDate = true;
    if (dateRange !== 'all') {
      const orderDateObj = new Date(o.order_date);
      const today = new Date();
      if (dateRange === 'today') {
        matchesDate = orderDateObj.toDateString() === today.toDateString();
      } else if (dateRange === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        matchesDate = orderDateObj >= oneWeekAgo;
      } else if (dateRange === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        matchesDate = orderDateObj >= oneMonthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesClient && matchesDate;
  });

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterClient('all');
    setDateRange('all');
  };

  const isFiltered = search !== '' || filterStatus !== 'all' || filterClient !== 'all' || dateRange !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Orders Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse and coordinate customer customisation orders across departments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* Search Box */}
          <div className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Client Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none transition font-medium"
            />
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-44">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition font-medium"
            >
              <option value="all">All Stages</option>
              <option value="received">Received</option>
              <option value="inventory_check">Inventory Check</option>
              <option value="in_production">In Production</option>
              <option value="production_done">Production Done</option>
              <option value="design_in_progress">Design In Progress</option>
              <option value="design_approved">Design Approved</option>
              <option value="packing">Packing/Assembly</option>
              <option value="dispatched">Dispatched</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Client Select */}
          <div className="w-full sm:w-52">
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition font-medium text-ellipsis overflow-hidden"
            >
              <option value="all">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.shop_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Select */}
          <div className="w-full sm:w-40">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none transition font-medium"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          {/* Clear Button */}
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-700 font-bold font-display">No Orders Found</h3>
            <p className="text-slate-400 text-xs mt-1">Try resetting the search terms or department filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Order No</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Order Date</th>
                  <th className="px-6 py-4">Expected Delivery</th>
                  <th className="px-6 py-4">Status / Stage</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => {
                  const items = orderItems.filter(item => item.order_id === o.id);
                  const totalItemsQty = items.reduce((sum, item) => sum + item.quantity_ordered, 0);

                  return (
                    <tr
                      key={o.id}
                      className="border-b border-slate-50 hover:bg-slate-50/30 transition cursor-pointer"
                      onClick={() => onNavigateToOrderDetail(o.id)}
                    >
                      <td className="px-6 py-4.5">
                        <span className="font-mono font-bold text-slate-800 text-sm">{o.order_number}</span>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">By {o.created_by}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <strong className="text-slate-700">{getClientName(o.client_id)}</strong>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">{totalItemsQty} customized articles</div>
                      </td>
                      <td className="px-6 py-4.5 text-slate-500 font-mono">
                        {o.order_date}
                      </td>
                      <td className="px-6 py-4.5 text-slate-500 font-mono">
                        {o.expected_delivery_date}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${getStatusBadgeClass(o.status)}`}>
                          {formatStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right font-mono font-semibold text-slate-800">
                        ₹{calculateOrderTotal(o.id).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <button className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center justify-center mx-auto">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
