/**
 * JIT SMART CAMPUS - Main Application Controller & Redesigned Home Dashboard
 * Coordinates modern navigation, crowd calculations, live activities, and screen transitions.
 */

import { initStorage, getShopCrowdStats, getOrdersByStudent, getAllOrders, getCartState } from './storage.js';
import { initAuth, getCurrentUser, isLoggedIn } from './auth.js';
import { renderLoginScreen } from './auth.js';
import { renderCanteenScreen } from './canteen.js';
import { renderStationeryScreen } from './stationery.js';
import { renderPrintingScreen } from './printing.js';
import { renderCartScreen } from './cart.js';
import { renderCheckoutScreen } from './checkout.js';
import { renderPaymentScreen } from './payment.js';
import { renderTokenScreen } from './tokens.js';
import { renderTrackingScreen } from './tracking.js';
import { renderStaffScreen } from './staff.js';
import { renderHistoryScreen, renderProfileScreen } from './history.js';
import { ICONS } from './icons.js';

let currentScreen = 'home';
let currentScreenParams = {};

export function getCurrentScreen() {
  return currentScreen;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initAuth();
  setupViewportSimulatorControls();
  setupGlobalNavigationEvents();

  if (!isLoggedIn()) {
    navigateTo('login');
  } else {
    navigateTo('home');
  }
});

/**
 * Main Router
 */
export function navigateTo(screenName, params = {}) {
  currentScreen = screenName;
  currentScreenParams = params;

  const appContainer = document.getElementById('mobile-app-screen');
  const bottomNav = document.getElementById('mobile-bottom-nav');

  if (!appContainer) return;

  // Manage screen-specific container classes
  if (screenName === 'canteen') {
    appContainer.classList.add('canteen-mode-active');
  } else {
    appContainer.classList.remove('canteen-mode-active');
  }

  if (screenName === 'payment') {
    appContainer.classList.add('payment-mode-active');
    if (bottomNav) bottomNav.style.display = 'flex';
  } else {
    appContainer.classList.remove('payment-mode-active');
    if (bottomNav && screenName !== 'login') bottomNav.style.display = 'flex';
  }

  // Instant scroll reset
  appContainer.scrollTo({ top: 0, behavior: 'instant' });

  // Handle Login Screen
  if (screenName === 'login') {
    if (bottomNav) bottomNav.style.display = 'none';
    renderLoginScreen(appContainer, (session) => {
      navigateTo('home');
    });
    return;
  }

  // Ensure authenticated
  if (!isLoggedIn()) {
    navigateTo('login');
    return;
  }

  // Update Bottom Nav
  updateBottomNavigation(screenName);

  // Render Screen
  switch (screenName) {
    case 'home':
      renderHomeScreen(appContainer, navigateTo);
      break;
    case 'canteen':
      renderCanteenScreen(appContainer, navigateTo);
      break;
    case 'stationery':
      renderStationeryScreen(appContainer, navigateTo);
      break;
    case 'printing':
      renderPrintingScreen(appContainer, navigateTo);
      break;
    case 'cart':
      renderCartScreen(appContainer, navigateTo, params);
      break;
    case 'checkout':
      renderCheckoutScreen(appContainer, navigateTo, params);
      break;
    case 'payment':
      renderPaymentScreen(appContainer, navigateTo, params);
      break;
    case 'token':
      renderTokenScreen(appContainer, navigateTo, params);
      break;
    case 'tracking':
      renderTrackingScreen(appContainer, navigateTo, params);
      break;
    case 'staff':
      renderStaffScreen(appContainer, navigateTo);
      break;
    case 'history':
      renderHistoryScreen(appContainer, navigateTo);
      break;
    case 'profile':
      renderProfileScreen(appContainer, navigateTo);
      break;
    default:
      renderHomeScreen(appContainer, navigateTo);
  }
}

/**
 * 3. REDESIGNED MOBILE HOME DASHBOARD
 */
