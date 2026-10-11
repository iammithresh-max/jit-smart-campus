/**
 * JIT SMART CAMPUS - Storage & State Management
 * Handles persistent state, queue calculations, crowd levels, and order operations.
 * NOTE: As per strict security requirements, DOB or sensitive credentials are NEVER stored in localStorage.
 */

import { INITIAL_CANTEEN_MENU, INITIAL_STATIONERY_ITEMS, INITIAL_PRINT_RATES, INITIAL_ORDERS } from './data.js';

const STORAGE_KEYS = {
  CANTEEN_MENU: 'jit_canteen_menu_v1',
  STATIONERY_ITEMS: 'jit_stationery_items_v1',
  PRINT_RATES: 'jit_print_rates_v1',
  ORDERS: 'jit_orders_v1',
  SESSION: 'jit_auth_session_safe_v1',
  CART: 'jit_cart_state_v1',
  TOKEN_COUNTERS: 'jit_token_seq_v1'
};

// Initialize persistent stores if not already present
export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.CANTEEN_MENU)) {
    localStorage.setItem(STORAGE_KEYS.CANTEEN_MENU, JSON.stringify(INITIAL_CANTEEN_MENU));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STATIONERY_ITEMS)) {
    localStorage.setItem(STORAGE_KEYS.STATIONERY_ITEMS, JSON.stringify(INITIAL_STATIONERY_ITEMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRINT_RATES)) {
    localStorage.setItem(STORAGE_KEYS.PRINT_RATES, JSON.stringify(INITIAL_PRINT_RATES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  } else {
    // Migration: Update any legacy demo student reg numbers to the 3 authorized accounts
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      let updated = false;
      const migrated = existing.map(o => {
        if (o.studentRegNo === '21CS042') {
          updated = true;
          return { ...o, studentRegNo: '711125104066', studentName: 'Mithresh Kanna S' };
        }
        if (o.studentRegNo === '21EC015') {
          updated = true;
          return { ...o, studentRegNo: '711125104069', studentName: 'MuthuChellaKumar' };
        }
        if (o.studentRegNo === '21ME033') {
          updated = true;
          return { ...o, studentRegNo: '711125104114', studentName: 'Udhaya K' };
        }
        return o;
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(migrated));
      }
    } catch (e) {}
  }

  // Clear legacy sessions if pointing to old default account
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
    if (session && (session.regNo === '21CS042' || session.regNo === '21EC015' || session.regNo === '21ME033')) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch (e) {}

  if (!localStorage.getItem(STORAGE_KEYS.TOKEN_COUNTERS)) {
    localStorage.setItem(STORAGE_KEYS.TOKEN_COUNTERS, JSON.stringify({
      canteen: 24,
      stationery: 12,
      printing: 6
    }));
  }
}

// ----------------- MENU & PRODUCTS -----------------
export function getCanteenMenu() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CANTEEN_MENU);
    return data ? JSON.parse(data) : INITIAL_CANTEEN_MENU;
  } catch (e) {
    return INITIAL_CANTEEN_MENU;
  }
}

export function saveCanteenMenu(items) {
  localStorage.setItem(STORAGE_KEYS.CANTEEN_MENU, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('jit:menu_updated'));
}

export function getStationeryItems() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATIONERY_ITEMS);
    return data ? JSON.parse(data) : INITIAL_STATIONERY_ITEMS;
  } catch (e) {
    return INITIAL_STATIONERY_ITEMS;
  }
}

export function saveStationeryItems(items) {
  localStorage.setItem(STORAGE_KEYS.STATIONERY_ITEMS, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('jit:inventory_updated'));
}

export function getPrintRates() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRINT_RATES);
    return data ? JSON.parse(data) : INITIAL_PRINT_RATES;
  } catch (e) {
    return INITIAL_PRINT_RATES;
  }
}

export function savePrintRates(rates) {
  localStorage.setItem(STORAGE_KEYS.PRINT_RATES, JSON.stringify(rates));
  window.dispatchEvent(new CustomEvent('jit:print_rates_updated'));
}

