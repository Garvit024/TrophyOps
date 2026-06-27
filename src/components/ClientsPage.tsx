/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Order, OrderItem } from '../types';
import { Search, UserPlus, Phone, Mail, MapPin, FileText, ShoppingBag, Landmark, ArrowRight } from 'lucide-react';
import { generateId } from '../db';

interface ClientsPageProps {
  clients: Client[];
  orders: Order[];
  orderItems: OrderItem[];
  onAddNewClient: (client: Client) => void;
  onNavigateToOrder: (orderId: string) => void;
}

export default function ClientsPage({
  clients,
  orders,
  orderItems,
  onAddNewClient,
  onNavigateToOrder,
}: ClientsPageProps) {
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);

  // New Client Modal state
  const [showModal, setShowModal] = useState(false);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Calculations
  const getClientSpent = (clientId: string) => {
    // Total sum of all orders linked to this client
    const clientOrders = orders.filter(o => o.client_id === clientId && o.status !== 'cancelled');
    return clientOrders.reduce((total, ord) => {
      const items = orderItems.filter(i => i.order_id === ord.id);
      return total + items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_price, 0);
    }, 0);
  };

  const getClientOrdersCount = (clientId: string) => {
    return orders.filter(o => o.client_id === clientId).length;
  };

  // Filtered clients list
  const filteredClients = clients.filter(c =>
    c.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    c.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !phone) {
      alert('Shop Name and Primary Phone are mandatory fields.');
      return;
    }

    const created: Client = {
      id: generateId('c-'),
      shop_name: shopName,
      owner_name: ownerName,
      phone: phone,
      whatsapp: whatsapp || phone,
      email: email,
      address: address,
      gst_number: gstNumber,
      notes: notes,
      created_at: new Date().toISOString().split('T')[0],
    };

    onAddNewClient(created);
    setSelectedClientId(created.id);
    setShowModal(false);

    // Reset fields
    setShopName('');
    setOwnerName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setGstNumber('');
    setNotes('');
  };

  const activeClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const activeClientOrders = activeClient
    ? orders.filter(o => o.client_id === activeClient.id).sort((a, b) => b.order_date.localeCompare(a.order_date))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Client Directory & CRM
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track business contact histories, outstanding accounts, and client lifetime valuation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Client Record</span>
        </button>
      </div>

      {/* Main Grid Double Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: Clients List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative text-xs">
            <Search className="absolute left-6 top-5.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Shop name, Owner or Phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl pl-10 pr-4 py-2 focus:outline-none transition font-medium"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No clients found.
              </div>
            ) : (
              filteredClients.map(c => {
                const lifetimeSpent = getClientSpent(c.id);
                const isActive = activeClient?.id === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50/50 transition flex justify-between items-start cursor-pointer ${
                      isActive ? 'bg-slate-50 border-r-4 border-slate-900' : ''
                    }`}
                  >
                    <div>
                      <strong className="text-xs text-slate-800 font-semibold block">{c.shop_name}</strong>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{c.owner_name} • {c.phone}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-mono font-bold text-slate-700 block">₹{lifetimeSpent.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block uppercase font-medium">Spent Value</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Client Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {activeClient ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              
              {/* Profile Header */}
              <div className="pb-6 border-b border-slate-100 flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-slate-800 text-xl tracking-tight">
                    {activeClient.shop_name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Account Owner: <span className="font-semibold text-slate-700">{activeClient.owner_name || 'Not Specified'}</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Lifetime Business</span>
                  <strong className="text-lg font-mono text-slate-900 font-extrabold block mt-0.5">
                    ₹{getClientSpent(activeClient.id).toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{getClientOrdersCount(activeClient.id)} orders placed</span>
                </div>
              </div>

              {/* Contact Card Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Contact Specifics</span>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Phone: <strong>{activeClient.phone}</strong></span>
                  </div>
                  {activeClient.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>WhatsApp: <strong className="text-emerald-600">{activeClient.whatsapp}</strong></span>
                    </div>
                  )}
                  {activeClient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>Email: <strong>{activeClient.email}</strong></span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Billing & Delivery info</span>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>Delivery Address: <strong className="text-slate-800">{activeClient.address || 'No specific address logged.'}</strong></span>
                  </div>
                  {activeClient.gst_number && (
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-slate-400" />
                      <span>GST IN: <strong className="text-slate-800 font-mono">{activeClient.gst_number}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Custom Notes */}
              {activeClient.notes && (
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-slate-700">
                  <strong className="font-bold text-[10px] text-amber-800 uppercase block tracking-wider mb-1">CRM Client Notes</strong>
                  "{activeClient.notes}"
                </div>
              )}

              {/* Client Order History */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <ShoppingBag className="w-4.5 h-4.5 text-slate-500" />
                  <span>Historical Customization Orders</span>
                </h4>

                {activeClientOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No orders registered under this client yet.</p>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                    {activeClientOrders.map(o => {
                      const itemsCount = orderItems.filter(i => i.order_id === o.id).length;
                      const totalAmount = orderItems
                        .filter(i => i.order_id === o.id)
                        .reduce((sum, item) => sum + item.quantity_ordered * item.unit_price, 0);

                      return (
                        <div
                          key={o.id}
                          onClick={() => onNavigateToOrder(o.id)}
                          className="p-4 hover:bg-slate-50/50 transition flex justify-between items-center text-xs cursor-pointer"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-800 block text-sm">{o.order_number}</span>
                            <span className="text-slate-400 block mt-0.5">{o.order_date} • {itemsCount} unique items</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-700">₹{totalAmount.toLocaleString('en-IN')}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                              o.status === 'dispatched' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {o.status}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
              <p className="text-slate-400 text-xs">Please add a customer to begin CRM logging.</p>
            </div>
          )}
        </div>

      </div>

      {/* ================= NEW CLIENT DIALOG MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateClient} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-slate-800" />
              <span>Register B2B Business Client</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Shop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Sports Corner"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">WhatsApp Link</label>
                <input
                  type="text"
                  placeholder="e.g. Same as phone"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Delivery Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Full street location detail for logistics"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">GST Number (for Invoices)</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="Optional"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">Special B2B Buyer Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Requests 10% discount on silver medals"
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl p-2.5 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
              >
                Register CRM Client
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
