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
 * Authenticates student with Register Number and Date of Birth
 * Verifies against registered demo records.
 */
export async function authenticateStudent(regNo, dob) {
  // Simulated network latency
  await new Promise(resolve => setTimeout(resolve, 600));

  const cleanRegNo = (regNo || '').trim().toUpperCase();
  const cleanDob = (dob || '').trim();

  if (!cleanRegNo) {
    throw new Error('Please enter your college Register Number (e.g. 21CS042).');
  }
  if (!cleanDob) {
    throw new Error('Please select your Date of Birth.');
  }

  // Find matching student
  const matched = DEMO_ACCOUNTS.find(
    acc => acc.regNo.toUpperCase() === cleanRegNo
  );

  if (!matched) {
    throw new Error(`Register Number "${cleanRegNo}" not found in college student database. Use one of the Demo Accounts below.`);
  }

  // Verify DOB
  if (matched.dob !== cleanDob) {
    throw new Error('Date of Birth does not match the college record for this Register Number.');
  }

  // Create safe session (DOB is NOT included in session or storage)
  const session = setSafeSession(matched);
  return session;
}

/**
 * Quick one-tap login for demo accounts (Staff, Student, Admin)
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
          <h3 class="card-title">Student Portal Login</h3>
          <span class="secure-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Secure SSL
          </span>
        </div>

        <form id="student-login-form" class="login-form">
          <!-- Register Number Field -->
          <div class="form-group">
            <label for="login-regno" class="form-label">
              <span>Register Number</span>
              <span class="hint-text">(e.g., 21CS042)</span>
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
                placeholder="Enter Register No." 
                value="21CS042" 
                autocomplete="username"
                required
              />
            </div>
          </div>

          <!-- Date of Birth Field -->
          <div class="form-group">
            <label for="login-dob" class="form-label">
              <span>Date of Birth</span>
              <span class="hint-text">(DD/MM/YYYY)</span>
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
                type="date" 
                id="login-dob" 
                name="dob" 
                class="form-input date-input" 
                value="2003-05-14"
                required
              />
            </div>
          </div>

          <!-- Error Alert Container -->
          <div id="login-error-container" class="login-error-alert" style="display: none;">
            <span class="error-icon">⚠️</span>
            <span id="login-error-text" class="error-msg"></span>
          </div>

          <!-- Submit Button -->
          <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block btn-lg">
            <span class="btn-text">LOGIN TO CAMPUS</span>
            <span class="btn-spinner" style="display: none;">
              <span class="spinner-dot"></span>
            </span>
          </button>
        </form>

        <!-- Privacy & Security Disclaimer -->
        <p class="login-privacy-note">
          🔒 College records verified securely. Sensitive birth details are verified on request and never saved to device storage.
        </p>
      </div>

      <!-- Demo Accounts Fast Selector -->
      <div class="demo-accounts-section">
        <div class="demo-section-header">
          <span class="demo-tag">DEMO MODE ACTIVE</span>
          <p class="demo-desc">Select any sample role below for instant one-tap access:</p>
        </div>

        <div class="demo-pills-grid">
          <button type="button" class="demo-pill-btn active-pill" data-reg="21CS042">
            <span class="pill-avatar">👨‍🎓</span>
            <div class="pill-info">
              <span class="pill-name">Rahul Sharma (CSE)</span>
              <span class="pill-sub">Student • 21CS042</span>
            </div>
          </button>

          <button type="button" class="demo-pill-btn" data-reg="21EC015">
            <span class="pill-avatar">👩‍🎓</span>
            <div class="pill-info">
              <span class="pill-name">Priya Patel (ECE)</span>
              <span class="pill-sub">Student • 21EC015</span>
            </div>
          </button>

          <button type="button" class="demo-pill-btn staff-pill" data-reg="STAFF-CANTEEN">
            <span class="pill-avatar">👨‍🍳</span>
            <div class="pill-info">
              <span class="pill-name">Chef Murugan</span>
              <span class="pill-sub">Canteen Staff</span>
            </div>
          </button>

          <button type="button" class="demo-pill-btn staff-pill" data-reg="STAFF-STATIONERY">
            <span class="pill-avatar">📚</span>
            <div class="pill-info">
              <span class="pill-name">Ramesh Kumar</span>
              <span class="pill-sub">Stationery Staff</span>
            </div>
          </button>

          <button type="button" class="demo-pill-btn staff-pill" data-reg="STAFF-PRINTING">
            <span class="pill-avatar">🖨️</span>
            <div class="pill-info">
              <span class="pill-name">Karthik Raja</span>
              <span class="pill-sub">Printing Staff</span>
            </div>
          </button>

          <button type="button" class="demo-pill-btn admin-pill" data-reg="ADMIN-001">
            <span class="pill-avatar">⚙️</span>
            <div class="pill-info">
              <span class="pill-name">Campus Admin</span>
              <span class="pill-sub">Administrator</span>
            </div>
          </button>
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
      errorText.textContent = err.message || 'Login failed. Please verify your details.';
      errorContainer.style.display = 'flex';
      submitBtn.disabled = false;
      btnText.style.display = 'inline-block';
      btnSpinner.style.display = 'none';
    }
  });

  // Attach Demo Pills
  const pills = container.querySelectorAll('.demo-pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', async () => {
      const reg = pill.getAttribute('data-reg');
      const account = DEMO_ACCOUNTS.find(a => a.regNo === reg);
      if (account) {
        // If student, populate form or login
        if (account.role === 'student') {
          container.querySelector('#login-regno').value = account.regNo;
          container.querySelector('#login-dob').value = account.dob;
        }
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
        try {
          const session = await quickDemoLogin(reg);
          if (onLoginSuccess) onLoginSuccess(session);
        } catch (err) {
          errorText.textContent = err.message;
          errorContainer.style.display = 'flex';
          submitBtn.disabled = false;
          btnText.style.display = 'inline-block';
          btnSpinner.style.display = 'none';
        }
      }
    });
  });
}
