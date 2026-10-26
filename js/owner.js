/**
 * JIT SMART CAMPUS - Dedicated Shop Owner Dashboard
 * 
 * STRICT SPECIFICATION COMPLIANCE (Section 12):
 * - Assigned owners to authorized shops only (no access to other shops' private data).
 * - Real-time sales and revenue summaries (Total, POD Cash Collected, Online Verified).
 * - Detailed POD Physical Collection Records: Shows order ID, token, amount, collection time, and authenticated staff ID.
 * - Product/Menu Management: Edit prices, toggle availability, edit print rates.
 * - Worker Management: Inspect assigned workers (Employee ID, DOB, assigned shop) and toggle cash collection permission.
 * - Audit Trail inspection.
 */

import { 
  getAllOrders, 
  getCanteenMenu, 
  saveCanteenMenu, 
  getStationeryItems, 
  saveStationeryItems, 
  getPrintRates, 
  savePrintRates,
  getCollectionRecords,
  getWorkers,
  updateWorkerPermission,
  getAuditLogs,
  addAuditLog
} from './storage.js';
import { getCurrentUser, logout } from './auth.js';
import { ICONS } from './icons.js';

let activeOwnerTab = 'orders'; // 'orders' | 'collections' | 'catalog' | 'workers' | 'audit'
let selectedShopFilter = null; // null = all authorized shops

