/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

interface DBState {
  users: User[];
  clients: Client[];
  articles: Article[];
  orders: Order[];
  orderItems: OrderItem[];
  orderLogs: OrderLog[];
  invoices: Invoice[];
  payments: Payment[];
  notifications: Notification[];
  businessInfo: BusinessInfo;
  currentUser: User;
}

const STORAGE_KEY = 'trophy_ops_db';

// Helper to generate IDs
export function generateId(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}-${rand}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${rand}`;
}

const DEFAULT_USERS: User[] = [
  { id: 'u-1', name: 'Vance Admin', email: 'admin@trophyops.com', role: 'admin', is_active: true },
  { id: 'u-2', name: 'John Sales', email: 'sales@trophyops.com', role: 'sales', is_active: true },
  { id: 'u-3', name: 'Sarah Store', email: 'store@trophyops.com', role: 'store', is_active: true },
  { id: 'u-4', name: 'Mike Prod', email: 'production@trophyops.com', role: 'production', is_active: true },
  { id: 'u-5', name: 'Emily Design', email: 'design@trophyops.com', role: 'design', is_active: true },
  { id: 'u-6', name: 'David Pack', email: 'packing@trophyops.com', role: 'packing', is_active: true },
];

const DEFAULT_ARTICLES: Article[] = [
  { id: 'art-1', article_code: 'ART-001', name: 'Golden Globe Trophy Classic', category: 'Trophy', unit_price: 1500, stock_qty: 12, min_stock_alert: 5, is_active: true, created_at: '2026-06-01' },
  { id: 'art-2', article_code: 'ART-002', name: 'Silver Winged Victory Trophy', category: 'Trophy', unit_price: 2400, stock_qty: 3, min_stock_alert: 5, is_active: true, created_at: '2026-06-01' },
  { id: 'art-3', article_code: 'ART-003', name: 'Champion Athletics Gold Medal', category: 'Medal', unit_price: 180, stock_qty: 50, min_stock_alert: 20, is_active: true, created_at: '2026-06-01' },
  { id: 'art-4', article_code: 'ART-004', name: 'Runner-up Silver Medal 60mm', category: 'Medal', unit_price: 150, stock_qty: 15, min_stock_alert: 20, is_active: true, created_at: '2026-06-01' },
  { id: 'art-5', article_code: 'ART-005', name: 'Star Achievement Acrylic Plaque', category: 'Plaque', unit_price: 1200, stock_qty: 8, min_stock_alert: 5, is_active: true, created_at: '2026-06-01' },
  { id: 'art-6', article_code: 'ART-006', name: 'Premium Oak Wood Shield', category: 'Shield', unit_price: 3500, stock_qty: 2, min_stock_alert: 3, is_active: true, created_at: '2026-06-01' },
  { id: 'art-7', article_code: 'ART-007', name: 'Custom Crystal Diamond Award', category: 'Plaque', unit_price: 4500, stock_qty: 0, min_stock_alert: 2, is_active: true, created_at: '2026-06-01' },
];

const DEFAULT_CLIENTS: Client[] = [
  { id: 'c-1', shop_name: 'Supreme Sports Hub', owner_name: 'Rajesh Kumar', phone: '+91 98765 43210', whatsapp: '+91 98765 43210', email: 'contact@supremesports.com', address: '12, MG Road, Bangalore - 560001', gst_number: '29AAAAA1111A1Z1', notes: 'Regular bulk buyer of sports medals', created_at: '2026-06-10' },
  { id: 'c-2', shop_name: 'Aone Stationery & Gifts', owner_name: 'Anil Mehta', phone: '+91 99112 23344', whatsapp: '+91 99112 23344', email: 'sales@aonestationers.com', address: '45, Commercial Street, Bangalore - 560001', gst_number: '', notes: 'School event supplier', created_at: '2026-06-12' },
  { id: 'c-3', shop_name: 'City Football Academy', owner_name: 'Coach Stephen', phone: '+91 98450 12345', whatsapp: '+91 98450 12345', email: 'info@cityfootball.org', address: 'HAL Sports Ground, Bangalore - 560017', gst_number: '29BBBBB2222B2Z2', notes: 'High frequency buyer, prompt payments', created_at: '2026-06-15' },
  { id: 'c-4', shop_name: 'Saint Mary High School', owner_name: 'Sister Mary', phone: '+91 91234 56789', whatsapp: '', email: 'stmarys@edu.in', address: 'Koramangala 3rd Block, Bangalore - 560034', gst_number: '', notes: 'Annual order in June/July', created_at: '2026-06-18' },
];

const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: 'TrophyOps customization',
  address: '88, Industrial Layout, Koramangala 5th Block, Bangalore - 560095',
  phone: '+91 80 4455 6677',
  email: 'support@trophyops.com',
  gst_number: '29ABCDE1234F1Z5',
  payment_due_days: 15,
};

function createInitialDB(): DBState {
  const orders: Order[] = [
    {
      id: 'o-1',
      order_number: 'ORD-2026-8801',
      client_id: 'c-1',
      created_by: 'John Sales',
      order_date: '2026-06-15',
      expected_delivery_date: '2026-06-25',
      status: 'dispatched',
      special_instructions: "Engrave 'Champion 2026' on base",
      courier_name: 'BlueDart',
      tracking_number: 'BD8829910',
      dispatch_date: '2026-06-24',
      cancellation_reason: '',
      created_at: '2026-06-15T10:00:00',
      updated_at: '2026-06-24T15:30:00',
    },
    {
      id: 'o-2',
      order_number: 'ORD-2026-8802',
      client_id: 'c-4',
      created_by: 'John Sales',
      order_date: '2026-06-20',
      expected_delivery_date: '2026-07-02',
      status: 'packing',
      special_instructions: "Urgent assembly needed",
      courier_name: '',
      tracking_number: '',
      dispatch_date: '',
      cancellation_reason: '',
      created_at: '2026-06-20T11:20:00',
      updated_at: '2026-06-24T18:10:00',
    },
    {
      id: 'o-3',
      order_number: 'ORD-2026-8803',
      client_id: 'c-2',
      created_by: 'John Sales',
      order_date: '2026-06-25',
      expected_delivery_date: '2026-07-05',
      status: 'in_production',
      special_instructions: "Logo engraving on acrylic star",
      courier_name: '',
      tracking_number: '',
      dispatch_date: '',
      cancellation_reason: '',
      created_at: '2026-06-25T14:30:00',
      updated_at: '2026-06-26T09:15:00',
    },
    {
      id: 'o-4',
      order_number: 'ORD-2026-8804',
      client_id: 'c-3',
      created_by: 'John Sales',
      order_date: '2026-06-26',
      expected_delivery_date: '2026-07-07',
      status: 'inventory_check',
      special_instructions: "Engraving details in brief",
      courier_name: '',
      tracking_number: '',
      dispatch_date: '',
      cancellation_reason: '',
      created_at: '2026-06-26T16:45:00',
      updated_at: '2026-06-26T16:45:00',
    }
  ];

  const orderItems: OrderItem[] = [
    // o-1 (Dispatched)
    {
      id: 'oi-1',
      order_id: 'o-1',
      article_id: 'art-1', // Golden Globe Trophy
      quantity_ordered: 5,
      quantity_available_in_store: 5,
      quantity_to_produce: 0,
      quantity_produced: 0,
      quantity_packed: 5,
      unit_price: 1500,
      custom_text: 'League Winner 2026',
      design_brief: 'Place logo above the engraving text',
      design_file_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300'
    },
    // o-2 (Packing)
    {
      id: 'oi-2',
      order_id: 'o-2',
      article_id: 'art-3', // Gold Medal
      quantity_ordered: 30,
      quantity_available_in_store: 30,
      quantity_to_produce: 0,
      quantity_produced: 0,
      quantity_packed: 0,
      unit_price: 180,
      custom_text: 'Annual Sports Meet 2026 - First Place',
      design_brief: 'Logo in center, school name on rim',
      design_file_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300'
    },
    {
      id: 'oi-3',
      order_id: 'o-2',
      article_id: 'art-4', // Silver Medal
      quantity_ordered: 30,
      quantity_available_in_store: 10,
      quantity_to_produce: 20,
      quantity_produced: 20,
      quantity_packed: 0,
      unit_price: 150,
      custom_text: 'Annual Sports Meet 2026 - Second Place',
      design_brief: 'Logo in center, school name on rim',
      design_file_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300'
    },
    // o-3 (In Production)
    {
      id: 'oi-4',
      order_id: 'o-3',
      article_id: 'art-6', // Oak Wood Shield
      quantity_ordered: 5,
      quantity_available_in_store: 2,
      quantity_to_produce: 3,
      quantity_produced: 0,
      quantity_packed: 0,
      unit_price: 3500,
      custom_text: 'Outstanding School Partner',
      design_brief: 'Golden lettering on oak base',
      design_file_url: ''
    },
    // o-4 (Inventory Check)
    {
      id: 'oi-5',
      order_id: 'o-4',
      article_id: 'art-1', // Golden Globe
      quantity_ordered: 2,
      quantity_available_in_store: 0,
      quantity_to_produce: 0,
      quantity_produced: 0,
      quantity_packed: 0,
      unit_price: 1500,
      custom_text: 'Best Striker',
      design_brief: 'Gold font',
      design_file_url: ''
    },
    {
      id: 'oi-6',
      order_id: 'o-4',
      article_id: 'art-5', // Acrylic Plaque
      quantity_ordered: 10,
      quantity_available_in_store: 0,
      quantity_to_produce: 0,
      quantity_produced: 0,
      quantity_packed: 0,
      unit_price: 1200,
      custom_text: 'Top Scorer',
      design_brief: 'Centred text',
      design_file_url: ''
    }
  ];

  const orderLogs: OrderLog[] = [
    {
      id: generateId('log-'),
      order_id: 'o-1',
      changed_by: 'John Sales',
      action: 'status_changed',
      from_value: 'None',
      to_value: 'received',
      notes: 'Order entered into system',
      timestamp: '2026-06-15T10:00:00',
    },
    {
      id: generateId('log-'),
      order_id: 'o-1',
      changed_by: 'Sarah Store',
      action: 'inventory_checked',
      from_value: 'received',
      to_value: 'design_in_progress',
      notes: 'All items available in stock. Production skipped!',
      timestamp: '2026-06-15T14:10:00',
    },
    {
      id: generateId('log-'),
      order_id: 'o-1',
      changed_by: 'Emily Design',
      action: 'design_uploaded',
      from_value: 'design_in_progress',
      to_value: 'design_in_progress',
      notes: 'Uploaded final CDR design template',
      timestamp: '2026-06-16T11:00:00',
    },
    {
      id: generateId('log-'),
      order_id: 'o-1',
      changed_by: 'Emily Design',
      action: 'design_approved',
      from_value: 'design_in_progress',
      to_value: 'packing',
      notes: 'Client approved via WhatsApp, forwarding to Fitting/Packing',
      timestamp: '2026-06-17T09:30:00',
    },
    {
      id: generateId('log-'),
      order_id: 'o-1',
      changed_by: 'David Pack',
      action: 'packed',
      from_value: 'packing',
      to_value: 'dispatched',
      notes: 'Confirmed 5 items packed. Dispatched via BlueDart',
      timestamp: '2026-06-24T15:30:00',
    },
    // o-2
    {
      id: generateId('log-'),
      order_id: 'o-2',
      changed_by: 'John Sales',
      action: 'status_changed',
      from_value: 'None',
      to_value: 'received',
      notes: 'School Order Created',
      timestamp: '2026-06-20T11:20:00',
    },
    {
      id: generateId('log-'),
      order_id: 'o-2',
      changed_by: 'Sarah Store',
      action: 'inventory_checked',
      from_value: 'received',
      to_value: 'in_production',
      notes: 'Gap of 20 items flagged for Silver Medals (ART-004)',
      timestamp: '2026-06-21T10:15:00',
    },
    {
      id: generateId('log-'),
      order_id: 'o-2',
      changed_by: 'Mike Prod',
      action: 'production_logged',
      from_value: 'in_production',
      to_value: 'production_done',
      notes: 'Completed manufacturing of 20 Silver Medals. Sent to Design',
      timestamp: '2026-06-23T14:40:00',
    },
    {
      id: generateId('log-'),
      order_id: 'o-2',
      changed_by: 'Emily Design',
      action: 'design_approved',
      from_value: 'production_done',
      to_value: 'packing',
      notes: 'Design set approved and ready to assemble',
      timestamp: '2026-06-24T18:10:00',
    }
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv-1',
      invoice_number: 'INV-2026-1001',
      order_id: 'o-1',
      generated_by: 'John Sales',
      subtotal: 7500,
      discount_amount: 500,
      gst_percent: 18,
      total_amount: 8260, // (7500 - 500) * 1.18 = 8260
      invoice_date: '2026-06-24',
      due_date: '2026-07-09',
      status: 'paid'
    },
    {
      id: 'inv-2',
      invoice_number: 'INV-2026-1002',
      order_id: 'o-2',
      generated_by: 'John Sales',
      subtotal: 9900, // 30*180 + 30*150 = 5400 + 4500 = 9900
      discount_amount: 0,
      gst_percent: 18,
      total_amount: 11682, // 9900 * 1.18 = 11682
      invoice_date: '2026-06-25',
      due_date: '2026-07-10',
      status: 'partial'
    }
  ];

  const payments: Payment[] = [
    {
      id: 'pay-1',
      invoice_id: 'inv-1',
      amount: 8260,
      payment_date: '2026-06-24',
      mode: 'upi',
      reference_number: 'REF-UPI-99281',
      recorded_by: 'John Sales',
      notes: 'Received full payment upon dispatch confirmation'
    },
    {
      id: 'pay-2',
      invoice_id: 'inv-2',
      amount: 5000,
      payment_date: '2026-06-25',
      mode: 'bank_transfer',
      reference_number: 'TXN-HDFC-9921',
      recorded_by: 'John Sales',
      notes: 'Initial advance payment'
    }
  ];

  const notifications: Notification[] = [
    {
      id: generateId('nt-'),
      recipient_role: 'store',
      message: 'New order ORD-2026-8804 needs inventory check',
      is_read: false,
      created_at: '2026-06-26T16:45:00',
      order_id: 'o-4'
    },
    {
      id: generateId('nt-'),
      recipient_role: 'production',
      message: 'Production required for ORD-2026-8803: Oak Wood Shield x3',
      is_read: false,
      created_at: '2026-06-25T14:30:00',
      order_id: 'o-3'
    },
    {
      id: generateId('nt-'),
      recipient_role: 'packing',
      message: 'ORD-2026-8802 is ready for packing',
      is_read: false,
      created_at: '2026-06-24T18:10:00',
      order_id: 'o-2'
    },
    {
      id: generateId('nt-'),
      recipient_role: 'sales',
      message: 'ORD-2026-8801 has been dispatched',
      is_read: true,
      created_at: '2026-06-24T15:30:00',
      order_id: 'o-1'
    }
  ];

  return {
    users: DEFAULT_USERS,
    clients: DEFAULT_CLIENTS,
    articles: DEFAULT_ARTICLES,
    orders,
    orderItems,
    orderLogs,
    invoices,
    payments,
    notifications,
    businessInfo: DEFAULT_BUSINESS_INFO,
    currentUser: DEFAULT_USERS[0], // default Vance Admin
  };
}

export function getDatabase(): DBState {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const fresh = createInitialDB();
    saveDatabase(fresh);
    return fresh;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading database', e);
    const fresh = createInitialDB();
    saveDatabase(fresh);
    return fresh;
  }
}

export function saveDatabase(state: DBState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Global helper to add order log
export function addOrderLog(
  state: DBState,
  orderId: string,
  action: string,
  fromVal: string,
  toVal: string,
  notes: string,
  user: string
): DBState {
  const log: OrderLog = {
    id: generateId('log-'),
    order_id: orderId,
    changed_by: user,
    action,
    from_value: fromVal,
    to_value: toVal,
    notes,
    timestamp: new Date().toISOString(),
  };
  state.orderLogs = [log, ...state.orderLogs];
  return state;
}

// Global helper to send custom notifications
export function addNotification(
  state: DBState,
  recipientRole: UserRole | 'all',
  message: string,
  orderId?: string
): DBState {
  const notif: Notification = {
    id: generateId('nt-'),
    recipient_role: recipientRole,
    order_id: orderId,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  state.notifications = [notif, ...state.notifications];
  return state;
}

// Trigger Notifications based on status transitions
export function handleStatusNotificationTrigger(
  state: DBState,
  order: Order,
  previousStatus: OrderStatus,
  user: User
): DBState {
  const ordNum = order.order_number;
  const items = state.orderItems.filter(i => i.order_id === order.id);

  if (order.status === 'received') {
    // Sales submits; notifies Store
    state = addNotification(state, 'store', `New order ${ordNum} needs inventory check`, order.id);
  } else if (order.status === 'inventory_check') {
    // Should generally be checked by Store
  } else if (order.status === 'in_production') {
    // Store marks gap items; notifies Production
    const gapLines = items
      .filter(i => i.quantity_to_produce > 0)
      .map(i => {
        const art = state.articles.find(a => a.id === i.article_id);
        return `${art ? art.name : 'Unknown'} x${i.quantity_to_produce}`;
      })
      .join(', ');
    state = addNotification(
      state,
      'production',
      `Production required for ${ordNum}: ${gapLines || 'None'}`,
      order.id
    );
  } else if (order.status === 'production_done') {
    // Production completed; notifies Design
    state = addNotification(state, 'design', `${ordNum} is ready for design`, order.id);
  } else if (order.status === 'design_in_progress') {
    // Design starts working on customisation
  } else if (order.status === 'design_approved') {
    // Design uploads artwork & approves; auto-notifies Packing
    state = addNotification(state, 'packing', `${ordNum} is ready for packing`, order.id);
  } else if (order.status === 'packing') {
    // Ready for Packing
  } else if (order.status === 'dispatched') {
    // Dispatched; notifies Sales
    state = addNotification(state, 'sales', `${ordNum} has been dispatched via ${order.courier_name}`, order.id);
  } else if (order.status === 'cancelled') {
    // Cancelled with reason
    state = addNotification(state, 'all', `⚠️ Order ${ordNum} has been cancelled: ${order.cancellation_reason}`, order.id);
  }

  return state;
}

// Business Rules Validations
export function validateProductionStart(state: DBState, orderId: string): { allowed: boolean; message?: string } {
  const items = state.orderItems.filter(i => i.order_id === orderId);
  const totalGap = items.reduce((sum, item) => sum + item.quantity_to_produce, 0);
  if (totalGap === 0) {
    return {
      allowed: false,
      message: 'This item is already available in Store (no production needed)',
    };
  }
  return { allowed: true };
}

export function validatePackingQty(
  orderItem: OrderItem,
  qtyPacked: number,
  isAdmin: boolean
): { allowed: boolean; message?: string } {
  if (qtyPacked > orderItem.quantity_ordered && !isAdmin) {
    return {
      allowed: false,
      message: 'Packed qty exceeds ordered qty. Contact Admin to approve.',
    };
  }
  if (qtyPacked < orderItem.quantity_ordered && qtyPacked > 0) {
    // needs reason, but allowed to pack
    return {
      allowed: true,
      message: 'WARNING: Packed quantity is less than ordered quantity. A reason must be recorded.',
    };
  }
  return { allowed: true };
}