function renderHomeScreen(container, navigateTo) {
  const user = getCurrentUser();
  const canteenCrowd = getShopCrowdStats('canteen');
  const stationeryCrowd = getShopCrowdStats('stationery');
  const allStudentOrders = user && user.role === 'student'
    ? getOrdersByStudent(user.regNo)
    : getAllOrders();

  const activeOrders = allStudentOrders.filter(
    o => o.status !== 'Completed' && o.status !== 'Cancelled'
  );

  const cart = getCartState();
  const cartItemTotal = (cart.canteenItems || []).reduce((s, i) => s + i.quantity, 0) +
                        (cart.stationeryItems || []).reduce((s, i) => s + i.quantity, 0) +
                        (cart.printJob ? 1 : 0);

  const firstName = user ? user.name.split(' ')[0] : 'Student';

  container.innerHTML = `
    <div class="home-screen fade-in">
      
      <!-- 1. Compact, Elegant Header -->
      <header class="home-compact-header">
        <div class="brand-wordmark-wrap">
          <div class="college-logo-badge">JIT</div>
          <div>
            <h1 class="header-brand-name">SMART CAMPUS</h1>
            <span class="header-reg-pill font-mono">${user ? user.regNo : ''}</span>
          </div>
        </div>

        <div class="header-actions-group">
          <!-- Cart Shortcut -->
          <button type="button" class="header-action-btn" id="home-cart-shortcut" aria-label="Shopping Cart">
            ${ICONS.cart(20)}
            ${cartItemTotal > 0 ? `<span class="cart-pill-count">${cartItemTotal}</span>` : ''}
          </button>

          <!-- User Profile Avatar -->
          <button type="button" class="user-avatar-pill" id="home-profile-btn" aria-label="Student Profile">
            <span>${user ? user.avatar : '👨‍🎓'}</span>
          </button>
        </div>
      </header>

      <!-- 2. Distinctive Hero Section -->
      <section class="home-hero-container">
        <div class="hero-geometry-art" aria-hidden="true"></div>
        <div class="hero-greeting-tag">
          ${ICONS.zap(13)}
          <span>Good morning, ${firstName}!</span>
        </div>
        <h2 class="hero-main-title">Your Campus, Without the Queue.</h2>
        <p class="hero-subtext">Order ahead. Save time. Get back to what matters.</p>
      </section>

      <!-- 3. Live Active Token Banner (Dynamic Island feel) -->
      ${activeOrders.length > 0 ? `
        <div class="live-activity-bar" id="home-quick-active-token" data-id="${activeOrders[0].orderId}">
          <div class="la-left">
            <span class="la-token-badge font-mono">${activeOrders[0].token}</span>
            <div class="la-meta">
              <span class="la-shop">${activeOrders[0].shop === 'canteen' ? 'Canteen Food' : activeOrders[0].shop === 'stationery' ? 'Stationery Order' : 'Print Job'}</span>
              <span class="la-status">${activeOrders[0].status === 'Ready for Collection' ? '🔔 Ready for Pickup!' : `${activeOrders[0].status} in Queue`}</span>
            </div>
          </div>
          <div class="la-arrow">
            ${ICONS.chevronRight(18)}
          </div>
        </div>
      ` : ''}

      <!-- 4. Quick Action Shortcuts Bar -->
      <div class="quick-shortcuts-scroll" role="region" aria-label="Quick Actions">
        <button type="button" class="quick-action-pill highlight-pill" id="quick-print-pill">
          ${ICONS.filePdf(16)}
          <span>Print PDF</span>
        </button>
        <button type="button" class="quick-action-pill" id="quick-track-pill">
          ${ICONS.clock(15)}
          <span>Track Order</span>
        </button>
        <button type="button" class="quick-action-pill" id="quick-tokens-pill">
          ${ICONS.orders(15)}
          <span>My Tokens</span>
        </button>
        <button type="button" class="quick-action-pill" id="quick-staff-pill">
          ${ICONS.sliders(15)}
          <span>Staff Desk</span>
        </button>
      </div>

      <!-- 5. Main Services (Distinctive Visual Treatments) -->
      <section class="services-showcase-container">
        
        <!-- SERVICE 1: JIT CANTEEN -->
        <article class="canteen-showcase-card" id="card-open-canteen">
          <div class="canteen-banner-media">
            <img 
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80" 
              alt="JIT Canteen Food" 
              class="canteen-banner-img" 
              loading="lazy" 
            />
            <div class="media-crowd-overlay">
              <div class="crowd-pill ${canteenCrowd.badgeColor}-pill">
                <span class="dot"></span>
                <span>${canteenCrowd.crowdLevel}</span>
              </div>
            </div>
          </div>

          <div class="canteen-showcase-body">
            <div class="service-meta-header">
              <span class="service-category-tag">CRAVINGS, SORTED.</span>
              <span class="service-wait-text">
                ${ICONS.clock(14)}
                <span>${canteenCrowd.estimatedWaitText} wait</span>
              </span>
            </div>

            <h3 class="service-title">JIT CANTEEN</h3>
            <p class="service-subtext">Browse today's hot breakfast, wholesome meals, and fresh snacks.</p>

            <div class="canteen-quick-chips">
              <span class="mini-chip">Ghee Dosa</span>
              <span class="mini-chip">Thali Meals</span>
              <span class="mini-chip">Filter Coffee</span>
              <span class="mini-chip">Sandwiches</span>
            </div>

            <button type="button" class="btn-service-action canteen-cta">
              <span>Explore Canteen Menu</span>
              ${ICONS.arrowRight(16)}
            </button>
          </div>
        </article>

        <!-- SERVICE 2: JIT STATIONERY -->
        <article class="stationery-showcase-card" id="card-open-stationery">
          <div class="stationery-showcase-body">
            <div class="service-meta-header">
              <span class="service-category-tag" style="color: var(--secondary-violet);">ACADEMIC STORE</span>
              <div class="crowd-pill ${stationeryCrowd.badgeColor}-pill" style="padding: 2px 8px;">
                <span class="dot"></span>
                <span>${stationeryCrowd.crowdLevel}</span>
              </div>
            </div>

            <h3 class="service-title">JIT STATIONERY</h3>
            <p class="service-subtext">Official lab record books, observation manuals, ball pens, and notebook bundles.</p>

            <button type="button" class="btn-service-action stationery-cta">
              <span>Explore Stationery Supplies</span>
              ${ICONS.arrowRight(16)}
            </button>
          </div>
        </article>

        <!-- HIGHLIGHT: PRINTING SERVICE SPOTLIGHT -->
        <div class="printing-spotlight-card" id="card-open-print">
          <div class="psc-left">
            <div class="psc-icon-box">
              ${ICONS.print(22)}
            </div>
            <div>
              <h4 class="psc-title">Need a Printout?</h4>
              <p class="psc-sub">Upload PDF assignments for queue-free pickup</p>
            </div>
          </div>
          <button type="button" class="btn-print-pill">
            <span>Upload PDF →</span>
          </button>
        </div>

      </section>

      <!-- Bottom Padding -->
      <div style="height: 14px;"></div>
    </div>
  `;

  // Attach Navigation Listeners
  const canteenCard = container.querySelector('#card-open-canteen');
  if (canteenCard) canteenCard.addEventListener('click', () => navigateTo('canteen'));

  const statCard = container.querySelector('#card-open-stationery');
  if (statCard) statCard.addEventListener('click', () => navigateTo('stationery'));

  const printCard = container.querySelector('#card-open-print');
  if (printCard) printCard.addEventListener('click', () => navigateTo('printing'));

  const quickPrintPill = container.querySelector('#quick-print-pill');
  if (quickPrintPill) quickPrintPill.addEventListener('click', () => navigateTo('printing'));

  const quickTrackPill = container.querySelector('#quick-track-pill');
  if (quickTrackPill) {
    quickTrackPill.addEventListener('click', () => {
      if (activeOrders.length > 0) {
        navigateTo('tracking', { orderId: activeOrders[0].orderId });
      } else {
        navigateTo('history');
      }
    });
  }

  const quickTokensPill = container.querySelector('#quick-tokens-pill');
  if (quickTokensPill) {
    quickTokensPill.addEventListener('click', () => {
      if (activeOrders.length > 0) {
        navigateTo('token', { orderId: activeOrders[0].orderId });
      } else {
        navigateTo('history');
      }
    });
  }

  const quickStaffPill = container.querySelector('#quick-staff-pill');
  if (quickStaffPill) quickStaffPill.addEventListener('click', () => navigateTo('staff'));

  const cartShortcut = container.querySelector('#home-cart-shortcut');
  if (cartShortcut) cartShortcut.addEventListener('click', () => navigateTo('cart'));

  const profileBtn = container.querySelector('#home-profile-btn');
  if (profileBtn) profileBtn.addEventListener('click', () => navigateTo('profile'));

  const activeTokenBanner = container.querySelector('#home-quick-active-token');
  if (activeTokenBanner) {
    activeTokenBanner.addEventListener('click', () => {
      const orderId = activeTokenBanner.getAttribute('data-id');
      navigateTo('token', { orderId });
    });
  }
}

