/**
 * JIT SMART CAMPUS - Storage & State Management
 * Handles persistent state, queue calculations, crowd levels, and order operations.
 * NOTE: As per strict security requirements, DOB or sensitive credentials are NEVER stored in localStorage.
 */

import { INITIAL_CANTEEN_MENU, INITIAL_STATIONERY_ITEMS, INITIAL_PRINT_RATES, INITIAL_ORDERS, DEMO_WORKER_ACCOUNTS, DEMO_OWNER_ACCOUNTS } from './data.js';

const STORAGE_KEYS = {
  CANTEEN_MENU: 'jit_canteen_menu_v1',
  STATIONERY_ITEMS: 'jit_stationery_items_v1',
  PRINT_RATES: 'jit_print_rates_v1',
  ORDERS: 'jit_orders_v1',
  SESSION: 'jit_auth_session_safe_v1',
  CART: 'jit_cart_state_v1',
  TOKEN_COUNTERS: 'jit_token_seq_v1',
  COLLECTION_RECORDS: 'jit_collection_records_v1',
  AUDIT_LOGS: 'jit_audit_logs_v1',
  WORKERS: 'jit_workers_v1',
  OWNERS: 'jit_owners_v1'
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
  if (!localStorage.getItem(STORAGE_KEYS.WORKERS)) {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(DEMO_WORKER_ACCOUNTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.OWNERS)) {
    localStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(DEMO_OWNER_ACCOUNTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COLLECTION_RECORDS)) {
    localStorage.setItem(STORAGE_KEYS.COLLECTION_RECORDS, JSON.stringify([
      {
        collectionId: 'COL-001',
        orderId: 'JIT-ORD-1021',
        token: 'S-009',
        shop: 'stationery',
        amount: 110,
        staffId: 'JIT-W003',
        staffName: 'Ramesh Kumar',
        timestamp: '2026-10-14T09:35:00.000Z'
      }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([
      {
        logId: 'AUD-001',
        action: 'ORDER_STATUS_UPDATE',
        actorId: 'JIT-W001',
        actorRole: 'WORKER',
        details: 'Order JIT-ORD-1018 marked Completed',
        timestamp: '2026-10-14T08:15:00.000Z'
      },
      {
        logId: 'AUD-002',
        action: 'POD_PAYMENT_COLLECTION',
        actorId: 'JIT-W003',
        actorRole: 'WORKER',
        details: 'Collected ₹110 for order JIT-ORD-1021 (Token S-009)',
        timestamp: '2026-10-14T09:35:00.000Z'
      }
    ]));
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

  // Initial and recurring cross-device backend database synchronization
  syncStorageWithBackend();
  if (!backendSyncTimer && typeof window !== 'undefined') {
    backendSyncTimer = setInterval(syncStorageWithBackend, 4000);
  }
}

let backendSyncTimer = null;

export async function syncStorageWithBackend() {
  try {
    const { apiGetAllOrders } = await import('./api.js');
    const backendOrders = await apiGetAllOrders();
    if (backendOrders && Array.isArray(backendOrders) && backendOrders.length > 0) {
      const localOrders = getAllOrders();
      const localMap = new Map(localOrders.map(o => [o.orderId, o]));
      let hasChanges = false;

      backendOrders.forEach(bOrder => {
        const local = localMap.get(bOrder.orderId);
        if (!local) {
          localMap.set(bOrder.orderId, bOrder);
          hasChanges = true;
        } else {
          const bTime = new Date(bOrder.updatedAt || bOrder.createdAt || 0).getTime();
          const lTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
          if (bOrder.status !== local.status || bOrder.payment?.status !== local.payment?.status || bTime > lTime) {
            localMap.set(bOrder.orderId, { ...local, ...bOrder });
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        const merged = Array.from(localMap.values());
        merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('jit:orders_updated', { detail: { source: 'backend_sync' } }));
      }
    }
  } catch (e) {}
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
  if (!user) return null;
  // STRICT: Strip any DOB or password-like attributes before writing to storage
  const safePayload = {
    ...user,
    loginTimestamp: Date.now(),
    token: user.token || `JIT-AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
  // Strictly remove sensitive credentials and DOB from browser session
  delete safePayload.dob;
  delete safePayload.pin;
  delete safePayload.password;
  delete safePayload.secret;

  // Ensure safe avatar fallback, never undefined
  if (!safePayload.avatar || safePayload.avatar === 'undefined') {
    safePayload.avatar = safePayload.role === 'WORKER' ? '👷' : (safePayload.role === 'SHOP_OWNER' ? '👔' : '👨‍🎓');
  }

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
  if (!regNo) return [];
  const clean = String(regNo).trim().toUpperCase();
  const orders = getAllOrders();
  return orders.filter(o => (o.studentRegNo || '').trim().toUpperCase() === clean);
}

/**
 * Calculates crowd level and waiting time from actual active queue data.
 * Does not use random values.
 */
export function getShopCrowdStats(shopType) {
  const orders = getAllOrders();
  const inactiveStatuses = ['completed', 'collected', 'cancelled', 'rejected'];
  // Active means pending processing:
  const activeOrders = orders.filter(o => {
    if (o.shop !== shopType) return false;
    const s = (o.status || '').toLowerCase().trim();
    if (inactiveStatuses.includes(s)) return false;
    return true;
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

  const inactiveStatuses = ['completed', 'collected', 'cancelled', 'rejected'];
  const targetStatusLower = (target.status || '').toLowerCase().trim();
  if (inactiveStatuses.includes(targetStatusLower)) {
    return { queuePos: 0, ordersAhead: 0, status: target.status };
  }

  if (target.status === 'Ready for Collection' || target.status === 'Ready for Pickup') {
    return { queuePos: 1, ordersAhead: 0, status: target.status };
  }

  // Active uncompleted orders before this order in same shop
  const sameShopActive = orders.filter(o =>
    o.shop === target.shop &&
    !inactiveStatuses.includes((o.status || '').toLowerCase().trim())
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

  // 4. Initial status and payment status separation
  const isPod = (paymentDetails.method === 'Pay on Delivery' || paymentDetails.method === 'POD');
  const initialStatus = isPod ? 'PLACED' : (paymentDetails.status === 'PAID' ? 'Confirmed' : 'Pending Verification');
  const initialPaymentStatus = isPod ? 'NOT PAID' : (paymentDetails.status || 'UNVERIFIED');

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
      method: isPod ? 'Pay on Delivery' : paymentDetails.method,
      status: initialPaymentStatus,
      txnId: paymentDetails.txnId || (isPod ? `COD-${Math.floor(100000 + Math.random() * 900000)}` : `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`),
      verifiedAt: (!isPod && initialPaymentStatus === 'PAID') ? new Date().toISOString() : null,
      collectedBy: null,
      collectedByName: null,
      collectedAt: null,
      collectedAmount: null
    },
    pickupLocation: shop === 'canteen'
      ? 'Canteen Counter 1 & 2'
      : shop === 'stationery'
        ? 'Stationery Dispatch Counter'
        : 'Reprographics Center (Printing Room)',
    statusHistory: [
      {
        status: initialStatus,
        updatedBy: studentRegNo || 'STUDENT',
        updatedByName: studentName || 'Student',
        timestamp: new Date().toISOString()
      }
    ],
    responsibleWorkerId: null,
    responsibleWorkerName: null,
    rejectionReason: null
  };

  const allOrders = getAllOrders();
  allOrders.unshift(newOrder); // newest first
  saveAllOrders(allOrders);

  // Add order creation audit log
  addAuditLog(
    'ORDER_CREATED',
    studentRegNo,
    'STUDENT',
    `Created ${shop} order ${orderId} (Token ${token}) for ₹${totalAmount}. Payment: ${initialPaymentStatus}`
  );

  // Async sync to backend server
  import('./api.js').then(({ apiCreateOrder }) => {
    apiCreateOrder({
      shop,
      items,
      totalAmount,
      studentRegNo,
      studentName,
      paymentDetails
    }).catch(() => {});
  }).catch(() => {});

  return newOrder;
}

/**
 * ----------------- PAY ON DELIVERY CASH COLLECTION -----------------
 * Confirms receipt of physical cash by an authorized worker or owner.
 * Strict RBAC, duplicate prevention, and audit logging.
 */
export function recordPodPaymentCollection(orderId, staffSession) {
  if (!orderId) throw new Error('Order ID is required.');
  if (!staffSession) throw new Error('Staff authorization required to collect payment.');

  // Validate Staff Role
  const role = staffSession.role;
  if (role === 'student' || role === 'STUDENT') {
    throw new Error('Unauthorized: Students cannot record payment collections.');
  }

  const orders = getAllOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  // Verify payment method is Pay on Delivery
  if (order.payment.method !== 'Pay on Delivery' && order.payment.method !== 'POD') {
    throw new Error(`Order ${orderId} is not a Pay on Delivery order.`);
  }

  // Prevent duplicate collection
  if (order.payment.status === 'PAID') {
    throw new Error(`Payment has already been collected for order ${orderId} at ${new Date(order.payment.collectedAt).toLocaleTimeString()}.`);
  }

  // RBAC Permission Check
  if (role === 'WORKER') {
    if (!staffSession.canCollectPayment) {
      throw new Error(`Worker ${staffSession.name} (${staffSession.empId}) is not authorized to collect cash payments.`);
    }
    if (staffSession.assignedShop && staffSession.assignedShop !== order.shop) {
      throw new Error(`Worker assigned to ${staffSession.assignedShop} cannot collect payment for ${order.shop} orders.`);
    }
  } else if (role === 'SHOP_OWNER') {
    if (staffSession.assignedShops && !staffSession.assignedShops.includes(order.shop)) {
      throw new Error(`Shop Owner is not authorized for ${order.shop} outlet.`);
    }
  }

  const staffId = staffSession.empId || staffSession.ownerId || staffSession.adminId || 'STAFF';
  const staffName = staffSession.name || 'Authorized Staff';
  const nowIso = new Date().toISOString();

  // 1. Update Order Payment
  order.payment.status = 'PAID';
  order.payment.collectedBy = staffId;
  order.payment.collectedByName = staffName;
  order.payment.collectedAt = nowIso;
  order.payment.collectedAmount = order.totalAmount;
  order.updatedAt = nowIso;

  // If order was in PLACED state, advance to Confirmed/Processing
  if (order.status === 'PLACED') {
    order.status = order.shop === 'canteen' ? 'Preparing' : (order.shop === 'stationery' ? 'Processing' : 'Printing in Progress');
  }

  saveAllOrders(orders);

  // 2. Record in Collection Records
  const collectionRecord = {
    collectionId: `COL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    orderId: order.orderId,
    token: order.token,
    shop: order.shop,
    amount: order.totalAmount,
    staffId,
    staffName,
    timestamp: nowIso
  };

  const records = getCollectionRecords();
  records.unshift(collectionRecord);
  saveCollectionRecords(records);

  // 3. Add to Audit Log
  addAuditLog(
    'POD_PAYMENT_COLLECTION',
    staffId,
    role,
    `Collected ₹${order.totalAmount} for order ${order.orderId} (Token ${order.token}) at ${order.shop}`
  );

  window.dispatchEvent(new CustomEvent('jit:payment_collected', { detail: { order, collectionRecord } }));
  window.dispatchEvent(new CustomEvent('jit:orders_updated'));

  return {
    success: true,
    message: 'Payment Received Successfully',
    orderId: order.orderId,
    token: order.token,
    amount: order.totalAmount,
    collectedAt: nowIso,
    staffName,
    staffId
  };
}

// ----------------- COLLECTION RECORDS & AUDIT -----------------
export function getCollectionRecords(shopFilter = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTION_RECORDS);
    const list = raw ? JSON.parse(raw) : [];
    if (shopFilter) {
      return list.filter(r => r.shop === shopFilter);
    }
    return list;
  } catch (e) {
    return [];
  }
}

export function saveCollectionRecords(records) {
  localStorage.setItem(STORAGE_KEYS.COLLECTION_RECORDS, JSON.stringify(records));
}

export function getAuditLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addAuditLog(action, actorId, actorRole, details) {
  try {
    const logs = getAuditLogs();
    logs.unshift({
      logId: `AUD-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
      action,
      actorId: actorId || 'SYSTEM',
      actorRole: actorRole || 'SYSTEM',
      details,
      timestamp: new Date().toISOString()
    });
    // Keep last 150 logs
    if (logs.length > 150) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  } catch (e) {}
}

// ----------------- WORKERS & OWNERS MANAGEMENT -----------------
export function getWorkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKERS);
    return raw ? JSON.parse(raw) : DEMO_WORKER_ACCOUNTS;
  } catch (e) {
    return DEMO_WORKER_ACCOUNTS;
  }
}

export function saveWorkers(workers) {
  localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
}

export function updateWorkerPermission(empId, canCollectPayment, actorSession) {
  const workers = getWorkers();
  const worker = workers.find(w => w.empId === empId);
  if (!worker) throw new Error(`Worker ${empId} not found.`);

  worker.canCollectPayment = !!canCollectPayment;
  saveWorkers(workers);

  addAuditLog(
    'WORKER_PERMISSION_UPDATED',
    actorSession ? (actorSession.ownerId || actorSession.empId) : 'ADMIN',
    actorSession ? actorSession.role : 'ADMIN',
    `Updated payment collection permission for ${worker.name} (${worker.empId}) to: ${canCollectPayment}`
  );

  return worker;
}

export function getOwners() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OWNERS);
    return raw ? JSON.parse(raw) : DEMO_OWNER_ACCOUNTS;
  } catch (e) {
    return DEMO_OWNER_ACCOUNTS;
  }
}

/**
 * Update order status (Used by Staff/Admin)
 * Enforces worker shop isolation, mandatory rejection reasons, duplicate prevention, and status audit trail.
 */
export function updateOrderStatus(orderId, nextStatus, staffSession = null, rejectionReason = '') {
  if (!orderId) throw new Error('Order ID is required.');
  if (!nextStatus) throw new Error('Target status is required.');

  const orders = getAllOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  // 1. RBAC Shop Isolation Check for workers
  if (staffSession && (staffSession.role === 'WORKER' || (staffSession.role || '').toLowerCase().includes('worker') || (staffSession.role || '').toLowerCase().includes('staff'))) {
    if (staffSession.assignedShop && staffSession.assignedShop !== order.shop) {
      throw new Error(`Unauthorized: Worker assigned to ${staffSession.assignedShop} cannot update ${order.shop} orders.`);
    }
  }

  // 2. Prevent duplicate or invalid action on closed orders
  const currentStatusLower = (order.status || '').toLowerCase().trim();
  if (currentStatusLower === nextStatus.toLowerCase().trim()) {
    throw new Error(`Order ${orderId} is already in ${nextStatus} state.`);
  }
  if (currentStatusLower === 'completed' || currentStatusLower === 'collected') {
    throw new Error(`Order ${orderId} has already been completed and collected.`);
  }
  if (currentStatusLower === 'rejected') {
    throw new Error(`Order ${orderId} has already been rejected.`);
  }
  if (currentStatusLower === 'cancelled') {
    throw new Error(`Order ${orderId} has been cancelled.`);
  }

  // 3. Mandatory rejection reason check
  if (nextStatus === 'Rejected') {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A mandatory rejection reason is required to reject an order.');
    }
  }

  const oldStatus = order.status;
  const nowIso = new Date().toISOString();
  const workerId = staffSession ? (staffSession.empId || staffSession.ownerId || staffSession.adminId || 'STAFF') : 'STAFF';
  const workerName = staffSession ? (staffSession.name || 'Authorized Staff') : 'Authorized Staff';

  order.status = nextStatus;
  order.updatedAt = nowIso;
  order.responsibleWorkerId = workerId;
  order.responsibleWorkerName = workerName;

  if (nextStatus === 'Rejected') {
    order.rejectionReason = rejectionReason.trim();
  }

  if (!order.statusHistory) {
    order.statusHistory = [
      {
        status: oldStatus,
        updatedBy: order.studentRegNo || 'STUDENT',
        updatedByName: order.studentName || 'Student',
        timestamp: order.createdAt || nowIso
      }
    ];
  }

  order.statusHistory.push({
    status: nextStatus,
    updatedBy: workerId,
    updatedByName: workerName,
    timestamp: nowIso,
    reason: nextStatus === 'Rejected' ? rejectionReason.trim() : null
  });

  saveAllOrders(orders);

  addAuditLog(
    'ORDER_STATUS_CHANGED',
    workerId,
    staffSession ? staffSession.role : 'STAFF',
    `Order ${orderId} status changed from "${oldStatus}" to "${nextStatus}" by ${workerName} (${workerId})${nextStatus === 'Rejected' ? ` - Reason: ${rejectionReason.trim()}` : ''}`
  );

  // Sync to shared backend API asynchronously
  import('./api.js').then(({ apiUpdateOrderStatus }) => {
    apiUpdateOrderStatus(orderId, nextStatus, staffSession, rejectionReason).catch(() => {});
  }).catch(() => {});

  window.dispatchEvent(new CustomEvent('jit:order_status_changed', { detail: order }));
  window.dispatchEvent(new CustomEvent('jit:orders_updated', { detail: { order, updatedOrderId: orderId } }));
  return order;
}

// ----------------- CART MANAGEMENT (STUDENT-ISOLATED) -----------------
function getStudentCartKey() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
    if (session && session.regNo) {
      return `${STORAGE_KEYS.CART}_${session.regNo}`;
    }
  } catch (e) {}
  return STORAGE_KEYS.CART;
}

export function getCartState() {
  try {
    const key = getStudentCartKey();
    const data = localStorage.getItem(key);
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
  const key = getStudentCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
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