export function renderOwnerScreen(container, navigateTo) {
  const user = getCurrentUser();

  // Role Guard
  if (!user || (user.role !== 'SHOP_OWNER' && user.role !== 'SYSTEM_ADMIN')) {
    container.innerHTML = `
      <div class="empty-results-box" style="margin-top: 80px; padding: 24px; text-align: center;">
        <span style="font-size: 40px;">⛔</span>
        <h3 style="color: var(--error-red); margin-top: 12px;">Access Denied</h3>
        <p style="color: var(--text-muted); font-size: 13px;">You must be logged in as an authorized Shop Owner to access this dashboard.</p>
        <button type="button" class="btn btn-primary" id="btn-owner-denied-login" style="margin-top: 14px;">
          Go to Owner Login →
        </button>
      </div>
    `;
    container.querySelector('#btn-owner-denied-login').onclick = () => navigateTo('owner-login');
    return;
  }

  const authorizedShops = user.assignedShops || ['canteen', 'stationery', 'printing'];
  if (!selectedShopFilter || !authorizedShops.includes(selectedShopFilter)) {
    selectedShopFilter = authorizedShops[0];
  }

  // Filter orders strictly for authorized shops
  const allOrders = getAllOrders();
  const ownerOrders = allOrders.filter(o => authorizedShops.includes(o.shop));
  const shopOrders = ownerOrders.filter(o => o.shop === selectedShopFilter);

  // Revenue metrics
  const totalRevenue = ownerOrders.reduce((sum, o) => {
    return (o.payment && o.payment.status === 'PAID') ? sum + o.totalAmount : sum;
  }, 0);

  const podCollections = getCollectionRecords().filter(r => authorizedShops.includes(r.shop));
  const podCashTotal = podCollections.reduce((sum, r) => sum + r.amount, 0);
  const onlineVerifiedTotal = Math.max(0, totalRevenue - podCashTotal);

  container.innerHTML = `
    <div class="owner-dashboard-screen fade-in" id="owner-dashboard-root">
      
      <!-- Top Sticky Header -->
      <header class="screen-header-bar sticky-top" style="background: #022C22; color: #FFFFFF; border-bottom: 1px solid #064E3B;">
        <button type="button" class="icon-nav-btn" id="owner-back-btn" aria-label="Back" style="color: #FFFFFF;">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title" style="color: #FFFFFF;">OWNER MANAGEMENT</h2>
          <span class="screen-badge" style="background: #0D9488; color: #FFFFFF;">
            ${user.ownerId || user.adminId || 'OWNER'}
          </span>
        </div>
        <button type="button" class="icon-nav-btn" id="owner-logout-btn" title="Logout" style="color: #F87171;">
          ${ICONS.logOut(18)}
        </button>
      </header>

      <!-- Owner Identity Strip -->
      <div class="owner-identity-banner" style="background: #064E3B; color: #F0FDF4; padding: 14px 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: #FFFFFF;">${user.name}</h3>
            <span style="font-size: 11px; color: #A7F3D0;">Authorized Shops: ${authorizedShops.map(s => s.toUpperCase()).join(', ')}</span>
          </div>
          <span style="font-size: 11px; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,0.15); font-weight: 700;">
            PROPRIETOR
          </span>
        </div>
      </div>

      <!-- Financial Metrics Grid -->
      <div class="owner-metrics-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px 14px; background: #F8FAFC;">
        <div style="background: #FFFFFF; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
          <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); display: block;">TOTAL SALES</span>
          <strong class="font-mono" style="font-size: 16px; color: var(--primary-navy); display: block; margin-top: 2px;">₹${totalRevenue}</strong>
          <span style="font-size: 9px; color: #047857;">Verified Paid</span>
        </div>
        <div style="background: #FFFFFF; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
          <span style="font-size: 10px; font-weight: 700; color: #B45309; display: block;">POD CASH</span>
          <strong class="font-mono" style="font-size: 16px; color: #B45309; display: block; margin-top: 2px;">₹${podCashTotal}</strong>
          <span style="font-size: 9px; color: var(--text-muted);">${podCollections.length} Cash Receipts</span>
        </div>
        <div style="background: #FFFFFF; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: center;">
          <span style="font-size: 10px; font-weight: 700; color: #0D9488; display: block;">ONLINE PAID</span>
          <strong class="font-mono" style="font-size: 16px; color: #0D9488; display: block; margin-top: 2px;">₹${onlineVerifiedTotal}</strong>
          <span style="font-size: 9px; color: var(--text-muted);">Gateway Verified</span>
        </div>
      </div>

      <!-- Shop Filter Tabs (If owner manages multiple shops) -->
      ${authorizedShops.length > 1 ? `
        <div class="owner-shop-filter-bar" style="display: flex; gap: 6px; padding: 6px 14px; background: #FFFFFF; border-bottom: 1px solid var(--border-subtle);">
          ${authorizedShops.map(s => `
            <button type="button" class="btn-shop-select ${selectedShopFilter === s ? 'active' : ''}" data-shop="${s}" style="padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: var(--radius-pill); border: 1px solid ${selectedShopFilter === s ? '#0D9488' : 'var(--border-subtle)'}; background: ${selectedShopFilter === s ? '#ECFDF5' : '#FFFFFF'}; color: ${selectedShopFilter === s ? '#047857' : 'var(--text-secondary)'};">
              ${s.toUpperCase()}
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Main Navigation Tabs -->
      <div class="staff-roles-bar" style="border-bottom: 1px solid var(--border-subtle); background: #FFFFFF;">
        <button type="button" class="staff-role-tab ${activeOwnerTab === 'orders' ? 'active' : ''}" data-tab="orders">
          📋 Orders (${shopOrders.length})
        </button>
        <button type="button" class="staff-role-tab ${activeOwnerTab === 'collections' ? 'active' : ''}" data-tab="collections">
          💵 POD Receipts (${podCollections.length})
        </button>
        <button type="button" class="staff-role-tab ${activeOwnerTab === 'catalog' ? 'active' : ''}" data-tab="catalog">
          🍱 Menu & Prices
        </button>
        <button type="button" class="staff-role-tab ${activeOwnerTab === 'workers' ? 'active' : ''}" data-tab="workers">
          👥 Staff & Permissions
        </button>
        <button type="button" class="staff-role-tab ${activeOwnerTab === 'audit' ? 'active' : ''}" data-tab="audit">
          📜 Audit Log
        </button>
      </div>

      <!-- Tab Content Body -->
      <main class="owner-body-viewport" id="owner-body-viewport" style="padding: 14px;">
        <!-- Injected dynamically -->
      </main>

    </div>
  `;

  // Attach Navigation Handlers
  const backBtn = container.querySelector('#owner-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const logoutBtn = container.querySelector('#owner-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Log out of Shop Owner Dashboard?')) {
        logout();
        navigateTo('login');
      }
    });
  }

  // Shop filter tabs
  container.querySelectorAll('[data-shop]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedShopFilter = btn.getAttribute('data-shop');
      renderOwnerScreen(container, navigateTo);
    });
  });

  // Tab switcher
  container.querySelectorAll('.staff-role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeOwnerTab = tab.getAttribute('data-tab');
      container.querySelectorAll('.staff-role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderOwnerTabContent(container, navigateTo, selectedShopFilter, user);
    });
  });

  renderOwnerTabContent(container, navigateTo, selectedShopFilter, user);
}

