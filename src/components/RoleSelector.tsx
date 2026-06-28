/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Notification, UserRole } from '../types';
import { Bell, UserCheck, Shield, ChevronDown, Check, Trash } from 'lucide-react';

interface RoleSelectorProps {
  currentUser: User;
  onLogout: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onNavigateToOrder: (orderId: string) => void;
}

export default function RoleSelector({
  currentUser,
  onLogout,
  notifications,
  onMarkRead,
  onClearAll,
  onNavigateToOrder,
}: RoleSelectorProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter notifications relevant to current role
  const activeNotifications = notifications.filter(
    n => n.recipient_role === currentUser.role || n.recipient_role === 'all'
  );
  const unreadCount = activeNotifications.filter(n => !n.is_read).length;

  return (
    <div id="role-selector-bar" className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label="trophy">🏆</span>
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight leading-none text-white flex items-center gap-1.5">
            TrophyOps
          </h1>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Business Management System
          </span>
        </div>
      </div>

      {/* Acting as Control Panel */}
      <div className="flex items-center gap-4">
        {/* Role Selector Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-800 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Logged in as: </span>
            <strong className="text-emerald-300 capitalize">{currentUser.name} ({currentUser.role})</strong>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg border border-slate-700 hover:border-red-500/30 transition-all text-sm font-medium cursor-pointer"
            title="Sign out"
          >
            <span>Log out</span>
          </button>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            id="notification-bell-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
            }}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
              <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  {currentUser.role.toUpperCase()} Notifications ({unreadCount} unread)
                </span>
                {activeNotifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto">
                {activeNotifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No notifications for {currentUser.role}
                  </div>
                ) : (
                  activeNotifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-slate-700/50 hover:bg-slate-700/40 transition text-xs flex gap-2 ${
                        !n.is_read ? 'bg-slate-700/20 border-l-2 border-emerald-400' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-slate-200">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {n.order_id && (
                            <button
                              onClick={() => {
                                onNavigateToOrder(n.order_id!);
                                setShowNotifications(false);
                              }}
                              className="text-emerald-400 hover:underline cursor-pointer"
                            >
                              View Order
                            </button>
                          )}
                        </div>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => onMarkRead(n.id)}
                          className="text-slate-400 hover:text-white cursor-pointer self-start"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
