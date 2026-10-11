/**
 * JIT SMART CAMPUS - Redesigned Mobile Shopping Cart
 * Streamlined cart experience with isolated checkout tabs for Canteen, Stationery, and Document Printing.
 */

import { getCartState, saveCartState, clearCart } from './storage.js';
import { ICONS } from './icons.js';

let activeCartTab = 'canteen'; // 'canteen' | 'stationery' | 'printing'

export function renderCartScreen(container, navigateTo, initialParams = {}) {
  if (initialParams.shop) {
    activeCartTab = initialParams.shop;
  }

  const cart = getCartState();
  if (!cart.activeShop) cart.activeShop = activeCartTab;

  const canteenCount = (cart.canteenItems || []).reduce((s, i) => s + i.quantity, 0);
  const statCount = (cart.stationeryItems || []).reduce((s, i) => s + i.quantity, 0);
  const printActive = !!cart.printJob;

  if (activeCartTab === 'canteen' && canteenCount === 0) {
    if (statCount > 0) activeCartTab = 'stationery';
    else if (printActive) activeCartTab = 'printing';
  } else if (activeCartTab === 'stationery' && statCount === 0) {
    if (canteenCount > 0) activeCartTab = 'canteen';
    else if (printActive) activeCartTab = 'printing';
  }

  container.innerHTML = `
    <div class="cart-screen fade-in">
      
      <!-- Top Screen Bar -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="cart-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">MY ORDER BASKET</h2>
          <span class="screen-badge">VERIFIED COUNTER CHECKOUT</span>
        </div>
        <button type="button" class="icon-nav-btn" id="cart-clear-all-btn" title="Clear Basket" style="color: var(--text-muted);">
          ${ICONS.trash(18)}
        </button>
      </div>

      <!-- Shop Separation Tabs -->
      <div class="cart-tabs-bar">
        <button type="button" class="cart-tab-btn ${activeCartTab === 'canteen' ? 'active' : ''}" data-tab="canteen">
          <span>Canteen</span>
          ${canteenCount > 0 ? `<span class="tab-count-bubble">${canteenCount}</span>` : ''}
        </button>
        <button type="button" class="cart-tab-btn ${activeCartTab === 'stationery' ? 'active' : ''}" data-tab="stationery">
          <span>Stationery</span>
          ${statCount > 0 ? `<span class="tab-count-bubble">${statCount}</span>` : ''}
        </button>
        <button type="button" class="cart-tab-btn ${activeCartTab === 'printing' ? 'active' : ''}" data-tab="printing">
          <span>Printing</span>
          ${printActive ? `<span class="tab-count-bubble">1</span>` : ''}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="cart-tab-content-area" id="cart-tab-content-area">
        <!-- Injected dynamically -->
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#cart-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const clearBtn = container.querySelector('#cart-clear-all-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm(`Remove all items from your ${activeCartTab} basket?`)) {
        clearCart(activeCartTab);
        renderCartScreen(container, navigateTo, { shop: activeCartTab });
      }
    });
  }

  const tabBtns = container.querySelectorAll('.cart-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeCartTab = btn.getAttribute('data-tab');
      renderCartScreen(container, navigateTo, { shop: activeCartTab });
    });
  });

  renderCurrentCartTabContent(container, navigateTo);
}

function renderCurrentCartTabContent(container, navigateTo) {
  const contentArea = container.querySelector('#cart-tab-content-area');
  if (!contentArea) return;

  if (activeCartTab === 'canteen') {
    renderCanteenCartTab(contentArea, container, navigateTo);
  } else if (activeCartTab === 'stationery') {
    renderStationeryCartTab(contentArea, container, navigateTo);
  } else if (activeCartTab === 'printing') {
    renderPrintingCartTab(contentArea, container, navigateTo);
  }
}

function renderCanteenCartTab(contentArea, container, navigateTo) {
  const cart = getCartState();
  const items = cart.canteenItems || [];

  if (items.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-cart-state">
        <div style="color: var(--text-muted); margin-bottom: 8px;">${ICONS.cart(48)}</div>
        <h3 class="empty-cart-title">Your Canteen Tray is Empty</h3>
        <p class="empty-cart-desc">Add delicious breakfast, meals, snacks, or coffee to skip the queue.</p>
        <button type="button" class="btn btn-primary" id="btn-browse-canteen" style="margin-top: 8px;">
          Explore Menu →
        </button>
      </div>
    `;
    contentArea.querySelector('#btn-browse-canteen').addEventListener('click', () => navigateTo('canteen'));
    return;
  }

  const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = itemTotal;

  contentArea.innerHTML = `
    <div class="cart-items-wrapper">
      <div class="cart-items-list">
        ${items.map(item => `
          <div class="cart-item-card" data-id="${item.id}">
            <div class="cart-item-img-wrap">
              <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
              <span class="food-diet-badge ${item.isVeg ? 'veg-badge' : 'nonveg-badge'}" style="top: 4px; left: 4px; width: 12px; height: 12px;">
                <span class="dot" style="width: 5px; height: 5px;"></span>
              </span>
            </div>
            <div class="cart-item-details">
              <div class="cart-item-header">
                <h4 class="cart-item-name">${item.name}</h4>
                <button type="button" class="cart-item-remove-btn" data-id="${item.id}" title="Remove item">✕</button>
              </div>
              <span style="font-size: 11px; color: var(--text-muted);">₹${item.price} each</span>
              <div class="cart-item-footer">
                <div class="qty-stepper compact">
                  <button type="button" class="stepper-btn c-dec" data-id="${item.id}">−</button>
                  <span class="stepper-val">${item.quantity}</span>
                  <button type="button" class="stepper-btn c-inc" data-id="${item.id}">+</button>
                </div>
                <span class="cart-item-subtotal">₹${item.price * item.quantity}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="bill-summary-card">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">Bill Summary</h4>
        <div class="bill-breakdown">
          <div class="bill-row">
            <span>Item Subtotal</span>
            <span>₹${itemTotal}</span>
          </div>
          <div class="bill-row">
            <span>Campus Convenience Fee</span>
            <span class="text-free">FREE</span>
          </div>
          <div class="bill-divider"></div>
          <div class="bill-row grand-total-row">
            <span>Total Payable</span>
            <span class="g-val">₹${grandTotal}</span>
          </div>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-canteen-proceed-checkout">
        <span>Proceed to Checkout</span>
        <span>• ₹${grandTotal}</span>
        ${ICONS.arrowRight(18)}
      </button>
    </div>
  `;

  contentArea.querySelectorAll('.c-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = items.find(i => i.id === id);
      if (item) {
        item.quantity++;
        saveCartState(cart);
        renderCartScreen(container, navigateTo, { shop: 'canteen' });
      }
    });
  });

  contentArea.querySelectorAll('.c-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        if (items[idx].quantity > 1) {
          items[idx].quantity--;
        } else {
          items.splice(idx, 1);
        }
        saveCartState(cart);
        renderCartScreen(container, navigateTo, { shop: 'canteen' });
      }
    });
  });

  contentArea.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        items.splice(idx, 1);
        saveCartState(cart);
        renderCartScreen(container, navigateTo, { shop: 'canteen' });
      }
    });
  });

  contentArea.querySelector('#btn-canteen-proceed-checkout').addEventListener('click', () => {
    navigateTo('checkout', {
      shop: 'canteen',
      items: items,
      totalAmount: grandTotal
    });
  });
}

function renderStationeryCartTab(contentArea, container, navigateTo) {
  const cart = getCartState();
  const items = cart.stationeryItems || [];

  if (items.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-cart-state">
        <div style="color: var(--text-muted); margin-bottom: 8px;">${ICONS.stationery(48)}</div>
        <h3 class="empty-cart-title">Your Stationery Bag is Empty</h3>
        <p class="empty-cart-desc">Add official lab records, ball pens, drawing sheets, or notebooks.</p>
        <button type="button" class="btn btn-primary" id="btn-browse-stat" style="margin-top: 8px;">
          Browse Stationery →
        </button>
      </div>
    `;
    contentArea.querySelector('#btn-browse-stat').addEventListener('click', () => navigateTo('stationery'));
    return;
  }

  const itemTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = itemTotal;

  contentArea.innerHTML = `
    <div class="cart-items-wrapper">
      <div class="cart-items-list">
        ${items.map(item => `
          <div class="cart-item-card" data-id="${item.id}">
            <div class="cart-item-img-wrap">
              <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
            </div>
            <div class="cart-item-details">
              <div class="cart-item-header">
                <h4 class="cart-item-name">${item.name}</h4>
                <button type="button" class="cart-item-remove-btn" data-id="${item.id}" title="Remove item">✕</button>
              </div>
              <span style="font-size: 11px; color: var(--text-muted);">₹${item.price} each</span>
              <div class="cart-item-footer">
                <div class="qty-stepper compact">
                  <button type="button" class="stepper-btn s-dec" data-id="${item.id}">−</button>
                  <span class="stepper-val">${item.quantity}</span>
                  <button type="button" class="stepper-btn s-inc" data-id="${item.id}">+</button>
                </div>
                <span class="cart-item-subtotal">₹${item.price * item.quantity}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="bill-summary-card">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">Bill Summary</h4>
        <div class="bill-breakdown">
          <div class="bill-row">
            <span>Item Subtotal</span>
            <span>₹${itemTotal}</span>
          </div>
          <div class="bill-row">
            <span>Campus Convenience Fee</span>
            <span class="text-free">FREE</span>
          </div>
          <div class="bill-divider"></div>
          <div class="bill-row grand-total-row">
            <span>Total Payable</span>
            <span class="g-val">₹${grandTotal}</span>
          </div>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-stat-proceed-checkout">
        <span>Proceed to Checkout</span>
        <span>• ₹${grandTotal}</span>
        ${ICONS.arrowRight(18)}
      </button>
    </div>
  `;

  contentArea.querySelectorAll('.s-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = items.find(i => i.id === id);
      if (item) {
        item.quantity++;
        saveCartState(cart);
        renderCartScreen(container, navigateTo, { shop: 'stationery' });
      }
    });
  });

  contentArea.querySelectorAll('.s-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        if (items[idx].quantity > 1) {
          items[idx].quantity--;
        } else {
          items.splice(idx, 1);
        }
        saveCartState(cart);
        renderCartScreen(container, navigateTo, { shop: 'stationery' });
      }
    });
  });

  contentArea.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        items.splice(idx, 1);
        saveCartState(cart);
        renderCartScreen(container, navigateTo, { shop: 'stationery' });
      }
    });
  });

  contentArea.querySelector('#btn-stat-proceed-checkout').addEventListener('click', () => {
    navigateTo('checkout', {
      shop: 'stationery',
      items: items,
      totalAmount: grandTotal
    });
  });
}

function renderPrintingCartTab(contentArea, container, navigateTo) {
  const cart = getCartState();
  const job = cart.printJob;

  if (!job) {
    contentArea.innerHTML = `
      <div class="empty-cart-state">
        <div style="color: var(--text-muted); margin-bottom: 8px;">${ICONS.print(48)}</div>
        <h3 class="empty-cart-title">No Active Print Job</h3>
        <p class="empty-cart-desc">Upload assignments, documents, or reports to print in B&W or Colour.</p>
        <button type="button" class="btn btn-primary" id="btn-browse-print" style="margin-top: 8px;">
          Upload Document →
        </button>
      </div>
    `;
    contentArea.querySelector('#btn-browse-print').addEventListener('click', () => navigateTo('printing'));
    return;
  }

  contentArea.innerHTML = `
    <div class="cart-items-wrapper">
      <div class="print-card" style="box-shadow: var(--shadow-sm);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="file-icon-badge">${ICONS.filePdf(20)}</div>
            <div>
              <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy);">${job.fileName}</h4>
              <span style="font-size: 11px; color: var(--text-muted);">${job.fileSizeStr} • Doc Pages: ${job.totalDocumentPages}</span>
            </div>
          </div>
          <button type="button" class="icon-nav-btn" id="btn-cancel-print-job" style="width: 32px; height: 32px; color: var(--error-red);">
            ${ICONS.trash(15)}
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 10px; background: var(--bg-secondary-grey); border-radius: var(--radius-sm); font-size: 11px;">
          <div>Mode: <strong>${job.type === 'colour' ? 'Colour' : 'B&W'}</strong></div>
          <div>Sides: <strong>${job.sides === 'double' ? 'Double' : 'Single'}</strong></div>
          <div>Pages: <strong>${job.pagesToPrint} pgs</strong></div>
          <div>Copies: <strong>${job.copies} set</strong></div>
        </div>
      </div>

      <div class="bill-summary-card">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">Bill Summary</h4>
        <div class="bill-breakdown">
          <div class="bill-row">
            <span>Rate per Page</span>
            <span>₹${job.ratePerPage.toFixed(2)}</span>
          </div>
          <div class="bill-row">
            <span>Total Sheets (${job.pagesToPrint} pgs × ${job.copies} sets)</span>
            <span>${job.pagesToPrint * job.copies} sheets</span>
          </div>
          <div class="bill-divider"></div>
          <div class="bill-row grand-total-row">
            <span>Total Payable</span>
            <span class="g-val">₹${job.totalAmount}</span>
          </div>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-print-proceed-checkout">
        <span>Proceed to Payment</span>
        <span>• ₹${job.totalAmount}</span>
        ${ICONS.arrowRight(18)}
      </button>
    </div>
  `;

  contentArea.querySelector('#btn-cancel-print-job').addEventListener('click', () => {
    cart.printJob = null;
    saveCartState(cart);
    renderCartScreen(container, navigateTo, { shop: 'printing' });
  });

  contentArea.querySelector('#btn-print-proceed-checkout').addEventListener('click', () => {
    navigateTo('checkout', {
      shop: 'printing',
      printJob: job,
      totalAmount: job.totalAmount
    });
  });
}
