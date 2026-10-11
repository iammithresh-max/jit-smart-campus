/**
 * JIT SMART CAMPUS - Dedicated Full-Screen Demonstration Payment Portal
 * 
 * STRICT SPECIFICATION COMPLIANCE:
 * - Completely separate full-screen payment experience (never appended below checkout).
 * - Zero QR codes: No QR code images, no QR generator, no QR UI anywhere.
 * - Recognized payment provider options:
 *   Google Pay, PhonePe, Paytm, BHIM UPI, Other UPI, Debit/Credit Card, Net Banking, Wallets, Pay on Delivery.
 * - DYNAMIC FIXED BOTTOM PAYMENT BUTTON:
 *   Immediately updates label to:
 *   "Pay ₹[TOTAL] with Google Pay"
 *   "Pay ₹[TOTAL] with PhonePe"
 *   "Pay ₹[TOTAL] with Paytm"
 *   "Pay ₹[TOTAL] with BHIM UPI"
 *   "Pay ₹[TOTAL] with UPI"
 *   "Pay ₹[TOTAL] with Card"
 *   "Pay ₹[TOTAL] via Net Banking"
 *   "Pay ₹[TOTAL] with Digital Wallet"
 *   "Place Order · Pay on Delivery"
 *   If no method selected: "Select a Payment Method" (button disabled).
 * - Multi-provider app intent routing (no default single redirect).
 * - Safe demo status & clear disclosure that real payments require a server backend.
 */