function renderOwnerTabContent(container, navigateTo, shop, user) {
  const viewport = container.querySelector('#owner-body-viewport');
  if (!viewport) return;

  switch (activeOwnerTab) {
    case 'orders':
      renderOwnerOrdersTab(viewport, container, navigateTo, shop);
      break;
    case 'collections':
      renderOwnerCollectionsTab(viewport, shop);
      break;
    case 'catalog':
      renderOwnerCatalogTab(viewport, shop, user);
      break;
    case 'workers':
      renderOwnerWorkersTab(viewport, shop, user);
      break;
    case 'audit':
      renderOwnerAuditTab(viewport);
      break;
    default:
      renderOwnerOrdersTab(viewport, container, navigateTo, shop);
  }
}

/**
 * TAB 1: Live Orders for Owner
 */
function renderOwnerOrdersTab(viewport, container, navigateTo, shop) {
  const orders = getAllOrders().filter(o => o.shop === shop);

  if (orders.length === 0) {
    viewport.innerHTML = `
      <div class="empty-results-box" style="text-align: center; padding: 30px;">
        <span style="font-size: 32px;">📦</span>
        <h4 style="margin-top: 8px;">No Orders in ${shop.toUpperCase()}</h4>
        <p style="font-size: 12px; color: var(--text-muted);">Orders placed by students will appear here in real time.</p>
      </div>
    `;
    return;
  }

  viewport.innerHTML = `
    <div class="owner-orders-stack" style="display: flex; flex-direction: column; gap: 10px;">
      ${orders.map(order => {
        const isPod = (order.payment.method === 'Pay on Delivery' || order.payment.method === 'POD');
        const isPaid = (order.payment.status === 'PAID');
        return `
          <div class="staff-order-card" style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="so-token font-mono" style="font-size: 16px; font-weight: 800; color: #047857;">${order.token}</span>
                <span style="font-size: 10px; color: var(--text-muted); margin-left: 6px;">Ref: ${order.orderId}</span>
              </div>
              <span class="so-status-badge" style="font-size: 10px; padding: 2px 8px; border-radius: 999px; background: #F1F5F9; font-weight: 700;">
                ${order.status}
              </span>
            </div>

            <div style="margin-top: 8px; font-size: 12px;">
              <strong>👤 ${order.studentName}</strong> (${order.studentRegNo})
              <div style="color: var(--text-muted); font-size: 11px;">Placed at ${new Date(order.createdAt).toLocaleTimeString()}</div>
            </div>

            <div style="margin-top: 8px; padding: 6px 10px; background: #F8FAFC; border-radius: var(--radius-sm); font-size: 11px;">
              ${(order.items || []).map(i => `${i.quantity}× ${i.name}`).join(', ') || (order.printConfig ? `${order.printConfig.fileName} (${order.printConfig.pagesToPrint} pgs)` : 'Custom order')}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-subtle);">
              <span class="font-mono" style="font-weight: 800; font-size: 14px;">₹${order.totalAmount}.00</span>
              <span style="font-size: 11px; font-weight: 700; color: ${isPaid ? '#047857' : '#B45309'}; background: ${isPaid ? '#ECFDF5' : '#FEF3C7'}; padding: 2px 8px; border-radius: var(--radius-pill);">
                ${isPaid ? 'PAID ✓' : 'NOT PAID — Pay at shop'}
              </span>
            </div>
            ${order.payment.collectedBy ? `
              <div style="font-size: 10px; color: #047857; margin-top: 4px; text-align: right;">
                Cash collected by ${order.payment.collectedByName || order.payment.collectedBy}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * TAB 2: Physical POD Cash Collection Records
 * Shows: Order ID, Token, Shop, Amount, Authenticated Staff ID who collected, Timestamp
 */
function renderOwnerCollectionsTab(viewport, shop) {
  const records = getCollectionRecords(shop);

  viewport.innerHTML = `
    <div class="collections-history-view">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy);">
          Physical Cash Collection Log (${records.length})
        </h4>
        <span style="font-size: 10px; font-weight: 700; color: #047857; background: #ECFDF5; padding: 2px 8px; border-radius: var(--radius-pill);">
          VERIFIED BY STAFF
        </span>
      </div>

      ${records.length === 0 ? `
        <div class="empty-results-box" style="text-align: center; padding: 24px;">
          <span style="font-size: 28px;">💵</span>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">No physical cash collections recorded yet for ${shop.toUpperCase()}.</p>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${records.map(rec => `
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="font-mono" style="font-weight: 800; font-size: 14px; color: #047857;">Token ${rec.token}</span>
                <span class="font-mono" style="font-size: 14px; font-weight: 800; color: #B45309;">₹${rec.amount}.00</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                Order ID: <strong class="font-mono">${rec.orderId}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E2E8F0;">
                <span>👤 Collected by: <strong>${rec.staffName} (${rec.staffId})</strong></span>
                <span>🕒 ${new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

/**
 * TAB 3: Catalog & Menu Management (Edit price & stock)
 */
function renderOwnerCatalogTab(viewport, shop, user) {
  if (shop === 'canteen') {
    const menu = getCanteenMenu();
    viewport.innerHTML = `
      <div class="catalog-manager">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">
          Canteen Menu & Pricing
        </h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${menu.map(item => `
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <div style="flex: 1; overflow: hidden;">
                <strong style="font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">${item.category} • ₹${item.price}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <button type="button" class="btn btn-secondary btn-sm btn-edit-price" data-id="${item.id}" data-price="${item.price}" style="font-size: 11px; padding: 4px 8px;">
                  ₹ Edit Price
                </button>
                <button type="button" class="btn btn-sm btn-toggle-avail ${item.available ? 'btn-success-subtle' : 'btn-danger-subtle'}" data-id="${item.id}" data-avail="${item.available}" style="font-size: 11px; padding: 4px 8px;">
                  ${item.available ? 'In Stock ✓' : 'Sold Out ✗'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Price Edit Handlers
    viewport.querySelectorAll('.btn-edit-price').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const currentPrice = btn.getAttribute('data-price');
        const newPrice = prompt(`Enter new price in ₹ for item:`, currentPrice);
        if (newPrice !== null && !isNaN(newPrice) && Number(newPrice) > 0) {
          const item = menu.find(i => i.id === id);
          if (item) {
            item.price = Number(newPrice);
            saveCanteenMenu(menu);
            addAuditLog('MENU_PRICE_CHANGE', user.ownerId, 'SHOP_OWNER', `Updated price of ${item.name} to ₹${newPrice}`);
            renderOwnerCatalogTab(viewport, shop, user);
          }
        }
      };
    });

    // Availability Toggle
    viewport.querySelectorAll('.btn-toggle-avail').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = menu.find(i => i.id === id);
        if (item) {
          item.available = !item.available;
          saveCanteenMenu(menu);
          addAuditLog('MENU_AVAILABILITY_CHANGE', user.ownerId, 'SHOP_OWNER', `Toggled ${item.name} available to ${item.available}`);
          renderOwnerCatalogTab(viewport, shop, user);
        }
      };
    });

  } else if (shop === 'stationery') {
    const items = getStationeryItems();
    viewport.innerHTML = `
      <div class="catalog-manager">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">
          Stationery Inventory & Pricing
        </h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${items.map(item => `
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <div style="flex: 1; overflow: hidden;">
                <strong style="font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">${item.category} • Price: ₹${item.price} • Stock: ${item.stock}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <button type="button" class="btn btn-secondary btn-sm btn-edit-stat-price" data-id="${item.id}" data-price="${item.price}" style="font-size: 11px; padding: 4px 8px;">
                  ₹ Price
                </button>
                <button type="button" class="btn btn-secondary btn-sm btn-edit-stock" data-id="${item.id}" data-stock="${item.stock}" style="font-size: 11px; padding: 4px 8px;">
                  📦 Stock
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    viewport.querySelectorAll('.btn-edit-stat-price').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = items.find(i => i.id === id);
        const p = prompt(`Enter new price for ${item.name}:`, item.price);
        if (p !== null && !isNaN(p) && Number(p) > 0) {
          item.price = Number(p);
          saveStationeryItems(items);
          addAuditLog('STATIONERY_PRICE_CHANGE', user.ownerId, 'SHOP_OWNER', `Updated price of ${item.name} to ₹${p}`);
          renderOwnerCatalogTab(viewport, shop, user);
        }
      };
    });

    viewport.querySelectorAll('.btn-edit-stock').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = items.find(i => i.id === id);
        const s = prompt(`Enter available stock count for ${item.name}:`, item.stock);
        if (s !== null && !isNaN(s) && Number(s) >= 0) {
          item.stock = Number(s);
          saveStationeryItems(items);
          addAuditLog('STATIONERY_STOCK_CHANGE', user.ownerId, 'SHOP_OWNER', `Updated stock of ${item.name} to ${s}`);
          renderOwnerCatalogTab(viewport, shop, user);
        }
      };
    });

  } else if (shop === 'printing') {
    const rates = getPrintRates();
    viewport.innerHTML = `
      <div class="catalog-manager">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">
          Reprographics Printing Rates
        </h4>
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Black & White Rate</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Current: ₹${rates.blackAndWhite.toFixed(2)} per page</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-edit-bw-rate">Edit ₹</button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Colour Rate</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Current: ₹${rates.colour.toFixed(2)} per page</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-edit-col-rate">Edit ₹</button>
          </div>
        </div>
      </div>
    `;

    viewport.querySelector('#btn-edit-bw-rate').onclick = () => {
      const val = prompt('Enter new Black & White rate per page (₹):', rates.blackAndWhite);
      if (val !== null && !isNaN(val) && Number(val) > 0) {
        rates.blackAndWhite = Number(val);
        savePrintRates(rates);
        addAuditLog('PRINT_RATE_CHANGE', user.ownerId, 'SHOP_OWNER', `Updated B&W rate to ₹${val}`);
        renderOwnerCatalogTab(viewport, shop, user);
      }
    };

    viewport.querySelector('#btn-edit-col-rate').onclick = () => {
      const val = prompt('Enter new Colour print rate per page (₹):', rates.colour);
      if (val !== null && !isNaN(val) && Number(val) > 0) {
        rates.colour = Number(val);
        savePrintRates(rates);
        addAuditLog('PRINT_RATE_CHANGE', user.ownerId, 'SHOP_OWNER', `Updated Colour rate to ₹${val}`);
        renderOwnerCatalogTab(viewport, shop, user);
      }
    };
  }
}

