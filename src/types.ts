/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'sales' | 'store' | 'production' | 'design' | 'packing';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Client {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  gst_number: string;
  notes: string;
  created_at: string;
}

export type ArticleCategory = 'Trophy' | 'Medal' | 'Shield' | 'Plaque' | 'Other';

export interface Article {
  id: string;
  article_code: string;
  name: string;
  category: ArticleCategory;
  unit_price: number;
  stock_qty: number;
  min_stock_alert: number;
  is_active: boolean;
  created_at: string;
}

export type OrderStatus =
  | 'received'
  | 'inventory_check'
  | 'in_production'
  | 'production_done'
  | 'design_in_progress'
  | 'design_approved'
  | 'packing'
  | 'dispatched'
  | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  created_by: string; // User Name / User ID
  order_date: string;
  expected_delivery_date: string;
  status: OrderStatus;
  special_instructions: string;
  courier_name: string;
  tracking_number: string;
  dispatch_date: string;
  cancellation_reason: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  article_id: string;
  quantity_ordered: number;
  quantity_available_in_store: number; // filled by Store
  quantity_to_produce: number; // auto-calculated: ordered - available
  quantity_produced: number; // filled by Production
  quantity_packed: number; // filled by Packing
  unit_price: number; // snapshot at order time
  custom_text: string; // e.g. engraving text
  design_brief: string;
  design_file_url: string; // uploaded file link / mock preview data
  variance_reason?: string; // reason for packing/dispatch qty changes
}

export interface OrderLog {
  id: string;
  order_id: string;
  changed_by: string; // user display name
  action: string; // 'status_changed', 'qty_updated', 'dispatched', 'inventory_checked', 'production_logged', 'design_uploaded', 'design_approved', 'packed', 'cancelled'
  from_value: string;
  to_value: string;
  notes: string;
  timestamp: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue';

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  generated_by: string;
  subtotal: number;
  discount_amount: number;
  gst_percent: number; // e.g. 18 or 0
  total_amount: number;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
}

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  mode: PaymentMode;
  reference_number: string;
  recorded_by: string;
  notes: string;
}

export interface Notification {
  id: string;
  recipient_role: UserRole | 'all';
  recipient_user_id?: string;
  order_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst_number: string;
  payment_due_days: number; // Configurable overdue threshold
}