/**
 * 4. REDESIGNED MOBILE BOTTOM NAVIGATION
 */
function updateBottomNavigation(activeScreen) {
  const bottomNav = document.getElementById('mobile-bottom-nav');
  if (!bottomNav) return;

  bottomNav.style.display = 'flex';

  // Inject crisp SVGs into nav items
  const homeTab = document.getElementById('nav-btn-home');
  const canteenTab = document.getElementById('nav-btn-canteen');
  const statTab = document.getElementById('nav-btn-stationery');
  const ordersTab = document.getElementById('nav-btn-history');
  const profileTab = document.getElementById('nav-btn-profile');

  const setNavIcon = (tab, iconSvg) => {
    const iconContainer = tab?.querySelector('.nav-icon');
    if (iconContainer) iconContainer.innerHTML = iconSvg;
  };

  setNavIcon(homeTab, ICONS.home(22));
  setNavIcon(canteenTab, ICONS.canteen(22));
  setNavIcon(statTab, ICONS.stationery(22));
  setNavIcon(ordersTab, ICONS.orders(22));
  setNavIcon(profileTab, ICONS.profile(22));

  const navItems = bottomNav.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const target = item.getAttribute('data-screen');
    if (target === activeScreen) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Badge updates
  const user = getCurrentUser();
  const orders = user && user.role === 'student' ? getOrdersByStudent(user.regNo) : getAllOrders();
  const activeOrdersCount = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;

  const ordersBadge = bottomNav.querySelector('#nav-orders-badge');
  if (ordersBadge) {
    if (activeOrdersCount > 0) {
      ordersBadge.textContent = activeOrdersCount;
      ordersBadge.style.display = 'flex';
    } else {
      ordersBadge.style.display = 'none';
    }
  }
}

