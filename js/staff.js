/**
 * JIT SMART CAMPUS - Worker Operations & Staff Dispatch Desk
 * 
 * STRICT SPECIFICATION COMPLIANCE (Sections 9, 11, 16):
 * - Role-Based Access: Workers are assigned strictly to their outlet (Canteen, Stationery, or Printing).
 * - Workers access ONLY their assigned shop!
 * - Pay on Delivery Physical Payment Collection:
 *   - Only eligible unpaid Pay on Delivery orders can be collected.
 *   - Only staff with authorized permission (`canCollectPayment: true`) can record receipt.
 *   - Requires physical cash receipt confirmation modal with exact amount and order reference.
 *   - Marks payment status to PAID only after authorized confirmation.
 *   - Records: Amount collected, timestamp, authenticated staff identifier, order reference.
 *   - Shows: "Payment Received Successfully" with order ID, token, amount, and collection time.
 *   - Disables further collection; prevents duplicates.
 *   - Keeps payment status separate from preparation and fulfillment status.
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
  getShopCrowdStats,
  recordPodPaymentCollection
} from './storage.js';
import { getCurrentUser, logout } from './auth.js';
import { ICONS } from './icons.js';

let activeStaffRoleTab = 'canteen'; // 'canteen' | 'stationery' | 'printing' | 'admin'

export function renderStaffScreen(container, navigateTo) {
  const user = getCurrentUser();

  // Role Guard: Workers, Owners, Admins only
  if (!user || user.role === 'STUDENT' || user.role === 'student') {
    container.innerHTML = `
      <div class="empty-results-box" style="margin-top: 80px; padding: 24px; text-align: center;">
        <span style="font-size: 40px;">⛔</span>
        <h3 style="color: var(--error-red); margin-top: 12px;">Staff Access Required</h3>
        <p style="color: var(--text-muted); font-size: 13px;">Students cannot access worker or staff desks.</p>
        <button type="button" class="btn btn-primary" id="btn-staff-goto-worker-login" style="margin-top: 14px;">
          Go to Worker Login →
        </button>
      </div>
    `;
    container.querySelector('#btn-staff-goto-worker-login').onclick = () => navigateTo('worker-login');
    return;
  }

  // Shop Isolation: If worker, lock them to assigned shop
  const isWorker = (user.role === 'WORKER' || user.role.includes('staff'));
  if (isWorker && user.assignedShop) {
    activeStaffRoleTab = user.assignedShop;
  } else if (user.role === 'admin' || user.role === 'SYSTEM_ADMIN') {
    // Admin can switch shops
  }

  container.innerHTML = `
    <div class="staff-screen fade-in" id="staff-screen-root">
      
      <!-- Screen Top Bar -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="staff-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">STAFF & DISPATCH DESK</h2>
          <span class="screen-badge staff-role-badge">
            ${user.empId || user.role.toUpperCase()}
          </span>
        </div>
        <button type="button" class="icon-nav-btn" id="staff-refresh-btn" aria-label="Refresh Orders">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>

      <!-- Worker Identity Card -->
      <div style="background: #064E3B; color: #FFFFFF; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 13px;">${user.name}</strong>
          <div style="font-size: 11px; color: #A7F3D0;">
            ${user.empId ? `Employee ID: ${user.empId} • Outlet: ${activeStaffRoleTab.toUpperCase()}` : `Role: ${user.role}`}
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          ${user.role === 'SHOP_OWNER' ? `
            <button type="button" class="btn btn-secondary btn-sm" id="btn-staff-to-owner" style="font-size: 10px; padding: 4px 8px; background: rgba(255,255,255,0.2); color: #FFF; border: none;">
              Owner Portal →
            </button>
          ` : ''}
          <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-staff-logout" style="font-size: 10px; padding: 4px 8px;">
            Logout
          </button>
        </div>
      </div>

      <!-- Role Selector Strip (Visible only to Admin or multi-shop owners; Workers are locked to assigned shop) -->
      ${(!isWorker || !user.assignedShop) ? `
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
      ` : `
        <div style="padding: 8px 14px; background: #ECFDF5; border-bottom: 1px solid #A7F3D0; font-size: 11px; font-weight: 700; color: #047857;">
          🔒 Assigned Outlet: ${activeStaffRoleTab.toUpperCase()} (${user.canCollectPayment ? '✓ Cash Collection Permitted' : '✗ Cash Collection Disabled'})
        </div>
      `}

      <!-- Main Role Viewport -->
      <div class="staff-viewport-body" id="staff-viewport-body">
        <!-- Rendered based on selected role -->
      </div>

      <!-- Cash Collection Confirmation Modal -->
      <div class="payment-modal-overlay" id="cash-collection-modal" style="display: none;">
        <div class="payment-modal-card zoom-in" style="max-width: 360px;">
          <div style="font-size: 32px; text-align: center; margin-bottom: 8px;">💵</div>
          <h4 class="pm-title" style="text-align: center;">Confirm Cash Collection</h4>
          <p style="font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 4px;">
            Verify physical receipt of payment at the counter before completing.
          </p>

          <div style="background: #F8FAFC; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; margin: 12px 0; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Order Reference:</span>
              <strong class="font-mono" id="modal-col-orderid">—</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Queue Token:</span>
              <strong class="font-mono text-emerald" id="modal-col-token">—</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Shop Outlet:</span>
              <strong id="modal-col-shop">—</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed #CBD5E1; font-size: 14px;">
              <span>Total Amount Due:</span>
              <strong class="font-mono text-emerald" id="modal-col-amount" style="font-size: 16px;">₹0.00</strong>
            </div>
          </div>

          <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: var(--text-secondary); margin-bottom: 14px; cursor: pointer;">
            <input type="checkbox" id="chk-confirm-physical-receipt" style="margin-top: 2px;" checked />
            <span>I confirm that the full payment has actually been received in physical cash at the counter.</span>
          </label>

          <div class="pm-actions-group">
            <button type="button" class="btn btn-primary btn-block" id="btn-confirm-record-cash">
              <span>Confirm Payment Received</span>
            </button>
            <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-record-cash">
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Order Rejection Modal with Mandatory Reason -->
      <div class="payment-modal-overlay" id="order-rejection-modal" style="display: none;">
        <div class="payment-modal-card zoom-in" style="max-width: 380px;">
          <div style="font-size: 32px; text-align: center; margin-bottom: 8px;">✕</div>
          <h4 class="pm-title" style="text-align: center; color: #DC2626;">Reject Order</h4>
          <p style="font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 4px;">
            Order: <strong class="font-mono" id="modal-rej-orderid">—</strong> (Token: <strong class="font-mono" id="modal-rej-token">—</strong>)
          </p>

          <div style="margin: 14px 0;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 6px;">
              Select Quick Reason:
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
              <button type="button" class="btn btn-secondary btn-sm btn-rej-chip" data-reason="Item Out of Stock">Item Out of Stock</button>
              <button type="button" class="btn btn-secondary btn-sm btn-rej-chip" data-reason="Kitchen / Counter Closed">Counter Closed</button>
              <button type="button" class="btn btn-secondary btn-sm btn-rej-chip" data-reason="Student Requested Cancellation">Student Request</button>
              <button type="button" class="btn btn-secondary btn-sm btn-rej-chip" data-reason="Equipment Maintenance">Maintenance</button>
            </div>

            <label for="rej-reason-text" style="display: block; font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 4px;">
              Mandatory Rejection Reason <span style="color: #DC2626;">*</span>:
            </label>
            <textarea id="rej-reason-text" rows="3" style="width: 100%; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px; font-size: 12px; font-family: inherit; resize: none;" placeholder="Explain clearly why this order is rejected..."></textarea>
            <div id="rej-error-msg" style="color: #DC2626; font-size: 11px; font-weight: 700; margin-top: 4px; display: none;">
              Please provide a mandatory reason before rejecting.
            </div>
          </div>

          <div class="pm-actions-group">
            <button type="button" class="btn btn-primary btn-block" id="btn-confirm-rejection" style="background: #DC2626; border-color: #DC2626; color: #FFF; font-weight: 700;">
              Confirm Rejection
            </button>
            <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-rejection">
              Cancel
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#staff-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const logoutBtn = container.querySelector('#btn-staff-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Log out of Staff Desk?')) {
        logout();
        navigateTo('login');
      }
    });
  }

  const toOwnerBtn = container.querySelector('#btn-staff-to-owner');
  if (toOwnerBtn) {
    toOwnerBtn.addEventListener('click', () => navigateTo('owner'));
  }

  const refreshBtn = container.querySelector('#staff-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderRoleDashboard(container, navigateTo, user);
    });
  }

  // Role Tab Switching (if permitted)
  const roleTabs = container.querySelectorAll('.staff-role-tab');
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeStaffRoleTab = tab.getAttribute('data-role');
      renderRoleDashboard(container, navigateTo, user);
    });
  });

  renderRoleDashboard(container, navigateTo, user);
}

function renderRoleDashboard(container, navigateTo, user) {
  const viewport = container.querySelector('#staff-viewport-body');
  if (!viewport) return;

  if (activeStaffRoleTab === 'canteen') {
    renderCanteenStaffQueue(viewport, container, navigateTo, user);
  } else if (activeStaffRoleTab === 'stationery') {
    renderStationeryStaffQueue(viewport, container, navigateTo, user);
  } else if (activeStaffRoleTab === 'printing') {
    renderPrintingStaffQueue(viewport, container, navigateTo, user);
  } else if (activeStaffRoleTab === 'admin') {
    renderAdminManagement(viewport, container, navigateTo);
  }
}

/**
 * 1. Canteen Staff Queue
 */
