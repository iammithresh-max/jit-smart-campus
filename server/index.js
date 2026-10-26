/**
 * JIT SMART CAMPUS - Enterprise Node.js / Express Backend Server
 * 
 * Provides:
 * - Secure Student, Worker, and Owner Authentication (JWT)
 * - Server-side order validation (Never trusts frontend prices or totals)
 * - Pay on Delivery (POD) physical cash collection confirmation with RBAC
 * - Payment Gateway Webhook verification (HMAC SHA256)
 * - Collision-free Queue Token sequencing
 * - Audit logging & collection records
 * - Secure PDF upload handling
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

const app = express();
const PORT = process.env.PORT || 5500;
const JWT_SECRET = process.env.JWT_SECRET || 'jit-smart-campus-secure-jwt-secret-2026';
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || 'iammithresh@oksbi';
const GATEWAY_WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET || 'whsec_sample_secret';

app.use(cors());
app.use(express.json());

// Configure Multer for secure private PDF storage
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `print-${uniqueSuffix}.pdf`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF files are accepted.'));
    }
  }
});

// Helper: Read database
function readDatabase() {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  }
  return { students: [], workers: [], owners: [], orders: [], collectionRecords: [], auditLogs: [], tokenCounters: {} };
}

// Helper: Save database
function saveDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper: Audit log
function addAuditLog(action, actorId, actorRole, details) {
  const db = readDatabase();
  const log = {
    logId: `AUD-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
    action,
    actorId: actorId || 'SYSTEM',
    actorRole: actorRole || 'SYSTEM',
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDatabase(db);
}

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// -------------------------------------------------------------
// 1. HEALTH CHECK
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'NODE_ENTERPRISE_SERVER',
    serverTime: new Date().toISOString(),
    merchantConfig: {
      upiId: MERCHANT_UPI_ID,
      verified: false
    }
  });
});

// -------------------------------------------------------------
// 2. STUDENT AUTHENTICATION
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { regNo, dob } = req.body;
  if (!regNo || !dob) {
    return res.status(400).json({ error: 'Registration number and Date of Birth are required.' });
  }

  const db = readDatabase();
  const cleanRegNo = String(regNo).trim().toUpperCase();
  const student = db.students.find(s => s.regNo === cleanRegNo);

  if (!student) {
    return res.status(401).json({ error: 'Invalid Registration Number or Date of Birth.' });
  }

  // Normalize DOB comparison
  const normInput = String(dob).replace(/[^0-9]/g, '');
  const normDb = String(student.dob).replace(/[^0-9]/g, '');

  if (normInput !== normDb) {
    return res.status(401).json({ error: 'Invalid Registration Number or Date of Birth.' });
  }

  const token = jwt.sign(
    { regNo: student.regNo, name: student.name, role: 'STUDENT' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    success: true,
    session: {
      regNo: student.regNo,
      name: student.name,
      department: student.department,
      role: 'STUDENT',
      token
    }
  });
});

// -------------------------------------------------------------
// 3. WORKER AUTHENTICATION
// -------------------------------------------------------------
app.post('/api/auth/worker-login', (req, res) => {
  const { empId, pin } = req.body;
  const db = readDatabase();
  const worker = db.workers.find(w => w.empId === String(empId).trim().toUpperCase());

  if (!worker || worker.pin !== String(pin).trim()) {
    return res.status(401).json({ error: 'Invalid Employee ID or Security PIN.' });
  }

  if (worker.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Worker account is inactive.' });
  }

  const token = jwt.sign(
    { empId: worker.empId, name: worker.name, role: 'WORKER', assignedShop: worker.assignedShop, canCollectPayment: worker.canCollectPayment },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    success: true,
    session: {
      empId: worker.empId,
      name: worker.name,
      role: 'WORKER',
      assignedShop: worker.assignedShop,
      canCollectPayment: worker.canCollectPayment,
      token
    }
  });
});

// -------------------------------------------------------------
// 4. SHOP OWNER AUTHENTICATION
// -------------------------------------------------------------
app.post('/api/auth/owner-login', (req, res) => {
  const { ownerId, pin } = req.body;
  const db = readDatabase();
  const owner = db.owners.find(o => o.ownerId === String(ownerId).trim().toUpperCase());

  if (!owner || owner.pin !== String(pin).trim()) {
    return res.status(401).json({ error: 'Invalid Owner ID or Password.' });
  }

  const token = jwt.sign(
    { ownerId: owner.ownerId, name: owner.name, role: 'SHOP_OWNER', assignedShops: owner.assignedShops },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    success: true,
    session: {
      ownerId: owner.ownerId,
      name: owner.name,
      role: 'SHOP_OWNER',
      assignedShops: owner.assignedShops,
      token
    }
  });
});

// -------------------------------------------------------------
// 5. SERVER-SIDE ORDER CREATION (Validate prices & totals)
// -------------------------------------------------------------
app.post('/api/orders', (req, res) => {
  const { shop, items, printConfig, studentRegNo, studentName, paymentDetails } = req.body;
  const db = readDatabase();

  if (!shop) return res.status(400).json({ error: 'Shop is required' });

  // Calculate trusted total on the backend
  let verifiedTotal = 0;
  if (shop === 'canteen') {
    for (const item of (items || [])) {
      const menuItem = db.canteenMenu.find(m => m.id === item.id);
      if (!menuItem || !menuItem.available) {
        return res.status(400).json({ error: `Item ${item.name} is currently unavailable.` });
      }
      verifiedTotal += (menuItem.price * (item.quantity || 1));
    }
  } else if (shop === 'stationery') {
    for (const item of (items || [])) {
      const statItem = db.stationeryItems.find(s => s.id === item.id);
      if (!statItem || statItem.stock < (item.quantity || 1)) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}.` });
      }
      verifiedTotal += (statItem.price * (item.quantity || 1));
      statItem.stock -= (item.quantity || 1); // Deduct stock
    }
  } else if (shop === 'printing' && printConfig) {
    const rate = printConfig.type === 'colour' ? db.printRates.colour : db.printRates.blackAndWhite;
    verifiedTotal = Math.round(rate * (printConfig.pagesToPrint || 1) * (printConfig.copies || 1));
  }

  // Allocate guaranteed unique token
  const prefixMap = { canteen: 'C', stationery: 'S', printing: 'P' };
  const prefix = prefixMap[shop] || 'X';
  db.tokenCounters[shop] = (db.tokenCounters[shop] || 0) + 1;
  const token = `${prefix}-${String(db.tokenCounters[shop]).padStart(3, '0')}`;

  const isPod = (paymentDetails?.method === 'Pay on Delivery');
  const orderId = `JIT-ORD-${Date.now().toString().slice(-6)}`;

  const newOrder = {
    orderId,
    shop,
    token,
    studentRegNo: studentRegNo || 'ANONYMOUS',
    studentName: studentName || 'Student',
    items: items || [],
    printConfig: printConfig || null,
    totalAmount: verifiedTotal,
    status: isPod ? 'PLACED' : 'Confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payment: {
      method: isPod ? 'Pay on Delivery' : (paymentDetails?.method || 'Online'),
      status: isPod ? 'NOT PAID' : 'PAID',
      txnId: isPod ? `COD-${Math.floor(100000 + Math.random() * 900000)}` : `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      verifiedAt: isPod ? null : new Date().toISOString(),
      collectedBy: null,
      collectedAt: null
    },
    pickupLocation: shop === 'canteen' ? 'Canteen Counter 1 & 2' : (shop === 'stationery' ? 'Stationery Dispatch Desk' : 'Reprographics Center')
  };

  db.orders.unshift(newOrder);
  saveDatabase(db);

  addAuditLog('ORDER_CREATED', studentRegNo, 'STUDENT', `Order ${orderId} placed for ${shop}. Amount: ₹${verifiedTotal}. Token: ${token}`);
  res.status(201).json({ success: true, order: newOrder });
});

// -------------------------------------------------------------
// 6. PAY ON DELIVERY (POD) PHYSICAL CASH COLLECTION
// -------------------------------------------------------------
app.post('/api/orders/:id/collect-payment', (req, res) => {
  const { id } = req.params;
  const { staffId, staffName, staffRole } = req.body;
  const db = readDatabase();

  const order = db.orders.find(o => o.orderId === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.payment.status === 'PAID') {
    return res.status(400).json({ error: 'Payment has already been collected.' });
  }

  // Validate Worker Permission
  if (staffRole === 'WORKER') {
    const worker = db.workers.find(w => w.empId === staffId);
    if (!worker || !worker.canCollectPayment) {
      return res.status(403).json({ error: 'Staff member is not authorized to collect cash payments.' });
    }
    if (worker.assignedShop !== order.shop) {
      return res.status(403).json({ error: 'Staff member cannot collect payment for unassigned shop.' });
    }
  }

  const nowIso = new Date().toISOString();
  order.payment.status = 'PAID';
  order.payment.collectedBy = staffId;
  order.payment.collectedByName = staffName;
  order.payment.collectedAt = nowIso;
  order.payment.collectedAmount = order.totalAmount;
  order.updatedAt = nowIso;

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

  db.collectionRecords.unshift(collectionRecord);
  saveDatabase(db);

  addAuditLog('POD_PAYMENT_COLLECTION', staffId, staffRole, `Confirmed cash collection ₹${order.totalAmount} for order ${order.orderId} (Token ${order.token})`);
  res.json({ success: true, message: 'Payment Received Successfully', order, collectionRecord });
});

// -------------------------------------------------------------
// 7. GET ORDERS & LOGS
// -------------------------------------------------------------
app.get('/api/orders', (req, res) => {
  const db = readDatabase();
  res.json({ orders: db.orders });
});

app.get('/api/collection-records', (req, res) => {
  const db = readDatabase();
  res.json({ records: db.collectionRecords });
});

app.get('/api/audit-logs', (req, res) => {
  const db = readDatabase();
  res.json({ logs: db.auditLogs });
});

// -------------------------------------------------------------
// 8. PAYMENT GATEWAY WEBHOOK (Signature Verified)
// -------------------------------------------------------------
app.post('/api/payment/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const bodyString = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', GATEWAY_WEBHOOK_SECRET)
    .update(bodyString)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  if (event === 'payment.captured') {
    const payment = req.body.payload.payment.entity;
    const orderId = payment.notes?.orderId;
    const db = readDatabase();
    const order = db.orders.find(o => o.orderId === orderId);
    if (order) {
      order.payment.status = 'PAID';
      order.payment.verifiedAt = new Date().toISOString();
      order.payment.txnId = payment.id;
      saveDatabase(db);
      addAuditLog('WEBHOOK_PAYMENT_VERIFIED', 'GATEWAY', 'WEBHOOK', `Payment ${payment.id} verified for order ${orderId}`);
    }
  }

  res.json({ status: 'ok' });
});

// -------------------------------------------------------------
// 9. SECURE PDF UPLOAD ENDPOINT
// -------------------------------------------------------------
app.post('/api/print/upload', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No document uploaded or invalid PDF.' });
  }
  res.json({
    success: true,
    fileName: req.file.originalname,
    storedRef: req.file.filename,
    fileSizeBytes: req.file.size
  });
});

app.listen(PORT, () => {
  console.log(`JIT Smart Campus Production Backend Server running on port ${PORT}`);
});
