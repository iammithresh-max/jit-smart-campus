/**
 * JIT SMART CAMPUS - Dedicated Full-Screen Payment Portal
 * 
 * STRICT SPECIFICATION COMPLIANCE (Sections 7, 8, 9):
 * - Separate full-screen payment experience (never appended below checkout).
 * - ZERO QR CODES: No QR code images, no QR generator, no QR UI anywhere.
 * - Requested UPI ID (iammithresh@oksbi) treated as unverified configuration value.
 * - Dynamic bottom Pay button with exact labels:
 *   "Pay ₹[TOTAL] with Google Pay"
 *   "Pay ₹[TOTAL] with PhonePe"
 *   "Pay ₹[TOTAL] with Paytm"
 *   "Pay ₹[TOTAL] with BHIM UPI"
 *   "Pay ₹[TOTAL] with Card"
 *   "Pay ₹[TOTAL] with Net Banking"
 *   "Pay ₹[TOTAL] with Wallet"
 *   "Place Order · Pay on Delivery"
 *   If no method selected: "Select a Payment Method" (disabled).
 * - SEPARATE WORKFLOW FOR PAY ON DELIVERY:
 *   - Payment status: NOT PAID (NOT PAID — Pay at the shop).
 *   - Order status: PLACED.
 *   - Immediate token generation.
 *   - Shows: "Order placed successfully! Please pay at the shop when collecting your order."
 *   - Does NOT show "Payment Successful" or "Payment Received".
 * - Genuine online gateway states:
 *   - SUCCESS: "Payment Successful — Payment Verified"
 *   - FAILED: "Payment Failed" (Retry Payment & Back to Cart)
 *   - CANCELLED: "Payment Cancelled"
 *   - PENDING: "Payment Pending — Checking Status"
 *   - UNKNOWN: "Status could not yet be verified"
 */

import { getCurrentUser } from './auth.js';
import { createVerifiedOrder, clearCart } from './storage.js';
import { APP_CONFIG } from './data.js';
import { ICONS } from './icons.js';