function renderCanteenStaffQueue(viewport, container, navigateTo, user) {
  const allOrders = getAllOrders();
  const canteenOrders = allOrders.filter(o => o.shop === 'canteen');
  const crowdStats = getShopCrowdStats('canteen');

  // Sort: Active pending orders first (Placed/Confirmed -> Preparing -> Ready), then Completed
  canteenOrders.sort((a, b) => {
    const priority = { 'PLACED': 1, 'Confirmed': 2, 'Preparing': 3, 'Ready for Collection': 4, 'Completed': 5, 'Cancelled': 6 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  viewport.innerHTML = `
    <div class="staff-queue-view fade-in">
      <div class="staff-crowd-monitor">
        <div>
          <span class="sc-title">Canteen Kitchen Queue</span>
          <span class="sc-sub">${canteenOrders.filter(o => o.status !== 'Completed').length} Orders in Queue</span>
        </div>
        <div class="crowd-pill ${crowdStats.badgeColor}-pill">
          <span class="dot"></span> ${crowdStats.crowdLevel}
        </div>
      </div>

      <div class="staff-orders-list">
        ${canteenOrders.length === 0 ? `
          <div class="empty-results-box">
            <span class="empty-icon">🍳</span>
            <p>No canteen orders placed yet today.</p>
          </div>
        ` : canteenOrders.map(order => {
          const isPod = (order.payment.method === 'Pay on Delivery' || order.payment.method === 'POD');
          const isPaid = (order.payment.status === 'PAID');
          const canCollect = (user.role === 'admin' || user.role === 'SYSTEM_ADMIN' || user.role === 'SHOP_OWNER' || !!user.canCollectPayment);

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

              <div class="so-items-box">
                ${(order.items || []).map(i => `
                  <div class="so-item-line">
                    <strong class="so-item-qty">${i.quantity}×</strong>
                    <span>${i.name}</span>
                    <span style="margin-left: auto; font-size: 11px; color: var(--text-muted);">₹${i.price * i.quantity}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Rejection Reason if Rejected -->
              ${order.status === 'Rejected' && order.rejectionReason ? `
                <div style="background: #FEF2F2; border-left: 3px solid #DC2626; padding: 6px 10px; font-size: 11px; color: #991B1B; margin: 6px 0; border-radius: 4px;">
                  <strong>Rejection Reason:</strong> ${order.rejectionReason}
                </div>
              ` : ''}

              <!-- Payment Status Bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: ${isPaid ? '#ECFDF5' : '#FEF3C7'}; border-radius: var(--radius-sm); margin: 6px 0;">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: ${isPaid ? '#047857' : '#B45309'};">
                    ${isPaid ? 'PAID — Payment Verified ✓' : 'NOT PAID — Pay at shop'}
                  </span>
                  <div style="font-size: 10px; color: var(--text-muted);">Method: ${order.payment.method}</div>
                </div>
                <strong class="font-mono" style="font-size: 13px;">₹${order.totalAmount}.00</strong>
              </div>

              <!-- Worker Audit History Info -->
              <div style="font-size: 10px; color: var(--text-muted); margin: 4px 0;">
                ${order.responsibleWorkerName ? `Last action by: ${order.responsibleWorkerName} (${order.responsibleWorkerId || 'Staff'})` : `Order created: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </div>

              <!-- Cash Collection Trigger for Unpaid POD -->
              ${(!isPaid && isPod) ? `
                <div style="margin: 6px 0;">
                  ${canCollect ? `
                    <button type="button" class="btn btn-action-step btn-open-cash-modal" data-id="${order.orderId}" data-token="${order.token}" data-amount="${order.totalAmount}" data-shop="canteen" style="background: #0F766E; color: #FFFFFF; width: 100%; font-weight: 700; padding: 8px;">
                      💵 Collect Cash Payment (₹${order.totalAmount})
                    </button>
                  ` : `
                    <div style="font-size: 10px; color: #B45309; text-align: center; padding: 4px; background: #FFFBEB; border-radius: 4px;">
                      🔒 Cash Collection Disabled (Awaiting Owner Permission)
                    </div>
                  `}
                </div>
              ` : ''}

              <!-- Fulfillment Actions -->
              <div class="so-footer-row">
                <span style="font-size: 11px; color: var(--text-muted);">
                  ${isPaid && order.payment.collectedBy ? `Cash confirmed by ${order.payment.collectedByName || order.payment.collectedBy}` : ''}
                </span>
                
                <div class="so-action-buttons">
                  ${order.status === 'PLACED' ? `
                    <button type="button" class="btn btn-action-step btn-confirm-order" data-id="${order.orderId}" style="background: #047857; color: #FFF; font-weight: 700;">
                      ✓ Confirm Order
                    </button>
                    <button type="button" class="btn btn-action-step btn-open-reject-modal" data-id="${order.orderId}" data-token="${order.token}" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; font-weight: 700;">
                      ✕ Reject
                    </button>
                  ` : order.status === 'Confirmed' ? `
                    <button type="button" class="btn btn-action-step btn-start-prep" data-id="${order.orderId}">
                      🍳 Start Preparing
                    </button>
                    <button type="button" class="btn btn-action-step btn-open-reject-modal" data-id="${order.orderId}" data-token="${order.token}" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;">
                      ✕ Reject
                    </button>
                  ` : order.status === 'Preparing' ? `
                    <button type="button" class="btn btn-action-step btn-mark-ready" data-id="${order.orderId}">
                      🔔 Mark Ready
                    </button>
                  ` : order.status === 'Ready for Collection' || order.status === 'Ready for Pickup' ? `
                    <button type="button" class="btn btn-action-step btn-complete-order" data-id="${order.orderId}">
                      ✅ Complete Handover
                    </button>
                  ` : order.status === 'Rejected' ? `
                    <span class="so-closed-tag" style="background: #FEE2E2; color: #DC2626; border-color: #FCA5A5;">Rejected ✕</span>
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

  attachQueueActions(viewport, container, navigateTo, user, () => renderCanteenStaffQueue(viewport, container, navigateTo, user));
}

/**
 * 2. Stationery Staff Queue
 */
function renderStationeryStaffQueue(viewport, container, navigateTo, user) {
  const allOrders = getAllOrders();
  const statOrders = allOrders.filter(o => o.shop === 'stationery');
  const crowdStats = getShopCrowdStats('stationery');

  statOrders.sort((a, b) => {
    const priority = { 'PLACED': 1, 'Confirmed': 2, 'Processing': 3, 'Ready for Collection': 4, 'Completed': 5 };
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
        ` : statOrders.map(order => {
          const isPod = (order.payment.method === 'Pay on Delivery' || order.payment.method === 'POD');
          const isPaid = (order.payment.status === 'PAID');
          const canCollect = (user.role === 'admin' || user.role === 'SYSTEM_ADMIN' || user.role === 'SHOP_OWNER' || !!user.canCollectPayment);

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

              <div class="so-items-box">
                ${(order.items || []).map(i => `
                  <div class="so-item-line">
                    <strong class="so-item-qty">${i.quantity}×</strong>
                    <span>${i.name}</span>
                    <span style="margin-left: auto; font-size: 11px; color: var(--text-muted);">₹${i.price * i.quantity}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Rejection Reason if Rejected -->
              ${order.status === 'Rejected' && order.rejectionReason ? `
                <div style="background: #FEF2F2; border-left: 3px solid #DC2626; padding: 6px 10px; font-size: 11px; color: #991B1B; margin: 6px 0; border-radius: 4px;">
                  <strong>Rejection Reason:</strong> ${order.rejectionReason}
                </div>
              ` : ''}

              <!-- Payment Status Bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: ${isPaid ? '#ECFDF5' : '#FEF3C7'}; border-radius: var(--radius-sm); margin: 6px 0;">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: ${isPaid ? '#047857' : '#B45309'};">
                    ${isPaid ? 'PAID — Payment Verified ✓' : 'NOT PAID — Pay at shop'}
                  </span>
                  <div style="font-size: 10px; color: var(--text-muted);">Method: ${order.payment.method}</div>
                </div>
                <strong class="font-mono" style="font-size: 13px;">₹${order.totalAmount}.00</strong>
              </div>

              <!-- Worker Audit History Info -->
              <div style="font-size: 10px; color: var(--text-muted); margin: 4px 0;">
                ${order.responsibleWorkerName ? `Last action by: ${order.responsibleWorkerName} (${order.responsibleWorkerId || 'Staff'})` : `Order created: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </div>

              ${(!isPaid && isPod) ? `
                <div style="margin: 6px 0;">
                  ${canCollect ? `
                    <button type="button" class="btn btn-action-step btn-open-cash-modal" data-id="${order.orderId}" data-token="${order.token}" data-amount="${order.totalAmount}" data-shop="stationery" style="background: #0F766E; color: #FFFFFF; width: 100%; font-weight: 700; padding: 8px;">
                      💵 Collect Cash Payment (₹${order.totalAmount})
                    </button>
                  ` : `
                    <div style="font-size: 10px; color: #B45309; text-align: center; padding: 4px; background: #FFFBEB; border-radius: 4px;">
                      🔒 Cash Collection Disabled (Awaiting Owner Permission)
                    </div>
                  `}
                </div>
              ` : ''}

              <div class="so-footer-row">
                <span style="font-size: 11px; color: var(--text-muted);">
                  ${isPaid && order.payment.collectedBy ? `Cash collected by ${order.payment.collectedByName || order.payment.collectedBy}` : ''}
                </span>
                
                <div class="so-action-buttons">
                  ${order.status === 'PLACED' ? `
                    <button type="button" class="btn btn-action-step btn-confirm-order" data-id="${order.orderId}" style="background: #047857; color: #FFF; font-weight: 700;">
                      ✓ Confirm Order
                    </button>
                    <button type="button" class="btn btn-action-step btn-open-reject-modal" data-id="${order.orderId}" data-token="${order.token}" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; font-weight: 700;">
                      ✕ Reject
                    </button>
                  ` : order.status === 'Confirmed' ? `
                    <button type="button" class="btn btn-action-step btn-start-prep" data-id="${order.orderId}">
                      📦 Start Packing
                    </button>
                    <button type="button" class="btn btn-action-step btn-open-reject-modal" data-id="${order.orderId}" data-token="${order.token}" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;">
                      ✕ Reject
                    </button>
                  ` : order.status === 'Processing' ? `
                    <button type="button" class="btn btn-action-step btn-mark-ready" data-id="${order.orderId}">
                      🔔 Mark Ready
                    </button>
                  ` : order.status === 'Ready for Collection' || order.status === 'Ready for Pickup' ? `
                    <button type="button" class="btn btn-action-step btn-complete-order" data-id="${order.orderId}">
                      ✅ Handed Over
                    </button>
                  ` : order.status === 'Rejected' ? `
                    <span class="so-closed-tag" style="background: #FEE2E2; color: #DC2626; border-color: #FCA5A5;">Rejected ✕</span>
                  ` : `
                    <span class="so-closed-tag">Completed ✓</span>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  attachQueueActions(viewport, container, navigateTo, user, () => renderStationeryStaffQueue(viewport, container, navigateTo, user));
}

/**
 * 3. Printing Staff Queue
 */
function renderPrintingStaffQueue(viewport, container, navigateTo, user) {
  const allOrders = getAllOrders();
  const printOrders = allOrders.filter(o => o.shop === 'printing');
  const crowdStats = getShopCrowdStats('printing');

  printOrders.sort((a, b) => {
    const priority = { 'PLACED': 1, 'Confirmed': 2, 'Printing in Progress': 3, 'Ready for Collection': 4, 'Completed': 5 };
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
          const isPod = (order.payment.method === 'Pay on Delivery' || order.payment.method === 'POD');
          const isPaid = (order.payment.status === 'PAID');
          const canCollect = (user.role === 'admin' || user.role === 'SYSTEM_ADMIN' || user.role === 'SHOP_OWNER' || !!user.canCollectPayment);

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

              <!-- Rejection Reason if Rejected -->
              ${order.status === 'Rejected' && order.rejectionReason ? `
                <div style="background: #FEF2F2; border-left: 3px solid #DC2626; padding: 6px 10px; font-size: 11px; color: #991B1B; margin: 6px 0; border-radius: 4px;">
                  <strong>Rejection Reason:</strong> ${order.rejectionReason}
                </div>
              ` : ''}

              <!-- Payment Status Bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: ${isPaid ? '#ECFDF5' : '#FEF3C7'}; border-radius: var(--radius-sm); margin: 6px 0;">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: ${isPaid ? '#047857' : '#B45309'};">
                    ${isPaid ? 'PAID — Payment Received ✓' : 'NOT PAID — Pay at the shop'}
                  </span>
                  <div style="font-size: 10px; color: var(--text-muted);">Method: ${order.payment.method}</div>
                </div>
                <strong class="font-mono" style="font-size: 13px;">₹${order.totalAmount}</strong>
              </div>

              <!-- Worker Audit History Info -->
              <div style="font-size: 10px; color: var(--text-muted); margin: 4px 0;">
                ${order.responsibleWorkerName ? `Last action by: ${order.responsibleWorkerName} (${order.responsibleWorkerId || 'Staff'})` : `Order created: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </div>

              ${(!isPaid && isPod) ? `
                <div style="margin: 6px 0;">
                  ${canCollect ? `
                    <button type="button" class="btn btn-action-step btn-open-cash-modal" data-id="${order.orderId}" data-token="${order.token}" data-amount="${order.totalAmount}" data-shop="printing" style="background: #0F766E; color: #FFFFFF; width: 100%; font-weight: 700; padding: 8px;">
                      💵 Collect Cash Payment (₹${order.totalAmount})
                    </button>
                  ` : `
                    <div style="font-size: 10px; color: #B45309; text-align: center; padding: 4px; background: #FFFBEB; border-radius: 4px;">
                      🔒 Cash Collection Disabled (Awaiting Owner Permission)
                    </div>
                  `}
                </div>
              ` : ''}

              <div class="so-footer-row">
                <span style="font-size: 11px; color: var(--text-muted);">
                  ${isPaid && order.payment.collectedBy ? `Cash collected by ${order.payment.collectedByName || order.payment.collectedBy}` : ''}
                </span>
                
                <div class="so-action-buttons">
                  ${order.status === 'PLACED' ? `
                    <button type="button" class="btn btn-action-step btn-confirm-order" data-id="${order.orderId}" style="background: #047857; color: #FFF; font-weight: 700;">
                      ✓ Confirm Order
                    </button>
                    <button type="button" class="btn btn-action-step btn-open-reject-modal" data-id="${order.orderId}" data-token="${order.token}" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; font-weight: 700;">
                      ✕ Reject
                    </button>
                  ` : order.status === 'Confirmed' ? `
                    <button type="button" class="btn btn-action-step btn-start-prep" data-id="${order.orderId}">
                      🖨️ Start Laser Print
                    </button>
                    <button type="button" class="btn btn-action-step btn-open-reject-modal" data-id="${order.orderId}" data-token="${order.token}" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;">
                      ✕ Reject
                    </button>
                  ` : order.status === 'Printing in Progress' ? `
                    <button type="button" class="btn btn-action-step btn-mark-ready" data-id="${order.orderId}">
                      🔔 Mark Sheets Ready
                    </button>
                  ` : order.status === 'Ready for Collection' ? `
                    <button type="button" class="btn btn-action-step btn-complete-order" data-id="${order.orderId}">
                      ✅ Handed to Student
                    </button>
                  ` : order.status === 'Rejected' ? `
                    <span class="so-closed-tag" style="background: #FEE2E2; color: #DC2626; border-color: #FCA5A5;">Rejected ✕</span>
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

  attachQueueActions(viewport, container, navigateTo, user, () => renderPrintingStaffQueue(viewport, container, navigateTo, user));
}

/**
 * Shared Action Attacher for Staff Queues & POD Cash Collection
 */
function attachQueueActions(viewport, container, navigateTo, user, reRenderFn) {
  // 1. Confirm workflow
  viewport.querySelectorAll('.btn-confirm-order').forEach(btn => {
    btn.onclick = () => {
      const orderId = btn.getAttribute('data-id');
      try {
        updateOrderStatus(orderId, 'Confirmed', user);
        reRenderFn();
      } catch (err) {
        alert(`Order Notice: ${err.message}`);
      }
    };
  });

  // 2. Preparation workflow
  viewport.querySelectorAll('.btn-start-prep').forEach(btn => {
    btn.onclick = () => {
      const orderId = btn.getAttribute('data-id');
      const nextStatus = activeStaffRoleTab === 'printing' ? 'Printing in Progress' : (activeStaffRoleTab === 'stationery' ? 'Processing' : 'Preparing');
      try {
        updateOrderStatus(orderId, nextStatus, user);
        reRenderFn();
      } catch (err) {
        alert(`Order Notice: ${err.message}`);
      }
    };
  });

  viewport.querySelectorAll('.btn-mark-ready').forEach(btn => {
    btn.onclick = () => {
      try {
        updateOrderStatus(btn.getAttribute('data-id'), 'Ready for Collection', user);
        reRenderFn();
      } catch (err) {
        alert(`Order Notice: ${err.message}`);
      }
    };
  });

  viewport.querySelectorAll('.btn-complete-order').forEach(btn => {
    btn.onclick = () => {
      try {
        updateOrderStatus(btn.getAttribute('data-id'), 'Completed', user);
        reRenderFn();
      } catch (err) {
        alert(`Order Notice: ${err.message}`);
      }
    };
  });

  // 3. Order Rejection Modal Handler
  const rejModal = container.querySelector('#order-rejection-modal');
  const modalRejOrderId = container.querySelector('#modal-rej-orderid');
  const modalRejToken = container.querySelector('#modal-rej-token');
  const rejReasonText = container.querySelector('#rej-reason-text');
  const rejErrorMsg = container.querySelector('#rej-error-msg');
  const confirmRejBtn = container.querySelector('#btn-confirm-rejection');
  const cancelRejBtn = container.querySelector('#btn-cancel-rejection');
  const rejChips = container.querySelectorAll('.btn-rej-chip');

  let pendingRejectionOrderId = null;

  viewport.querySelectorAll('.btn-open-reject-modal').forEach(btn => {
    btn.onclick = () => {
      pendingRejectionOrderId = btn.getAttribute('data-id');
      const token = btn.getAttribute('data-token');
      if (modalRejOrderId) modalRejOrderId.textContent = pendingRejectionOrderId;
      if (modalRejToken) modalRejToken.textContent = token;
      if (rejReasonText) rejReasonText.value = '';
      if (rejErrorMsg) rejErrorMsg.style.display = 'none';
      if (rejModal) rejModal.style.display = 'flex';
    };
  });

  rejChips.forEach(chip => {
    chip.onclick = () => {
      if (rejReasonText) {
        rejReasonText.value = chip.getAttribute('data-reason');
        if (rejErrorMsg) rejErrorMsg.style.display = 'none';
      }
    };
  });

  if (cancelRejBtn) {
    cancelRejBtn.onclick = () => {
      if (rejModal) rejModal.style.display = 'none';
      pendingRejectionOrderId = null;
    };
  }

  if (confirmRejBtn) {
    confirmRejBtn.onclick = () => {
      const reason = rejReasonText ? rejReasonText.value.trim() : '';
      if (!reason) {
        if (rejErrorMsg) rejErrorMsg.style.display = 'block';
        return;
      }
      if (!pendingRejectionOrderId) return;
      try {
        updateOrderStatus(pendingRejectionOrderId, 'Rejected', user, reason);
        if (rejModal) rejModal.style.display = 'none';
        pendingRejectionOrderId = null;
        reRenderFn();
      } catch (err) {
        alert(`Rejection Notice: ${err.message}`);
      }
    };
  }

  // 4. Physical Cash Collection Modal Handler
  const cashModal = container.querySelector('#cash-collection-modal');
  const modalOrderId = container.querySelector('#modal-col-orderid');
  const modalToken = container.querySelector('#modal-col-token');
  const modalShop = container.querySelector('#modal-col-shop');
  const modalAmount = container.querySelector('#modal-col-amount');
  const confirmRecordBtn = container.querySelector('#btn-confirm-record-cash');
  const cancelRecordBtn = container.querySelector('#btn-cancel-record-cash');
  const chkConfirm = container.querySelector('#chk-confirm-physical-receipt');

  let pendingCollectionOrderId = null;

  viewport.querySelectorAll('.btn-open-cash-modal').forEach(btn => {
    btn.onclick = () => {
      pendingCollectionOrderId = btn.getAttribute('data-id');
      const token = btn.getAttribute('data-token');
      const amount = btn.getAttribute('data-amount');
      const shop = btn.getAttribute('data-shop');

      if (modalOrderId) modalOrderId.textContent = pendingCollectionOrderId;
      if (modalToken) modalToken.textContent = token;
      if (modalShop) modalShop.textContent = shop.toUpperCase();
      if (modalAmount) modalAmount.textContent = `₹${amount}.00`;
      if (chkConfirm) chkConfirm.checked = true;

      if (cashModal) cashModal.style.display = 'flex';
    };
  });

  if (cancelRecordBtn) {
    cancelRecordBtn.onclick = () => {
      if (cashModal) cashModal.style.display = 'none';
      pendingCollectionOrderId = null;
    };
  }

  if (confirmRecordBtn) {
    confirmRecordBtn.onclick = () => {
      if (!chkConfirm || !chkConfirm.checked) {
        alert('Please confirm that physical cash has been received.');
        return;
      }

      if (!pendingCollectionOrderId) return;

      try {
        const result = recordPodPaymentCollection(pendingCollectionOrderId, user);
        if (cashModal) cashModal.style.display = 'none';

        alert(`Payment Received Successfully!\n\nOrder ID: ${result.orderId}\nToken: ${result.token}\nAmount Collected: ₹${result.amount}\nCollection Time: ${new Date(result.collectedAt).toLocaleTimeString()}`);
        pendingCollectionOrderId = null;
        reRenderFn();
      } catch (err) {
        alert(`Collection Error: ${err.message}`);
      }
    };
  }
}

/**
 * 4. Campus Admin Portal (Prices, Stock, Print Rates, Stats)
 */
function renderAdminManagement(viewport, container, navigateTo) {
  const allOrders = getAllOrders();
  const canteenMenu = getCanteenMenu();
  const stationeryItems = getStationeryItems();
  const printRates = getPrintRates();

  const totalRevenue = allOrders.reduce((sum, o) => {
    return (o.payment && o.payment.status === 'PAID') ? sum + o.totalAmount : sum;
  }, 0);
  const activeTokens = allOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;

  viewport.innerHTML = `
    <div class="admin-management-view fade-in">
      <div class="admin-metrics-grid">
        <div class="admin-stat-card">
          <span class="a-stat-label">Total Verified Revenue</span>
          <h3 class="a-stat-val text-success font-mono">₹${totalRevenue.toLocaleString()}</h3>
          <span class="a-stat-sub">From ${allOrders.length} Campus Orders</span>
        </div>
        <div class="admin-stat-card">
          <span class="a-stat-label">Active Tokens in Queue</span>
          <h3 class="a-stat-val text-violet font-mono">${activeTokens}</h3>
          <span class="a-stat-sub">Across All Counters</span>
        </div>
      </div>

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

      <div class="admin-card">
        <div class="admin-card-header">
          <h4 class="admin-card-title">🍽️ Canteen Menu Stock Control</h4>
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

  viewport.querySelector('#btn-save-print-rates').onclick = () => {
    const bw = parseFloat(viewport.querySelector('#admin-bw-rate').value) || 1;
    const col = parseFloat(viewport.querySelector('#admin-color-rate').value) || 5;
    const current = getPrintRates();
    current.blackAndWhite = bw;
    current.colour = col;
    savePrintRates(current);
    alert('Print rates updated successfully!');
  };

  viewport.querySelectorAll('.btn-toggle-stock').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const menu = getCanteenMenu();
      const dish = menu.find(d => d.id === id);
      if (dish) {
        dish.available = !dish.available;
        saveCanteenMenu(menu);
        renderAdminManagement(viewport, container, navigateTo);
      }
    };
  });

  viewport.querySelectorAll('.btn-restock-stat').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const items = getStationeryItems();
      const stat = items.find(s => s.id === id);
      if (stat) {
        stat.stock += 20;
        saveStationeryItems(items);
        renderAdminManagement(viewport, container, navigateTo);
      }
    };
  });
}
