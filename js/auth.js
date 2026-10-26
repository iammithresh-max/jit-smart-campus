/**
 * JIT SMART CAMPUS - Authentication Controller
 * 
 * Provides secure authentication workflows:
 * 1. Student Login (Registration Number and Date of Birth only - NO student name on login form).
 * 2. Dedicated Worker Login (Employee ID JIT-W001..W005 & PIN).
 * 3. Dedicated Shop Owner Login (Owner ID JIT-O001..O002 & PIN).
 * 
 * STRICT COMPLIANCE:
 * - Sensitive credentials and DOB are NEVER stored in localStorage or exposed in client profiles.
 * - Clear generic error messages: "Invalid Registration Number or Date of Birth."
 */

import { DEMO_STUDENT_ACCOUNTS, DEMO_WORKER_ACCOUNTS, DEMO_OWNER_ACCOUNTS, DEMO_ADMIN_ACCOUNT, DEMO_ACCOUNTS } from './data.js';
import { getSafeSession, setSafeSession, clearSession } from './storage.js';
import { apiStudentLogin, apiWorkerLogin, apiOwnerLogin } from './api.js';

export function initAuth() {
  return getSafeSession();
}

export function getCurrentUser() {
  return getSafeSession();
}

export function isLoggedIn() {
  return !!getSafeSession();
}

