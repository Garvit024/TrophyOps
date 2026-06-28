/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Article, Order, OrderItem, ArticleCategory } from '../types';
import { Plus, Trash2, Search, UserPlus, HelpCircle, FileText, Check, Upload } from 'lucide-react';
import { generateId, generateOrderNumber } from '../db';

interface NewOrderFormProps {
  clients: Client[];
  articles: Article[];
  onSubmitOrder: (newOrder: Order, items: OrderItem[]) => void;
  onAddNewClient: (client: Client) => void;
  onCancel: () => void;
}

interface FormLineItem {
  articleId: string;
  quantity: number;
  unitPrice: number;
  customText: string;
}

export default function NewOrderForm({
  clients,
  articles,
  onSubmitOrder,
  onAddNewClient,
  onCancel,
}: NewOrderFormProps) {
  // Client selection states
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // New inline client form state
  const [showInlineClientForm, setShowInlineClientForm] = useState(false);
  const [newClientShop, setNewClientShop] = useState('');
  const [newClientOwner, setNewClientOwner] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientWhatsapp, setNewClientWhatsapp] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientGst, setNewClientGst] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Dates
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // Line items
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    { articleId: '', quantity: 1, unitPrice: 0, customText: '' },
  ]);

  // Overall instructions
  const [designBrief, setDesignBrief] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedMockupUrl, setUploadedMockupUrl] = useState('');

  // Suggestions for clients
  const clientSuggestions = clients.filter(c =>
    c.shop_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.owner_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setClientSearch(`${client.shop_name} (${client.owner_name})`);
    setShowClientSuggestions(false);
  };

  const handleInlineClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientShop || !newClientPhone) {
      alert('Shop Name and Phone Number are mandatory fields.');
      return;
    }

    const created: Client = {
      id: generateId('c-'),
      shop_name: newClientShop,
      owner_name: newClientOwner,
      phone: newClientPhone,
      whatsapp: newClientWhatsapp || newClientPhone, // default same
      email: newClientEmail,
      address: newClientAddress,
      gst_number: newClientGst,
      notes: newClientNotes,
      created_at: new Date().toISOString().split('T')[0],
    };

    onAddNewClient(created);
    setSelectedClientId(created.id);
    setClientSearch(`${created.shop_name} (${created.owner_name})`);
    setShowInlineClientForm(false);

    // Reset inline client fields
    setNewClientShop('');
    setNewClientOwner('');
    setNewClientPhone('');
    setNewClientWhatsapp('');
    setNewClientEmail('');
    setNewClientAddress('');
    setNewClientGst('');
    setNewClientNotes('');
  };

  // Add line item
  const handleAddLineItem = () => {
    setLineItems([...lineItems, { articleId: '', quantity: 1, unitPrice: 0, customText: '' }]);
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Change line item field
  const handleLineItemChange = (index: number, field: keyof FormLineItem, value: any) => {
    const updated = [...lineItems];

    if (field === 'articleId') {
      const selectedArticle = articles.find(a => a.id === value);
      updated[index] = {
        ...updated[index],
        articleId: value,
        unitPrice: selectedArticle ? selectedArticle.unit_price : 0,
      };

      // Strict Business Validation check: "Duplicate article in same order not allowed. Error: This article is already in the order. Update quantity instead."
      const hasDuplicate = lineItems.some((item, idx) => idx !== index && item.articleId === value);
      if (hasDuplicate && value !== '') {
        alert('This article is already in the order. Update quantity of the existing line instead.');
        updated[index] = { ...updated[index], articleId: '', unitPrice: 0 };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }

    setLineItems(updated);
  };

  // Drag and Drop mockup simulation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // simulate upload setting mock preview image URL
      setUploadedMockupUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert('Please select or register a B2B client shop.');
      return;
    }

    if (!expectedDeliveryDate) {
      alert('Please specify an Expected Delivery Date.');
      return;
    }

    // Filter out invalid items
    const validItems = lineItems.filter(item => item.articleId !== '');
    if (validItems.length === 0) {
      alert('Please select at least one valid article line.');
      return;
    }

    // Build Order Model
    const orderId = generateId('o-');
    const orderNo = generateOrderNumber();

    const newOrder: Order = {
      id: orderId,
      order_number: orderNo,
      client_id: selectedClientId,
      created_by: 'John Sales', // mock salesperson
      order_date: orderDate,
      expected_delivery_date: expectedDeliveryDate,
      status: 'received', // initial state
      discount_percent: discountPercent,
      special_instructions: specialInstructions,
      courier_name: '',
      tracking_number: '',
      dispatch_date: '',
      cancellation_reason: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Build Order Items Models
    const items: OrderItem[] = validItems.map(item => ({
      id: generateId('oi-'),
      order_id: orderId,
      article_id: item.articleId,
      quantity_ordered: Number(item.quantity),
      quantity_available_in_store: 0,
      quantity_to_produce: 0,
      quantity_produced: 0,
      quantity_packed: 0,
      unit_price: Number(item.unitPrice),
      custom_text: item.customText,
      design_brief: designBrief,
      design_file_url: uploadedMockupUrl,
    }));

    onSubmitOrder(newOrder, items);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Order Creation Form
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Initiate a customization job. This will notify the Store department to begin stock checks.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="lg:col-span-2 space-y-6">
          
          {/* CLIENT SELECTOR CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 relative">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center justify-between">
              <span>B2B Client Information</span>
              <button
                type="button"
                onClick={() => setShowInlineClientForm(!showInlineClientForm)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add New Client Shop</span>
              </button>
            </h3>

            {showInlineClientForm ? (
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Quick Inline Client CRM Registration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Shop Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Sports Corner"
                      value={newClientShop}
                      onChange={e => setNewClientShop(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Owner Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={newClientOwner}
                      onChange={e => setNewClientOwner(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Phone Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 99887 76655"
                      value={newClientPhone}
                      onChange={e => setNewClientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">WhatsApp Link</label>
                    <input
                      type="text"
                      placeholder="e.g. Same as phone"
                      value={newClientWhatsapp}
                      onChange={e => setNewClientWhatsapp(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Delivery Address</label>
                    <input
                      type="text"
                      value={newClientAddress}
                      onChange={e => setNewClientAddress(e.target.value)}
                      placeholder="Full delivery street, landmark, city"
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">GST IN (for Invoice)</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={newClientGst}
                      onChange={e => setNewClientGst(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Email ID (Optional)</label>
                    <input
                      type="email"
                      placeholder="Optional"
                      value={newClientEmail}
                      onChange={e => setNewClientEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineClientForm(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-semibold cursor-pointer"
                  >
                    Cancel Registration
                  </button>
                  <button
                    type="button"
                    onClick={handleInlineClientSubmit}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                  >
                    Save & Select Shop
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative text-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type shop name, owner name, or phone to match B2B record..."
                  value={clientSearch}
                  onChange={e => {
                    setClientSearch(e.target.value);
                    setSelectedClientId('');
                    setShowClientSuggestions(true);
                  }}
                  onFocus={() => setShowClientSuggestions(true)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl pl-10 pr-4 py-2 focus:outline-none transition font-medium"
                />

                {showClientSuggestions && clientSearch !== '' && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                    {clientSuggestions.length === 0 ? (
                      <div className="p-3 text-slate-400 text-xs text-center">
                        No matches found. Click "+ Add New Client Shop" above to register.
                      </div>
                    ) : (
                      clientSuggestions.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectClient(c)}
                          className="w-full text-left p-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-b-0 flex flex-col cursor-pointer"
                        >
                          <strong className="text-slate-800">{c.shop_name}</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5">Owner: {c.owner_name} • Phone: {c.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DATES & SCHEDULING CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expected Delivery Date *</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={e => setExpectedDeliveryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold ring-2 ring-emerald-500/10 focus:ring-emerald-500/25"
              />
            </div>
          </div>

          {/* ARTICLE MASTER LINES CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight">
              Line Items & Custom Engraving Details
            </h3>

            <div className="space-y-4">
              {lineItems.map((line, index) => {
                const matchedArticle = articles.find(a => a.id === line.articleId);
                return (
                  <div key={index} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative space-y-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Article Picker */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Article Master Item *</label>
                        <select
                          value={line.articleId}
                          onChange={e => handleLineItemChange(index, 'articleId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                        >
                          <option value="">-- Choose Article from Price list --</option>
                          {articles.filter(a => a.is_active).map(a => (
                            <option key={a.id} value={a.id}>
                              {a.article_code} - {a.name} (₹{a.unit_price})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Quantity Needed *</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => handleLineItemChange(index, 'quantity', Math.max(1, Number(e.target.value)))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Custom Engraving Base Text */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Engraving Custom Base Text</label>
                        <input
                          type="text"
                          placeholder="e.g. Champion of Champions / Winner 2026"
                          value={line.customText}
                          onChange={e => handleLineItemChange(index, 'customText', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>

                      {/* Unit Price Auto-filled */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Unit Price Snapshot (₹)</label>
                        <input
                          type="text"
                          disabled
                          value={line.unitPrice > 0 ? `₹${line.unitPrice}` : 'Auto'}
                          className="w-full bg-slate-100 border border-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-500 text-center"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddLineItem}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200 border-dashed cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Article Line</span>
              </button>
            </div>
          </div>

          {/* DESIGN BRIEF & MOCKUP DROPZONE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight">
              Design brief & references
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Design & Customization Direction Brief</label>
                <textarea
                  placeholder="e.g. Place school emblem on metal shield center, engrave names using Times New Roman bold font in 12pt size."
                  value={designBrief}
                  onChange={e => setDesignBrief(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl p-3 focus:outline-none transition font-medium"
                />
              </div>

              {/* Drag and Drop Zone */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Upload Design References / Logos (Drag & Drop)</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition p-4 text-center ${
                    dragActive ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="font-semibold text-[11px] text-slate-600 block">Drag & Drop references or click to upload</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Supports PNG, PDF files (Max 5MB)</span>

                  {uploadedMockupUrl && (
                    <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <Check className="w-3 h-3" /> logo_reference_mockup.png successfully attached
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SPECIAL INSTRUCTIONS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 text-xs">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Special Dispatch/Packing instructions</label>
            <textarea
              placeholder="e.g. Box with bubble wrap, handle with care. Deliver strictly before school assembly morning."
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl p-3 focus:outline-none"
            />
          </div>

          {/* DISCOUNT FIELD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 text-xs">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Special Client Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={e => setDiscountPercent(Number(e.target.value))}
              placeholder="0"
              className="w-full sm:w-1/3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl p-3 focus:outline-none font-mono"
            />
          </div>

          {/* FORM SUBMISSION BAR */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Submit & Notify Store</span>
            </button>
          </div>

        </form>

        {/* Right Sidebar Checklist */}
        <div className="space-y-6">
          
          {/* PRICING PREVIEW PANEL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight">
              Order Pricing Summary
            </h3>

            <div className="space-y-2 text-xs">
              {lineItems.filter(item => item.articleId !== '').map((item, index) => {
                const art = articles.find(a => a.id === item.articleId);
                const sub = item.quantity * item.unitPrice;
                return (
                  <div key={index} className="flex justify-between text-slate-600 font-mono">
                    <span className="truncate max-w-[150px] font-sans">{art?.name} x{item.quantity}</span>
                    <span>₹{sub.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}

              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-800 text-sm">
                <span>Gross Total:</span>
                <span className="font-mono">
                  ₹{lineItems
                    .filter(i => i.articleId !== '')
                    .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
              
              {discountPercent > 0 && (
                <div className="flex justify-between font-bold text-emerald-600 text-sm">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="font-mono">
                    - ₹{Math.round(lineItems
                      .filter(i => i.articleId !== '')
                      .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) * (discountPercent / 100))
                      .toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900 text-base">
                <span>Net Subtotal:</span>
                <span className="font-mono">
                  ₹{Math.round(lineItems
                    .filter(i => i.articleId !== '')
                    .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) * (1 - discountPercent / 100))
                    .toLocaleString('en-IN')}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Billing estimates will apply a customizable 18% B2B GST tax upon invoice preparation at the 'Design Approved' stage.
              </p>
            </div>
          </div>

          {/* SYSTEM GUIDELINES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow Directives</h4>
            <ul className="text-[11px] text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Creating an order sets status to <strong className="text-slate-700">Order Received</strong>.</li>
              <li>Store gets automatically paged in real-time.</li>
              <li>Prices are locked based on current pricing models.</li>
              <li>Duplicates on matching articles are blocked immediately.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
