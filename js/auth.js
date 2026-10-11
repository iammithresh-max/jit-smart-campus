/**
 * JIT SMART CAMPUS - Authentication Controller
 * Handles student login, staff login, demo account presets, and session management.
 * NOTE: Never stores DOB or sensitive student data in localStorage.
 */

import { DEMO_ACCOUNTS } from './data.js';
import { getSafeSession, setSafeSession, clearSession } from './storage.js';

export function initAuth() {
  // Check if session exists
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
 * Normalizes various date string formats (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY) to YYYY-MM-DD
 */
function normalizeDate(str) {
  if (!str) return '';
  const s = String(str).trim();
  // Match YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }
  return s;
}

/**
 * Authenticates student with Register Number and Date of Birth
 * Normalizes date format, rejects empty fields, and displays generic error
 * without revealing which field was incorrect.
 */
export async function authenticateStudent(regNo, dob) {
  // Simulated network latency for realistic college portal feel
  await new Promise(resolve => setTimeout(resolve, 400));

  const cleanRegNo = (regNo || '').trim().toUpperCase();
  const cleanDob = (dob || '').trim();

  // 1. Reject empty fields with exact error
  if (!cleanRegNo || !cleanDob) {
    throw new Error('Invalid Registration Number or Date of Birth.');
  }

  // 2. Find matching student in demo records
  const matched = DEMO_ACCOUNTS.find(
    acc => acc.role === 'student' && acc.regNo.toUpperCase() === cleanRegNo
  );

  if (!matched) {
    throw new Error('Invalid Registration Number or Date of Birth.');
  }

  // 3. Normalize both date strings before comparison
  const normalizedInputDob = normalizeDate(cleanDob);
  const normalizedAccountDob = normalizeDate(matched.dob);

  if (!normalizedInputDob || normalizedInputDob !== normalizedAccountDob) {
    throw new Error('Invalid Registration Number or Date of Birth.');
  }

  // Create safe session (DOB is strictly stripped and never saved to localStorage or URL)
  const session = setSafeSession(matched);
  return session;
}

/**
 * Quick login for demo staff/admin accounts
 */
export async function quickDemoLogin(regNo) {
  await new Promise(resolve => setTimeout(resolve, 300));
  const matched = DEMO_ACCOUNTS.find(acc => acc.regNo === regNo);
  if (!matched) {
    throw new Error(`Account ${regNo} not found.`);
  }
  const session = setSafeSession(matched);
  return session;
}

/**
 * Renders the Mobile Login Screen
 */
export function renderLoginScreen(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-screen-wrapper fade-in">
      <!-- App Header & Logo -->
      <div class="login-header">
        <div class="brand-badge">
          <div class="brand-logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 class="brand-title">JIT SMART CAMPUS</h1>
            <p class="brand-subtitle">JANSONS INSTITUTE OF TECHNOLOGY</p>
          </div>
        </div>
        <div class="brand-tagline-pill">
          <span class="tagline-dot"></span>
          <span>Order Smart. Skip the Queue.</span>
        </div>
      </div>

      <!-- Hero Card / Illustration -->
      <div class="login-hero-card">
        <div class="hero-icons-float">
          <span class="float-icon float-1">🍔</span>
          <span class="float-icon float-2">📚</span>
          <span class="float-icon float-3">🖨️</span>
          <span class="float-icon float-4">⚡</span>
        </div>
        <div class="hero-text-content">
          <h2 class="hero-heading">Welcome, Campus Scholar!</h2>
          <p class="hero-subtext">Order food, grab stationery, and print documents seamlessly with real-time queue tokens.</p>
        </div>
      </div>

      <!-- Login Form Card -->
      <div class="login-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Student Portal Login</h3>
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

          <!-- 2. Date of Birth Field -->
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

        <!-- Privacy & Security Disclaimer -->
        <p class="login-privacy-note">
          🔒 <strong>Prototype Security Disclosure:</strong> This project is hosted on GitHub Pages with simulated client-side credential verification. In a production environment, authentication must be validated against a secure college backend server and encrypted database. Sensitive credentials and Date of Birth are never stored in browser localStorage or URLs.
        </p>
      </div>

      <!-- Authorized Demonstration Records Helper -->
      <div class="demo-accounts-section">
        <div class="demo-section-header">
          <span class="demo-tag">AUTHORIZED STUDENT RECORDS</span>
          <p class="demo-desc">Select a student record below to test credentials (validates on form submit):</p>
        </div>

        <div class="demo-pills-grid">
          <button type="button" class="demo-pill-btn" data-fill-reg="711125104066" data-fill-dob="04-11-2007">
            <span class="pill-avatar">👨‍🎓</span>
            <div class="pill-info">
              <span class="pill-name">Mithresh Kanna S</span>
              <span class="pill-sub">Reg: 711125104066 • DOB: 04-11-2007</span>
            </div>
          </button>

          <button type="button" class="demo-pill-btn" data-fill-reg="711125104069" data-fill-dob="17-01-2008">
            <span class="pill-avatar">👨‍🎓</span>
            <div class="pill-info">
              <span class="pill-name">MuthuChellaKumar</span>
              <span class="pill-sub">Reg: 711125104069 • DOB: 17-01-2008</span>
            </div>
          </button>

          <button type="button" class="demo-pill-btn" data-fill-reg="711125104114" data-fill-dob="08-05-2007">
            <span class="pill-avatar">👨‍🎓</span>
            <div class="pill-info">
              <span class="pill-name">Udhaya K</span>
              <span class="pill-sub">Reg: 711125104114 • DOB: 08-05-2007</span>
            </div>
          </button>
        </div>

        <!-- Staff / Admin Operator Access Dropdown -->
        <details class="staff-access-accordion" style="margin-top: 14px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 14px;">
          <summary style="font-size: 12px; font-weight: 700; color: var(--text-muted); cursor: pointer; user-select: none;">
            ⚙️ Staff & Operator Quick Access
          </summary>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            <button type="button" class="demo-pill-btn staff-pill" data-staff-reg="STAFF-CANTEEN">
              <span class="pill-avatar">👨‍🍳</span>
              <div class="pill-info">
                <span class="pill-name">Chef Murugan</span>
                <span class="pill-sub">Canteen Staff Desk</span>
              </div>
            </button>
            <button type="button" class="demo-pill-btn staff-pill" data-staff-reg="STAFF-STATIONERY">
              <span class="pill-avatar">📚</span>
              <div class="pill-info">
                <span class="pill-name">Ramesh Kumar</span>
                <span class="pill-sub">Stationery Staff Desk</span>
              </div>
            </button>
            <button type="button" class="demo-pill-btn staff-pill" data-staff-reg="STAFF-PRINTING">
              <span class="pill-avatar">🖨️</span>
              <div class="pill-info">
                <span class="pill-name">Karthik Raja</span>
                <span class="pill-sub">Printing Staff Desk</span>
              </div>
            </button>
            <button type="button" class="demo-pill-btn admin-pill" data-staff-reg="ADMIN-001">
              <span class="pill-avatar">⚙️</span>
              <div class="pill-info">
                <span class="pill-name">Dr. S. Sundararajan</span>
                <span class="pill-sub">Campus Administrator</span>
              </div>
            </button>
          </div>
        </details>
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

  // Attach Fill Helper Pills (Sets the 2 input fields without bypassing form validation)
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

  // Attach Staff Quick Access
  const staffPills = container.querySelectorAll('[data-staff-reg]');
  staffPills.forEach(pill => {
    pill.addEventListener('click', async () => {
      const reg = pill.getAttribute('data-staff-reg');
      try {
        const session = await quickDemoLogin(reg);
        if (onLoginSuccess) onLoginSuccess(session);
      } catch (err) {
        errorText.textContent = err.message;
        errorContainer.style.display = 'flex';
      }
    });
  });
}
