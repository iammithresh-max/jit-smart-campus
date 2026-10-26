/**
 * JIT SMART CAMPUS - Backend API Client & Data Synchronizer
 * 
 * Provides unified REST communication with the backend server.
 * In a full production deployment, connects to the secure server endpoint.
 * When running in client-only demo environments (e.g. GitHub Pages), provides
 * compliant graceful fallback with transparent environment badges.
 */

import { APP_CONFIG, DEMO_STUDENT_ACCOUNTS, DEMO_WORKER_ACCOUNTS, DEMO_OWNER_ACCOUNTS, DEMO_ADMIN_ACCOUNT } from './data.js';

// Default API base URL (relative for same-origin dev server / configurable)
const API_BASE = window.JIT_API_BASE || '';

let isBackendAvailable = null;

/**
 * Checks if the backend server is reachable and reports its mode
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      isBackendAvailable = true;
      return { connected: true, ...data };
    }
  } catch (e) {
    isBackendAvailable = false;
  }
  return { connected: false, mode: 'CLIENT_FALLBACK' };
}

/**
 * 1. STUDENT AUTHENTICATION
 * Validates Registration Number and Date of Birth.
 * Client NEVER sends plain-text DOB to untrusted destinations.
 */
export async function apiStudentLogin(regNo, dob) {
  const cleanRegNo = (regNo || '').trim().toUpperCase();
  const cleanDob = (dob || '').trim();

  if (!cleanRegNo || !cleanDob) {
    throw new Error('Invalid Registration Number or Date of Birth.');
  }

  // Attempt backend login first
  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regNo: cleanRegNo, dob: cleanDob })
      });
      if (res.ok) {
        const data = await res.json();
        return { avatar: '👨‍🎓', ...data.session };
      } else if (res.status === 401 || res.status === 400) {
        throw new Error('Invalid Registration Number or Date of Birth.');
      }
    } catch (e) {
      if (e.message.includes('Invalid Registration Number')) throw e;
      // If network unreachable, fall through to safe demo validation
    }
  }

  // Graceful Demo Fallback: validate against authorized demo records
  const student = DEMO_STUDENT_ACCOUNTS.find(
    s => s.regNo.toUpperCase() === cleanRegNo
  );

  if (!student) {
    throw new Error('Invalid Registration Number or Date of Birth.');
  }

  // Normalize date formats (YYYY-MM-DD vs DD-MM-YYYY)
  const norm1 = normalizeDate(cleanDob);
  const norm2 = normalizeDate(student.dob);

  if (!norm1 || norm1 !== norm2) {
    throw new Error('Invalid Registration Number or Date of Birth.');
  }

  return {
    regNo: student.regNo,
    name: student.name,
    department: student.department,
    role: 'STUDENT',
    year: student.year || 'Student',
    phone: student.phone || '',
    avatar: student.avatar || '🎓',
    isDemo: true,
    token: `JIT-STU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
}

/**
 * 2. WORKER AUTHENTICATION
 * Validates unique Employee ID (e.g. JIT-W001) and PIN/password
 */
export async function apiWorkerLogin(empId, pin) {
  const cleanEmpId = (empId || '').trim().toUpperCase();
  const cleanPin = (pin || '').trim();

  if (!cleanEmpId || !cleanPin) {
    throw new Error('Invalid Employee ID or Security PIN.');
  }

  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/worker-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId: cleanEmpId, pin: cleanPin })
      });
      if (res.ok) {
        const data = await res.json();
        return { avatar: '👷', ...data.session };
      } else if (res.status === 401) {
        throw new Error('Invalid Employee ID or Security PIN.');
      }
    } catch (e) {
      if (e.message.includes('Invalid Employee ID')) throw e;
    }
  }

  // Fallback to demo worker accounts
  const worker = DEMO_WORKER_ACCOUNTS.find(
    w => w.empId.toUpperCase() === cleanEmpId
  );

  if (!worker || worker.pin !== cleanPin) {
    throw new Error('Invalid Employee ID or Security PIN.');
  }

  if (worker.status !== 'ACTIVE') {
    throw new Error('Worker account is inactive. Please contact your campus manager.');
  }

  return {
    empId: worker.empId,
    name: worker.name,
    role: 'WORKER',
    assignedShop: worker.assignedShop,
    canCollectPayment: !!worker.canCollectPayment,
    avatar: worker.avatar || '👷',
    isDemo: true,
    token: `JIT-WRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
}

