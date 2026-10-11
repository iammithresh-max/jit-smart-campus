/**
 * JIT SMART CAMPUS - Redesigned Order History & Student Profile
 * Clean, modern order cards with direct digital token pass access and verified profile details.
 */

import { getAllOrders, getOrdersByStudent } from './storage.js';
import { getCurrentUser, logout } from './auth.js';
import { ICONS } from './icons.js';

let currentHistoryFilter = 'all'; // 'all' | 'active' | 'completed'

export function renderHistoryScreen(container, navigateTo) {
  const user = getCurrentUser();
  const studentOrders = user && user.role === 'student'
    ? getOrdersByStudent(user.regNo)
    : getAllOrders();

  container.innerHTML = `
    <div class="history-screen fade-in">
      
      <!-- Top Screen Bar -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="history-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">MY ORDERS & PASSES</h2>
          <span class="screen-badge">HISTORY</span>
        </div>
        <div style="width: 40px;"></div>
      </div>

      <!-- Filter Chips -->
      <div class="history-filter-strip">
        <button type="button" class="history-filter-pill ${currentHistoryFilter === 'all' ? 'active' : ''}" data-filter="all">
          All (${studentOrders.length})
        </button>
        <button type="button" class="history-filter-pill ${currentHistoryFilter === 'active' ? 'active' : ''}" data-filter="active">
          Active (${studentOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length})
        </button>
        <button type="button" class="history-filter-pill ${currentHistoryFilter === 'completed' ? 'active' : ''}" data-filter="completed">
          Completed (${studentOrders.filter(o => o.status === 'Completed').length})
        </button>
      </div>

      <!-- Orders List Container -->
      <div class="history-orders-container" id="history-orders-list">
        <!-- Rendered dynamically -->
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#history-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const filterPills = container.querySelectorAll('.history-filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentHistoryFilter = pill.getAttribute('data-filter');
      renderHistoryList(container, navigateTo);
    });
  });

  renderHistoryList(container, navigateTo);
}

function renderHistoryList(container, navigateTo) {
  const listEl = container.querySelector('#history-orders-list');
  if (!listEl) return;

  const user = getCurrentUser();
  const allStudentOrders = user && user.role === 'student'
    ? getOrdersByStudent(user.regNo)
    : getAllOrders();

  const filtered = allStudentOrders.filter(order => {
    if (currentHistoryFilter === 'active') {
      return order.status !== 'Completed' && order.status !== 'Cancelled';
    }
    if (currentHistoryFilter === 'completed') {
      return order.status === 'Completed';
    }
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-results-box" style="margin-top: 50px;">
        <div style="color: var(--text-muted); margin-bottom: 8px;">${ICONS.orders(48)}</div>
        <h4 class="empty-title">No orders found</h4>
        <p class="empty-text">Your campus purchases and digital tokens will appear right here.</p>
        <button type="button" class="btn btn-primary" id="btn-hist-explore" style="margin-top: 8px;">
          Start New Order →
        </button>
      </div>
    `;
    const exploreBtn = listEl.querySelector('#btn-hist-explore');
    if (exploreBtn) exploreBtn.addEventListener('click', () => navigateTo('home'));
    return;
  }

  const shopLabels = {
    canteen: 'JIT Canteen',
    stationery: 'JIT Stationery',
    printing: 'Reprographics (Print)'
  };

  listEl.innerHTML = `
    <div class="orders-cards-stack">
      ${filtered.map(order => {
        const isActive = order.status !== 'Completed' && order.status !== 'Cancelled';
        const isReady = order.status === 'Ready for Collection';

        return `
          <div class="order-history-card ${isActive ? 'order-card-active' : ''}" data-id="${order.orderId}">
            <div class="oh-header-row">
              <div>
                <h4 class="oh-shop-name">${shopLabels[order.shop] || 'Campus Shop'}</h4>
                <span class="oh-date-time font-mono">${new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div class="oh-token-badge">
                <span class="oh-token-lbl">TOKEN</span>
                <span class="oh-token-val font-mono">${order.token}</span>
              </div>
            </div>

            <div class="oh-body-items">
              ${order.shop === 'printing' && order.printConfig ? `
                <span class="oh-item-snippet">📄 ${order.printConfig.fileName} (${order.printConfig.pagesToPrint} pages)</span>
              ` : (order.items || []).map(i => `
                <span class="oh-item-snippet">${i.quantity}× ${i.name}</span>
              `).join('')}
            </div>

            <div class="oh-footer-row">
              <div class="oh-price-status-stack">
                <span class="oh-amount font-mono">₹${order.totalAmount}.00</span>
                <span class="oh-status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}">
                  ${isReady ? '🔔 ' : ''}${order.status}
                </span>
              </div>

              <div class="oh-actions-row">
                <button type="button" class="btn btn-sm btn-view-token" data-id="${order.orderId}">
                  Digital Pass 🎟️
                </button>
                <button type="button" class="btn btn-sm btn-primary btn-track-order" data-id="${order.orderId}">
                  Track Live 📡
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  listEl.querySelectorAll('.btn-view-token').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      navigateTo('token', { orderId: id });
    });
  });

  listEl.querySelectorAll('.btn-track-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      navigateTo('tracking', { orderId: id });
    });
  });
}