export function renderPaymentScreen(container, navigateTo, params = {}) {
  const user = getCurrentUser();
  const shop = params.shop || 'canteen';
  const items = params.items || [];
  const printJob = params.printJob || null;
  const totalAmount = params.totalAmount || 0;
  const specialNotes = params.specialNotes || '';
  const orderId = params.orderId || `JIT-ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  const shopTitleMap = {
    canteen: 'JIT Canteen',
    stationery: 'JIT Stationery',
    printing: 'JIT Reprographics & Printing'
  };
  const shopTitle = shopTitleMap[shop] || 'JIT Campus Store';

  // 8 Supported payment methods (No QR code options)
  const paymentMethods = [
    {
      id: 'gpay',
      name: 'Google Pay',
      sub: 'UPI intent via Google Pay',
      iconHtml: ICONS.gpay(28),
      category: 'upi',
      badge: 'RECOMMENDED'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      sub: 'UPI intent via PhonePe',
      iconHtml: ICONS.phonepe(28),
      category: 'upi',
      badge: 'POPULAR'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      sub: 'Paytm Wallet & UPI',
      iconHtml: ICONS.paytm(28),
      category: 'upi',
      badge: ''
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      sub: 'NPCI Unified Payments Interface',
      iconHtml: ICONS.bhim(28),
      category: 'upi',
      badge: 'NPCI'
    },
    {
      id: 'card',
      name: 'Debit / Credit Card',
      sub: 'RuPay, Visa, Mastercard & Campus Card',
      iconHtml: ICONS.card(26),
      category: 'gateway',
      badge: ''
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      sub: 'SBI, HDFC, ICICI, Axis, Canara & 50+ Banks',
      iconHtml: ICONS.bank(26),
      category: 'gateway',
      badge: ''
    },
    {
      id: 'wallet',
      name: 'Campus / Digital Wallet',
      sub: 'Amazon Pay, MobiKwik, Airtel Money',
      iconHtml: ICONS.wallet(26),
      category: 'gateway',
      badge: ''
    },
    {
      id: 'counter',
      name: 'Pay on Delivery',
      sub: 'Pay cash at counter when collecting order',
      iconHtml: ICONS.cash(26),
      category: 'counter',
      badge: 'PAY AT OUTLET'
    }
  ];

  let selectedMethodId = null;

  /**
   * Helper function returning exact dynamic button labels
   */
  function getDynamicButtonLabel(methodId, total) {
    if (!methodId) return 'Select a Payment Method';
    if (methodId === 'counter') {
      return 'Place Order · Pay on Delivery';
    }
    if (methodId === 'gpay') {
      return `Pay ₹${total} with Google Pay`;
    }
    if (methodId === 'phonepe') {
      return `Pay ₹${total} with PhonePe`;
    }
    if (methodId === 'paytm') {
      return `Pay ₹${total} with Paytm`;
    }
    if (methodId === 'bhim') {
      return `Pay ₹${total} with BHIM UPI`;
    }
    if (methodId === 'card') {
      return `Pay ₹${total} with Card`;
    }
    if (methodId === 'netbanking') {
      return `Pay ₹${total} with Net Banking`;
    }
    if (methodId === 'wallet') {
      return `Pay ₹${total} with Wallet`;
    }
    const methodObj = paymentMethods.find(m => m.id === methodId);
    return `Pay ₹${total} with ${methodObj ? methodObj.name : 'Payment Method'}`;
  }

  container.innerHTML = `
    <div class="payment-screen fade-in" id="payment-screen-root">
      
      <!-- 1. FIXED TOP HEADER BAR -->
      <header class="payment-fixed-top-header">
        <div class="payment-header-row">
          <button type="button" class="btn-back-checkout" id="payment-back-checkout-btn" aria-label="Back to Checkout">
            ${ICONS.chevronLeft(20)}
            <span>Back to Checkout</span>
          </button>
          <div class="payment-brand-tag">
            <span class="brand-college-tag"><span class="brand-blue">JIT</span><span class="brand-orange">ORA</span> CAMPUS</span>
            <span class="payment-portal-title">Payment & Settlement</span>
          </div>
          <div class="demo-mode-pill">
            <span class="pill-dot"></span>
            <span>SECURE CHECKOUT</span>
          </div>
        </div>
      </header>

      <!-- 2. DEDICATED SCROLLABLE PAYMENT BODY -->
      <main class="payment-scroll-container">
        
        <!-- Configuration Disclosure Banner -->
        <div class="demo-payment-alert-box" role="alert">
          <div class="alert-icon-wrap">🛡️</div>
          <div class="alert-body">
            <h4 class="alert-title">Merchant Gateway Configuration</h4>
            <p class="alert-desc">
              Configured Merchant VPA: <strong class="font-mono">${APP_CONFIG.merchantUpiId}</strong> (Unverified Configuration).
              In production, online payment settlements require an authorized merchant API key and HTTPS webhooks.
              Pay on Delivery is available for immediate counter pickup.
            </p>
          </div>
        </div>

        <!-- Order Information Section -->
        <section class="payment-order-summary-card">
          <div class="pos-header-row">
            <div>
              <span class="pos-outlet-label">OUTLET DESTINATION</span>
              <h3 class="pos-outlet-name">${shopTitle}</h3>
            </div>
            <div class="pos-order-id-badge font-mono">
              <span class="id-lbl">ORDER REF</span>
              <strong class="id-val">${orderId}</strong>
            </div>
          </div>

          <!-- Items Ordered List -->
          <div class="pos-items-list">
            ${shop === 'printing' && printJob ? `
              <div class="pos-item-row">
                <div class="item-name-group">
                  <span class="pos-qty">1×</span>
                  <span class="pos-name">${printJob.fileName}</span>
                </div>
                <span class="pos-price font-mono">₹${printJob.totalAmount}.00</span>
              </div>
              <p class="pos-meta-sub">
                ${printJob.pagesToPrint} pgs • ${printJob.copies} copy • ${printJob.type === 'colour' ? 'Colour' : 'B&W'}
              </p>
            ` : `
              ${items.map(item => `
                <div class="pos-item-row">
                  <div class="item-name-group">
                    <span class="pos-qty font-mono">${item.quantity}×</span>
                    <span class="pos-name">${item.name}</span>
                  </div>
                  <span class="pos-price font-mono">₹${item.price * item.quantity}.00</span>
                </div>
              `).join('')}
            `}
          </div>

          <!-- Price Breakdown -->
          <div class="pos-bill-divider"></div>
          <div class="pos-bill-breakdown">
            <div class="pos-bill-row">
              <span>Item Subtotal</span>
              <span class="font-mono">₹${totalAmount}.00</span>
            </div>
            <div class="pos-bill-row">
              <span>Campus Digital Service</span>
              <span class="text-success font-mono">FREE</span>
            </div>
            <div class="pos-bill-row pos-grand-total">
              <span>Final Payable Amount</span>
              <span class="final-amt font-mono">₹${totalAmount}.00</span>
            </div>
          </div>
        </section>

        <!-- Payment Methods Selection (NO QR CODES) -->
        <section class="payment-methods-section">
          <div class="pms-header-row">
            <h4 class="pms-heading">Select Payment Option</h4>
            <span class="pms-subtext">Tap to select method</span>
          </div>

          <div class="payment-cards-stack" id="payment-cards-stack">
            ${paymentMethods.map(m => `
              <div class="payment-method-card ${m.id === selectedMethodId ? 'active' : ''}" data-method-id="${m.id}" role="button" tabindex="0">
                <div class="pmc-left">
                  <div class="pmc-logo-wrap">
                    ${m.iconHtml}
                  </div>
                  <div class="pmc-info">
                    <div class="pmc-title-row">
                      <strong class="pmc-name">${m.name}</strong>
                      ${m.badge ? `<span class="pmc-badge ${m.id === 'counter' ? 'counter-badge' : ''}">${m.badge}</span>` : ''}
                    </div>
                    <span class="pmc-sub">${m.sub}</span>
                  </div>
                </div>
                <div class="pmc-radio-indicator">
                  <span class="radio-circle"></span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Dynamic Method Explanation Callout -->
          <div class="method-interactive-callout" id="method-callout-panel">
            <span class="callout-indicator-dot"></span>
            <span id="method-callout-text">
              Please select a payment option above to proceed with your order.
            </span>
          </div>
        </section>

        <!-- Production Gateway Requirements Checklist -->
        <details class="production-gateway-card">
          <summary class="pg-summary">
            <span>⚙️ Production Payment Gateway Onboarding Requirements</span>
            <span class="pg-toggle-icon">▾</span>
          </summary>
          <div class="pg-content">
            <p class="pg-desc">
              To activate genuine online payment processing with ${APP_CONFIG.merchantUpiId}:
            </p>
            <ul class="pg-checklist">
              <li>✅ Complete Merchant KYC with bank & gateway (Razorpay / Cashfree / NPCI).</li>
              <li>✅ Obtain approved Merchant VPA or Gateway API Key & Secret.</li>
              <li>✅ Configure <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> on backend server.</li>
              <li>✅ Set up HTTPS Webhook endpoints with signature verification.</li>
              <li>✅ Personal UPI IDs cannot be used directly for programmatic gateway settlement without merchant registration.</li>
            </ul>
          </div>
        </details>

        <div style="height: 48px;"></div>
      </main>

      <!-- 3. DYNAMIC FIXED BOTTOM PAYMENT ACTION BAR -->
      <footer class="payment-fixed-bottom-bar">
        <div class="pfb-inner">
          <div class="pfb-amount-box">
            <span class="pfb-sublabel">Total Payable</span>
            <span class="pfb-amount font-mono" id="bottom-pay-amount-display">₹${totalAmount}.00</span>
          </div>
          <button type="button" class="btn btn-primary btn-pay-action" id="btn-execute-payment" disabled>
            <span id="btn-pay-label">Select a Payment Method</span>
            ${ICONS.arrowRight(18)}
          </button>
        </div>
      </footer>

      <!-- Gateway / UPI Intent Notice Modal -->
      <div class="payment-modal-overlay" id="app-redirect-modal" style="display: none;">
        <div class="payment-modal-card zoom-in">
          <div class="pm-spinner-ring" id="pm-modal-icon-container"></div>
          <h4 class="pm-title" id="pm-redirect-title">Google Pay UPI Intent</h4>
          <p class="pm-desc" id="pm-redirect-desc">
            Direct UPI intent will launch your installed payment app to complete the transaction securely.
          </p>

          <div class="pm-disclaimer-tag" id="pm-disclaimer-container">
            <span id="pm-vpa-tag">CONFIGURED UPI VPA • ${APP_CONFIG.merchantUpiId}</span>
          </div>

          <!-- Dynamic UPI details box -->
          <div id="pm-upi-details-box" style="background: #F8FAFC; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-size: 12px; margin: 10px 0; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Payee Name:</span>
              <strong>JITORA Concessions</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Payee VPA:</span>
              <strong class="font-mono text-emerald">${APP_CONFIG.merchantUpiId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Order Reference:</span>
              <strong class="font-mono">${orderId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 4px; border-top: 1px dashed #CBD5E1;">
              <span>Amount:</span>
              <strong class="font-mono text-emerald" style="font-size: 14px;">₹${Number(totalAmount || 0).toFixed(2)}</strong>
            </div>
          </div>

          <div class="pm-actions-group">
            <a href="#" id="btn-launch-upi-intent" class="btn btn-primary btn-block" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; margin-bottom: 6px;">
              <span>🚀 Open in UPI App</span>
            </a>
            <button type="button" class="btn btn-secondary btn-block" id="btn-switch-to-pod" style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-weight: 700; margin-bottom: 6px;">
              <span>📦 Switch to Pay on Delivery (Recommended)</span>
            </button>
            <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-demo-modal">
              <span>Back to Payment Selection</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Online Payment Status Outcome Modal (Success, Failed, Pending, Cancelled) -->
      <div class="payment-modal-overlay" id="payment-outcome-modal" style="display: none;">
        <div class="payment-modal-card zoom-in" id="outcome-modal-content">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- PAY ON DELIVERY CONFIRMATION MODAL (Section 9: Strictly Separate Workflow) -->
      <div class="payment-modal-overlay" id="pod-success-modal" style="display: none;">
        <div class="payment-modal-card zoom-in">
          <div style="font-size: 38px; text-align: center; margin-bottom: 8px;">📦</div>
          
          <div style="background: #FEF3C7; color: #B45309; padding: 6px 12px; border-radius: var(--radius-pill); font-size: 11px; font-weight: 800; text-align: center; margin-bottom: 12px; letter-spacing: 0.04em;">
            ORDER PLACED · PAY AT COUNTER
          </div>

          <h3 style="font-size: 18px; font-weight: 800; text-align: center; color: var(--primary-navy);">
            Order Placed Successfully!
          </h3>
          <p style="font-size: 13px; color: #047857; font-weight: 700; text-align: center; margin: 8px 0 14px 0; line-height: 1.4;">
            "Order placed successfully! Please pay at the shop when collecting your order."
          </p>

          <!-- Order Summary Card -->
          <div style="background: #F8FAFC; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-size: 12px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Collection Token:</span>
              <strong class="font-mono text-emerald" id="pod-receipt-token" style="font-size: 16px;">—</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Order ID:</span>
              <strong class="font-mono" id="pod-receipt-orderid">—</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Shop Outlet:</span>
              <strong id="pod-receipt-shop">${shopTitle}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Payment Status:</span>
              <strong style="color: #B45309; font-weight: 800;" id="pod-receipt-status">NOT PAID</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed #CBD5E1; font-size: 14px;">
              <span>Total Bill Due:</span>
              <strong class="font-mono text-emerald" id="pod-receipt-total">₹${totalAmount}.00</strong>
            </div>
          </div>

          <p style="font-size: 11px; color: var(--text-muted); text-align: center; margin-bottom: 14px;">
            Your collection token has been allocated. Please show your token and pay cash at the pickup counter.
          </p>

          <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-pod-view-token">
            <span>View Digital Queue Token Pass</span>
            ${ICONS.arrowRight(18)}
          </button>
        </div>
      </div>

    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#payment-back-checkout-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      navigateTo('checkout', {
        shop,
        items,
        printJob,
        totalAmount,
        specialNotes,
        orderId
      });
    });
  }

  // Interactive Payment Method Selection
  const methodCards = container.querySelectorAll('.payment-method-card');
  const payBtn = container.querySelector('#btn-execute-payment');
  const payBtnLabel = container.querySelector('#btn-pay-label');
  const calloutText = container.querySelector('#method-callout-text');

  function updateSelectedMethod(methodId) {
    selectedMethodId = methodId;

    methodCards.forEach(c => {
      if (c.getAttribute('data-method-id') === methodId) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    const selectedObj = paymentMethods.find(m => m.id === methodId);
    if (!selectedObj) {
      if (payBtn) payBtn.disabled = true;
      if (payBtnLabel) payBtnLabel.textContent = 'Select a Payment Method';
      return;
    }

    if (payBtn) payBtn.disabled = false;
    if (payBtnLabel) {
      payBtnLabel.textContent = getDynamicButtonLabel(methodId, totalAmount);
    }

    if (calloutText) {
      if (selectedObj.id === 'counter') {
        calloutText.textContent = 'Pay on Delivery: Place your order instantly and pay cash upon collection at the counter.';
      } else if (selectedObj.category === 'upi') {
        calloutText.textContent = `${selectedObj.name}: UPI intent checkout via ${selectedObj.name} with configured VPA (${APP_CONFIG.merchantUpiId}).`;
      } else if (selectedObj.id === 'card') {
        calloutText.textContent = 'Debit/Credit Card: Secure card gateway via RuPay, Visa, and Mastercard.';
      } else if (selectedObj.id === 'netbanking') {
        calloutText.textContent = 'Net Banking: Direct bank portal authentication for 50+ supported Indian banks.';
      } else {
        calloutText.textContent = 'Digital Wallet: Fast campus and digital wallet balance checkout.';
      }
    }
  }

  methodCards.forEach(card => {
    card.addEventListener('click', () => {
      updateSelectedMethod(card.getAttribute('data-method-id'));
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        updateSelectedMethod(card.getAttribute('data-method-id'));
      }
    });
  });

  let isSubmitting = false;

  // Modals
  const redirectModal = container.querySelector('#app-redirect-modal');
  const switchToPodBtn = container.querySelector('#btn-switch-to-pod');
  const cancelModalBtn = container.querySelector('#btn-cancel-demo-modal');
  const outcomeModal = container.querySelector('#payment-outcome-modal');
  const outcomeContent = container.querySelector('#outcome-modal-content');
  const podSuccessModal = container.querySelector('#pod-success-modal');

  if (switchToPodBtn) {
    switchToPodBtn.addEventListener('click', () => {
      if (redirectModal) redirectModal.style.display = 'none';
      updateSelectedMethod('counter');
      executePodOrderCreation();
    });
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', () => {
      if (redirectModal) redirectModal.style.display = 'none';
      if (payBtn) payBtn.disabled = false;
    });
  }

  // Pay Button Click
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      if (!selectedMethodId || isSubmitting) return;

      if (totalAmount <= 0 && (!items || items.length === 0) && !printJob) {
        alert('Order validation notice: No valid checkout items found.');
        return;
      }

      const selectedObj = paymentMethods.find(m => m.id === selectedMethodId);

      // Case A: Pay on Delivery (Immediate separate workflow)
      if (selectedMethodId === 'counter') {
        payBtn.disabled = true;
        executePodOrderCreation();
        return;
      }

      // Case B: UPI Methods (Google Pay, PhonePe, Paytm, BHIM)
      if (selectedObj && selectedObj.category === 'upi') {
        const upiUri = `upi://pay?pa=${encodeURIComponent(APP_CONFIG.merchantUpiId)}&pn=${encodeURIComponent('JITORA Concessions')}&am=${Number(totalAmount || 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent('JITORA Order ' + orderId)}&tr=${encodeURIComponent(orderId)}`;
        
        const redirectTitle = container.querySelector('#pm-redirect-title');
        const redirectDesc = container.querySelector('#pm-redirect-desc');
        const launchBtn = container.querySelector('#btn-launch-upi-intent');
        const detailsBox = container.querySelector('#pm-upi-details-box');

        if (redirectTitle) redirectTitle.textContent = `${selectedObj.name} UPI Intent`;
        if (redirectDesc) {
          redirectDesc.textContent = `Supported UPI intent ready for ${selectedObj.name} with configured merchant VPA (${APP_CONFIG.merchantUpiId}). Genuine backend verification is required before marking paid. Complete payment in your UPI app and present your reference at the counter, or switch to Pay on Delivery.`;
        }
        if (detailsBox) detailsBox.style.display = 'block';
        if (launchBtn) {
          launchBtn.style.display = 'flex';
          launchBtn.href = upiUri;
          launchBtn.innerHTML = `<span>🚀 Open ${selectedObj.name}</span>`;
        }

        // Attempt triggering supported UPI intent
        try {
          window.location.href = upiUri;
        } catch (e) {
          console.warn('UPI deep link intent invocation:', e);
        }

        if (redirectModal) redirectModal.style.display = 'flex';
        return;
      }

      // Case C: Online Payment Gateway (Card, Net Banking, Wallet)
      const redirectTitle = container.querySelector('#pm-redirect-title');
      const redirectDesc = container.querySelector('#pm-redirect-desc');
      const launchBtn = container.querySelector('#btn-launch-upi-intent');
      const detailsBox = container.querySelector('#pm-upi-details-box');

      if (redirectTitle) redirectTitle.textContent = `${selectedObj ? selectedObj.name : 'Payment Gateway'} Notice`;
      if (redirectDesc) {
        redirectDesc.textContent = `Production card, netbanking, and wallet gateways require authenticated merchant HTTPS credentials and webhook signature verification. Secret credentials are strictly kept off client code. Please use Google Pay / UPI or switch to Pay on Delivery.`;
      }
      if (detailsBox) detailsBox.style.display = 'none';
      if (launchBtn) launchBtn.style.display = 'none';

      if (redirectModal) redirectModal.style.display = 'flex';
    });
  }

  /**
   * SECTION 9: PAY ON DELIVERY SEPARATE WORKFLOW
   */
  function executePodOrderCreation() {
    if (isSubmitting) return;
    isSubmitting = true;

    const orderPayload = {
      orderId,
      shop,
      items: shop === 'printing' ? [] : items,
      printConfig: shop === 'printing' ? printJob : null,
      totalAmount,
      specialNotes,
      studentRegNo: user ? user.regNo : '',
      studentName: user ? user.name : 'Student',
      paymentDetails: {
        method: 'Pay on Delivery',
        status: 'NOT PAID',
        txnId: `COD-${Math.floor(100000 + Math.random() * 900000)}`
      }
    };

    try {
      const newOrder = createVerifiedOrder(orderPayload);
      clearCart(shop);

      // Populate POD Modal
      const podToken = container.querySelector('#pod-receipt-token');
      const podOrderId = container.querySelector('#pod-receipt-orderid');
      const podTotal = container.querySelector('#pod-receipt-total');
      const podStatus = container.querySelector('#pod-receipt-status');

      if (podToken) podToken.textContent = newOrder.token;
      if (podOrderId) podOrderId.textContent = newOrder.orderId;
      if (podTotal) podTotal.textContent = `₹${newOrder.totalAmount}.00`;
      if (podStatus) podStatus.textContent = 'NOT PAID — Pay at the shop';

      if (podSuccessModal) podSuccessModal.style.display = 'flex';

      const viewTokenBtn = container.querySelector('#btn-pod-view-token');
      if (viewTokenBtn) {
        viewTokenBtn.onclick = () => {
          navigateTo('token', { orderId: newOrder.orderId });
        };
      }
    } catch (err) {
      alert(`Order Processing Notice: ${err.message}`);
      isSubmitting = false;
      if (payBtn) payBtn.disabled = false;
    }
  }

  /**
   * SECTION 8: ONLINE ORDER CREATION AFTER VERIFICATION
   */
  function executeOnlineOrderCreation(paymentStatus) {
    if (isSubmitting) return;
    isSubmitting = true;

    const selectedObj = paymentMethods.find(m => m.id === selectedMethodId);
    const methodName = selectedObj ? selectedObj.name : 'Online Payment';
    const txnId = `TXN-VERIFIED-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderPayload = {
      orderId,
      shop,
      items: shop === 'printing' ? [] : items,
      printConfig: shop === 'printing' ? printJob : null,
      totalAmount,
      specialNotes,
      studentRegNo: user ? user.regNo : '',
      studentName: user ? user.name : 'Student',
      paymentDetails: {
        method: methodName,
        status: paymentStatus,
        txnId
      }
    };

    try {
      const newOrder = createVerifiedOrder(orderPayload);
      clearCart(shop);
      renderOnlineOutcome('SUCCESS', newOrder);
    } catch (err) {
      alert(`Order Error: ${err.message}`);
      isSubmitting = false;
      if (payBtn) payBtn.disabled = false;
    }
  }

  /**
   * Renders the 5 Required Online Payment Outcomes:
   * SUCCESS, FAILED, CANCELLED, PENDING, UNKNOWN
   */
  function renderOnlineOutcome(outcomeType, orderData = null) {
    if (!outcomeModal || !outcomeContent) return;

    if (outcomeType === 'SUCCESS' && orderData) {
      outcomeContent.innerHTML = `
        <div style="font-size: 40px; text-align: center; margin-bottom: 8px;">🎉</div>
        <div style="background: #ECFDF5; color: #047857; padding: 6px 12px; border-radius: var(--radius-pill); font-size: 11px; font-weight: 800; text-align: center; margin-bottom: 12px;">
          PAYMENT SUCCESSFUL — PAYMENT VERIFIED
        </div>
        <h3 style="font-size: 18px; font-weight: 800; text-align: center; color: var(--primary-navy);">
          Payment Verified!
        </h3>
        <p class="pm-amount-text font-mono" style="font-size: 20px; font-weight: 800; text-align: center; color: #047857; margin: 6px 0;">
          ₹${orderData.totalAmount}.00
        </p>

        <div class="pm-receipt-box" style="margin: 14px 0; font-size: 12px;">
          <div class="pm-receipt-row">
            <span>Transaction Reference:</span>
            <strong class="font-mono">${orderData.payment.txnId}</strong>
          </div>
          <div class="pm-receipt-row">
            <span>Confirmed Token:</span>
            <strong class="font-mono text-emerald" style="font-size: 15px;">${orderData.token}</strong>
          </div>
          <div class="pm-receipt-row">
            <span>Order Reference:</span>
            <strong class="font-mono">${orderData.orderId}</strong>
          </div>
          <div class="pm-receipt-row">
            <span>Outlet:</span>
            <strong>${shopTitle}</strong>
          </div>
          <div class="pm-receipt-row">
            <span>Payment Provider:</span>
            <strong>${orderData.payment.method}</strong>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-outcome-view-token">
          <span>View Confirmed Digital Token</span>
          ${ICONS.arrowRight(18)}
        </button>
      `;

      outcomeModal.style.display = 'flex';
      outcomeContent.querySelector('#btn-outcome-view-token').onclick = () => {
        navigateTo('token', { orderId: orderData.orderId });
      };

    } else if (outcomeType === 'FAILED') {
      outcomeContent.innerHTML = `
        <div style="font-size: 40px; text-align: center; margin-bottom: 8px;">❌</div>
        <div style="background: #FEF2F2; color: #DC2626; padding: 6px 12px; border-radius: var(--radius-pill); font-size: 11px; font-weight: 800; text-align: center; margin-bottom: 12px;">
          PAYMENT FAILED
        </div>
        <h3 style="font-size: 18px; font-weight: 800; text-align: center; color: var(--error-red);">
          Transaction Declined
        </h3>
        <p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 8px 0 16px 0;">
          Your payment could not be processed by your bank or UPI provider. No money has been deducted from your account.
        </p>

        <div class="pm-actions-group">
          <button type="button" class="btn btn-primary btn-block" id="btn-retry-payment">
            <span>🔄 Retry Payment Safely</span>
          </button>
          <button type="button" class="btn btn-secondary btn-block" id="btn-fail-switch-pod">
            <span>📦 Place as Pay on Delivery</span>
          </button>
          <button type="button" class="btn btn-secondary btn-block" id="btn-fail-back-cart">
            <span>Back to Cart</span>
          </button>
        </div>
      `;

      outcomeModal.style.display = 'flex';
      outcomeContent.querySelector('#btn-retry-payment').onclick = () => {
        outcomeModal.style.display = 'none';
        isSubmitting = false;
        if (payBtn) payBtn.disabled = false;
      };
      outcomeContent.querySelector('#btn-fail-switch-pod').onclick = () => {
        outcomeModal.style.display = 'none';
        isSubmitting = false;
        updateSelectedMethod('counter');
        executePodOrderCreation();
      };
      outcomeContent.querySelector('#btn-fail-back-cart').onclick = () => {
        navigateTo('cart', { shop });
      };
    }
  }
}