/**
 * 3. SHOP OWNER AUTHENTICATION
 * Validates Owner ID (e.g. JIT-O001) and Password
 */
export async function apiOwnerLogin(ownerId, pin) {
  const cleanOwnerId = (ownerId || '').trim().toUpperCase();
  const cleanPin = (pin || '').trim();

  if (!cleanOwnerId || !cleanPin) {
    throw new Error('Invalid Owner ID or Password.');
  }

  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/owner-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: cleanOwnerId, pin: cleanPin })
      });
      if (res.ok) {
        const data = await res.json();
        return { avatar: '👔', ...data.session };
      } else if (res.status === 401) {
        throw new Error('Invalid Owner ID or Password.');
      }
    } catch (e) {
      if (e.message.includes('Invalid Owner ID')) throw e;
    }
  }

  const owner = DEMO_OWNER_ACCOUNTS.find(
    o => o.ownerId.toUpperCase() === cleanOwnerId
  );

  if (!owner || owner.pin !== cleanPin) {
    throw new Error('Invalid Owner ID or Password.');
  }

  return {
    ownerId: owner.ownerId,
    name: owner.name,
    role: 'SHOP_OWNER',
    assignedShops: owner.assignedShops || [],
    avatar: owner.avatar || '👔',
    isDemo: true,
    token: `JIT-OWN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
}

/**
 * 4. RECORD PAY ON DELIVERY CASH RECEIPT
 * Confirms physical payment receipt by an authorized worker or owner.
 * Records collector staff ID, amount, and timestamp.
 */
export async function apiCollectPodPayment(orderId, staffSession) {
  if (!orderId || !staffSession) {
    throw new Error('Missing order ID or staff authorization session.');
  }

  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/collect-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffSession.token || ''}`
        },
        body: JSON.stringify({
          staffId: staffSession.empId || staffSession.ownerId || staffSession.adminId,
          staffName: staffSession.name,
          staffRole: staffSession.role
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
  }

  return null; // Will fallback to storage engine
}

/**
 * 5. GET AUDIT LOGS
 */
export async function apiGetAuditLogs(token) {
  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch (e) {}
  }
  return null;
}

/**
 * 6. UPDATE ORDER STATUS (CONFIRM, PREPARE, READY, COLLECT/COMPLETE, REJECT)
 */
export async function apiUpdateOrderStatus(orderId, status, staffSession, rejectionReason = '') {
  if (!orderId || !status) {
    throw new Error('Order ID and target status are required.');
  }

  if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
    throw new Error('A mandatory rejection reason is required to reject an order.');
  }

  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffSession ? (staffSession.token || '') : ''}`
        },
        body: JSON.stringify({
          status,
          workerId: staffSession ? (staffSession.empId || staffSession.ownerId || staffSession.adminId || 'STAFF') : 'STAFF',
          workerName: staffSession ? (staffSession.name || 'Authorized Staff') : 'Authorized Staff',
          workerRole: staffSession ? staffSession.role : 'WORKER',
          workerAssignedShop: staffSession ? (staffSession.assignedShop || '') : '',
          rejectionReason: rejectionReason ? rejectionReason.trim() : ''
        })
      });
      if (res.ok) {
        return await res.json();
      } else if (res.status === 400 || res.status === 403) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update order status');
      }
    } catch (e) {
      if (e.message.includes('mandatory rejection reason') || e.message.includes('Unauthorized')) throw e;
    }
  }

  return null;
}

/**
 * 7. GET ALL ORDERS (SHARED DATABASE SYNC)
 */
export async function apiGetAllOrders() {
  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        return data.orders || [];
      }
    } catch (e) {}
  }
  return null;
}

/**
 * 8. CREATE ORDER
 */
export async function apiCreateOrder(orderPayload) {
  if (isBackendAvailable !== false) {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
  }
  return null;
}

/**
 * Normalizes various date string formats to YYYY-MM-DD
 */
function normalizeDate(str) {
  if (!str) return '';
  const s = String(str).trim();
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`;
  }
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${String(dmyMatch[2]).padStart(2, '0')}-${String(dmyMatch[1]).padStart(2, '0')}`;
  }
  return s;
}
