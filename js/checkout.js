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
          <span style="font-size: 11px; font-weight: 700; color: var(--secondary-violet); font-family: var(--font-mono);">${user ? user.regNo : ''}</span>
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

      <!-- Prominent Sticky Bottom Action to Proceed to Separate Payment Page -->
      <div class="checkout-sticky-pay-bar">
        <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-proceed-to-payment">
          <span>Proceed to Payment (₹${totalAmount})</span>
          ${ICONS.arrowRight(18)}
        </button>
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#checkout-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('cart', { shop }));

  const termsCheckbox = container.querySelector('#order-confirm-checkbox');
  const proceedPayBtn = container.querySelector('#btn-proceed-to-payment');

  if (termsCheckbox && proceedPayBtn) {
    termsCheckbox.addEventListener('change', () => {
      proceedPayBtn.disabled = !termsCheckbox.checked;
    });

    proceedPayBtn.addEventListener('click', () => {
      if (!termsCheckbox.checked) {
        alert('Please agree to counter collection terms before proceeding.');
        return;
      }
      proceedPayBtn.disabled = true;
      const specialNotes = container.querySelector('#order-special-notes')?.value || '';
      
      // Navigate to dedicated full-screen payment page
      navigateTo('payment', {
        shop,
        items,
        printJob,
        totalAmount,
        specialNotes,
        orderId: checkoutParams.orderId || `JIT-ORD-${Math.floor(1000 + Math.random() * 9000)}`
      });
    });
  }
}

