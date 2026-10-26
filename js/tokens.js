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
          <div style="color: var(--text-muted); margin-bottom: 8px;">${ICONS.orders(48)}</div>
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
              <h3 class="t-college-name"><span class="brand-blue">JIT</span><span class="brand-orange">ORA</span> SMART CAMPUS</h3>
              <span class="t-shop-name">${shopTitles[order.shop] || 'CAMPUS SERVICE'}</span>
            </div>
            <span class="t-status-pill ${statusColors[order.status] || ''}">
              ${(order.status || 'PENDING').toUpperCase()}
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

          <!-- Ticket Footer & Metadata (Strictly No QR Codes) -->
          <div class="ticket-footer-strip">
            <div class="stamp-and-meta-row">
              <div class="ticket-stamp-box">
                <div class="verified-seal-circle ${order.payment.status === 'PAID' ? 'seal-paid' : 'seal-queued'}">
                  <span class="seal-icon">${order.payment.status === 'PAID' ? '✓' : '⏳'}</span>
                  <span class="seal-text">${order.payment.status === 'PAID' ? 'VERIFIED' : 'QUEUED'}</span>
                </div>
                <span class="token-pass-tag font-mono">${order.token}</span>
                <span style="font-size: 8px; font-weight: 800; color: var(--text-muted); margin-top: 2px;">Counter Pass</span>
              </div>

              <div class="ticket-meta-details">
                <div class="t-meta-item">
                  <span class="t-meta-lbl">Order Reference:</span>
                  <span class="t-meta-val font-mono">${order.orderId}</span>
                </div>
                <div class="t-meta-item">
                  <span class="t-meta-lbl">Student:</span>
                  <span class="t-meta-val">${order.studentName || 'Student'} (${order.studentRegNo || '—'})</span>
                </div>
                <div class="t-meta-item">
                  <span class="t-meta-lbl">Payment Status:</span>
                  <span class="t-meta-val ${order.payment && order.payment.status === 'PAID' ? 'text-success font-bold' : 'font-bold'}" style="color: ${order.payment && order.payment.status === 'PAID' ? '#047857' : '#B45309'};">
                    ${order.payment && order.payment.status === 'PAID' ? 'PAID — Verified ✓' : `NOT PAID — Pay ₹${Number(order.totalAmount || 0).toFixed(2)} at shop`}
                  </span>
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
