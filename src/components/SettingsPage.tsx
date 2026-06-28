/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Article, BusinessInfo, ArticleCategory, UserRole } from '../types';
import { Settings, Users, FolderKanban, Info, Plus, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { generateId } from '../db';

interface SettingsPageProps {
  users: User[];
  articles: Article[];
  businessInfo: BusinessInfo;
  onUpdateUsers: (users: User[]) => void;
  onUpdateArticles: (articles: Article[]) => void;
  onUpdateBusinessInfo: (info: BusinessInfo) => void;
}

export default function SettingsPage({
  users,
  articles,
  businessInfo,
  onUpdateUsers,
  onUpdateArticles,
  onUpdateBusinessInfo,
}: SettingsPageProps) {

  // 1. BUSINESS INFO EDIT STATES
  const [bizName, setBizName] = useState(businessInfo.name);
  const [bizAddress, setBizAddress] = useState(businessInfo.address);
  const [bizPhone, setBizPhone] = useState(businessInfo.phone);
  const [bizEmail, setBizEmail] = useState(businessInfo.email);
  const [bizGst, setBizGst] = useState(businessInfo.gst_number);
  const [bizDueDays, setBizDueDays] = useState(businessInfo.payment_due_days);

  // 2. ARTICLE MASTER CREATOR STATES
  const [artCode, setArtCode] = useState('');
  const [artName, setArtName] = useState('');
  const [artCat, setArtCat] = useState<ArticleCategory>('Trophy');
  const [artPrice, setArtPrice] = useState('');
  const [artMinAlert, setArtMinAlert] = useState('5');

  // 3. USER MANAGEMENT STATES
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('sales');

  const handleSaveBizInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessInfo({
      name: bizName,
      address: bizAddress,
      phone: bizPhone,
      email: bizEmail,
      gst_number: bizGst,
      payment_due_days: Number(bizDueDays),
    });
    alert('Business credentials updated successfully!');
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artCode || !artName || !artPrice) {
      alert('Code, Name, and Price are mandatory fields.');
      return;
    }

    // Check code duplication
    const duplicate = articles.some(a => a.article_code.toUpperCase() === artCode.toUpperCase());
    if (duplicate) {
      alert(`An article with code ${artCode} already exists in the Price Master.`);
      return;
    }

    const created: Article = {
      id: generateId('art-'),
      article_code: artCode.toUpperCase(),
      name: artName,
      category: artCat,
      unit_price: Number(artPrice),
      stock_qty: 0, // initially out of stock, updated in store
      min_stock_alert: Number(artMinAlert),
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
    };

    onUpdateArticles([created, ...articles]);
    alert(`Article ${created.article_code} successfully registered in Catalog!`);
    
    // Reset fields
    setArtCode('');
    setArtName('');
    setArtPrice('');
    setArtMinAlert('5');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      alert('User Name, Email, and Password are required.');
      return;
    }

    const created: User = {
      id: generateId('u-'),
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
      is_active: true,
    };

    onUpdateUsers([...users, created]);
    alert(`User account created for ${created.name} (${created.role})!`);
    
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
  };

  const handleToggleUserActive = (id: string) => {
    onUpdateUsers(users.map(u => {
      if (u.id === id) {
        if (u.role === 'admin') {
          alert('The primary Admin account cannot be deactivated for security reasons.');
          return u;
        }
        return { ...u, is_active: !u.is_active };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
          System settings & Administration
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure business metadata, register catalog items, and authorize department user roles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Business Metadata Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-slate-500" />
              <span>Business Profile Credentials</span>
            </h3>

            <form onSubmit={handleSaveBizInfo} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Trading Name</label>
                <input
                  type="text"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Address</label>
                <textarea
                  value={bizAddress}
                  onChange={e => setBizAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Line</label>
                <input
                  type="text"
                  value={bizPhone}
                  onChange={e => setBizPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Billing Email</label>
                <input
                  type="email"
                  value={bizEmail}
                  onChange={e => setBizEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">GSTIN Code</label>
                <input
                  type="text"
                  value={bizGst}
                  onChange={e => setBizGst(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Overdue Days Limit</label>
                <input
                  type="number"
                  min="1"
                  value={bizDueDays}
                  onChange={e => setBizDueDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Save Business Profile
              </button>
            </form>
          </div>
        </div>

        {/* Panel 2: Article Master creation */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <FolderKanban className="w-4.5 h-4.5 text-slate-500" />
              <span>Catalog Article Master Entry</span>
            </h3>

            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Article Code *</label>
                <input
                  type="text"
                  placeholder="e.g. ART-008"
                  value={artCode}
                  onChange={e => setArtCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Article Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Custom Marble Base Trophy"
                  value={artName}
                  onChange={e => setArtName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category Group</label>
                <select
                  value={artCat}
                  onChange={e => setArtCat(e.target.value as ArticleCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold"
                >
                  <option value="Trophy">Trophy</option>
                  <option value="Medal">Medal</option>
                  <option value="Shield">Shield</option>
                  <option value="Plaque">Plaque</option>
                  <option value="Other">Other customized items</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Standard Unit Price (INR) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1200"
                  value={artPrice}
                  onChange={e => setArtPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Safety Threshold Alert Limit</label>
                <input
                  type="number"
                  min="0"
                  value={artMinAlert}
                  onChange={e => setArtMinAlert(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Register Catalog Article
              </button>
            </form>
          </div>
        </div>

        {/* Panel 3: User authorization */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-slate-500" />
              <span>Department Authorization Ledger</span>
            </h3>

            {/* Quick Create User */}
            <form onSubmit={handleCreateUser} className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Authorize New Team Member</span>
              <input
                type="text"
                placeholder="Name"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1.5"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email address"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5"
                />
                <input
                  type="password"
                  placeholder="Set Password"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 flex-1 font-semibold"
                >
                  <option value="sales">Sales</option>
                  <option value="store">Store</option>
                  <option value="production">Production</option>
                  <option value="design">Design</option>
                  <option value="packing">Fitting/Packing</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-slate-800 transition"
                >
                  Create
                </button>
              </div>
            </form>

            {/* Users list */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs bg-slate-50/50 hover:bg-slate-50 transition">
                  <div>
                    <strong className="font-semibold text-slate-800 block">{u.name}</strong>
                    <span className="text-[10px] text-slate-500 block capitalize">{u.role} • {u.email}</span>
                  </div>
                  <div className="flex items-center">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUserActive(u.id)}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title={u.is_active ? "Deactivate User" : "Activate User"}
                      >
                        {u.is_active ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    )}
                    {u.role === 'admin' && (
                      <div className="p-1 cursor-not-allowed opacity-50" title="Admin account cannot be deactivated">
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
