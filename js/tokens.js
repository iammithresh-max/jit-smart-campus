/**
 * JIT SMART CAMPUS - Redesigned Digital Token Experience
 * High-contrast boarding pass ticket with large focal typography, live queue position,
 * vector QR code, and quick tracking actions.
 */

import { getOrderById, computeOrderQueuePosition } from './storage.js';
import { ICONS } from './icons.js';

export function renderTokenScreen(container, navigateTo, params = {}) {
  const orderId = params.orderId;
  const order = getOrderById(orderId);

  if (!order) {
    container.innerHTML = `
      <div class="token-screen fade-in">
        <div class="empty-results-box" style="margin-top: 60px;">
          <div style="color: var(--text-muted); margin-bottom: 8px;">${ICONS.qrCode(48)}</div>
          <h3 class="empty-title">Token Not Found</h3>
          <p class="empty-text">No active pass found for reference: ${orderId || 'None'}</p>
          <button type="button" class="btn btn-primary" id="token-err-home-btn" style="margin-top: 8px;">
            Back to Dashboard
          </button>
        </div>
      </div>
    `;
    const homeBtn = container.querySelector('#token-err-home-btn');
    if (homeBtn) homeBtn.addEventListener('click', () => navigateTo('home'));
    return;
  }

  const queueStats = computeOrderQueuePosition(orderId);
  const shopTitles = {
    canteen: 'JIT CANTEEN COUNTER',
    stationery: 'JIT STATIONERY DESK',
    printing: 'JIT REPROGRAPHICS (PRINTING)'
  };

  const waitEstimates = {
    canteen: `${Math.max(3, queueStats.ordersAhead * 3)}–${Math.max(6, queueStats.ordersAhead * 4 + 4)} mins`,
    stationery: `${Math.max(2, queueStats.ordersAhead * 2)}–${Math.max(5, queueStats.ordersAhead * 3 + 3)} mins`,
    printing: `${Math.max(3, queueStats.ordersAhead * 2)}–${Math.max(6, queueStats.ordersAhead * 3 + 5)} mins`
  };

  const statusColors = {
    'Confirmed': 'badge-confirmed',
    'Preparing': 'badge-preparing',
    'Processing': 'badge-preparing',
    'Printing in Progress': 'badge-preparing',
    'Ready for Collection': 'badge-ready',
    'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled'
  };

  container.innerHTML = `
    <div class="token-screen fade-in">
      
      <!-- Top Screen Bar -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="token-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">DIGITAL COLLECTION TOKEN</h2>
          <span class="screen-badge">VERIFIED COUNTER PASS</span>
        </div>
        <button type="button" class="icon-nav-btn" id="token-refresh-btn" aria-label="Refresh Queue">
          🔄
        </button>
      </div>

      <div class="token-content-body">
        
        <!-- High-Contrast Digital Ticket Pass -->
        <div class="digital-ticket-card">
          
          <!-- Ticket Header Strip -->
          <div class="ticket-header-strip">
            <div>
              <h3 class="t-college-name">JIT SMART CAMPUS</h3>
              <span class="t-shop-name">${shopTitles[order.shop] || 'CAMPUS SERVICE'}</span>
            </div>
            <span class="t-status-pill ${statusColors[order.status] || ''}">
              ${order.status.toUpperCase()}
            </span>
          </div>

          <!-- Giant Token Number Focal Point -->
          <div class="token-hero-block">
            <span class="token-eyebrow">YOUR TOKEN NUMBER</span>
            <h1 class="token-big-number">${order.token}</h1>
            <span class="token-pickup-station">📍 ${order.pickupLocation}</span>
          </div>

          <!-- Queue Telemetry Row -->
          <div class="token-metrics-row">
            <div class="t-metric-box">
              <span class="m-val">${queueStats.queuePos > 0 ? `#${queueStats.queuePos}` : '—'}</span>
              <span class="m-lbl">Queue Pos</span>
            </div>
            <div class="t-metric-box">
              <span class="m-val">${queueStats.ordersAhead}</span>
              <span class="m-lbl">Orders Ahead</span>
            </div>
            <div class="t-metric-box highlight-metric">
              <span class="m-val">${waitEstimates[order.shop] || '5–8 mins'}</span>
              <span class="m-lbl">Est. Wait</span>
            </div>
          </div>

          <!-- Perforation & Notches -->
          <div class="ticket-perforation-wrap">
            <div class="ticket-notch notch-left"></div>
            <div class="perforation-dashed-line"></div>
            <div class="ticket-notch notch-right"></div>
          </div>

          <!-- Ticket Footer / QR & Metadata -->
          <div class="ticket-footer-strip">
            <div class="qr-and-meta-row">
              <div class="ticket-qr-box">
                <svg width="90" height="90" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="5" y="5" width="28" height="28" rx="4" fill="#0A0F1D"/>
                  <rect x="9" y="9" width="20" height="20" rx="2" fill="#FFFFFF"/>
                  <rect x="14" y="14" width="10" height="10" fill="#0A0F1D"/>

                  <rect x="67" y="5" width="28" height="28" rx="4" fill="#0A0F1D"/>
                  <rect x="71" y="9" width="20" height="20" rx="2" fill="#FFFFFF"/>
                  <rect x="76" y="14" width="10" height="10" fill="#0A0F1D"/>

                  <rect x="5" y="67" width="28" height="28" rx="4" fill="#0A0F1D"/>
                  <rect x="9" y="71" width="20" height="20" rx="2" fill="#FFFFFF"/>
                  <rect x="14" y="76" width="10" height="10" fill="#0A0F1D"/>

                  <rect x="38" y="10" width="8" height="8" fill="#0A0F1D"/>
                  <rect x="52" y="15" width="8" height="8" fill="#0A0F1D"/>
                  <rect x="42" y="42" width="16" height="16" rx="2" fill="#6366F1"/>
                  <rect x="65" y="42" width="8" height="8" fill="#0A0F1D"/>
                  <rect x="40" y="68" width="8" height="8" fill="#0A0F1D"/>
                  <rect x="70" y="68" width="12" height="12" fill="#0A0F1D"/>
                  <rect x="85" y="85" width="8" height="8" fill="#0A0F1D"/>
                </svg>
                <span style="font-size: 8px; font-weight: 800; color: var(--text-muted); margin-top: 2px;">Counter Scan</span>
              </div>

              <div class="ticket-meta-details">
                <div class="t-meta-item">
                  <span class="t-meta-lbl">Order Reference:</span>
                  <span class="t-meta-val font-mono">${order.orderId}</span>
                </div>
                <div class="t-meta-item">
                  <span class="t-meta-lbl">Student:</span>
                  <span class="t-meta-val">${order.studentName} (${order.studentRegNo})</span>
                </div>
                <div class="t-meta-item">
                  <span class="t-meta-lbl">Paid Amount:</span>
                  <span class="t-meta-val text-success">₹${order.totalAmount}.00 (Verified)</span>
                </div>
                <div class="t-meta-item">
                  <span class="t-meta-lbl">Placed At:</span>
                  <span class="t-meta-val">${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <!-- Items Ordered Breakdown -->
            <div style="background: var(--bg-secondary-grey); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 11px;">
              <span style="font-weight: 700; color: var(--primary-navy); display: block; margin-bottom: 4px;">Items in this pass:</span>
              ${order.shop === 'printing' && order.printConfig ? `
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                  <span>🖨️ ${order.printConfig.fileName} (${order.printConfig.pagesToPrint} pgs × ${order.printConfig.copies} sets)</span>
                  <strong>₹${order.totalAmount}</strong>
                </div>
              ` : (order.items || []).map(i => `
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 2px;">
                  <span>${i.quantity}× ${i.name}</span>
                  <strong>₹${i.price * i.quantity}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-track-live-order">
            ${ICONS.clock(18)}
            <span>Track Live Queue Timeline</span>
            ${ICONS.arrowRight(16)}
          </button>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <button type="button" class="btn btn-secondary" id="btn-token-my-orders">
              <span>All Orders</span>
            </button>
            <button type="button" class="btn btn-secondary" id="btn-token-home">
              <span>Back to Home</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#token-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const refreshBtn = container.querySelector('#token-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderTokenScreen(container, navigateTo, params);
    });
  }

  const trackBtn = container.querySelector('#btn-track-live-order');
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      navigateTo('tracking', { orderId: order.orderId });
    });
  }

  const myOrdersBtn = container.querySelector('#btn-token-my-orders');
  if (myOrdersBtn) myOrdersBtn.addEventListener('click', () => navigateTo('history'));

  const homeBtn = container.querySelector('#btn-token-home');
  if (homeBtn) homeBtn.addEventListener('click', () => navigateTo('home'));
}