// ----------------- AUTH SESSION (SAFE: NO DOB) -----------------
export function getSafeSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function setSafeSession(user) {
  // STRICT: Strip any DOB or password-like attributes before writing to storage
  const safePayload = {
    regNo: user.regNo,
    name: user.name,
    department: user.department,
    role: user.role,
    year: user.year || 'Student',
    phone: user.phone || '',
    avatar: user.avatar || '🎓',
    loginTimestamp: Date.now(),
    token: `JIT-AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safePayload));
  window.dispatchEvent(new CustomEvent('jit:auth_changed', { detail: safePayload }));
  return safePayload;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  window.dispatchEvent(new CustomEvent('jit:auth_changed', { detail: null }));
}

// ----------------- ORDERS & QUEUE ENGINE -----------------
export function getAllOrders() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveAllOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent('jit:orders_updated'));
}

export function getOrderById(orderId) {
  const orders = getAllOrders();
  return orders.find(o => o.orderId === orderId);
}

export function getOrdersByStudent(regNo) {
  const orders = getAllOrders();
  return orders.filter(o => o.studentRegNo === regNo);
}

/**
 * Calculates crowd level and waiting time from actual active queue data.
 * Does not use random values.
 */
export function getShopCrowdStats(shopType) {
  const orders = getAllOrders();
  // Active means pending processing:
  const activeOrders = orders.filter(o => {
    if (o.shop !== shopType) return false;
    if (shopType === 'canteen') {
      return o.status === 'Confirmed' || o.status === 'Preparing';
    } else if (shopType === 'stationery') {
      return o.status === 'Confirmed' || o.status === 'Processing';
    } else if (shopType === 'printing') {
      return o.status === 'Confirmed' || o.status === 'Printing in Progress';
    }
    return false;
  });

  const count = activeOrders.length;
  let level = 'Low Crowd';
  let badgeColor = 'green';
  let waitMin = Math.max(3, count * 2);
  let waitMax = Math.max(5, count * 3 + 4);

  if (count === 0) {
    level = 'Low Crowd';
    badgeColor = 'green';
    waitMin = 2;
    waitMax = 5;
  } else if (count <= 3) {
    level = 'Low Crowd';
    badgeColor = 'green';
  } else if (count <= 7) {
    level = 'Moderate Crowd';
    badgeColor = 'yellow';
  } else {
    level = 'High Crowd';
    badgeColor = 'red';
  }

  return {
    shopType,
    activeCount: count,
    crowdLevel: level,
    badgeColor,
    estimatedWaitText: `${waitMin}–${waitMax} mins`,
    waitMinutesAvg: Math.round((waitMin + waitMax) / 2)
  };
}

/**
 * Allocate the next unique token and calculate real-time queue position
 */
export function allocateNextToken(shopType) {
  let counters = { canteen: 24, stationery: 12, printing: 6 };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOKEN_COUNTERS);
    if (raw) counters = JSON.parse(raw);
  } catch (e) { }

  let prefix = 'C';
  if (shopType === 'stationery') prefix = 'S';
  if (shopType === 'printing') prefix = 'P';

  counters[shopType] = (counters[shopType] || 0) + 1;
  const num = counters[shopType];
  localStorage.setItem(STORAGE_KEYS.TOKEN_COUNTERS, JSON.stringify(counters));

  const padded = String(num).padStart(3, '0');
  const tokenString = `${prefix}-${padded}`;

  return tokenString;
}

/**
 * Compute real-time queue position and orders ahead for an active order
 */
export function computeOrderQueuePosition(orderId) {
  const orders = getAllOrders();
  const target = orders.find(o => o.orderId === orderId);
  if (!target) return { queuePos: 0, ordersAhead: 0, status: 'Not Found' };

  if (target.status === 'Completed' || target.status === 'Cancelled') {
    return { queuePos: 0, ordersAhead: 0, status: target.status };
  }

  if (target.status === 'Ready for Collection') {
    return { queuePos: 1, ordersAhead: 0, status: target.status };
  }

  // Active uncompleted orders before this order in same shop
  const sameShopActive = orders.filter(o =>
    o.shop === target.shop &&
    o.status !== 'Completed' &&
    o.status !== 'Cancelled'
  );

  // Sort by createdAt ascending
  sameShopActive.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const idx = sameShopActive.findIndex(o => o.orderId === orderId);
  const queuePos = idx !== -1 ? idx + 1 : 1;
  const ordersAhead = Math.max(0, queuePos - 1);

  return {
    queuePos,
    ordersAhead,
    status: target.status
  };
}

/**
 * Server-side order creation simulation with stock verification & token assignment
 */
export function createVerifiedOrder({ shop, items, printConfig, totalAmount, studentRegNo, studentName, paymentDetails }) {
  // 1. Verify stock if stationery
  if (shop === 'stationery' && items && items.length > 0) {
    const currentInventory = getStationeryItems();
    for (const item of items) {
      const stockItem = currentInventory.find(i => i.id === item.id);
      if (stockItem && stockItem.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${stockItem.stock}`);
      }
    }
    // Deduct stock
    for (const item of items) {
      const stockItem = currentInventory.find(i => i.id === item.id);
      if (stockItem) {
        stockItem.stock -= item.quantity;
      }
    }
    saveStationeryItems(currentInventory);
  }

  // 2. Allocate guaranteed unique token from counter
  const token = allocateNextToken(shop);

  // 3. Generate Unique Order ID
  const orderId = `JIT-ORD-${Date.now().toString().slice(-6)}`;

  // 4. Initial status
  const initialStatus = 'Confirmed';

  const newOrder = {
    orderId,
    shop, // 'canteen' | 'stationery' | 'printing'
    token,
    studentRegNo,
    studentName,
    items: items || [],
    printConfig: printConfig || null,
    totalAmount,
    status: initialStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payment: {
      method: paymentDetails.method,
      status: paymentDetails.status || (paymentDetails.method === 'Pay on Delivery' ? 'Pay on Delivery' : 'Unverified'),
      txnId: paymentDetails.txnId || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      verifiedAt: paymentDetails.status === 'VERIFIED' ? new Date().toISOString() : null
    },
    pickupLocation: shop === 'canteen'
      ? 'Canteen Counter 1 & 2'
      : shop === 'stationery'
        ? 'Stationery Dispatch Counter'
        : 'Reprographics Center (Printing Room)'
  };

  const allOrders = getAllOrders();
  allOrders.unshift(newOrder); // newest first
  saveAllOrders(allOrders);

  return newOrder;
}

/**
 * Update order status (Used by Staff/Admin)
 */
export function updateOrderStatus(orderId, nextStatus) {
  const orders = getAllOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return null;

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  saveAllOrders(orders);

  window.dispatchEvent(new CustomEvent('jit:order_status_changed', { detail: order }));
  return order;
}

// ----------------- CART MANAGEMENT -----------------
export function getCartState() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    return data ? JSON.parse(data) : {
      activeShop: null, // 'canteen' | 'stationery' | 'printing'
      canteenItems: [],
      stationeryItems: [],
      printJob: null
    };
  } catch (e) {
    return {
      activeShop: null,
      canteenItems: [],
      stationeryItems: [],
      printJob: null
    };
  }
}

export function saveCartState(cart) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('jit:cart_updated', { detail: cart }));
}

export function clearCart(shopType) {
  const cart = getCartState();
  if (shopType === 'canteen') {
    cart.canteenItems = [];
  } else if (shopType === 'stationery') {
    cart.stationeryItems = [];
  } else if (shopType === 'printing') {
    cart.printJob = null;
  } else {
    cart.canteenItems = [];
    cart.stationeryItems = [];
    cart.printJob = null;
    cart.activeShop = null;
  }
  saveCartState(cart);
}
