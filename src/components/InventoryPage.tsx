/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Article, ArticleCategory, Order, OrderItem, Client } from '../types';
import { Search, Plus, SlidersHorizontal, AlertTriangle, CheckCircle, FileSpreadsheet, X } from 'lucide-react';
import { generateId } from '../db';

interface InventoryPageProps {
  articles: Article[];
  orders: Order[];
  orderItems: OrderItem[];
  clients: Client[];
  onUpdateArticles: (articles: Article[]) => void;
  onNavigateToOrder: (orderId: string) => void;
  currentUserRole: string;
}

export default function InventoryPage({
  articles,
  orders,
  orderItems,
  clients,
  onUpdateArticles,
  onNavigateToOrder,
  currentUserRole,
}: InventoryPageProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all' | 'ok' | 'low' | 'out'

  // Inline stock edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<number>(0);

  // Excel simulation state
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelPasteData, setExcelPasteData] = useState('');

  // Save inline stock modification
  const handleSaveStock = (id: string) => {
    const updated = articles.map(a => {
      if (a.id === id) {
        return { ...a, stock_qty: Number(editingStock) };
      }
      return a;
    });
    onUpdateArticles(updated);
    setEditingId(null);
  };

  // Excel Bulk Import Simulation (Section 08.6)
  const handleExcelImport = () => {
    if (!excelPasteData.trim()) {
      alert('Please paste some text/CSV data from your spreadsheet.');
      return;
    }

    // Try parsing CSV or TSV
    const rows = excelPasteData.trim().split('\n');
    const newArticles: Article[] = [];

    rows.forEach(row => {
      const cols = row.split(/[\t,;]/); // split by tab, comma, or semicolon
      if (cols.length >= 3) {
        const code = cols[0].trim();
        const name = cols[1].trim();
        const category = (cols[2].trim() as ArticleCategory) || 'Trophy';
        const price = Number(cols[3]?.replace(/[^0-9.]/g, '') || 500);
        const qty = Number(cols[4]?.trim() || 10);
        const minVal = Number(cols[5]?.trim() || 5);

        if (code && name && !isNaN(price)) {
          newArticles.push({
            id: generateId('art-'),
            article_code: code,
            name: name,
            category: category,
            unit_price: price,
            stock_qty: qty,
            min_stock_alert: minVal,
            is_active: true,
            created_at: new Date().toISOString().split('T')[0],
          });
        }
      }
    });

    if (newArticles.length === 0) {
      alert('No valid items detected. Make sure columns are ordered: Code, Name, Category, Price, Stock, Min Alert');
      return;
    }

    // Append imported items
    onUpdateArticles([...articles, ...newArticles]);
    alert(`Successfully imported ${newArticles.length} articles into Price Master!`);
    setShowImportModal(false);
    setExcelPasteData('');
  };

  const getStockStatus = (a: Article) => {
    if (a.stock_qty === 0) return 'out';
    if (a.stock_qty <= a.min_stock_alert) return 'low';
    return 'ok';
  };

  // Filter items
  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.article_code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    const status = getStockStatus(a);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockBadge = (status: 'ok' | 'low' | 'out', qty: number) => {
    switch (status) {
      case 'out':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Out of Stock</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Low stock ({qty})</span>;
      default:
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">OK ({qty})</span>;
    }
  };

  // Pending inventory checks (backlog for Store)
  const pendingChecks = orders.filter(o => o.status === 'received' || o.status === 'inventory_check');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Inventory & Price Master
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Maintain raw & finished article inventory, unit prices, and alert levels.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Price Import</span>
          </button>
        </div>
      </div>

      {/* Main Tabs structure: Stock Master vs Store Pending Backlog */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Side: Filter Panels and Store Backlog */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filters Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>Catalog Filters</span>
            </h3>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Article Category</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-300"
              >
                <option value="all">All Categories</option>
                <option value="Trophy">Trophies</option>
                <option value="Medal">Medals</option>
                <option value="Shield">Shields</option>
                <option value="Plaque">Plaques</option>
                <option value="Other">Other customized articles</option>
              </select>
            </div>

            {/* Stock Levels Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Alert Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-300"
              >
                <option value="all">All Stock Statuses</option>
                <option value="ok">Stock OK</option>
                <option value="low">Low Stock Alerts</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Pending Checks Backlog Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Pending Stock Checks ({pendingChecks.length})</span>
            </h3>

            {pendingChecks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No incoming orders require physical checks.</p>
            ) : (
              <div className="space-y-2.5">
                {pendingChecks.map(o => {
                  const itemsCount = orderItems.filter(i => i.order_id === o.id).length;
                  return (
                    <div
                      key={o.id}
                      onClick={() => onNavigateToOrder(o.id)}
                      className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center cursor-pointer hover:border-slate-300 transition"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800">{o.order_number}</span>
                        <div className="text-[10px] text-slate-400 font-sans">{itemsCount} articles to check</div>
                      </div>
                      <span className="text-[10px] text-emerald-600 hover:underline font-bold">Audit</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Articles Listing */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Article Code or Name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 rounded-xl pl-10 pr-4 py-1.5 text-xs focus:outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Articles Listing Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Article Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5 text-right">Standard Price</th>
                    <th className="px-6 py-3.5 text-center">Safety Alert Limit</th>
                    <th className="px-6 py-3.5 text-center">In Store Stock</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map(a => {
                    const status = getStockStatus(a);
                    const isEditing = editingId === a.id;

                    return (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{a.article_code}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">{a.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{a.category}</td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                          ₹{a.unit_price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-slate-500">
                          {a.min_stock_alert} units
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editingStock}
                              onChange={e => setEditingStock(Math.max(0, Number(e.target.value)))}
                              className="w-16 bg-white border border-slate-300 rounded px-1 py-0.5 text-center font-mono font-bold"
                            />
                          ) : (
                            getStockBadge(status, a.stock_qty)
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleSaveStock(a.id)}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-semibold cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(a.id);
                                setEditingStock(a.stock_qty);
                              }}
                              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                            >
                              Edit Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ================= BULK IMPORT MODAL ================= */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-100 shadow-xl">
            <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Copy-Paste Excel pricing list Importer</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Import multiple customized articles from your internal Excel price lists. Paste raw spreadsheet tables below. Columns must match standard order: <br />
              <strong className="text-slate-700 font-mono">ArticleCode | ArticleName | Category | UnitPrice | StockQty | MinAlertThreshold</strong>
            </p>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-[10px] text-slate-400 uppercase">Excel Paste Output (Tab-separated or Comma-separated lines)</span>
              <textarea
                value={excelPasteData}
                onChange={e => setExcelPasteData(e.target.value)}
                placeholder="ART-201	Golden Trophy Medallion	Trophy	1250	25	10&#10;ART-202	Premium Acrylic Flame	Plaque	1800	15	5"
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-xl p-3 text-xs font-mono"
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
              >
                Close Dialog
              </button>
              <button
                onClick={handleExcelImport}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
              >
                Trigger Bulk Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