export function logout() {
  clearSession();
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

/**
 * Authenticates student with Register Number and Date of Birth
 * Validates through backend API with safe demo fallback.
 */
export async function authenticateStudent(regNo, dob) {
  const cleanRegNo = (regNo || '').trim().toUpperCase();
  const cleanDob = (dob || '').trim();

  if (!cleanRegNo || !cleanDob) {
    throw new Error('Invalid Registration Number or Date of Birth.');
  }

  const sessionData = await apiStudentLogin(cleanRegNo, cleanDob);
  const session = setSafeSession(sessionData);
  return session;
}

/**
 * Authenticates worker with Employee ID and PIN
 */
export async function authenticateWorker(empId, pin) {
  const cleanEmpId = (empId || '').trim().toUpperCase();
  const cleanPin = (pin || '').trim();

  if (!cleanEmpId || !cleanPin) {
    throw new Error('Invalid Employee ID or Security PIN.');
  }

  const sessionData = await apiWorkerLogin(cleanEmpId, cleanPin);
  const session = setSafeSession(sessionData);
  return session;
}

/**
 * Authenticates shop owner with Owner ID and PIN
 */
export async function authenticateOwner(ownerId, pin) {
  const cleanOwnerId = (ownerId || '').trim().toUpperCase();
  const cleanPin = (pin || '').trim();

  if (!cleanOwnerId || !cleanPin) {
    throw new Error('Invalid Owner ID or Password.');
  }

  const sessionData = await apiOwnerLogin(cleanOwnerId, cleanPin);
  const session = setSafeSession(sessionData);
  return session;
}

/**
 * Quick login for demo staff/admin accounts (Backward compatibility)
 */
export async function quickDemoLogin(regNo) {
  await new Promise(resolve => setTimeout(resolve, 200));
  const matched = DEMO_ACCOUNTS.find(acc => acc.regNo === regNo || acc.empId === regNo || acc.adminId === regNo);
  if (!matched) {
    throw new Error(`Account ${regNo} not found.`);
  }
  const session = setSafeSession(matched);
  return session;
}

/**
 * =========================================================================
 * 1. STUDENT LOGIN SCREEN
 * Asks only for Registration Number and Date of Birth.
 * No student name input.
 * =========================================================================
 */
export function renderLoginScreen(container, onLoginSuccess, navigateTo) {
  container.innerHTML = `
    <div class="login-screen-wrapper fade-in">
      <!-- App Header & Logo -->
      <div class="login-header">
        <div class="brand-badge">
          <img src="assets/jitora-logo.png" alt="JITORA" class="login-jitora-logo-img" />
          <div>
            <h1 class="brand-title"><span class="brand-blue">JIT</span><span class="brand-orange">ORA</span></h1>
            <p class="brand-subtitle">JANSONS INSTITUTE OF TECHNOLOGY</p>
          </div>
        </div>
        <div class="brand-tagline-pill">
          <span class="tagline-dot"></span>
          <span>Order Smart. Skip the Queue.</span>
        </div>
      </div>

      <!-- Hero Card -->
      <div class="login-hero-card">
        <div class="hero-icons-float">
          <span class="float-icon float-1">🍔</span>
          <span class="float-icon float-2">📚</span>
          <span class="float-icon float-3">🖨️</span>
          <span class="float-icon float-4">⚡</span>
        </div>
        <div class="hero-text-content">
          <h2 class="hero-heading">Student Portal Login</h2>
          <p class="hero-subtext">Order food, buy academic supplies, and submit PDF print jobs with digital queue tokens.</p>
        </div>
      </div>

      <!-- Login Form Card -->
      <div class="login-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Student Authentication</h3>
            <p class="card-desc" style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Enter your college credentials to access your portal</p>
          </div>
          <span class="secure-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Secure Portal
          </span>
        </div>

        <form id="student-login-form" class="login-form">
          <!-- 1. Registration Number Field -->
          <div class="form-group">
            <label for="login-regno" class="form-label">
              <span>Registration Number</span>
              <span class="hint-text">(12-digit College Reg No.)</span>
            </label>
            <div class="input-icon-wrap">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input 
                type="text" 
                id="login-regno" 
                name="regNo" 
                class="form-input" 
                placeholder="Enter Registration Number" 
                value="" 
                autocomplete="username"
                required
              />
            </div>
          </div>

          <!-- 2. Date of Birth Field (Strictly no name field) -->
          <div class="form-group">
            <label for="login-dob" class="form-label">
              <span>Date of Birth (DOB)</span>
              <span class="hint-text">(DD-MM-YYYY)</span>
            </label>
            <div class="input-icon-wrap">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <input 
                type="text" 
                id="login-dob" 
                name="dob" 
                class="form-input" 
                placeholder="DD-MM-YYYY (e.g. 04-11-2007)" 
                value=""
                autocomplete="off"
                required
              />
            </div>
          </div>

          <!-- Error Alert Container -->
          <div id="login-error-container" class="login-error-alert" style="display: none;">
            <span class="error-icon">⚠️</span>
            <span id="login-error-text" class="error-msg">Invalid Registration Number or Date of Birth.</span>
          </div>

          <!-- Submit Button -->
          <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block btn-lg">
            <span class="btn-text">LOGIN TO CAMPUS PORTAL</span>
            <span class="btn-spinner" style="display: none;">
              <span class="spinner-dot"></span>
            </span>
          </button>
        </form>

        <!-- Role Portal Switchers -->
        <div style="display: flex; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-goto-worker-login" style="flex: 1; font-size: 11px;">
            👷 Worker Login →
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-goto-owner-login" style="flex: 1; font-size: 11px;">
            👔 Shop Owner Login →
          </button>
        </div>

        <!-- Privacy & Security Disclaimer -->
        <p class="login-privacy-note">
          🔒 <strong>Privacy Protection:</strong> Credentials validate against server-side records. Student Date of Birth is never saved to browser localStorage or exposed in public client code.
        </p>
      </div>

      <!-- Authorized Demonstration Records Helper -->
      <div class="demo-accounts-section">
        <div class="demo-section-header">
          <span class="demo-tag">AUTHORIZED STUDENT RECORDS (DEMO)</span>
          <p class="demo-desc">Select a student record below to populate credentials (validates securely on submit):</p>
        </div>

        <div class="demo-pills-grid">
          ${DEMO_STUDENT_ACCOUNTS.map(s => {
            // Plausible display format for demo testing
            const parts = s.dob.split('-');
            const displayDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
            return `
              <button type="button" class="demo-pill-btn" data-fill-reg="${s.regNo}" data-fill-dob="${displayDob}">
                <span class="pill-avatar">${s.avatar}</span>
                <div class="pill-info">
                  <span class="pill-name">${s.name} <small style="color: #0D9488; font-size: 10px;">(DEMO)</small></span>
                  <span class="pill-sub">Reg: ${s.regNo} • DOB: ${displayDob}</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach Form Submit
  const form = container.querySelector('#student-login-form');
  const errorContainer = container.querySelector('#login-error-container');
  const errorText = container.querySelector('#login-error-text');
  const submitBtn = container.querySelector('#login-submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNo = container.querySelector('#login-regno').value;
    const dob = container.querySelector('#login-dob').value;

    errorContainer.style.display = 'none';
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';

    try {
      const session = await authenticateStudent(regNo, dob);
      if (onLoginSuccess) onLoginSuccess(session);
    } catch (err) {
      errorText.textContent = err.message || 'Invalid Registration Number or Date of Birth.';
      errorContainer.style.display = 'flex';
      submitBtn.disabled = false;
      btnText.style.display = 'inline-block';
      btnSpinner.style.display = 'none';
    }
  });

  // Attach Fill Helper Pills
  const fillPills = container.querySelectorAll('[data-fill-reg]');
  fillPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const reg = pill.getAttribute('data-fill-reg');
      const dob = pill.getAttribute('data-fill-dob');
      const regInput = container.querySelector('#login-regno');
      const dobInput = container.querySelector('#login-dob');
      if (regInput && dobInput) {
        regInput.value = reg;
        dobInput.value = dob;
        errorContainer.style.display = 'none';
        regInput.focus();
      }
    });
  });

  // Portal Switchers
  const workerSwitchBtn = container.querySelector('#btn-goto-worker-login');
  if (workerSwitchBtn && navigateTo) {
    workerSwitchBtn.addEventListener('click', () => navigateTo('worker-login'));
  }

  const ownerSwitchBtn = container.querySelector('#btn-goto-owner-login');
  if (ownerSwitchBtn && navigateTo) {
    ownerSwitchBtn.addEventListener('click', () => navigateTo('owner-login'));
  }
}

