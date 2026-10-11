/**
 * JIT SMART CAMPUS - Redesigned Stationery Experience
 * Clean academic store aesthetic, stock validation, quick category filters,
 * dedicated printing spotlight, and floating sticky cart bar.
 */

import { getStationeryItems, getCartState, saveCartState, getShopCrowdStats } from './storage.js';
import { ICONS } from './icons.js';

let currentStatCategory = 'All Items';
let currentStatSearch = '';

export function renderStationeryScreen(container, navigateTo) {
  const crowdStats = getShopCrowdStats('stationery');
  const categories = [
    'All Items',
    'Pens',
    'Pencils',
    'Notebooks',
    'Record Books',
    'Files',
    'Art Supplies'
  ];

  container.innerHTML = `
    <div class="stationery-screen fade-in">
      
      <!-- 1. Header Bar -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="stationery-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">JIT STATIONERY</h2>
          <span class="screen-badge">ACADEMIC SUPPLIES</span>
        </div>
        <button type="button" class="icon-nav-btn" id="stationery-cart-btn" aria-label="View Cart">
          ${ICONS.cart(20)}
          <span class="cart-badge-count" id="header-stationery-cart-count" style="display: none;">0</span>
        </button>
      </div>

      <!-- 2. High-Discovery Printing Spotlight -->
      <div style="padding: 0 16px;">
        <div class="printing-spotlight-card" id="stationery-shortcut-print">
          <div class="psc-left">
            <div class="psc-icon-box">
              ${ICONS.print(22)}
            </div>
            <div>
              <h4 class="psc-title">Need a Printout?</h4>
              <p class="psc-sub">Upload your PDF and get it ready for collection</p>
            </div>
          </div>
          <button type="button" class="btn-print-pill">
            <span>Print a Document →</span>
          </button>
        </div>
      </div>

      <!-- 3. Search Bar -->
      <div class="stationery-search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">${ICONS.search(18)}</span>
          <input 
            type="text" 
            id="stationery-search-input" 
            class="search-input" 
            placeholder="Search record books, pens, A4 bundles..." 
            value="${currentStatSearch}" 
          />
          ${currentStatSearch ? `<button type="button" id="clear-stat-search" class="clear-search-btn">✕</button>` : ''}
        </div>
      </div>

      <!-- 4. Category Scrolling Chips -->
      <div class="categories-scroll-wrapper">
        <div class="categories-track">
          ${categories.map(cat => `
            <button type="button" class="category-chip ${currentStatCategory === cat ? 'active' : ''}" data-cat="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 5. Stationery Products Grid -->
      <div class="stationery-products-container" id="stationery-products-list">
        <!-- Rendered dynamically -->
      </div>

      <!-- 6. Sticky Floating Cart Summary Bar -->
      <div class="sticky-cart-summary-bar" id="stationery-bottom-cart-bar" style="display: none;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="cart-qty-pill" id="stat-bottom-cart-qty">0 ITEMS</span>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 9px; color: #CBD5E1;">Order Total</span>
            <span class="cart-total-val" id="stat-bottom-cart-amount">₹0</span>
          </div>
        </div>
        <button type="button" class="btn-cart-checkout" id="stat-bottom-view-cart-btn">
          <span>View Cart</span>
          ${ICONS.arrowRight(16)}
        </button>
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#stationery-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const cartHeaderBtn = container.querySelector('#stationery-cart-btn');
  if (cartHeaderBtn) cartHeaderBtn.addEventListener('click', () => navigateTo('cart', { shop: 'stationery' }));

  const bottomViewCartBtn = container.querySelector('#stat-bottom-view-cart-btn');
  if (bottomViewCartBtn) bottomViewCartBtn.addEventListener('click', () => navigateTo('cart', { shop: 'stationery' }));

  const printShortcut = container.querySelector('#stationery-shortcut-print');
  if (printShortcut) printShortcut.addEventListener('click', () => navigateTo('printing'));

  // Search Input
  const searchInput = container.querySelector('#stationery-search-input');
  searchInput.addEventListener('input', (e) => {
    currentStatSearch = e.target.value.toLowerCase().trim();
    renderStationeryItems(container, navigateTo);
  });

  const clearSearchBtn = container.querySelector('#clear-stat-search');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      currentStatSearch = '';
      searchInput.value = '';
      renderStationeryItems(container, navigateTo);
    });
  }

  // Category Chips
  const catChips = container.querySelectorAll('.category-chip');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentStatCategory = chip.getAttribute('data-cat');
      renderStationeryItems(container, navigateTo);
    });
  });

  renderStationeryItems(container, navigateTo);
  updateStationeryCartIndicators(container);
}