/**
 * Mobile Profile Screen
 */
export function renderProfileScreen(container, navigateTo) {
  const user = getCurrentUser();

  container.innerHTML = `
    <div class="profile-screen fade-in">
      
      <!-- Screen Header -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="profile-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">STUDENT PROFILE</h2>
          <span class="screen-badge">CAMPUS ID VERIFIED</span>
        </div>
        <div style="width: 40px;"></div>
      </div>

      <div class="profile-content-body">
        
        <!-- Profile Identity Card -->
        <div class="profile-hero-card">
          <div class="profile-avatar-circle">
            ${user ? user.avatar : '👨‍🎓'}
          </div>
          <h3 class="profile-student-name">${user ? user.name : 'College Student'}</h3>
          <span class="profile-regno-pill font-mono">${user ? user.regNo : '21CS042'}</span>
          <p class="profile-dept-text">${user ? user.department : 'Jansons Institute of Technology'}</p>
        </div>

        <!-- Academic Info -->
        <div class="profile-details-card">
          <h4 class="card-section-title">Academic Details</h4>
          
          <div class="profile-field-row">
            <span class="p-field-label">Institution</span>
            <span class="p-field-val">Jansons Institute of Technology (JIT)</span>
          </div>
          <div class="profile-field-row">
            <span class="p-field-label">Department</span>
            <span class="p-field-val">${user ? user.department : 'Engineering'}</span>
          </div>
          <div class="profile-field-row">
            <span class="p-field-label">Academic Year</span>
            <span class="p-field-val">${user ? user.year : 'Final Year'}</span>
          </div>
          <div class="profile-field-row">
            <span class="p-field-label">Account Role</span>
            <span class="p-field-val text-violet">${user ? user.role.toUpperCase() : 'STUDENT'}</span>
          </div>
        </div>

        <!-- Security & Storage Notice -->
        <div class="profile-details-card">
          <h4 class="card-section-title">Security & Storage</h4>
          <p class="privacy-explanation-text">
            🔒 In compliance with security standards, student Date of Birth (DOB) and confidential credentials are never stored in browser localStorage.
          </p>
        </div>

        <!-- Actions -->
        <div class="profile-actions-stack">
          <button type="button" class="btn btn-secondary btn-block" id="btn-profile-staff-desk">
            <span>Open Staff & Admin Desk</span>
          </button>
          
          <button type="button" class="btn btn-danger btn-block" id="btn-profile-logout">
            <span>Logout from Campus</span>
          </button>
        </div>

      </div>
    </div>
  `;

  const backBtn = container.querySelector('#profile-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const staffDeskBtn = container.querySelector('#btn-profile-staff-desk');
  if (staffDeskBtn) staffDeskBtn.addEventListener('click', () => navigateTo('staff'));

  const logoutBtn = container.querySelector('#btn-profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out of JIT Smart Campus?')) {
        logout();
        navigateTo('login');
      }
    });
  }
}