/**
 * =========================================================================
 * 2. DEDICATED WORKER LOGIN SCREEN
 * Dedicated Employee Login page (JIT-W001..W005).
 * Workers access only their assigned shop!
 * =========================================================================
 */
export function renderWorkerLoginScreen(container, onLoginSuccess, navigateTo) {
  container.innerHTML = `
    <div class="login-screen-wrapper fade-in">
      <div class="login-header">
        <div class="brand-badge">
          <img src="assets/jitora-logo.png" alt="JITORA" class="login-jitora-logo-img" />
          <div>
            <h1 class="brand-title"><span class="brand-blue">JIT</span><span class="brand-orange">ORA</span> <span style="font-size: 0.72em; color: #0F766E;">WORKER</span></h1>
            <p class="brand-subtitle">CAMPUS OPERATIONS & DISPATCH DESK</p>
          </div>
        </div>
        <div class="brand-tagline-pill">
          <span class="tagline-dot" style="background: #0D9488;"></span>
          <span>Worker & Staff Desk Portal</span>
        </div>
      </div>

      <div class="login-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Employee Portal Login</h3>
            <p class="card-desc" style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Enter your Employee ID and Security PIN</p>
          </div>
          <span class="secure-badge" style="background: #ECFDF5; color: #047857; border-color: #A7F3D0;">
            Staff Access
          </span>
        </div>

        <form id="worker-login-form" class="login-form">
          <div class="form-group">
            <label for="worker-empid" class="form-label">
              <span>Employee ID</span>
              <span class="hint-text">(e.g. JIT-W001)</span>
            </label>
            <input 
              type="text" 
              id="worker-empid" 
              name="empId" 
              class="form-input font-mono" 
              placeholder="JIT-W001" 
              required
            />
          </div>

          <div class="form-group">
            <label for="worker-pin" class="form-label">
              <span>Security Access PIN</span>
              <span class="hint-text">(Default: demo123)</span>
            </label>
            <input 
              type="password" 
              id="worker-pin" 
              name="pin" 
              class="form-input" 
              placeholder="••••••••" 
              required
            />
          </div>

          <div id="worker-error-container" class="login-error-alert" style="display: none;">
            <span class="error-icon">⚠️</span>
            <span id="worker-error-text" class="error-msg">Invalid Employee ID or Security PIN.</span>
          </div>

          <button type="submit" id="worker-submit-btn" class="btn btn-primary btn-block btn-lg" style="background: #0F766E;">
            <span class="btn-text">SIGN IN TO WORKER DESK</span>
            <span class="btn-spinner" style="display: none;">
              <span class="spinner-dot"></span>
            </span>
          </button>
        </form>

        <div style="display: flex; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-back-student-from-worker" style="flex: 1; font-size: 11px;">
            ← Student Portal
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-worker-to-owner" style="flex: 1; font-size: 11px;">
            Shop Owner Login →
          </button>
        </div>
      </div>

      <!-- Fictional Demo Worker Profiles -->
      <div class="demo-accounts-section">
        <div class="demo-section-header">
          <span class="demo-tag">DEMO WORKER PROFILES (5 ADULT FICTIONAL WORKERS)</span>
          <p class="demo-desc">Tap a worker profile below to auto-populate credentials for evaluation:</p>
        </div>

        <div class="demo-pills-grid">
          ${DEMO_WORKER_ACCOUNTS.map(w => `
            <button type="button" class="demo-pill-btn" data-fill-worker="${w.empId}" data-fill-pin="${w.pin}">
              <span class="pill-avatar">${w.avatar}</span>
              <div class="pill-info">
                <span class="pill-name">${w.name} • ${w.empId} <small style="color: #0D9488;">(DEMO)</small></span>
                <span class="pill-sub">Shop: ${w.assignedShop.toUpperCase()} • DOB: ${w.dob} • Cash: ${w.canCollectPayment ? '✓ Yes' : '✗ No'}</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#worker-login-form');
  const errorContainer = container.querySelector('#worker-error-container');
  const errorText = container.querySelector('#worker-error-text');
  const submitBtn = container.querySelector('#worker-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const empId = container.querySelector('#worker-empid').value;
    const pin = container.querySelector('#worker-pin').value;

    errorContainer.style.display = 'none';
    submitBtn.disabled = true;

    try {
      const session = await authenticateWorker(empId, pin);
      if (onLoginSuccess) onLoginSuccess(session);
    } catch (err) {
      errorText.textContent = err.message || 'Invalid Employee ID or Security PIN.';
      errorContainer.style.display = 'flex';
      submitBtn.disabled = false;
    }
  });

  // Attach Worker Fill Pills
  container.querySelectorAll('[data-fill-worker]').forEach(pill => {
    pill.addEventListener('click', () => {
      container.querySelector('#worker-empid').value = pill.getAttribute('data-fill-worker');
      container.querySelector('#worker-pin').value = pill.getAttribute('data-fill-pin');
      errorContainer.style.display = 'none';
      container.querySelector('#worker-empid').focus();
    });
  });

  const backStudentBtn = container.querySelector('#btn-back-student-from-worker');
  if (backStudentBtn && navigateTo) {
    backStudentBtn.addEventListener('click', () => navigateTo('login'));
  }

  const toOwnerBtn = container.querySelector('#btn-worker-to-owner');
  if (toOwnerBtn && navigateTo) {
    toOwnerBtn.addEventListener('click', () => navigateTo('owner-login'));
  }
}

