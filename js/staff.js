/**
 * JIT SMART CAMPUS - Staff & Admin Mobile Dashboard
 * Live order queue dispatcher for Canteen, Stationery, Printing, and Campus Admin analytics.
 */

import { 
  getAllOrders, 
  updateOrderStatus, 
  getCanteenMenu, 
  saveCanteenMenu, 
  getStationeryItems, 
  saveStationeryItems, 
  getPrintRates, 
  savePrintRates,
  getShopCrowdStats
} from './storage.js';
import { getCurrentUser } from './auth.js';
import { ICONS } from './icons.js';

let activeStaffRoleTab = 'canteen'; // 'canteen' | 'stationery' | 'printing' | 'admin'

export function renderStaffScreen(container, navigateTo) {
  const user = getCurrentUser();

  // If user is already a specific staff member, default to their portal
  if (user && user.role) {
    if (user.role === 'canteen_staff') activeStaffRoleTab = 'canteen';
    else if (user.role === 'stationery_staff') activeStaffRoleTab = 'stationery';
    else if (user.role === 'printing_staff') activeStaffRoleTab = 'printing';
    else if (user.role === 'admin') activeStaffRoleTab = 'admin';
  }

  container.innerHTML = `
    <div class="staff-screen fade-in">
      <!-- Screen Top Bar -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="staff-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">STAFF & ADMIN DESK</h2>
          <span class="screen-badge staff-role-badge">STAFF DISPATCH</span>
        </div>
        <button type="button" class="icon-nav-btn" id="staff-refresh-btn" aria-label="Refresh Orders">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>

      <!-- Role Selector Strip (Allows quick switching for demonstration!) -->
      <div class="staff-roles-bar">
        <button type="button" class="staff-role-tab ${activeStaffRoleTab === 'canteen' ? 'active' : ''}" data-role="canteen">
          👨‍🍳 Canteen
        </button>
        <button type="button" class="staff-role-tab ${activeStaffRoleTab === 'stationery' ? 'active' : ''}" data-role="stationery">
          📚 Stationery
        </button>
        <button type="button" class="staff-role-tab ${activeStaffRoleTab === 'printing' ? 'active' : ''}" data-role="printing">
          🖨️ Printing
        </button>
        <button type="button" class="staff-role-tab ${activeStaffRoleTab === 'admin' ? 'active' : ''}" data-role="admin">
          ⚙️ Admin
        </button>
      </div>

      <!-- Main Role Viewport -->
      <div class="staff-viewport-body" id="staff-viewport-body">
        <!-- Rendered based on selected role -->
      </div>
    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#staff-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const refreshBtn = container.querySelector('#staff-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderStaffScreen(container, navigateTo);
    });
  }

  // Role Tab Switching
  const roleTabs = container.querySelectorAll('.staff-role-tab');
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeStaffRoleTab = tab.getAttribute('data-role');
      renderRoleDashboard(container, navigateTo);
    });
  });

  // Render initial dashboard
  renderRoleDashboard(container, navigateTo);
}

function renderRoleDashboard(container, navigateTo) {
  const viewport = container.querySelector('#staff-viewport-body');
  if (!viewport) return;

  if (activeStaffRoleTab === 'canteen') {
    renderCanteenStaffQueue(viewport, container, navigateTo);
  } else if (activeStaffRoleTab === 'stationery') {
    renderStationeryStaffQueue(viewport, container, navigateTo);
  } else if (activeStaffRoleTab === 'printing') {
    renderPrintingStaffQueue(viewport, container, navigateTo);
  } else if (activeStaffRoleTab === 'admin') {
    renderAdminManagement(viewport, container, navigateTo);
  }
}

/**
 * 1. Canteen Staff Queue
 */
function renderCanteenStaffQueue(viewport, container, navigateTo) {
  const allOrders = getAllOrders();
  const canteenOrders = allOrders.filter(o => o.shop === 'canteen');
  const crowdStats = getShopCrowdStats('canteen');

  // Sort: Active pending orders first (Confirmed -> Preparing -> Ready), then Completed
  canteenOrders.sort((a, b) => {
    const priority = { 'Confirmed': 1, 'Preparing': 2, 'Ready for Collection': 3, 'Completed': 4, 'Cancelled': 5 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  viewport.innerHTML = `
    <div class="staff-queue-view fade-in">
      <!-- Live Crowd Monitor Bar -->
      <div class="staff-crowd-monitor">
        <div>
          <span class="sc-title">Canteen Live Queue</span>
          <span class="sc-sub">${canteenOrders.filter(o => o.status !== 'Completed').length} Orders in Queue</span>
        </div>
        <div class="crowd-pill ${crowdStats.badgeColor}-pill">
          <span class="dot"></span> ${crowdStats.crowdLevel}
        </div>
      </div>

      <!-- Orders List -->
      <div class="staff-orders-list">
        ${canteenOrders.length === 0 ? `
          <div class="empty-results-box">
            <span class="empty-icon">🍳</span>
            <p>No canteen orders placed yet today.</p>
          </div>
        ` : canteenOrders.map(order => `
          <div class="staff-order-card status-${order.status.toLowerCase().replace(/\s+/g, '-')}" data-order="${order.orderId}">
            <div class="so-header-row">
              <span class="so-token font-mono">${order.token}</span>
              <span class="so-status-badge">${order.status}</span>
            </div>
            <div class="so-student-row">
              <span class="so-student-name">👤 ${order.studentName} (${order.studentRegNo})</span>
              <span class="so-time">🕒 ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <!-- Items to Prepare -->
            <div class="so-items-box">
              ${(order.items || []).map(i => `
                <div class="so-item-line">
                  <strong class="so-item-qty">${i.quantity}×</strong>
                  <span>${i.name}</span>
                </div>
              `).join('')}
            </div>

            <div class="so-footer-row">
              <span class="so-paid-amount">₹${order.totalAmount} (Paid via UPI)</span>
              
              <!-- Action Workflow Buttons -->
              <div class="so-action-buttons">
                ${order.status === 'Confirmed' ? `
                  <button type="button" class="btn btn-action-step btn-start-prep" data-id="${order.orderId}">
                    🍳 Start Preparing
                  </button>
                ` : order.status === 'Preparing' ? `
                  <button type="button" class="btn btn-action-step btn-mark-ready" data-id="${order.orderId}">
                    🔔 Mark Ready
                  </button>
                ` : order.status === 'Ready for Collection' ? `
                  <button type="button" class="btn btn-action-step btn-complete-order" data-id="${order.orderId}">
                    ✅ Complete Handover
                  </button>
                ` : `
                  <span class="so-closed-tag">Closed ✓</span>
                `}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Attach Workflow Actions
  viewport.querySelectorAll('.btn-start-prep').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-id');
      updateOrderStatus(orderId, 'Preparing');
      renderCanteenStaffQueue(viewport, container, navigateTo);
    });
  });

  viewport.querySelectorAll('.btn-mark-ready').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-id');
      updateOrderStatus(orderId, 'Ready for Collection');
      renderCanteenStaffQueue(viewport, container, navigateTo);
    });
  });

  viewport.querySelectorAll('.btn-complete-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-id');
      updateOrderStatus(orderId, 'Completed');
      renderCanteenStaffQueue(viewport, container, navigateTo);
    });
  });
}

/**
 * 2. Stationery Staff Queue
 */
function renderStationeryStaffQueue(viewport, container, navigateTo) {
  const allOrders = getAllOrders();
  const statOrders = allOrders.filter(o => o.shop === 'stationery');
  const crowdStats = getShopCrowdStats('stationery');

  statOrders.sort((a, b) => {
    const priority = { 'Confirmed': 1, 'Processing': 2, 'Ready for Collection': 3, 'Completed': 4 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  viewport.innerHTML = `
    <div class="staff-queue-view fade-in">
      <div class="staff-crowd-monitor">
        <div>
          <span class="sc-title">Stationery Dispatch Queue</span>
          <span class="sc-sub">${statOrders.filter(o => o.status !== 'Completed').length} Active Orders</span>
        </div>
        <div class="crowd-pill ${crowdStats.badgeColor}-pill">
          <span class="dot"></span> ${crowdStats.crowdLevel}
        </div>
      </div>

      <div class="staff-orders-list">
        ${statOrders.length === 0 ? `
          <div class="empty-results-box">
            <span class="empty-icon">📚</span>
            <p>No stationery orders yet.</p>
          </div>
        ` : statOrders.map(order => `
          <div class="staff-order-card status-${order.status.toLowerCase().replace(/\s+/g, '-')}" data-order="${order.orderId}">
            <div class="so-header-row">
              <span class="so-token font-mono">${order.token}</span>
              <span class="so-status-badge">${order.status}</span>
            </div>
            <div class="so-student-row">
              <span class="so-student-name">👤 ${order.studentName} (${order.studentRegNo})</span>
              <span class="so-time">🕒 ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div class="so-items-box">
              ${(order.items || []).map(i => `
                <div class="so-item-line">
                  <strong class="so-item-qty">${i.quantity}×</strong>
                  <span>${i.name}</span>
                </div>
              `).join('')}
            </div>

            <div class="so-footer-row">
              <span class="so-paid-amount">₹${order.totalAmount} (Paid)</span>
              
              <div class="so-action-buttons">
                ${order.status === 'Confirmed' ? `
                  <button type="button" class="btn btn-action-step btn-start-prep" data-id="${order.orderId}">
                    📦 Start Packing
                  </button>
                ` : order.status === 'Processing' ? `
                  <button type="button" class="btn btn-action-step btn-mark-ready" data-id="${order.orderId}">
                    🔔 Mark Ready
                  </button>
                ` : order.status === 'Ready for Collection' ? `
                  <button type="button" class="btn btn-action-step btn-complete-order" data-id="${order.orderId}">
                    ✅ Handed Over
                  </button>
                ` : `
                  <span class="so-closed-tag">Completed ✓</span>
                `}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  viewport.querySelectorAll('.btn-start-prep').forEach(btn => {
    btn.addEventListener('click', () => {
      updateOrderStatus(btn.getAttribute('data-id'), 'Processing');
      renderStationeryStaffQueue(viewport, container, navigateTo);
    });
  });

  viewport.querySelectorAll('.btn-mark-ready').forEach(btn => {
    btn.addEventListener('click', () => {
      updateOrderStatus(btn.getAttribute('data-id'), 'Ready for Collection');
      renderStationeryStaffQueue(viewport, container, navigateTo);
    });
  });

  viewport.querySelectorAll('.btn-complete-order').forEach(btn => {
    btn.addEventListener('click', () => {
      updateOrderStatus(btn.getAttribute('data-id'), 'Completed');
      renderStationeryStaffQueue(viewport, container, navigateTo);
    });
  });
}

/**
 * 3. Printing Staff Queue
 */
function renderPrintingStaffQueue(viewport, container, navigateTo) {
  const allOrders = getAllOrders();
  const printOrders = allOrders.filter(o => o.shop === 'printing');
  const crowdStats = getShopCrowdStats('printing');

  printOrders.sort((a, b) => {
    const priority = { 'Confirmed': 1, 'Printing in Progress': 2, 'Ready for Collection': 3, 'Completed': 4 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  viewport.innerHTML = `
    <div class="staff-queue-view fade-in">
      <div class="staff-crowd-monitor">
        <div>
          <span class="sc-title">Reprographics Print Queue</span>
          <span class="sc-sub">${printOrders.filter(o => o.status !== 'Completed').length} Print Jobs Pending</span>
        </div>
        <div class="crowd-pill ${crowdStats.badgeColor}-pill">
          <span class="dot"></span> ${crowdStats.crowdLevel}
        </div>
      </div>

      <div class="staff-orders-list">
        ${printOrders.length === 0 ? `
          <div class="empty-results-box">
            <span class="empty-icon">🖨️</span>
            <p>No print jobs queued yet.</p>
          </div>
        ` : printOrders.map(order => {
          const cfg = order.printConfig || {};
          return `
            <div class="staff-order-card status-${order.status.toLowerCase().replace(/\s+/g, '-')}" data-order="${order.orderId}">
              <div class="so-header-row">
                <span class="so-token font-mono">${order.token}</span>
                <span class="so-status-badge">${order.status}</span>
              </div>
              <div class="so-student-row">
                <span class="so-student-name">👤 ${order.studentName} (${order.studentRegNo})</span>
                <span class="so-time">🕒 ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <!-- Print Specifications Detail Box -->
              <div class="so-items-box print-specs-box">
                <div class="print-spec-headline">
                  <span>📄 ${cfg.fileName || 'Assignment.pdf'}</span>
                  <span class="spec-pages-pill">${cfg.pagesToPrint || 1} Pages × ${cfg.copies || 1} Copies</span>
                </div>
                <div class="print-spec-grid">
                  <div>Color: <strong>${cfg.type === 'colour' ? 'Colour' : 'B&W'}</strong></div>
                  <div>Sides: <strong>${cfg.sides === 'double' ? 'Double' : 'Single'}</strong></div>
                  <div>Paper: <strong>A4 Bond</strong></div>
                  <div>Range: <strong>${cfg.pageRange || 'All Pages'}</strong></div>
                </div>
              </div>

              <div class="so-footer-row">
                <span class="so-paid-amount">₹${order.totalAmount} (Paid)</span>
                
                <div class="so-action-buttons">
                  ${order.status === 'Confirmed' ? `
                    <button type="button" class="btn btn-action-step btn-start-prep" data-id="${order.orderId}">
                      🖨️ Start Laser Print
                    </button>
                  ` : order.status === 'Printing in Progress' ? `
                    <button type="button" class="btn btn-action-step btn-mark-ready" data-id="${order.orderId}">
                      🔔 Mark Sheets Ready
                    </button>
                  ` : order.status === 'Ready for Collection' ? `
                    <button type="button" class="btn btn-action-step btn-complete-order" data-id="${order.orderId}">
                      ✅ Handed to Student
                    </button>
                  ` : `
                    <span class="so-closed-tag">Collected ✓</span>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  viewport.querySelectorAll('.btn-start-prep').forEach(btn => {
    btn.addEventListener('click', () => {
      updateOrderStatus(btn.getAttribute('data-id'), 'Printing in Progress');
      renderPrintingStaffQueue(viewport, container, navigateTo);
    });
  });

  viewport.querySelectorAll('.btn-mark-ready').forEach(btn => {
    btn.addEventListener('click', () => {
      updateOrderStatus(btn.getAttribute('data-id'), 'Ready for Collection');
      renderPrintingStaffQueue(viewport, container, navigateTo);
    });
  });

  viewport.querySelectorAll('.btn-complete-order').forEach(btn => {
    btn.addEventListener('click', () => {
      updateOrderStatus(btn.getAttribute('data-id'), 'Completed');
      renderPrintingStaffQueue(viewport, container, navigateTo);
    });
  });
}

/**
 * 4. Campus Admin Portal (Prices, Stock, Print Rates, Stats)
 */
function renderAdminManagement(viewport, container, navigateTo) {
  const allOrders = getAllOrders();
  const canteenMenu = getCanteenMenu();
  const stationeryItems = getStationeryItems();
  const printRates = getPrintRates();

  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeTokens = allOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;

  viewport.innerHTML = `
    <div class="admin-management-view fade-in">
      <!-- High Level Metrics Cards -->
      <div class="admin-metrics-grid">
        <div class="admin-stat-card">
          <span class="a-stat-label">Total Campus Revenue</span>
          <h3 class="a-stat-val text-success">₹${totalRevenue.toLocaleString()}</h3>
          <span class="a-stat-sub">From ${allOrders.length} Orders</span>
        </div>
        <div class="admin-stat-card">
          <span class="a-stat-label">Active Tokens in Queue</span>
          <h3 class="a-stat-val text-violet">${activeTokens}</h3>
          <span class="a-stat-sub">Across All Counters</span>
        </div>
      </div>

      <!-- Section: Print Rates Configuration -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h4 class="admin-card-title">🖨️ Reprographics Print Rates</h4>
          <span class="admin-card-badge">Configurable</span>
        </div>
        <div class="admin-rates-form">
          <div class="rate-input-row">
            <label for="admin-bw-rate">Black & White (₹ / page):</label>
            <input type="number" step="0.5" id="admin-bw-rate" class="form-input" value="${printRates.blackAndWhite}" />
          </div>
          <div class="rate-input-row">
            <label for="admin-color-rate">Colour Print (₹ / page):</label>
            <input type="number" step="0.5" id="admin-color-rate" class="form-input" value="${printRates.colour}" />
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-save-print-rates">
            Save Print Rates
          </button>
        </div>
      </div>

      <!-- Section: Canteen Availability & Prices -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h4 class="admin-card-title">🍽️ Canteen Menu Stock & Pricing</h4>
        </div>
        <div class="admin-items-list">
          ${canteenMenu.slice(0, 8).map(dish => `
            <div class="admin-item-row" data-id="${dish.id}">
              <div class="ai-info">
                <strong>${dish.name}</strong>
                <span class="ai-sub">${dish.category} • ₹${dish.price}</span>
              </div>
              <div class="ai-actions">
                <button type="button" class="btn-toggle-stock ${dish.available ? 'active' : ''}" data-id="${dish.id}">
                  ${dish.available ? 'IN STOCK' : 'SOLD OUT'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Section: Stationery Inventory Stock -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h4 class="admin-card-title">📚 Stationery Inventory Control</h4>
        </div>
        <div class="admin-items-list">
          ${stationeryItems.slice(0, 8).map(item => `
            <div class="admin-item-row" data-id="${item.id}">
              <div class="ai-info">
                <strong>${item.name}</strong>
                <span class="ai-sub">${item.category} • Current Stock: ${item.stock}</span>
              </div>
              <div class="ai-actions">
                <button type="button" class="btn-restock-stat" data-id="${item.id}">
                  + Restock 20
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Save Print Rates
  const saveRatesBtn = viewport.querySelector('#btn-save-print-rates');
  if (saveRatesBtn) {
    saveRatesBtn.addEventListener('click', () => {
      const bw = parseFloat(viewport.querySelector('#admin-bw-rate').value) || 1;
      const col = parseFloat(viewport.querySelector('#admin-color-rate').value) || 5;
      const current = getPrintRates();
      current.blackAndWhite = bw;
      current.colour = col;
      savePrintRates(current);
      alert('Print rates updated successfully!');
    });
  }

  // Toggle Canteen Stock
  viewport.querySelectorAll('.btn-toggle-stock').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const menu = getCanteenMenu();
      const dish = menu.find(d => d.id === id);
      if (dish) {
        dish.available = !dish.available;
        saveCanteenMenu(menu);
        renderAdminManagement(viewport, container, navigateTo);
      }
    });
  });

  // Restock Stationery
  viewport.querySelectorAll('.btn-restock-stat').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const items = getStationeryItems();
      const stat = items.find(s => s.id === id);
      if (stat) {
        stat.stock += 20;
        saveStationeryItems(items);
        renderAdminManagement(viewport, container, navigateTo);
      }
    });
  });
}
