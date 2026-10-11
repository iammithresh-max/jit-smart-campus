/**
 * JIT SMART CAMPUS - Premium Canteen Browsing Experience
 * Consumer food-ordering UX inspired by leading delivery apps with
 * instant cart updates, category chips, veg/non-veg tags, and sticky cart bar.
 */

import { getCanteenMenu, getCartState, saveCartState, getShopCrowdStats } from './storage.js';
import { ICONS } from './icons.js';

let currentCategory = 'All';
let currentSearch = '';
let currentVegFilter = 'all'; // 'all' | 'veg' | 'non-veg'

export function renderCanteenScreen(container, navigateTo) {
  const crowdStats = getShopCrowdStats('canteen');
  const categories = ['All', 'Breakfast', 'Meals', 'Snacks', 'Fast Food', 'Desserts', 'Beverages'];

  // Add canteen active class to container for layout constraint
  container.classList.add('canteen-mode-active');

  container.innerHTML = `
    <div class="canteen-screen fade-in" id="canteen-screen-root">
      
      <!-- 1. FIXED TOP HEADER SECTION (Header, Live Crowd Strip, Search/Filter, Category Chips) -->
      <div class="canteen-fixed-header-section">
        
        <!-- Header Bar -->
        <div class="screen-header-bar canteen-header-bar">
          <button type="button" class="icon-nav-btn" id="canteen-back-btn" aria-label="Back to Dashboard">
            ${ICONS.chevronLeft(20)}
          </button>
          <div class="screen-header-title-box">
            <h2 class="screen-title">JIT CANTEEN</h2>
            <span class="screen-badge">KITCHEN OPEN</span>
          </div>
          <button type="button" class="icon-nav-btn" id="canteen-cart-btn" aria-label="View Cart">
            ${ICONS.cart(20)}
            <span class="cart-badge-count" id="header-canteen-cart-count" style="display: none;">0</span>
          </button>
        </div>

        <!-- Compact Live Crowd & Telemetry Strip -->
        <div class="canteen-crowd-strip-container">
          <div class="canteen-compact-strip" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #FFFFFF; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="crowd-pill ${crowdStats.badgeColor}-pill" style="padding: 3px 8px;">
                <span class="dot"></span>
                <span>${crowdStats.crowdLevel}</span>
              </div>
              <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
                ${ICONS.clock(13)}
                <span>${crowdStats.estimatedWaitText} wait</span>
              </span>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-green-dark);">Live Counters Active</span>
          </div>
        </div>

        <!-- Search Bar & Dietary Filter -->
        <div class="canteen-controls-bar">
          <div class="search-input-wrap">
            <span class="search-icon">${ICONS.search(18)}</span>
            <input 
              type="text" 
              id="canteen-search-input" 
              class="search-input" 
              placeholder="Search dosas, rice, biryani, coffee..." 
              value="${currentSearch}"
            />
            ${currentSearch ? `<button type="button" id="clear-canteen-search" class="clear-search-btn">✕</button>` : ''}
          </div>

          <div class="dietary-filter-pills">
            <button type="button" class="diet-pill ${currentVegFilter === 'all' ? 'active' : ''}" data-filter="all">
              All
            </button>
            <button type="button" class="diet-pill ${currentVegFilter === 'veg' ? 'active' : ''}" data-filter="veg">
              <span class="food-diet-badge veg-badge" style="position: static; width: 12px; height: 12px;"><span class="dot" style="width: 5px; height: 5px;"></span></span>
              <span>Pure Veg</span>
            </button>
            <button type="button" class="diet-pill ${currentVegFilter === 'non-veg' ? 'active' : ''}" data-filter="non-veg">
              <span class="food-diet-badge nonveg-badge" style="position: static; width: 12px; height: 12px;"><span class="dot" style="width: 5px; height: 5px;"></span></span>
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        <!-- Category Scrolling Chips -->
        <div class="categories-scroll-wrapper">
          <div class="categories-track">
            ${categories.map(cat => `
              <button type="button" class="category-chip ${currentCategory === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 2. DEDICATED SCROLLABLE CONTAINER: ONLY MENU ITEMS SCROLL VERTICALLY -->
      <div class="canteen-menu-scroll-container" id="canteen-menu-scroll-container">
        <div class="food-products-container" id="food-products-list">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- 3. PERMANENTLY FIXED BOTTOM VIEW CART BAR (Never moves or bounces while scrolling) -->
      <div class="canteen-fixed-view-cart-bar" id="canteen-bottom-cart-bar" style="display: none;">
        <div class="cart-bar-left-info">
          <span class="cart-qty-pill" id="bottom-cart-qty">0 ITEMS</span>
          <div class="cart-bar-pricing">
            <span class="cart-bar-sublabel">Total Amount</span>
            <span class="cart-total-val" id="bottom-cart-amount">₹0</span>
          </div>
        </div>
        <button type="button" class="btn-cart-checkout" id="bottom-view-cart-btn">
          <span>View Cart</span>
          ${ICONS.arrowRight(16)}
        </button>
      </div>

    </div>
  `;

  // Attach Header Navigation Handlers
  const backBtn = container.querySelector('#canteen-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const cartHeaderBtn = container.querySelector('#canteen-cart-btn');
  if (cartHeaderBtn) cartHeaderBtn.addEventListener('click', () => navigateTo('cart', { shop: 'canteen' }));

  const bottomViewCartBtn = container.querySelector('#bottom-view-cart-btn');
  if (bottomViewCartBtn) bottomViewCartBtn.addEventListener('click', () => navigateTo('cart', { shop: 'canteen' }));

  // Search Input
  const searchInput = container.querySelector('#canteen-search-input');
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    renderFoodItems(container, navigateTo);
  });

  const clearSearchBtn = container.querySelector('#clear-canteen-search');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      currentSearch = '';
      searchInput.value = '';
      renderFoodItems(container, navigateTo);
    });
  }

  // Dietary Filters
  const dietPills = container.querySelectorAll('.diet-pill');
  dietPills.forEach(pill => {
    pill.addEventListener('click', () => {
      dietPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentVegFilter = pill.getAttribute('data-filter');
      renderFoodItems(container, navigateTo);
    });
  });

  // Category Chips
  const catChips = container.querySelectorAll('.category-chip');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.getAttribute('data-cat');
      renderFoodItems(container, navigateTo);
    });
  });

  // Initial Food Render & Cart Count update
  renderFoodItems(container, navigateTo);
  updateCartIndicators(container);
}

function renderFoodItems(container, navigateTo) {
  const listEl = container.querySelector('#food-products-list');
  if (!listEl) return;

  const menu = getCanteenMenu();
  const cart = getCartState();

  const filtered = menu.filter(item => {
    if (currentCategory !== 'All' && item.category !== currentCategory) return false;
    if (currentVegFilter === 'veg' && !item.isVeg) return false;
    if (currentVegFilter === 'non-veg' && item.isVeg) return false;
    if (currentSearch) {
      const matchName = item.name.toLowerCase().includes(currentSearch);
      const matchDesc = item.description.toLowerCase().includes(currentSearch);
      const matchCat = item.category.toLowerCase().includes(currentSearch);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-results-box" style="margin-top: 40px;">
        <span class="empty-icon" style="color: var(--text-muted);">${ICONS.search(40)}</span>
        <h4 class="empty-title">No matching dishes</h4>
        <p class="empty-text">We couldn't find anything matching your filters.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="reset-canteen-filters" style="margin-top: 8px;">
          Clear All Filters
        </button>
      </div>
    `;
    const resetBtn = listEl.querySelector('#reset-canteen-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentCategory = 'All';
        currentSearch = '';
        currentVegFilter = 'all';
        renderCanteenScreen(container.parentElement, navigateTo);
      });
    }
    return;
  }

  // 2-Column Responsive Food Grid
  listEl.innerHTML = `
    <div class="food-grid">
      ${filtered.map(item => {
        const cartItem = (cart.canteenItems || []).find(ci => ci.id === item.id);
        const qty = cartItem ? cartItem.quantity : 0;

        return `
          <div class="food-card ${!item.available ? 'item-disabled' : ''}" data-id="${item.id}">
            <!-- Food Image Container -->
            <div class="food-img-wrap">
              <img 
                src="${item.image}" 
                alt="${item.name}" 
                class="food-img" 
                loading="lazy" 
                onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';"
              />
              <span class="food-diet-badge ${item.isVeg ? 'veg-badge' : 'nonveg-badge'}" title="${item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}">
                <span class="dot"></span>
              </span>
              ${item.discount ? `<span class="food-discount-tag">${item.discount}</span>` : ''}
              ${!item.available ? `<span class="food-soldout-overlay">SOLD OUT</span>` : ''}
            </div>

            <!-- Card Body -->
            <div class="food-info">
              <h4 class="food-name">${item.name}</h4>
              ${item.description ? `<p class="food-desc">${item.description}</p>` : ''}
              
              <div class="food-meta-row">
                <span>⏱️ ${item.prepTime}</span>
                <span style="color: #D97706; display: flex; align-items: center; gap: 2px;">
                  ${ICONS.star(11, '#F59E0B')} ${item.rating}
                </span>
              </div>

              <!-- Price & Add Action -->
              <div class="food-price-action-row">
                <div class="price-stack">
                  <span class="current-price">₹${item.price}</span>
                  ${item.originalPrice ? `<span class="original-price">₹${item.originalPrice}</span>` : ''}
                </div>

                <div class="action-btn-wrap">
                  ${!item.available ? `
                    <button type="button" class="btn btn-soldout" disabled style="padding: 4px 8px; font-size: 10px; background: var(--bg-secondary-grey); color: var(--text-muted); border: none; border-radius: var(--radius-pill);">OUT</button>
                  ` : qty > 0 ? `
                    <div class="qty-stepper">
                      <button type="button" class="stepper-btn dec-btn" data-id="${item.id}">−</button>
                      <span class="stepper-val">${qty}</span>
                      <button type="button" class="stepper-btn inc-btn" data-id="${item.id}">+</button>
                    </div>
                  ` : `
                    <button type="button" class="btn btn-add-food" data-id="${item.id}">
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

  // Attach Add & Stepper handlers
  listEl.querySelectorAll('.btn-add-food').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      updateCartItemQuantity(id, 1);
      renderFoodItems(container, navigateTo);
      updateCartIndicators(container);
    });
  });

  listEl.querySelectorAll('.inc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cart = getCartState();
      const existing = (cart.canteenItems || []).find(ci => ci.id === id);
      const currentQty = existing ? existing.quantity : 0;
      updateCartItemQuantity(id, currentQty + 1);
      renderFoodItems(container, navigateTo);
      updateCartIndicators(container);
    });
  });

  listEl.querySelectorAll('.dec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cart = getCartState();
      const existing = (cart.canteenItems || []).find(ci => ci.id === id);
      const currentQty = existing ? existing.quantity : 0;
      updateCartItemQuantity(id, currentQty - 1);
      renderFoodItems(container, navigateTo);
      updateCartIndicators(container);
    });
  });
}

function updateCartItemQuantity(productId, newQty) {
  const menu = getCanteenMenu();
  const product = menu.find(p => p.id === productId);
  if (!product) return;

  const cart = getCartState();
  if (!cart.canteenItems) cart.canteenItems = [];

  const existingIdx = cart.canteenItems.findIndex(ci => ci.id === productId);

  if (newQty <= 0) {
    if (existingIdx !== -1) {
      cart.canteenItems.splice(existingIdx, 1);
    }
  } else {
    if (existingIdx !== -1) {
      cart.canteenItems[existingIdx].quantity = newQty;
    } else {
      cart.canteenItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        isVeg: product.isVeg,
        quantity: newQty,
        shop: 'canteen'
      });
    }
  }

  cart.activeShop = 'canteen';
  saveCartState(cart);
}

function updateCartIndicators(container) {
  const cart = getCartState();
  const items = cart.canteenItems || [];
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Header Cart Badge
  const headerCount = container.querySelector('#header-canteen-cart-count');
  if (headerCount) {
    headerCount.textContent = totalCount;
    headerCount.style.display = totalCount > 0 ? 'flex' : 'none';
  }

  // Floating Bottom Cart Bar
  const bottomBar = container.querySelector('#canteen-bottom-cart-bar');
  const bottomQty = container.querySelector('#bottom-cart-qty');
  const bottomAmount = container.querySelector('#bottom-cart-amount');

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