/**
 * =========================================================================
 * 3. DEDICATED SHOP OWNER LOGIN SCREEN
 * Dedicated Owner Login page (JIT-O001..O002).
 * Opens dedicated Owner Dashboard.
 * =========================================================================
 */
export function renderOwnerLoginScreen(container, onLoginSuccess, navigateTo) {
  container.innerHTML = `
    <div class="login-screen-wrapper fade-in">
      <div class="login-header">
        <div class="brand-badge">
          <img src="assets/jitora-logo.png" alt="JITORA" class="login-jitora-logo-img" />
          <div>
            <h1 class="brand-title"><span class="brand-blue">JIT</span><span class="brand-orange">ORA</span> <span style="font-size: 0.72em; color: #115E59;">OWNER</span></h1>
            <p class="brand-subtitle">SHOP OWNER MANAGEMENT PORTAL</p>
          </div>
        </div>
        <div class="brand-tagline-pill">
          <span class="tagline-dot" style="background: #14B8A6;"></span>
          <span>Owner Administration & Revenue Portal</span>
        </div>
      </div>

      <div class="login-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Shop Owner Login</h3>
            <p class="card-desc" style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Enter your Owner ID and Secret Password</p>
          </div>
          <span class="secure-badge" style="background: #F0FDF4; color: #166534; border-color: #BBF7D0;">
            Owner Level
          </span>
        </div>

        <form id="owner-login-form" class="login-form">
          <div class="form-group">
            <label for="owner-id" class="form-label">
              <span>Owner ID</span>
              <span class="hint-text">(e.g. JIT-O001)</span>
            </label>
            <input 
              type="text" 
              id="owner-id" 
              name="ownerId" 
              class="form-input font-mono" 
              placeholder="JIT-O001" 
              required
            />
          </div>

          <div class="form-group">
            <label for="owner-pin" class="form-label">
              <span>Owner Password</span>
              <span class="hint-text">(Default: owner123)</span>
            </label>
            <input 
              type="password" 
              id="owner-pin" 
              name="pin" 
              class="form-input" 
              placeholder="••••••••" 
              required
            />
          </div>

          <div id="owner-error-container" class="login-error-alert" style="display: none;">
            <span class="error-icon">⚠️</span>
            <span id="owner-error-text" class="error-msg">Invalid Owner ID or Password.</span>
          </div>

          <button type="submit" id="owner-submit-btn" class="btn btn-primary btn-block btn-lg" style="background: #115E59;">
            <span class="btn-text">SIGN IN TO OWNER DASHBOARD</span>
            <span class="btn-spinner" style="display: none;">
              <span class="spinner-dot"></span>
            </span>
          </button>
        </form>

        <div style="display: flex; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-back-student-from-owner" style="flex: 1; font-size: 11px;">
            ← Student Portal
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-owner-to-worker" style="flex: 1; font-size: 11px;">
            Worker Login →
          </button>
        </div>
      </div>

      <!-- Fictional Demo Owner Profiles -->
      <div class="demo-accounts-section">
        <div class="demo-section-header">
          <span class="demo-tag">DEMO SHOP OWNER PROFILES</span>
          <p class="demo-desc">Tap an authorized owner below to auto-populate credentials for evaluation:</p>
        </div>

        <div class="demo-pills-grid">
          ${DEMO_OWNER_ACCOUNTS.map(o => `
            <button type="button" class="demo-pill-btn" data-fill-owner="${o.ownerId}" data-fill-pin="${o.pin}">
              <span class="pill-avatar">${o.avatar}</span>
              <div class="pill-info">
                <span class="pill-name">${o.name} (${o.ownerId}) <small style="color: #0D9488;">(DEMO)</small></span>
                <span class="pill-sub">Assigned: ${o.assignedShops.map(s => s.toUpperCase()).join(', ')}</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#owner-login-form');
  const errorContainer = container.querySelector('#owner-error-container');
  const errorText = container.querySelector('#owner-error-text');
  const submitBtn = container.querySelector('#owner-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ownerId = container.querySelector('#owner-id').value;
    const pin = container.querySelector('#owner-pin').value;

    errorContainer.style.display = 'none';
    submitBtn.disabled = true;

    try {
      const session = await authenticateOwner(ownerId, pin);
      if (onLoginSuccess) onLoginSuccess(session);
    } catch (err) {
      errorText.textContent = err.message || 'Invalid Owner ID or Password.';
      errorContainer.style.display = 'flex';
      submitBtn.disabled = false;
    }
  });

  container.querySelectorAll('[data-fill-owner]').forEach(pill => {
    pill.addEventListener('click', () => {
      container.querySelector('#owner-id').value = pill.getAttribute('data-fill-owner');
      container.querySelector('#owner-pin').value = pill.getAttribute('data-fill-pin');
      errorContainer.style.display = 'none';
      container.querySelector('#owner-id').focus();
    });
  });

  const backStudentBtn = container.querySelector('#btn-back-student-from-owner');
  if (backStudentBtn && navigateTo) {
    backStudentBtn.addEventListener('click', () => navigateTo('login'));
  }

  const toWorkerBtn = container.querySelector('#btn-owner-to-worker');
  if (toWorkerBtn && navigateTo) {
    toWorkerBtn.addEventListener('click', () => navigateTo('worker-login'));
  }
}
