/**
 * JIT SMART CAMPUS - Order Tracking Timeline
 * Vertical timeline with connected glowing pulses, real-time sync, and acoustic chime alert when ready.
 */

import { getOrderById, computeOrderQueuePosition } from './storage.js';
import { ICONS } from './icons.js';

let trackingIntervalId = null;
let lastKnownStatus = null;

export function renderTrackingScreen(container, navigateTo, params = {}) {
  const orderId = params.orderId;
  const order = getOrderById(orderId);

  if (trackingIntervalId) {
    clearInterval(trackingIntervalId);
    trackingIntervalId = null;
  }

  if (!order) {
    container.innerHTML = `
      <div class="tracking-screen fade-in">
        <div class="empty-results-box" style="margin-top: 60px;">
          <div style="color: var(--text-muted); margin-bottom: 8px;">${ICONS.clock(48)}</div>
          <h3 class="empty-title">Tracking Unavailable</h3>
          <p class="empty-text">No active order found with reference: ${orderId || 'None'}</p>
          <button type="button" class="btn btn-primary" id="track-err-home-btn" style="margin-top: 8px;">
            Back to Dashboard
          </button>
        </div>
      </div>
    `;
    const homeBtn = container.querySelector('#track-err-home-btn');
    if (homeBtn) homeBtn.addEventListener('click', () => navigateTo('home'));
    return;
  }

  lastKnownStatus = order.status;
  const timelineSteps = getTimelineStepsForShop(order.shop);
  const queueStats = computeOrderQueuePosition(orderId);

  const shopNames = {
    canteen: 'JIT Canteen Food Counter',
    stationery: 'JIT Stationery Dispatch Desk',
    printing: 'JIT Reprographics Print Center'
  };

  const waitEstimates = {
    canteen: `${Math.max(2, queueStats.ordersAhead * 3)}–${Math.max(5, queueStats.ordersAhead * 4 + 4)} mins`,
    stationery: `${Math.max(2, queueStats.ordersAhead * 2)}–${Math.max(4, queueStats.ordersAhead * 3 + 3)} mins`,
    printing: `${Math.max(3, queueStats.ordersAhead * 2)}–${Math.max(6, queueStats.ordersAhead * 3 + 5)} mins`
  };

  const isReady = order.status === 'Ready for Collection';

  container.innerHTML = `
    <div class="tracking-screen fade-in">
      
      <!-- Screen Header -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="tracking-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">ORDER TIMELINE</h2>
          <span class="screen-badge">LIVE TRACKER</span>
        </div>
        <button type="button" class="icon-nav-btn" id="tracking-refresh-btn" aria-label="Refresh">
          🔄
        </button>
      </div>

      <div class="tracking-content-body">
        
        <!-- Ready Alert Banner -->
        ${isReady ? `
          <div class="ready-alert-card bounce-in">
            <div style="font-size: 26px;">🔔</div>
            <div>
              <h3 class="ready-title">READY FOR COLLECTION!</h3>
              <p class="ready-desc">Please proceed to <strong>${order.pickupLocation}</strong> with token <strong>${order.token}</strong> for immediate pickup.</p>
            </div>
          </div>
        ` : ''}

        <!-- Active Order Status Card -->
        <div class="tracking-summary-card">
          <div class="track-header-row">
            <div>
              <span style="font-size: 11px; color: #94A3B8;">${shopNames[order.shop] || 'Campus Shop'}</span>
              <h3 style="font-size: 13px; font-weight: 700; color: #F8FAFC;">Order: ${order.orderId}</h3>
            </div>
            <div class="track-token-pill">
              <span style="font-size: 8px; color: #CBD5E1;">TOKEN</span>
              <span class="t-pill-number font-mono">${order.token}</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.15); gap: 8px;">
            <div style="text-align: center;">
              <span style="display: block; font-size: 16px; font-weight: 800;">${queueStats.queuePos > 0 ? `#${queueStats.queuePos}` : '—'}</span>
              <span style="font-size: 9px; color: #94A3B8;">Queue Pos</span>
            </div>
            <div style="text-align: center;">
              <span style="display: block; font-size: 16px; font-weight: 800;">${queueStats.ordersAhead}</span>
              <span style="font-size: 9px; color: #94A3B8;">Orders Ahead</span>
            </div>
            <div style="text-align: center;">
              <span style="display: block; font-size: 16px; font-weight: 800; color: #34D399;">${isReady ? '0 min' : waitEstimates[order.shop]}</span>
              <span style="font-size: 9px; color: #94A3B8;">Est. Wait</span>
            </div>
          </div>
        </div>

        <!-- Vertical Progress Timeline -->
        <div class="timeline-container-card">
          <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy); margin-bottom: 16px;">Queue Progress</h4>

          <div class="vertical-timeline">
            ${timelineSteps.map((step, idx) => {
              const stepState = getStepState(step.name, order.status, timelineSteps);
              return `
                <div class="timeline-step ${stepState}">
                  <div class="step-indicator-col">
                    <div class="step-dot">
                      ${stepState === 'completed' ? `
                        ${ICONS.check(12)}
                      ` : stepState === 'active' ? `
                        <span class="active-pulse-inner"></span>
                      ` : `
                        <span>${idx + 1}</span>
                      `}
                    </div>
                    ${idx < timelineSteps.length - 1 ? `<div class="step-line ${stepState === 'completed' ? 'line-done' : ''}"></div>` : ''}
                  </div>
                  <div class="step-content-col">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <h5 class="step-title">${step.name}</h5>
                      <span class="step-state-tag">${stepState.toUpperCase()}</span>
                    </div>
                    <p style="font-size: 11px; color: var(--text-muted); line-height: 1.35; margin-top: 3px;">${step.desc}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-view-digital-token">
            <span>Show Digital Token Pass (${order.token})</span>
            ${ICONS.arrowRight(16)}
          </button>
          <button type="button" class="btn btn-secondary btn-block" id="btn-tracking-home">
            <span>Back to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#tracking-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  const refreshBtn = container.querySelector('#tracking-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderTrackingScreen(container, navigateTo, params);
    });
  }

  const tokenBtn = container.querySelector('#btn-view-digital-token');
  if (tokenBtn) {
    tokenBtn.addEventListener('click', () => {
      navigateTo('token', { orderId: order.orderId });
    });
  }

  const homeBtn = container.querySelector('#btn-tracking-home');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => navigateTo('home'));
  }

  // Auto-polling status sync
  trackingIntervalId = setInterval(() => {
    const updated = getOrderById(orderId);
    if (updated && updated.status !== lastKnownStatus) {
      lastKnownStatus = updated.status;
      if (updated.status === 'Ready for Collection') {
        playOrderReadyChime();
      }
      renderTrackingScreen(container, navigateTo, params);
    }
  }, 2500);
}

function getTimelineStepsForShop(shop) {
  if (shop === 'canteen') {
    return [
      { name: 'Confirmed', desc: 'Order placed and verified into kitchen queue.' },
      { name: 'Preparing', desc: 'Chef preparing fresh food items in campus kitchen.' },
      { name: 'Ready for Collection', desc: 'Order packed and ready at Canteen Pickup Counters 1 & 2.' },
      { name: 'Completed', desc: 'Token verified and food collected by student.' }
    ];
  } else if (shop === 'stationery') {
    return [
      { name: 'Confirmed', desc: 'Order verified and stationery stock reserved.' },
      { name: 'Processing', desc: 'Store staff packing notebook bundles and stationery.' },
      { name: 'Ready for Collection', desc: 'Items packed at Stationery Dispatch Desk.' },
      { name: 'Completed', desc: 'Supplies collected and verified.' }
    ];
  } else if (shop === 'printing') {
    return [
      { name: 'Confirmed', desc: 'Document uploaded and print job queued.' },
      { name: 'Printing in Progress', desc: 'High-speed laser printing & collation in progress.' },
      { name: 'Ready for Collection', desc: 'Printed document ready at Reprographics desk.' },
      { name: 'Completed', desc: 'Document handed over to student.' }
    ];
  }
  return [];
}

function getStepState(stepName, currentStatus, allSteps) {
  const currentIdx = allSteps.findIndex(s => s.name === currentStatus);
  const thisIdx = allSteps.findIndex(s => s.name === stepName);

  if (currentIdx === -1) {
    return thisIdx === 0 ? 'active' : 'pending';
  }

  if (thisIdx < currentIdx) return 'completed';
  if (thisIdx === currentIdx) return 'active';
  return 'pending';
}

function playOrderReadyChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc1.frequency.setValueAtTime(830.61, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    osc1.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.9);
  } catch (e) {}
}