function renderStationeryItems(container, navigateTo) {
  const listEl = container.querySelector('#stationery-products-list');
  if (!listEl) return;

  const items = getStationeryItems();
  const cart = getCartState();

  const filtered = items.filter(item => {
    if (currentStatCategory !== 'All Items' && item.category !== currentStatCategory) return false;
    if (currentStatSearch) {
      const matchName = item.name.toLowerCase().includes(currentStatSearch);
      const matchDesc = item.description.toLowerCase().includes(currentStatSearch);
      const matchCat = item.category.toLowerCase().includes(currentStatSearch);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-results-box" style="margin-top: 40px;">
        <span class="empty-icon" style="color: var(--text-muted);">${ICONS.search(40)}</span>
        <h4 class="empty-title">No supplies found</h4>
        <p class="empty-text">Try tweaking your search term or picking another category.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="reset-stat-filters" style="margin-top: 8px;">
          Reset Filter
        </button>
      </div>
    `;
    const resetBtn = listEl.querySelector('#reset-stat-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentStatCategory = 'All Items';
        currentStatSearch = '';
        renderStationeryScreen(container.parentElement, navigateTo);
      });
    }
    return;
  }

  listEl.innerHTML = `
    <div class="stationery-grid">
      ${filtered.map(item => {
        const cartItem = (cart.stationeryItems || []).find(ci => ci.id === item.id);
        const qty = cartItem ? cartItem.quantity : 0;
        const isOutOfStock = item.stock <= 0;

        return `
          <div class="stationery-card ${isOutOfStock ? 'item-out-of-stock' : ''}" data-id="${item.id}">
            <div class="stat-img-wrap">
              <img 
                src="${item.image}" 
                alt="${item.name}" 
                class="stat-img" 
                loading="lazy" 
                onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80';"
              />
              ${isOutOfStock ? `
                <span class="stat-stock-badge out-badge">OUT OF STOCK</span>
              ` : `
                <span class="stat-stock-badge in-badge">${item.stock} left</span>
              `}
            </div>

            <div class="stat-info">
              <span class="stat-cat-tag">${item.category}</span>
              <h4 class="stat-name">${item.name}</h4>

              <div class="stat-price-action-row">
                <div class="stat-price-stack">
                  <span class="current-price">₹${item.price}</span>
                </div>

                <div class="action-btn-wrap">
                  ${isOutOfStock ? `
                    <button type="button" class="btn btn-soldout" disabled style="padding: 4px 8px; font-size: 10px; background: var(--bg-secondary-grey); color: var(--text-muted); border: none; border-radius: var(--radius-pill);">NO STOCK</button>
                  ` : qty > 0 ? `
                    <div class="qty-stepper">
                      <button type="button" class="stepper-btn dec-btn" data-id="${item.id}">−</button>
                      <span class="stepper-val">${qty}</span>
                      <button type="button" class="stepper-btn inc-btn" data-id="${item.id}" ${qty >= item.stock ? 'disabled' : ''}>+</button>
                    </div>
                  ` : `
                    <button type="button" class="btn btn-add-stat" data-id="${item.id}">
                      ADD +
                    </button>
                  `}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  listEl.querySelectorAll('.btn-add-stat').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      updateStationeryCartQuantity(id, 1);
      renderStationeryItems(container, navigateTo);
      updateStationeryCartIndicators(container);
    });
  });

  listEl.querySelectorAll('.inc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cart = getCartState();
      const existing = (cart.stationeryItems || []).find(ci => ci.id === id);
      const currentQty = existing ? existing.quantity : 0;
      updateStationeryCartQuantity(id, currentQty + 1);
      renderStationeryItems(container, navigateTo);
      updateStationeryCartIndicators(container);
    });
  });

  listEl.querySelectorAll('.dec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cart = getCartState();
      const existing = (cart.stationeryItems || []).find(ci => ci.id === id);
      const currentQty = existing ? existing.quantity : 0;
      updateStationeryCartQuantity(id, currentQty - 1);
      renderStationeryItems(container, navigateTo);
      updateStationeryCartIndicators(container);
    });
  });
}

function updateStationeryCartQuantity(productId, newQty) {
  const items = getStationeryItems();
  const product = items.find(p => p.id === productId);
  if (!product) return;

  if (newQty > product.stock) {
    alert(`Only ${product.stock} units are currently in stock.`);
    return;
  }

  const cart = getCartState();
  if (!cart.stationeryItems) cart.stationeryItems = [];

  const existingIdx = cart.stationeryItems.findIndex(ci => ci.id === productId);

  if (newQty <= 0) {
    if (existingIdx !== -1) {
      cart.stationeryItems.splice(existingIdx, 1);
    }
  } else {
    if (existingIdx !== -1) {
      cart.stationeryItems[existingIdx].quantity = newQty;
    } else {
      cart.stationeryItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: newQty,
        shop: 'stationery'
      });
    }
  }

  cart.activeShop = 'stationery';
  saveCartState(cart);
}

function updateStationeryCartIndicators(container) {
  const cart = getCartState();
  const items = cart.stationeryItems || [];
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const headerCount = container.querySelector('#header-stationery-cart-count');
  if (headerCount) {
    headerCount.textContent = totalCount;
    headerCount.style.display = totalCount > 0 ? 'flex' : 'none';
  }

  const bottomBar = container.querySelector('#stationery-bottom-cart-bar');
  const bottomQty = container.querySelector('#stat-bottom-cart-qty');
  const bottomAmount = container.querySelector('#stat-bottom-cart-amount');

  if (bottomBar) {
    if (totalCount > 0) {
      bottomBar.style.display = 'flex';
      if (bottomQty) bottomQty.textContent = `${totalCount} ${totalCount === 1 ? 'ITEM' : 'ITEMS'}`;
      if (bottomAmount) bottomAmount.textContent = `₹${totalAmount}`;
    } else {
      bottomBar.style.display = 'none';
    }
  }
}