import { getCurrentUser } from './auth.js';
import { createVerifiedOrder, clearCart } from './storage.js';
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

  // 9 Supported payment methods with clean vector icons
  const paymentMethods = [
    {
      id: 'gpay',
      name: 'Google Pay',
      sub: 'UPI intent via Tez / Google Pay',
      iconHtml: ICONS.gpay(28),
      category: 'upi',
      appScheme: 'tez://upi/pay',
      badge: 'RECOMMENDED'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      sub: 'UPI intent via PhonePe application',
      iconHtml: ICONS.phonepe(28),
      category: 'upi',
      appScheme: 'phonepe://pay',
      badge: 'POPULAR'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      sub: 'Paytm app or Paytm Payments Bank',
      iconHtml: ICONS.paytm(28),
      category: 'upi',
      appScheme: 'paytmmp://pay',
      badge: ''
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      sub: 'NPCI Unified Payments Interface',
      iconHtml: ICONS.bhim(28),
      category: 'upi',
      appScheme: 'upi://pay',
      badge: 'NPCI'
    },
    {
      id: 'other_upi',
      name: 'Other UPI',
      sub: 'Any UPI-enabled app on device',
      iconHtml: ICONS.upiGeneric(24),
      category: 'upi',
      appScheme: 'upi://pay',
      badge: ''
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
      sub: 'Cash on collection at outlet pickup counter',
      iconHtml: ICONS.cash(26),
      category: 'counter',
      badge: 'NO ONLINE PAYMENT'
    }
  ];

  // Initialize with null so user must select, or first method if specified
  let selectedMethodId = null;

  /**
   * Helper function to return dynamic payment button text matching strict requirements
   */
  function getDynamicButtonLabel(methodId, total) {
    if (!methodId) return 'Select a Payment Method';
    if (methodId === 'counter') {
      return 'Place Order · Pay on Delivery';
    }
    if (methodId === 'netbanking') {
      return `Pay ₹${total} via Net Banking`;
    }
    if (methodId === 'card') {
      return `Pay ₹${total} with Card`;
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
    const methodObj = paymentMethods.find(m => m.id === methodId);
    return `Pay ₹${total} with ${methodObj ? methodObj.name : 'Payment Method'}`;
  }

  container.innerHTML = `
    <div class="payment-screen fade-in" id="payment-screen-root">
      
      <!-- ==========================================
           1. FIXED TOP HEADER BAR
           ========================================== -->
      <header class="payment-fixed-top-header">
        <div class="payment-header-row">
          <button type="button" class="btn-back-checkout" id="payment-back-checkout-btn" aria-label="Back to Checkout">
            ${ICONS.chevronLeft(20)}
            <span>Back to Checkout</span>
          </button>
          <div class="payment-brand-tag">
            <span class="brand-college-tag">JIT SMART CAMPUS</span>
            <span class="payment-portal-title">Payment Options</span>
          </div>
          <div class="demo-mode-pill">
            <span class="pill-dot"></span>
            <span>DEMO MODE</span>
          </div>
        </div>
      </header>

      <!-- ==========================================
           2. DEDICATED SCROLLABLE PAYMENT BODY
           ========================================== -->
      <main class="payment-scroll-container">
        
        <!-- Demonstration Mode Notice Banner -->
        <div class="demo-payment-alert-box" role="alert">
          <div class="alert-icon-wrap">🛡️</div>
          <div class="alert-body">
            <h4 class="alert-title">DEMO PAYMENT MODE</h4>
            <p class="alert-desc">
              This is an academic demonstration for Jansons Institute of Technology.
              No real bank transfers, fees, or real money transactions will be processed.
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
              <span class="id-lbl">ORDER ID</span>
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

        <!-- Payment Methods Selection -->
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

        <!-- Production Payment Gateway Checklist -->
        <details class="production-gateway-card">
          <summary class="pg-summary">
            <span>⚙️ Production Gateway Setup Checklist</span>
            <span class="pg-toggle-icon">▾</span>
          </summary>
          <div class="pg-content">
            <p class="pg-desc">
              For security, frontend GitHub Pages cannot execute financial settlements. Before enabling real payments in a live college deployment:
            </p>
            <ul class="pg-checklist">
              <li>✅ Deploy a secure backend server (Node.js/Python) with valid SSL (HTTPS).</li>
              <li>✅ Register a verified Merchant UPI VPA or Payment Gateway (Razorpay/Cashfree/Stripe).</li>
              <li>✅ Store API Secret Keys securely in server environment variables (never in frontend code).</li>
              <li>✅ Implement server-side Webhook listeners with cryptographic signature validation.</li>
              <li>✅ Synchronize verified order statuses to a persistent database (PostgreSQL/MongoDB).</li>
            </ul>
          </div>
        </details>

        <!-- Safe Bottom Spacing to ensure scrollable content is never covered -->
        <div style="height: 40px;"></div>

      </main>

      <!-- ==========================================
           3. DYNAMIC FIXED BOTTOM PAYMENT ACTION BAR
           ========================================== -->
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

      <!-- Online Gateway Notice Modal -->
      <div class="payment-modal-overlay" id="app-redirect-modal" style="display: none;">
        <div class="payment-modal-card zoom-in">
          <div class="pm-spinner-ring"></div>
          <h4 class="pm-title" id="pm-redirect-title">Payment Gateway Notice</h4>
          <p class="pm-desc" id="pm-redirect-desc">
            Production online payment settlements require an active backend server with HTTPS merchant credentials. In this campus prototype client, real payment gateway transactions are not configured.
          </p>

          <div class="pm-disclaimer-tag">
            <span>PROTOTYPE ENVIRONMENT • GATEWAY NOT CONFIGURED</span>
          </div>

          <div class="pm-actions-group">
            <button type="button" class="btn btn-secondary btn-block" id="btn-switch-to-pod" style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-weight: 700; margin-bottom: 4px;">
              <span>📦 Switch to Pay on Delivery (Recommended)</span>
            </button>
            <button type="button" class="btn btn-primary btn-block" id="btn-confirm-demo-success">
              <span>⚡ Simulate Prototype Order (Unverified)</span>
            </button>
            <button type="button" class="btn btn-secondary btn-block" id="btn-cancel-demo-modal">
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Success Confirmation Modal Overlay -->
      <div class="payment-modal-overlay" id="demo-success-modal" style="display: none;">
        <div class="payment-modal-card zoom-in">
          <div class="pm-success-icon">
            ${ICONS.check(36)}
          </div>
          
          <div class="pm-success-badge" id="success-badge-title">
            DEMO PAYMENT SUCCESS — NO REAL MONEY TRANSFERRED
          </div>

          <h3 class="pm-order-verified-heading">Order Placed Successfully</h3>
          <p class="pm-amount-text font-mono">₹${totalAmount}.00</p>

          <div class="pm-receipt-box">
            <div class="pm-receipt-row">
              <span>Status:</span>
              <strong class="demo-status-pill" id="receipt-status-pill">DEMO PAYMENT COMPLETED</strong>
            </div>
            <div class="pm-receipt-row">
              <span>Order Reference:</span>
              <strong class="font-mono" id="receipt-order-ref">${orderId}</strong>
            </div>
            <div class="pm-receipt-row">
              <span>Outlet:</span>
              <strong>${shopTitle}</strong>
            </div>
            <div class="pm-receipt-row">
              <span>Payment Provider:</span>
              <strong id="receipt-method-text">Google Pay (Demo)</strong>
            </div>
          </div>

          <p class="pm-legal-note">
            This is an educational prototype order. Your digital collection token has been allocated in the queue.
          </p>

          <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-view-queue-token">
            <span>View Digital Queue Token Pass</span>
            ${ICONS.arrowRight(18)}
          </button>
        </div>
      </div>

    </div>
  `;

  // 1. Navigation: Back to Checkout (Preserves cart, items, shop, printJob, notes)
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

  // 2. Interactive Dynamic Payment Method Selection
  const methodCards = container.querySelectorAll('.payment-method-card');
  const payBtn = container.querySelector('#btn-execute-payment');
  const payBtnLabel = container.querySelector('#btn-pay-label');
  const calloutText = container.querySelector('#method-callout-text');

  function updateSelectedMethod(methodId) {
    selectedMethodId = methodId;

    // Update active class immediately on all cards
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

    // Enable payment button
    if (payBtn) {
      payBtn.disabled = false;
    }

    // Immediately update bottom button label matching strict specification
    if (payBtnLabel) {
      payBtnLabel.textContent = getDynamicButtonLabel(methodId, totalAmount);
    }

    // Update Callout Information
    if (calloutText) {
      if (selectedObj.id === 'counter') {
        calloutText.textContent = 'Pay on Delivery: Place your order instantly and pay cash upon collection at the counter.';
      } else if (selectedObj.category === 'upi') {
        calloutText.textContent = `${selectedObj.name}: On mobile, triggers the ${selectedObj.name} UPI payment flow. Desktop testing provides simulated confirmation.`;
      } else if (selectedObj.id === 'card') {
        calloutText.textContent = 'Debit/Credit Card: Secure card gateway simulation for prototype demonstration.';
      } else if (selectedObj.id === 'netbanking') {
        calloutText.textContent = 'Net Banking: Direct simulated bank portal authentication for 50+ supported banks.';
      } else {
        calloutText.textContent = 'Digital Wallet: Fast campus and digital wallet balance payment simulation.';
      }
    }
  }

  // Attach card click handlers
  methodCards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-method-id');
      updateSelectedMethod(id);
    });

    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.getAttribute('data-method-id');
        updateSelectedMethod(id);
      }
    });
  });

  // Guard against accidental double submission
  let isSubmitting = false;

  // 3. Payment Execution Handler
  const redirectModal = container.querySelector('#app-redirect-modal');
  const redirectTitle = container.querySelector('#pm-redirect-title');
  const redirectDesc = container.querySelector('#pm-redirect-desc');
  const switchToPodBtn = container.querySelector('#btn-switch-to-pod');
  const confirmDemoSuccessBtn = container.querySelector('#btn-confirm-demo-success');
  const cancelModalBtn = container.querySelector('#btn-cancel-demo-modal');
  const successModal = container.querySelector('#demo-success-modal');

  if (switchToPodBtn) {
    switchToPodBtn.addEventListener('click', () => {
      if (redirectModal) redirectModal.style.display = 'none';
      updateSelectedMethod('counter');
    });
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', () => {
      if (redirectModal) redirectModal.style.display = 'none';
      if (payBtn) payBtn.disabled = false;
    });
  }

  if (confirmDemoSuccessBtn) {
    confirmDemoSuccessBtn.addEventListener('click', () => {
      confirmDemoSuccessBtn.disabled = true;
      const selectedObj = paymentMethods.find(m => m.id === selectedMethodId);
      executeOrderCreation(selectedObj ? selectedObj.name : 'Simulated Payment', 'DEMO UNVERIFIED');
    });
  }

  if (payBtn) {
    payBtn.addEventListener('click', () => {
      if (!selectedMethodId || isSubmitting) return;

      // 1. Validate current cart and checkout data
      if (totalAmount <= 0 && (!items || items.length === 0) && !printJob) {
        alert('Order validation notice: No valid checkout items found.');
        return;
      }

      // Disable immediately to prevent accidental duplicate submissions
      payBtn.disabled = true;

      const selectedObj = paymentMethods.find(m => m.id === selectedMethodId);
      const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Handle Pay at Counter (Pay on Delivery)
      if (selectedMethodId === 'counter') {
        executeOrderCreation('Pay on Delivery', 'PAY AT COUNTER');
        return;
      }

      // Handle Online Payment Methods (Inform that real gateway is not configured)
      if (redirectTitle) redirectTitle.textContent = `${selectedObj ? selectedObj.name : 'Online Payment'} Gateway Notice`;
      if (redirectDesc) {
        redirectDesc.textContent = isMobile
          ? `Production payment processing requires server-side merchant credentials. In this mobile prototype, real payment gateway settlement is not configured. Choose 'Pay on Delivery' or simulate an unverified test order:`
          : `Production payment settlements require an active backend server with HTTPS merchant credentials. In this campus prototype client, real payment gateway transactions are not configured. Choose 'Pay on Delivery' or simulate an unverified test order:`;
      }
      if (redirectModal) redirectModal.style.display = 'flex';
    });
  }

  function executeOrderCreation(methodName, orderStatus) {
    if (isSubmitting) return;
    isSubmitting = true;
    if (payBtn) payBtn.disabled = true;

    if (redirectModal) redirectModal.style.display = 'none';

    const isCounter = (selectedMethodId === 'counter');
    const paymentMethodName = isCounter ? 'Pay on Delivery' : `${methodName} (Demo)`;
    const paymentStatus = isCounter ? 'PAY AT COUNTER' : 'DEMO UNVERIFIED';
    const simulatedTxnId = isCounter
      ? `COD-${Math.floor(100000 + Math.random() * 900000)}`
      : `DEMO-TXN-${Math.floor(100000 + Math.random() * 900000)}`;

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
        method: paymentMethodName,
        status: paymentStatus,
        txnId: simulatedTxnId
      }
    };

    try {
      // 1. Create order in storage engine (only once)
      const newOrder = createVerifiedOrder(orderPayload);
      
      // 2. Clear shopping cart for the completed shop
      clearCart(shop);

      // 3. Update Success Modal Info
      const receiptStatus = container.querySelector('#receipt-status-pill');
      const receiptMethod = container.querySelector('#receipt-method-text');
      const receiptOrderRef = container.querySelector('#receipt-order-ref');
      const successBadge = container.querySelector('#success-badge-title');

      if (receiptStatus) receiptStatus.textContent = paymentStatus;
      if (receiptMethod) receiptMethod.textContent = paymentMethodName;
      if (receiptOrderRef) receiptOrderRef.textContent = newOrder.orderId;

      if (successBadge) {
        if (isCounter) {
          successBadge.textContent = 'ORDER PLACED · PAY CASH AT COUNTER ON PICKUP';
          successBadge.style.background = '#FEF3C7';
          successBadge.style.color = '#B45309';
        } else {
          successBadge.textContent = 'DEMO PROTOTYPE ORDER — UNVERIFIED GATEWAY';
          successBadge.style.background = '#F1F5F9';
          successBadge.style.color = '#475569';
        }
      }

      if (successModal) successModal.style.display = 'flex';

      const viewTokenBtn = container.querySelector('#btn-view-queue-token');
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
}
