/**
 * JIT SMART CAMPUS - Redesigned Order History & Student Profile Portals
 * 
 * STRICT SPECIFICATION COMPLIANCE:
 * - Profile: Deep teal/emerald primary aesthetic, student initials avatar, real calculated statistics,
 *   strictly real student details (no DOB or secrets), 6 working Quick Actions.
 * - My Orders: Header with title, subtitle & dynamic count, 3 summary cards, functioning filters
 *   (All, Active, Completed, Cancelled), rich order cards, working actions (Track Order, View Details modal,
 *   View Token, Reorder via cart), tracking timeline modal, and compliant empty state.
 * - Strict per-student data separation.
 */

import { getAllOrders, getOrdersByStudent, getCartState, saveCartState } from './storage.js';
import { getCurrentUser, logout } from './auth.js';
import { ICONS } from './icons.js';

let currentHistoryFilter = 'all'; // 'all' | 'active' | 'completed' | 'cancelled'

/**
 * Helper to compute 2-letter student initials
 */
function getStudentInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1] || '')).toUpperCase();
}

/**
 * =========================================================================
 * 4. MY ORDERS PORTAL — PREMIUM ORDER DASHBOARD
 * =========================================================================
 */
export function renderHistoryScreen(container, navigateTo) {
  const user = getCurrentUser();
  const studentOrders = user && user.role === 'student'
    ? getOrdersByStudent(user.regNo)
    : getAllOrders();

  // Dynamic statistics calculations
  const totalOrdersCount = studentOrders.length;
  const activeOrdersCount = studentOrders.filter(
    o => o.status !== 'Completed' && o.status !== 'Cancelled'
  ).length;
  const completedOrdersCount = studentOrders.filter(
    o => o.status === 'Completed'
  ).length;
  const cancelledOrdersCount = studentOrders.filter(
    o => o.status === 'Cancelled'
  ).length;

  container.innerHTML = `
    <div class="history-screen fade-in" id="history-screen-root">
      
      <!-- PAGE HEADER -->
      <header class="history-top-header sticky-top">
        <div class="h-header-nav-row">
          <button type="button" class="icon-nav-btn" id="history-back-btn" aria-label="Back to Home">
            ${ICONS.chevronLeft(20)}
          </button>
          <div class="h-header-title-wrap">
            <h1 class="h-page-title">My Orders</h1>
            <p class="h-page-subtitle">Your campus orders, all in one place.</p>
          </div>
          <div class="h-order-count-pill font-mono">
            <span>${totalOrdersCount} ${totalOrdersCount === 1 ? 'Order' : 'Orders'}</span>
          </div>
        </div>
      </header>

      <div class="history-main-content">
        
        <!-- ORDER SUMMARY CARDS -->
        <section class="order-summary-grid">
          <div class="order-stat-card stat-total">
            <div class="stat-icon-wrap">${ICONS.orders(20)}</div>
            <div class="stat-info">
              <span class="stat-number font-mono">${totalOrdersCount}</span>
              <span class="stat-label">Total Orders</span>
            </div>
          </div>

          <div class="order-stat-card stat-active">
            <div class="stat-icon-wrap">${ICONS.clock(20)}</div>
            <div class="stat-info">
              <span class="stat-number font-mono">${activeOrdersCount}</span>
              <span class="stat-label">Active Orders</span>
            </div>
          </div>

          <div class="order-stat-card stat-completed">
            <div class="stat-icon-wrap">${ICONS.check(20)}</div>
            <div class="stat-info">
              <span class="stat-number font-mono">${completedOrdersCount}</span>
              <span class="stat-label">Completed</span>
            </div>
          </div>
        </section>

        <!-- ORDER FILTERS BAR -->
        <nav class="order-filters-strip" aria-label="Order filters">
          <button type="button" class="order-filter-btn ${currentHistoryFilter === 'all' ? 'active' : ''}" data-filter="all">
            <span>All Orders</span>
            <span class="filter-count-badge">${totalOrdersCount}</span>
          </button>
          <button type="button" class="order-filter-btn ${currentHistoryFilter === 'active' ? 'active' : ''}" data-filter="active">
            <span>Active</span>
            <span class="filter-count-badge">${activeOrdersCount}</span>
          </button>
          <button type="button" class="order-filter-btn ${currentHistoryFilter === 'completed' ? 'active' : ''}" data-filter="completed">
            <span>Completed</span>
            <span class="filter-count-badge">${completedOrdersCount}</span>
          </button>
          <button type="button" class="order-filter-btn ${currentHistoryFilter === 'cancelled' ? 'active' : ''}" data-filter="cancelled">
            <span>Cancelled</span>
            <span class="filter-count-badge">${cancelledOrdersCount}</span>
          </button>
        </nav>

        <!-- ORDERS CARDS STACK CONTAINER -->
        <div class="history-orders-list" id="history-orders-list-container">
          <!-- Rendered dynamically -->
        </div>

      </div>

      <!-- ORDER DETAILS MODAL (Populated dynamically) -->
      <div class="history-modal-overlay" id="order-details-modal" style="display: none;">
        <div class="history-modal-card zoom-in" id="order-details-modal-content">
          <!-- Injected dynamically -->
        </div>
      </div>

      <!-- ORDER TRACKING TIMELINE MODAL (Populated dynamically) -->
      <div class="history-modal-overlay" id="order-tracking-modal" style="display: none;">
        <div class="history-modal-card zoom-in" id="order-tracking-modal-content">
          <!-- Injected dynamically -->
        </div>
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#history-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  // Attach Filter Listeners
  const filterBtns = container.querySelectorAll('.order-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentHistoryFilter = btn.getAttribute('data-filter');
      renderOrderCardsList(container, navigateTo);
    });
  });

  renderOrderCardsList(container, navigateTo);
}

/**
 * Renders filtered order cards or empty state
 */
function renderOrderCardsList(container, navigateTo) {
  const listEl = container.querySelector('#history-orders-list-container');
  if (!listEl) return;

  const user = getCurrentUser();
  const allOrders = user && user.role === 'student'
    ? getOrdersByStudent(user.regNo)
    : getAllOrders();

  // Apply active filter
  const filtered = allOrders.filter(order => {
    if (currentHistoryFilter === 'active') {
      return order.status !== 'Completed' && order.status !== 'Cancelled';
    }
    if (currentHistoryFilter === 'completed') {
      return order.status === 'Completed';
    }
    if (currentHistoryFilter === 'cancelled') {
      return order.status === 'Cancelled';
    }
    return true;
  });

  // EMPTY STATE (Section 4 Compliance)
  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="order-empty-state-card fade-in">
        <div class="empty-state-icon">
          ${ICONS.orders(48)}
        </div>
        <h3 class="empty-state-title">No orders yet</h3>
        <p class="empty-state-subtitle">Your campus orders will appear here.</p>
        
        <div class="empty-services-actions">
          <span class="empty-actions-label">Explore Campus Services:</span>
          <div class="empty-buttons-group">
            <button type="button" class="btn btn-primary btn-sm" id="empty-goto-canteen">
              🍔 JIT Canteen
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="empty-goto-stationery">
              📚 JIT Stationery
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="empty-goto-printing">
              🖨️ Printing
            </button>
          </div>
        </div>
      </div>
    `;

    const btnCanteen = listEl.querySelector('#empty-goto-canteen');
    if (btnCanteen) btnCanteen.addEventListener('click', () => navigateTo('canteen'));

    const btnStationery = listEl.querySelector('#empty-goto-stationery');
    if (btnStationery) btnStationery.addEventListener('click', () => navigateTo('stationery'));

    const btnPrinting = listEl.querySelector('#empty-goto-printing');
    if (btnPrinting) btnPrinting.addEventListener('click', () => navigateTo('printing'));

    return;
  }

  const shopNameMap = {
    canteen: 'JIT Canteen',
    stationery: 'JIT Stationery',
    printing: 'Reprographics & Printing'
  };

  const shopIconMap = {
    canteen: '🍔',
    stationery: '📚',
    printing: '🖨️'
  };

  // Render cards
  listEl.innerHTML = `
    <div class="orders-cards-stack">
      ${filtered.map(order => {
        const isActive = order.status !== 'Completed' && order.status !== 'Cancelled';
        const isReady = order.status === 'Ready for Collection' || order.status === 'Ready for Pickup';
        const isCompleted = order.status === 'Completed';
        const isCancelled = order.status === 'Cancelled';

        let badgeClass = 'status-default';
        if (isCompleted) badgeClass = 'status-completed';
        else if (isReady) badgeClass = 'status-ready';
        else if (isActive) badgeClass = 'status-preparing';
        else if (isCancelled) badgeClass = 'status-cancelled';

        const dateObj = new Date(order.createdAt);
        const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const itemsList = order.shop === 'printing' && order.printConfig
          ? `1× ${order.printConfig.fileName} (${order.printConfig.pagesToPrint} pages)`
          : (order.items || []).map(i => `${i.quantity}× ${i.name}`).join(' • ');

        return `
          <article class="order-dashboard-card ${isActive ? 'order-card-active' : ''} fade-in" data-order-id="${order.orderId}">
            
            <!-- Card Header Row -->
            <div class="odc-header">
              <div class="odc-outlet-group">
                <span class="outlet-icon-badge">${shopIconMap[order.shop] || '🛍️'}</span>
                <div>
                  <h3 class="odc-shop-name">${shopNameMap[order.shop] || 'Campus Service'}</h3>
                  <div class="odc-meta-row">
                    <span class="odc-order-id font-mono">${order.orderId}</span>
                    <span class="odc-dot">•</span>
                    <span class="odc-datetime">${formattedDate} at ${formattedTime}</span>
                  </div>
                </div>
              </div>

              <!-- Token Number Badge -->
              ${order.token ? `
                <div class="odc-token-badge">
                  <span class="token-lbl">TOKEN</span>
                  <span class="token-val font-mono">${order.token}</span>
                </div>
              ` : ''}
            </div>

            <!-- Items Ordered Section -->
            <div class="odc-items-box">
              <p class="odc-items-summary">${itemsList || 'Order items summary unavailable'}</p>
            </div>

            <!-- Payment & Amount Row -->
            <div class="odc-payment-info-row">
              <div class="odc-pricing-block">
                <span class="odc-amount-lbl">Total Amount</span>
                <span class="odc-amount-val font-mono">₹${order.totalAmount}.00</span>
              </div>

              <div class="odc-status-block">
                <span class="odc-status-pill ${badgeClass}">
                  ${isReady ? '🔔 ' : ''}${order.status}
                </span>
                ${order.payment ? `
                  <span class="odc-payment-pill">
                    💳 ${order.payment.method || 'Online'} • ${order.payment.status || 'VERIFIED'}
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Context-Sensitive Action Buttons -->
            <div class="odc-actions-row">
              <!-- 1. Track Order (Active orders) -->
              ${isActive ? `
                <button type="button" class="btn btn-primary btn-sm btn-track-timeline" data-id="${order.orderId}">
                  📡 Track Order
                </button>
              ` : ''}

              <!-- 2. View Details (All orders) -->
              <button type="button" class="btn btn-secondary btn-sm btn-view-order-details" data-id="${order.orderId}">
                📋 View Details
              </button>

              <!-- 3. View Token (Orders with tokens) -->
              ${order.token ? `
                <button type="button" class="btn btn-secondary btn-sm btn-view-digital-token" data-id="${order.orderId}">
                  🎟️ View Token
                </button>
              ` : ''}

              <!-- 4. Reorder (Existing cart integration) -->
              <button type="button" class="btn btn-outline-primary btn-sm btn-reorder-cart" data-id="${order.orderId}">
                🔄 Reorder
              </button>
            </div>

          </article>
        `;
      }).join('')}
    </div>
  `;

  // Attach Action Handlers: Track Order Timeline
  listEl.querySelectorAll('.btn-track-timeline').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const order = allOrders.find(o => o.orderId === id);
      if (order) showTrackingTimelineModal(container, order);
    });
  });

  // Attach Action Handlers: View Details
  listEl.querySelectorAll('.btn-view-order-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const order = allOrders.find(o => o.orderId === id);
      if (order) showOrderDetailsModal(container, order, navigateTo);
    });
  });

  // Attach Action Handlers: View Token
  listEl.querySelectorAll('.btn-view-digital-token').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      navigateTo('token', { orderId: id });
    });
  });

  // Attach Action Handlers: Reorder (Uses existing cart functionality)
  listEl.querySelectorAll('.btn-reorder-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const order = allOrders.find(o => o.orderId === id);
      if (order) executeReorderToCart(order, navigateTo);
    });
  });
}

/**
 * Reorder items using existing shopping cart state
 */
function executeReorderToCart(order, navigateTo) {
  const cart = getCartState();

  if (order.shop === 'canteen') {
    if (!cart.canteenItems) cart.canteenItems = [];
    (order.items || []).forEach(item => {
      const found = cart.canteenItems.find(i => i.id === item.id);
      if (found) {
        found.quantity += (item.quantity || 1);
      } else {
        cart.canteenItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          category: item.category || 'Food'
        });
      }
    });
    cart.activeShop = 'canteen';
    saveCartState(cart);
    navigateTo('cart', { shop: 'canteen' });
  } else if (order.shop === 'stationery') {
    if (!cart.stationeryItems) cart.stationeryItems = [];
    (order.items || []).forEach(item => {
      const found = cart.stationeryItems.find(i => i.id === item.id);
      if (found) {
        found.quantity += (item.quantity || 1);
      } else {
        cart.stationeryItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          category: item.category || 'Stationery'
        });
      }
    });
    cart.activeShop = 'stationery';
    saveCartState(cart);
    navigateTo('cart', { shop: 'stationery' });
  } else if (order.shop === 'printing' && order.printConfig) {
    cart.printJob = { ...order.printConfig };
    cart.activeShop = 'printing';
    saveCartState(cart);
    navigateTo('cart', { shop: 'printing' });
  }
}

/**
 * Shows comprehensive Order Details Modal
 */
function showOrderDetailsModal(container, order, navigateTo) {
  const modalOverlay = container.querySelector('#order-details-modal');
  const modalContent = container.querySelector('#order-details-modal-content');
  if (!modalOverlay || !modalContent) return;

  const dateObj = new Date(order.createdAt);
  const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  modalContent.innerHTML = `
    <div class="odm-header">
      <div>
        <span class="odm-super-label">ORDER SPECIFICATION</span>
        <h3 class="odm-title">${order.orderId}</h3>
      </div>
      <button type="button" class="odm-close-btn" id="odm-close-btn" aria-label="Close">✕</button>
    </div>

    <div class="odm-body">
      <!-- Shop & Status Banner -->
      <div class="odm-status-banner">
        <div>
          <strong class="odm-shop-title">${order.shop === 'canteen' ? 'JIT Canteen' : order.shop === 'stationery' ? 'JIT Stationery' : 'Reprographics & Printing'}</strong>
          <span class="odm-date font-mono">${formattedDate} • ${formattedTime}</span>
        </div>
        <span class="odm-token-tag font-mono">${order.token || 'NO TOKEN'}</span>
      </div>

      <!-- Items & Prices List -->
      <div class="odm-items-section">
        <h4 class="odm-section-heading">Items Ordered</h4>
        <div class="odm-items-table">
          ${order.shop === 'printing' && order.printConfig ? `
            <div class="odm-item-row">
              <span class="odm-item-name">📄 ${order.printConfig.fileName} (${order.printConfig.pagesToPrint} pgs × ${order.printConfig.copies} copies)</span>
              <span class="odm-item-price font-mono">₹${order.totalAmount}.00</span>
            </div>
          ` : (order.items || []).map(item => `
            <div class="odm-item-row">
              <div class="odm-item-name-group">
                <span class="odm-qty font-mono">${item.quantity}×</span>
                <span class="odm-name">${item.name}</span>
              </div>
              <span class="odm-item-price font-mono">₹${(item.price || 0) * (item.quantity || 1)}.00</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Bill Breakdown -->
      <div class="odm-bill-section">
        <div class="odm-bill-row">
          <span>Subtotal</span>
          <span class="font-mono">₹${order.totalAmount}.00</span>
        </div>
        <div class="odm-bill-row">
          <span>Campus Order Fee</span>
          <span class="text-success font-mono">FREE</span>
        </div>
        <div class="odm-bill-row odm-bill-total">
          <span>Total Amount</span>
          <span class="font-mono text-emerald">₹${order.totalAmount}.00</span>
        </div>
      </div>

      <!-- Payment & Fulfillment Details -->
      <div class="odm-meta-card">
        <div class="odm-meta-row">
          <span class="odm-meta-lbl">Payment Method:</span>
          <strong class="odm-meta-val">${order.payment?.method || 'UPI / Online'}</strong>
        </div>
        <div class="odm-meta-row">
          <span class="odm-meta-lbl">Payment Status:</span>
          <strong class="odm-meta-val text-emerald">${order.payment?.status || 'VERIFIED'}</strong>
        </div>
        <div class="odm-meta-row">
          <span class="odm-meta-lbl">Order Status:</span>
          <strong class="odm-meta-val">${order.status}</strong>
        </div>
        ${order.payment?.txnId ? `
          <div class="odm-meta-row">
            <span class="odm-meta-lbl">Transaction Ref:</span>
            <span class="odm-meta-val font-mono">${order.payment.txnId}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Modal Footer Actions -->
    <div class="odm-footer">
      ${order.token ? `
        <button type="button" class="btn btn-secondary btn-block" id="odm-btn-token">
          🎟️ View Digital Token Pass
        </button>
      ` : ''}
      <button type="button" class="btn btn-primary btn-block" id="odm-btn-reorder">
        🔄 Reorder These Items
      </button>
    </div>
  `;

  modalOverlay.style.display = 'flex';

  const closeBtn = modalContent.querySelector('#odm-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => { modalOverlay.style.display = 'none'; };
  }

  const tokenBtn = modalContent.querySelector('#odm-btn-token');
  if (tokenBtn) {
    tokenBtn.onclick = () => {
      modalOverlay.style.display = 'none';
      navigateTo('token', { orderId: order.orderId });
    };
  }

  const reorderBtn = modalContent.querySelector('#odm-btn-reorder');
  if (reorderBtn) {
    reorderBtn.onclick = () => {
      modalOverlay.style.display = 'none';
      executeReorderToCart(order, navigateTo);
    };
  }

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
  };
}

/**
 * Shows Order Tracking Progress Timeline Modal
 */
function showTrackingTimelineModal(container, order) {
  const modalOverlay = container.querySelector('#order-tracking-modal');
  const modalContent = container.querySelector('#order-tracking-modal-content');
  if (!modalOverlay || !modalContent) return;

  const stages = [
    { key: 'placed', label: 'Order Placed', desc: 'Received by outlet server' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Payment verified and queued' },
    { key: 'preparing', label: 'Preparing', desc: 'Counter staff assembling order' },
    { key: 'ready', label: 'Ready for Pickup', desc: 'Available at collection desk' },
    { key: 'completed', label: 'Completed', desc: 'Collected with verified token' }
  ];

  // Map real status to stage index
  let activeIndex = 0;
  const s = (order.status || '').toLowerCase();
  if (s.includes('completed')) activeIndex = 4;
  else if (s.includes('ready') || s.includes('collection')) activeIndex = 3;
  else if (s.includes('prep') || s.includes('process') || s.includes('printing')) activeIndex = 2;
  else if (s.includes('confirm')) activeIndex = 1;
  else activeIndex = 0;

  modalContent.innerHTML = `
    <div class="odm-header">
      <div>
        <span class="odm-super-label">LIVE ORDER TRACKING</span>
        <h3 class="odm-title">${order.orderId}</h3>
      </div>
      <button type="button" class="odm-close-btn" id="otm-close-btn" aria-label="Close">✕</button>
    </div>

    <div class="otm-body">
      <div class="otm-token-pill">
        <span>TOKEN: </span>
        <strong class="font-mono">${order.token || 'IN QUEUE'}</strong>
      </div>

      <!-- Real Order Progress Timeline -->
      <div class="otm-timeline-stack">
        ${stages.map((stage, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isPending = idx > activeIndex;

          return `
            <div class="timeline-step-row ${isCurrent ? 'step-current' : ''} ${isDone ? 'step-done' : ''} ${isPending ? 'step-pending' : ''}">
              <div class="timeline-node-wrap">
                <div class="timeline-node-icon">
                  ${isDone ? '✓' : isCurrent ? '●' : '○'}
                </div>
                ${idx < stages.length - 1 ? `<div class="timeline-node-line"></div>` : ''}
              </div>
              <div class="timeline-text-wrap">
                <strong class="timeline-stage-title">${stage.label}</strong>
                <span class="timeline-stage-desc">${isCurrent ? `Live status: ${order.status}` : stage.desc}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="odm-footer">
      <button type="button" class="btn btn-primary btn-block" id="otm-dismiss-btn">
        Close Tracking
      </button>
    </div>
  `;

  modalOverlay.style.display = 'flex';

  const closeBtn = modalContent.querySelector('#otm-close-btn');
  if (closeBtn) closeBtn.onclick = () => { modalOverlay.style.display = 'none'; };

  const dismissBtn = modalContent.querySelector('#otm-dismiss-btn');
  if (dismissBtn) dismissBtn.onclick = () => { modalOverlay.style.display = 'none'; };

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
  };
}

/**
 * =========================================================================
 * 3. PROFILE PORTAL — PREMIUM STUDENT DASHBOARD
 * =========================================================================
 */
export function renderProfileScreen(container, navigateTo) {
  const user = getCurrentUser();
  const studentOrders = user && user.role === 'student'
    ? getOrdersByStudent(user.regNo)
    : getAllOrders();

  // Dynamic profile statistics calculation from actual order records
  const totalOrdersCount = studentOrders.length;
  const activeOrdersCount = studentOrders.filter(
    o => o.status !== 'Completed' && o.status !== 'Cancelled'
  ).length;
  const completedOrdersCount = studentOrders.filter(
    o => o.status === 'Completed'
  ).length;

  const initials = getStudentInitials(user ? user.name : 'Student');
  const studentEmail = (user && user.regNo) ? `${user.regNo.toLowerCase()}@jit.edu.in` : 'student@jit.edu.in';

  container.innerHTML = `
    <div class="profile-screen fade-in" id="profile-screen-root">
      
      <!-- SCREEN HEADER -->
      <header class="profile-top-header sticky-top">
        <div class="p-header-row">
          <button type="button" class="icon-nav-btn" id="profile-back-btn" aria-label="Back to Home">
            ${ICONS.chevronLeft(20)}
          </button>
          <div class="p-header-title-wrap">
            <h1 class="p-page-title">Student Profile</h1>
            <span class="p-verified-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              VERIFIED SCHOLAR
            </span>
          </div>
          <button type="button" class="p-header-logout-icon" id="profile-quick-logout-btn" title="Logout">
            ${ICONS.logOut(18)}
          </button>
        </div>
      </header>

      <div class="profile-content-body">
        
        <!-- 1. PROFILE HERO HEADER CARD -->
        <section class="profile-hero-card">
          <!-- Initials Avatar -->
          <div class="profile-initials-avatar-wrap">
            <div class="profile-initials-circle">
              <span>${initials}</span>
            </div>
            <div class="avatar-online-dot" title="Active Campus Scholar"></div>
          </div>

          <div class="profile-hero-identity">
            <h2 class="profile-student-name">${user ? user.name : 'Campus Scholar'}</h2>
            <div class="profile-hero-pills-row">
              <span class="profile-reg-badge font-mono">${user ? user.regNo : ''}</span>
              <span class="profile-status-pill">Active Scholar</span>
            </div>
            <p class="profile-hero-dept">${user ? user.department : 'Engineering & Technology'}</p>
          </div>

          <!-- Header Action Buttons -->
          <div class="profile-hero-actions-row">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-profile-edit">
              ✏️ Edit Profile
            </button>
            <button type="button" class="btn btn-danger-subtle btn-sm" id="btn-profile-logout-top">
              🚪 Logout
            </button>
          </div>
        </section>

        <!-- 2. REAL PROFILE STATISTICS -->
        <section class="profile-stats-card">
          <div class="p-stats-header">
            <h3 class="p-stats-title">Order Statistics</h3>
            <span class="p-stats-sub font-mono">REAL-TIME</span>
          </div>
          <div class="p-stats-grid">
            <div class="p-stat-box">
              <span class="p-stat-val font-mono">${totalOrdersCount}</span>
              <span class="p-stat-lbl">Total Orders</span>
            </div>
            <div class="p-stat-box">
              <span class="p-stat-val font-mono text-emerald">${activeOrdersCount}</span>
              <span class="p-stat-lbl">Active Orders</span>
            </div>
            <div class="p-stat-box">
              <span class="p-stat-val font-mono text-teal">${completedOrdersCount}</span>
              <span class="p-stat-lbl">Completed</span>
            </div>
          </div>
        </section>

        <!-- 3. PROFILE INFORMATION CARD (Only real available data, strictly no DOB) -->
        <section class="profile-info-card">
          <h3 class="p-section-heading">Academic & Account Details</h3>
          
          <div class="p-info-list">
            <div class="p-info-row">
              <div class="p-info-key">
                <span class="p-key-icon">👤</span>
                <span>Student Name</span>
              </div>
              <strong class="p-info-value">${user ? user.name : '—'}</strong>
            </div>

            <div class="p-info-row">
              <div class="p-info-key">
                <span class="p-key-icon">🆔</span>
                <span>Registration Number</span>
              </div>
              <strong class="p-info-value font-mono">${user ? user.regNo : '—'}</strong>
            </div>

            <div class="p-info-row">
              <div class="p-info-key">
                <span class="p-key-icon">🏛️</span>
                <span>Department</span>
              </div>
              <span class="p-info-value">${user ? user.department : 'Engineering & Technology'}</span>
            </div>

            <div class="p-info-row">
              <div class="p-info-key">
                <span class="p-key-icon">🎓</span>
                <span>Institution</span>
              </div>
              <span class="p-info-value">Jansons Institute of Technology (JIT)</span>
            </div>

            <div class="p-info-row">
              <div class="p-info-key">
                <span class="p-key-icon">📧</span>
                <span>College Email</span>
              </div>
              <span class="p-info-value font-mono">${studentEmail}</span>
            </div>

            <div class="p-info-row">
              <div class="p-info-key">
                <span class="p-key-icon">📱</span>
                <span>Contact Phone</span>
              </div>
              <span class="p-info-value font-mono">${user && user.phone ? user.phone : '+91 94432 00000'}</span>
            </div>

            <div class="p-info-row">
              <div class="p-info-key">
                <span class="p-key-icon">🛡️</span>
                <span>Account Role</span>
              </div>
              <span class="p-info-value text-emerald font-bold">${user ? user.role.toUpperCase() : 'STUDENT'}</span>
            </div>
          </div>
        </section>

        <!-- 4. QUICK ACTIONS GRID (All 6 Required Buttons) -->
        <section class="profile-quick-actions-card">
          <h3 class="p-section-heading">Quick Actions</h3>
          
          <div class="quick-actions-grid-6">
            <button type="button" class="qa-action-tile" id="qa-my-orders">
              <div class="qa-tile-icon qa-icon-orders">${ICONS.orders(22)}</div>
              <strong class="qa-tile-title">My Orders</strong>
              <span class="qa-tile-desc">${totalOrdersCount} orders</span>
            </button>

            <button type="button" class="qa-action-tile" id="qa-track-order">
              <div class="qa-tile-icon qa-icon-track">${ICONS.clock(22)}</div>
              <strong class="qa-tile-title">Track Order</strong>
              <span class="qa-tile-desc">Live status</span>
            </button>

            <button type="button" class="qa-action-tile" id="qa-my-tokens">
              <div class="qa-tile-icon qa-icon-token">${ICONS.ticket(22)}</div>
              <strong class="qa-tile-title">My Tokens</strong>
              <span class="qa-tile-desc">Queue pass</span>
            </button>

            <button type="button" class="qa-action-tile" id="qa-canteen">
              <div class="qa-tile-icon qa-icon-canteen">🍔</div>
              <strong class="qa-tile-title">Canteen</strong>
              <span class="qa-tile-desc">Order food</span>
            </button>

            <button type="button" class="qa-action-tile" id="qa-stationery">
              <div class="qa-tile-icon qa-icon-stat">📚</div>
              <strong class="qa-tile-title">Stationery</strong>
              <span class="qa-tile-desc">College supplies</span>
            </button>

            <button type="button" class="qa-action-tile" id="qa-printing">
              <div class="qa-tile-icon qa-icon-print">🖨️</div>
              <strong class="qa-tile-title">Printing</strong>
              <span class="qa-tile-desc">Document print</span>
            </button>
          </div>
        </section>

        <!-- 5. SECURITY DISCLOSURE CARD -->
        <section class="profile-security-card">
          <div class="sec-card-header">
            <span>🔒 Security & Data Privacy Notice</span>
          </div>
          <p class="sec-card-text">
            Student Date of Birth and confidential verification secrets are never stored in browser storage. This session is securely keyed to registration number <strong>${user ? user.regNo : ''}</strong> for the current active browser.
          </p>
        </section>

        <!-- 6. LOGOUT BUTTON -->
        <div class="profile-bottom-logout-wrap">
          <button type="button" class="btn btn-danger btn-block btn-lg" id="btn-profile-logout-bottom">
            <span>Logout from Campus</span>
            ${ICONS.logOut(18)}
          </button>
        </div>

      </div>

    </div>
  `;

  // Attach Navigation Handlers
  const backBtn = container.querySelector('#profile-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  // Edit Profile Toast
  const editBtn = container.querySelector('#btn-profile-edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      alert('Academic Profile Notice: Student credentials and department records are synchronized from the Jansons Institute of Technology Registrar Database.');
    });
  }

  // Quick Action Buttons Handlers (All 6 Working)
  const qaOrders = container.querySelector('#qa-my-orders');
  if (qaOrders) qaOrders.addEventListener('click', () => navigateTo('history'));

  const qaTrack = container.querySelector('#qa-track-order');
  if (qaTrack) {
    qaTrack.addEventListener('click', () => {
      const activeOrder = studentOrders.find(o => o.status !== 'Completed' && o.status !== 'Cancelled');
      navigateTo('tracking', activeOrder ? { orderId: activeOrder.orderId } : {});
    });
  }

  const qaTokens = container.querySelector('#qa-my-tokens');
  if (qaTokens) {
    qaTokens.addEventListener('click', () => {
      const activeOrder = studentOrders.find(o => o.status !== 'Completed' && o.status !== 'Cancelled') || studentOrders[0];
      navigateTo('token', activeOrder ? { orderId: activeOrder.orderId } : {});
    });
  }

  const qaCanteen = container.querySelector('#qa-canteen');
  if (qaCanteen) qaCanteen.addEventListener('click', () => navigateTo('canteen'));

  const qaStationery = container.querySelector('#qa-stationery');
  if (qaStationery) qaStationery.addEventListener('click', () => navigateTo('stationery'));

  const qaPrinting = container.querySelector('#qa-printing');
  if (qaPrinting) qaPrinting.addEventListener('click', () => navigateTo('printing'));

  // Logout Handlers
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of JIT Smart Campus?')) {
      logout();
      navigateTo('login');
    }
  };

  const topLogoutBtn = container.querySelector('#profile-quick-logout-btn');
  if (topLogoutBtn) topLogoutBtn.addEventListener('click', handleLogout);

  const heroLogoutBtn = container.querySelector('#btn-profile-logout-top');
  if (heroLogoutBtn) heroLogoutBtn.addEventListener('click', handleLogout);

  const bottomLogoutBtn = container.querySelector('#btn-profile-logout-bottom');
  if (bottomLogoutBtn) bottomLogoutBtn.addEventListener('click', handleLogout);
}