export function setupGlobalNavigationEvents() {
  const bottomNav = document.getElementById('mobile-bottom-nav');
  if (bottomNav) {
    bottomNav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetScreen = item.getAttribute('data-screen');
        if (targetScreen) {
          navigateTo(targetScreen);
        }
      });
    });
  }

  window.addEventListener('jit:order_status_changed', (e) => {
    const order = e.detail;
    showToastNotification(`Order #${order.token} status updated: ${order.status}!`);
  });
}

export function showToastNotification(message) {
  let toast = document.getElementById('jit-toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'jit-toast-notification';
    toast.className = 'jit-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function setupViewportSimulatorControls() {
  const simulatorWrap = document.getElementById('simulator-viewport-wrapper');
  const sizePills = document.querySelectorAll('.viewport-size-pill');

  if (!simulatorWrap || sizePills.length === 0) return;

  sizePills.forEach(pill => {
    pill.addEventListener('click', () => {
      sizePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const width = pill.getAttribute('data-width');
      if (width === 'full') {
        simulatorWrap.style.width = '100%';
        simulatorWrap.style.maxWidth = '100%';
        simulatorWrap.classList.add('full-width-mode');
      } else {
        simulatorWrap.style.width = `${width}px`;
        simulatorWrap.style.maxWidth = `${width}px`;
        simulatorWrap.classList.remove('full-width-mode');
      }
    });
  });
}
