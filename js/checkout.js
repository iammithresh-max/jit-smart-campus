/**
 * JIT SMART CAMPUS - Redesigned Mobile Order Confirmation & Payment Experience
 * Clear visual hierarchy, student verification, dynamic payment CTA, and simulated payment modes.
 */

import { getCurrentUser } from './auth.js';
import { createVerifiedOrder, clearCart } from './storage.js';
import { ICONS } from './icons.js';

export function renderCheckoutScreen(container, navigateTo, checkoutParams = {}) {
  const user = getCurrentUser();
  const shop = checkoutParams.shop || 'canteen';
  const items = checkoutParams.items || [];
  const printJob = checkoutParams.printJob || null;
  const totalAmount = checkoutParams.totalAmount || 0;

  const shopNameMap = {
    canteen: 'JIT CANTEEN',
    stationery: 'JIT STATIONERY',
    printing: 'JIT REPROGRAPHICS & PRINTING'
  };

  const pickupMap = {
    canteen: 'Canteen Pickup Counters 1 & 2',
    stationery: 'Stationery Dispatch Desk',
    printing: 'Reprographics Center (Room 104)'
  };

  container.innerHTML = `
    <div class="checkout-screen fade-in">
      
      <!-- Screen Header -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="checkout-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">REVIEW & PAY</h2>
          <span class="screen-badge">VERIFIED COUNTER ORDER</span>
        </div>
        <div style="width: 40px;"></div>
      </div>

      <div class="checkout-scroll-content">
        
        <!-- 1. Pickup Counter Destination -->
        <div class="checkout-destination-card">
          <div style="font-size: 20px;">📍</div>
          <div>
            <span style="font-size: 10px; font-weight: 700; color: #B45309; letter-spacing: 0.04em;">PICKUP COUNTER</span>
            <h4 class="destination-title">${shopNameMap[shop] || 'Campus Store'}</h4>
            <p class="destination-counter">${pickupMap[shop] || 'Main Counter'}</p>
          </div>
        </div>

        <!-- 2. Student Verification Badge -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #FFFFFF; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 24px;">${user ? user.avatar : '👨‍🎓'}</div>
            <div>
              <span style="font-size: 10px; color: var(--text-muted);">Ordering As:</span>
              <h4 style="font-size: 13px; font-weight: 800; color: var(--primary-navy);">${user ? user.name : 'Student'}</h4>
            </div>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: var(--secondary-violet); font-family: var(--font-mono);">${user ? user.regNo : '21CS042'}</span>
        </div>

        <!-- 3. Order Items Review -->
        <div class="checkout-card">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h4 class="checkout-card-heading">Order Breakdown</h4>
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">
              ${shop === 'printing' ? '1 Printout' : `${items.length} ${items.length === 1 ? 'Item' : 'Items'}`}
            </span>
          </div>

          ${shop === 'printing' && printJob ? `
            <div style="padding: 10px; background: var(--bg-secondary-grey); border-radius: var(--radius-sm); font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between;">
                <strong>${printJob.fileName}</strong>
                <span>₹${printJob.totalAmount}</span>
              </div>
              <span style="font-size: 11px; color: var(--text-muted);">${printJob.pagesToPrint} pgs • ${printJob.copies} copy • ${printJob.type === 'colour' ? 'Colour' : 'B&W'}</span>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${items.map(item => `
                <div class="review-item-row">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 800; color: var(--secondary-violet);">${item.quantity}×</span>
                    <span>${item.name}</span>
                  </div>
                  <span style="font-weight: 800; color: var(--primary-navy);">₹${item.price * item.quantity}</span>
                </div>
              `).join('')}
            </div>
          `}

          <!-- Special Notes -->
          <div style="margin-top: 6px;">
            <input 
              type="text" 
              id="order-special-notes" 
              class="form-input" 
              placeholder="Special instructions (e.g. less spicy, separate sambar)..." 
              style="min-height: 42px; font-size: 12px; padding: 8px 12px;"
            />
          </div>
        </div>

        <!-- 4. Final Bill -->
        <div class="checkout-card">
          <h4 class="checkout-card-heading">Payment Summary</h4>
          <div class="bill-breakdown">
            <div class="bill-row">
              <span>Item Subtotal</span>
              <span>₹${totalAmount}</span>
            </div>
            <div class="bill-row">
              <span>Campus Handling Fee</span>
              <span class="text-free">FREE</span>
            </div>
            <div class="bill-divider"></div>
            <div class="bill-row grand-total-row">
              <span>Final Payable</span>
              <span class="g-val">₹${totalAmount}</span>
            </div>
          </div>
        </div>

        <!-- Agreement -->
        <div style="padding: 0 4px;">
          <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: var(--text-secondary); line-height: 1.4; cursor: pointer;">
            <input type="checkbox" id="order-confirm-checkbox" checked style="margin-top: 2px;" />
            <span>I verify my order items and agree to collect at the counter once my token is called.</span>
          </label>
        </div>

      </div>

      <!-- Prominent Sticky Bottom Pay Action -->
      <div class="checkout-sticky-pay-bar">
        <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-open-payment-modal">
          <span>Pay ₹${totalAmount}</span>
          ${ICONS.arrowRight(18)}
        </button>
      </div>

      <!-- Payment Sheet Modal -->
      <div class="payment-modal-overlay" id="payment-modal-overlay" style="display: none;">
        <div class="payment-modal-sheet slide-up">
          <div class="sheet-drag-handle"></div>
          
          <div class="sheet-header">
            <div>
              <h3 class="sheet-title">Campus Pay Portal</h3>
              <p class="sheet-sub">Amount to Pay: <strong style="color: var(--accent-green-dark);">₹${totalAmount}</strong></p>
            </div>
            <button type="button" class="icon-nav-btn" id="btn-close-payment-sheet" style="width: 32px; height: 32px;">✕</button>
          </div>

          <!-- Payment Options -->
          <div class="pay-method-option active">
            <div class="method-header-row">
              <div style="color: var(--secondary-violet); font-size: 20px;">⚡</div>
              <div class="method-info">
                <h4 class="method-name">Instant UPI Payment</h4>
                <p class="method-desc">GPay, PhonePe, Paytm, BHIM</p>
              </div>
              <span style="color: var(--secondary-violet);">${ICONS.checkCircle(18)}</span>
            </div>

            <!-- Dynamic QR Simulation -->
            <div class="simulated-qr-box">
              <div style="padding: 10px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px;">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="1.5">
                  <rect x="2" y="2" width="8" height="8" rx="1"></rect>
                  <rect x="14" y="2" width="8" height="8" rx="1"></rect>
                  <rect x="2" y="14" width="8" height="8" rx="1"></rect>
                  <rect x="14" y="14" width="3" height="3"></rect>
                  <rect x="19" y="14" width="3" height="3"></rect>
                  <rect x="14" y="19" width="3" height="3"></rect>
                  <rect x="19" y="19" width="3" height="3"></rect>
                </svg>
              </div>
              <span class="qr-hint">Scan with any UPI App or use Demo Buttons below</span>
            </div>
          </div>

          <!-- Clearly Labelled Demo Simulation Controls -->
          <div class="demo-simulation-controls-card">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span class="sim-badge">DEMO PAYMENT MODE</span>
              <span style="font-size: 10px; color: #92400E;">Safe Simulated Pay</span>
            </div>

            <div class="sim-buttons-stack">
              <button type="button" class="btn-simulate-success" id="btn-sim-success">
                <span>✅ Simulate Successful Payment</span>
                <span class="btn-sub">Verifies server-side and issues token</span>
              </button>

              <button type="button" class="btn-simulate-failure" id="btn-sim-failure">
                <span>❌ Simulate Failed Payment</span>
                <span class="btn-sub">Tests decline handling without token</span>
              </button>
            </div>
          </div>

          <!-- Processing Overlay -->
          <div class="payment-processing-overlay" id="payment-processing-overlay" style="display: none;">
            <div class="processing-spinner-box">
              <div class="spinner-ring"></div>
              <h4 class="processing-title">Verifying Payment...</h4>
              <p class="processing-desc">Connecting to campus queue server</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Success Animated Screen -->
      <div class="payment-success-screen" id="payment-success-screen" style="display: none;">
        <div class="success-card-content zoom-in">
          <div class="success-checkmark-circle">
            ${ICONS.check(38)}
          </div>
          <h2 class="success-title">Payment Verified!</h2>
          <p class="success-amount">₹${totalAmount}.00</p>
          <div class="success-badge-pill">
            <span>TXN: <strong id="success-txnid">UPI-984201</strong></span>
          </div>
          <p class="success-prompt">Generating your Digital Token Pass...</p>
        </div>
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#checkout-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('cart', { shop }));

  const termsCheckbox = container.querySelector('#order-confirm-checkbox');
  const openPayBtn = container.querySelector('#btn-open-payment-modal');
  const payModalOverlay = container.querySelector('#payment-modal-overlay');
  const closePayBtn = container.querySelector('#btn-close-payment-sheet');
  const processingOverlay = container.querySelector('#payment-processing-overlay');
  const successScreen = container.querySelector('#payment-success-screen');

  termsCheckbox.addEventListener('change', () => {
    openPayBtn.disabled = !termsCheckbox.checked;
  });

  openPayBtn.addEventListener('click', () => {
    if (!termsCheckbox.checked) {
      alert('Please agree to order conditions before proceeding.');
      return;
    }
    payModalOverlay.style.display = 'flex';
  });

  closePayBtn.addEventListener('click', () => {
    payModalOverlay.style.display = 'none';
  });

  // Simulated Failure Button
  const simFailureBtn = container.querySelector('#btn-sim-failure');
  simFailureBtn.addEventListener('click', async () => {
    processingOverlay.style.display = 'flex';
    await new Promise(r => setTimeout(r, 600));
    processingOverlay.style.display = 'none';
    alert('Payment Simulation Declined: Bank authorization declined. No queue token was issued.');
  });

  // Simulated Success Button
  const simSuccessBtn = container.querySelector('#btn-sim-success');
  simSuccessBtn.addEventListener('click', async () => {
    simSuccessBtn.disabled = true;
    simFailureBtn.disabled = true;
    processingOverlay.style.display = 'flex';

    try {
      await new Promise(r => setTimeout(r, 800));

      const orderPayload = {
        shop,
        items: shop === 'printing' ? [] : items,
        printConfig: shop === 'printing' ? printJob : null,
        totalAmount,
        studentRegNo: user ? user.regNo : '21CS042',
        studentName: user ? user.name : 'Rahul Sharma',
        paymentDetails: {
          method: 'UPI Instant',
          txnId: `UPI-${Math.floor(100000 + Math.random() * 900000)}`
        }
      };

      const newOrder = createVerifiedOrder(orderPayload);
      clearCart(shop);

      processingOverlay.style.display = 'none';
      payModalOverlay.style.display = 'none';

      const txnLabel = container.querySelector('#success-txnid');
      if (txnLabel) txnLabel.textContent = newOrder.payment.txnId;
      successScreen.style.display = 'flex';

      setTimeout(() => {
        navigateTo('token', { orderId: newOrder.orderId });
      }, 1200);

    } catch (err) {
      processingOverlay.style.display = 'none';
      simSuccessBtn.disabled = false;
      simFailureBtn.disabled = false;
      alert(`Validation error: ${err.message}`);
    }
  });
}