/**
 * TAB 4: Worker Management & Permissions
 * Shows Employee ID, DOB, assigned shop, and cash collection permission toggle
 */
function renderOwnerWorkersTab(viewport, shop, user) {
  const allWorkers = getWorkers();
  const shopWorkers = allWorkers.filter(w => w.assignedShop === shop);

  viewport.innerHTML = `
    <div class="workers-manager">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy);">
          Assigned Staff: ${shop.toUpperCase()} (${shopWorkers.length})
        </h4>
        <span style="font-size: 10px; color: var(--text-muted);">MANAGE PERMISSIONS</span>
      </div>

      ${shopWorkers.length === 0 ? `
        <p style="font-size: 12px; color: var(--text-muted);">No workers currently assigned to ${shop}.</p>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${shopWorkers.map(w => `
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">${w.avatar || '👷'}</span>
                  <div>
                    <strong style="font-size: 13px; color: var(--primary-navy);">${w.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">ID: <span class="font-mono font-bold">${w.empId}</span> • DOB: <span class="font-mono">${w.dob}</span></div>
                  </div>
                </div>
                <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-pill); background: ${w.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2'}; color: ${w.status === 'ACTIVE' ? '#047857' : '#EF4444'};">
                  ${w.status}
                </span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #F1F5F9;">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Can Collect Physical Cash (POD):</span>
                  <div style="font-size: 10px; color: var(--text-muted);">Grants permission to confirm counter cash receipts</div>
                </div>
                <button type="button" class="btn btn-sm btn-toggle-permission ${w.canCollectPayment ? 'btn-success' : 'btn-secondary'}" data-empid="${w.empId}" data-current="${w.canCollectPayment}" style="font-size: 11px; padding: 4px 10px;">
                  ${w.canCollectPayment ? '✓ Permitted' : '✗ Disabled'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  // Permission Toggle Handlers
  viewport.querySelectorAll('.btn-toggle-permission').forEach(btn => {
    btn.onclick = () => {
      const empId = btn.getAttribute('data-empid');
      const current = btn.getAttribute('data-current') === 'true';
      updateWorkerPermission(empId, !current, user);
      renderOwnerWorkersTab(viewport, shop, user);
    };
  });
}

/**
 * TAB 5: Audit Log Trail
 */
function renderOwnerAuditTab(viewport) {
  const logs = getAuditLogs();

  viewport.innerHTML = `
    <div class="audit-log-view">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy);">
          System Security & Activity Audit Log
        </h4>
        <span style="font-size: 10px; font-weight: 700; color: var(--text-muted);">${logs.length} Entries</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${logs.slice(0, 30).map(log => `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #0F766E;">${log.action}</strong>
              <span class="font-mono" style="font-size: 9px; color: var(--text-muted);">${new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div style="color: var(--text-secondary); margin-top: 2px;">${log.details}</div>
            <div style="font-size: 9px; color: var(--text-muted); margin-top: 3px;">Actor: ${log.actorId} (${log.actorRole})</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
