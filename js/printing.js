/**
 * JIT SMART CAMPUS - Redesigned Mobile PDF Printing Experience
 * Clean, step-by-step progressive disclosure flow for PDF upload, print settings, and live billing.
 */

import { getPrintRates, getCartState, saveCartState } from './storage.js';
import { ICONS } from './icons.js';

let uploadedFileState = null;
let printOptions = {
  type: 'blackAndWhite',
  sides: 'single',
  paperSize: 'A4',
  copies: 1,
  pageMode: 'all',
  pageRangeStr: '',
  selectedPagesCount: 1
};

export function renderPrintingScreen(container, navigateTo) {
  const rates = getPrintRates();

  container.innerHTML = `
    <div class="printing-screen fade-in">
      
      <!-- Screen Header -->
      <div class="screen-header-bar sticky-top">
        <button type="button" class="icon-nav-btn" id="printing-back-btn" aria-label="Back">
          ${ICONS.chevronLeft(20)}
        </button>
        <div class="screen-header-title-box">
          <h2 class="screen-title">PRINT A DOCUMENT</h2>
          <span class="screen-badge">CAMPUS REPROGRAPHICS</span>
        </div>
        <div style="width: 40px;"></div>
      </div>

      <div class="printing-content-body">
        
        <!-- STEP 1: UPLOAD DOCUMENT -->
        <div class="print-card">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="step-num-badge">1</span>
            <div>
              <h3 class="card-heading">Select PDF Document</h3>
              <p class="card-subhead">Max file size: ${rates.maxFileSizeMB}MB • PDF format only</p>
            </div>
          </div>

          <input 
            type="file" 
            id="pdf-file-native-input" 
            accept="application/pdf,.pdf" 
            style="display: none;" 
          />

          <!-- Dropzone -->
          <div class="upload-dropzone" id="pdf-upload-dropzone">
            <div class="dropzone-icon-box">
              ${ICONS.upload(36)}
            </div>
            <h4 class="dropzone-prompt">Tap to Upload Assignment PDF</h4>
            <p class="dropzone-hint">Supports Android file manager & local files</p>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-browse-pdf" style="margin-top: 6px;">
              Choose File
            </button>
          </div>

          <!-- Progress Indicator -->
          <div class="upload-progress-box" id="upload-progress-box" style="display: none;">
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" id="upload-progress-fill" style="width: 60%;"></div>
            </div>
            <span class="progress-label">Verifying PDF structure and extracting page count...</span>
          </div>

          <!-- Uploaded File Card -->
          <div class="uploaded-file-details-card" id="uploaded-file-card" style="display: none;">
            <div class="file-icon-badge">
              ${ICONS.filePdf(20)}
            </div>
            <div style="flex: 1; overflow: hidden;">
              <span class="file-name" id="display-file-name">assignment.pdf</span>
              <div class="file-tags-row">
                <span id="display-file-size">1.2 MB</span> • 
                <strong id="display-file-pages" style="color: var(--secondary-violet);">14 Pages</strong>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="icon-nav-btn" id="btn-replace-pdf" title="Replace file" style="width: 32px; height: 32px;">
                🔄
              </button>
              <button type="button" class="icon-nav-btn" id="btn-remove-pdf" title="Remove file" style="width: 32px; height: 32px; color: var(--error-red);">
                ${ICONS.trash(15)}
              </button>
            </div>
          </div>

          <div class="print-error-banner" id="pdf-error-banner" style="display: none;">
            <span>⚠️</span>
            <span id="pdf-error-msg"></span>
          </div>
        </div>

        <!-- STEP 2: PRINT SETTINGS -->
        <div class="print-card" id="print-config-section">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="step-num-badge">2</span>
            <div>
              <h3 class="card-heading">Print Settings</h3>
              <p class="card-subhead">Configure color, sides, and copies</p>
            </div>
          </div>

          <!-- Color Mode -->
          <div class="setting-row">
            <label class="setting-title">Color Mode</label>
            <div class="segmented-control">
              <button type="button" class="segment-btn ${printOptions.type === 'blackAndWhite' ? 'active' : ''}" data-type="blackAndWhite">
                <span>Black & White</span>
                <span style="font-size: 10px; color: var(--text-muted);">₹${rates.blackAndWhite.toFixed(2)}/pg</span>
              </button>
              <button type="button" class="segment-btn ${printOptions.type === 'colour' ? 'active' : ''}" data-type="colour">
                <span>Full Colour</span>
                <span style="font-size: 10px; color: var(--text-muted);">₹${rates.colour.toFixed(2)}/pg</span>
              </button>
            </div>
          </div>

          <!-- Sides -->
          <div class="setting-row">
            <label class="setting-title">Print Sides</label>
            <div class="segmented-control">
              <button type="button" class="segment-btn ${printOptions.sides === 'single' ? 'active' : ''}" data-sides="single">
                Single-Sided
              </button>
              <button type="button" class="segment-btn ${printOptions.sides === 'double' ? 'active' : ''}" data-sides="double">
                Double-Sided (Duplex)
              </button>
            </div>
          </div>

          <!-- Page Selection -->
          <div class="setting-row">
            <label class="setting-title">Pages to Print</label>
            <div class="segmented-control">
              <button type="button" class="segment-btn ${printOptions.pageMode === 'all' ? 'active' : ''}" data-pagemode="all">
                All Pages
              </button>
              <button type="button" class="segment-btn ${printOptions.pageMode === 'custom' ? 'active' : ''}" data-pagemode="custom">
                Custom Range
              </button>
            </div>
          </div>

          <!-- Custom Range Input -->
          <div class="custom-range-input-box" id="custom-range-box" style="${printOptions.pageMode === 'custom' ? 'display: block;' : 'display: none;'}">
            <label for="pdf-range-input" style="font-size: 11px; font-weight: 700; color: var(--primary-navy);">Specify Pages (e.g. 1-5, 8, 12):</label>
            <input 
              type="text" 
              id="pdf-range-input" 
              class="form-input" 
              placeholder="e.g. 1-5, 8, 12" 
              value="${printOptions.pageRangeStr}" 
              style="min-height: 40px; padding: 6px 12px;"
            />
            <span id="range-feedback-msg" style="font-size: 10px; color: var(--text-muted); margin-top: 2px; display: block;">Range validated against total pages.</span>
          </div>

          <!-- Total Pages & Copies Row -->
          <div class="setting-row page-stepper-row">
            <div>
              <label class="setting-title">Pages Selected</label>
              <span style="font-size: 10px; color: var(--text-muted); display: block;">Per printed copy</span>
            </div>
            <div class="qty-stepper">
              <button type="button" class="stepper-btn" id="btn-dec-pages">−</button>
              <span class="stepper-val" id="display-selected-pages">${printOptions.selectedPagesCount}</span>
              <button type="button" class="stepper-btn" id="btn-inc-pages">+</button>
            </div>
          </div>

          <div class="setting-row page-stepper-row">
            <div>
              <label class="setting-title">Number of Copies</label>
              <span style="font-size: 10px; color: var(--text-muted); display: block;">Total sets</span>
            </div>
            <div class="qty-stepper">
              <button type="button" class="stepper-btn" id="btn-dec-copies">−</button>
              <span class="stepper-val" id="display-copies-count">${printOptions.copies}</span>
              <button type="button" class="stepper-btn" id="btn-inc-copies">+</button>
            </div>
          </div>
        </div>

        <!-- STEP 3: PRICE SUMMARY & CONTINUE -->
        <div class="print-card">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h4 class="card-heading">Price Summary</h4>
            <span style="font-size: 11px; font-weight: 700; color: var(--accent-green-dark);">A4 Standard Paper</span>
          </div>

          <div class="breakdown-table">
            <div class="breakdown-row">
              <span>Rate per Page</span>
              <span id="b-rate-text">₹1.00</span>
            </div>
            <div class="breakdown-row">
              <span>Total Sheets</span>
              <span id="b-sheets-text">1 sheet</span>
            </div>
            <div class="breakdown-divider"></div>
            <div class="breakdown-row total-row">
              <span>Total Price</span>
              <span class="total-val" id="b-total-text">₹1.00</span>
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-proceed-print-checkout">
            <span>Continue to Checkout</span>
            ${ICONS.arrowRight(18)}
          </button>
        </div>

      </div>
    </div>
  `;

  // Attach Navigation Listeners
  const backBtn = container.querySelector('#printing-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('home'));

  // File Upload Handlers
  const nativeInput = container.querySelector('#pdf-file-native-input');
  const dropzone = container.querySelector('#pdf-upload-dropzone');
  const browseBtn = container.querySelector('#btn-browse-pdf');
  const replaceBtn = container.querySelector('#btn-replace-pdf');
  const removeBtn = container.querySelector('#btn-remove-pdf');

  browseBtn.addEventListener('click', () => nativeInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) nativeInput.click();
  });

  if (replaceBtn) replaceBtn.addEventListener('click', () => nativeInput.click());
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      uploadedFileState = null;
      printOptions.selectedPagesCount = 1;
      updateUploadUI(container);
      updateCostCalculations(container);
    });
  }

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0], container);
    }
  });

  nativeInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0], container);
    }
  });

  // Segment Buttons (Color Mode)
  container.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      printOptions.type = btn.getAttribute('data-type');
      updateCostCalculations(container);
    });
  });

  // Segment Buttons (Sides)
  container.querySelectorAll('[data-sides]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-sides]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      printOptions.sides = btn.getAttribute('data-sides');
      updateCostCalculations(container);
    });
  });

  // Segment Buttons (Page Mode)
  container.querySelectorAll('[data-pagemode]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-pagemode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      printOptions.pageMode = btn.getAttribute('data-pagemode');
      const customBox = container.querySelector('#custom-range-box');
      if (printOptions.pageMode === 'custom') {
        customBox.style.display = 'block';
        evaluatePageRange(container);
      } else {
        customBox.style.display = 'none';
        if (uploadedFileState && uploadedFileState.pageCount) {
          printOptions.selectedPagesCount = uploadedFileState.pageCount;
        }
      }
      updateCostCalculations(container);
    });
  });

  const rangeInput = container.querySelector('#pdf-range-input');
  rangeInput.addEventListener('input', (e) => {
    printOptions.pageRangeStr = e.target.value;
    evaluatePageRange(container);
    updateCostCalculations(container);
  });

  container.querySelector('#btn-dec-pages').addEventListener('click', () => {
    if (printOptions.selectedPagesCount > 1) {
      printOptions.selectedPagesCount--;
      updateCostCalculations(container);
    }
  });
  container.querySelector('#btn-inc-pages').addEventListener('click', () => {
    printOptions.selectedPagesCount++;
    updateCostCalculations(container);
  });

  container.querySelector('#btn-dec-copies').addEventListener('click', () => {
    if (printOptions.copies > 1) {
      printOptions.copies--;
      updateCostCalculations(container);
    }
  });
  container.querySelector('#btn-inc-copies').addEventListener('click', () => {
    printOptions.copies++;
    updateCostCalculations(container);
  });

  // Proceed Button
  container.querySelector('#btn-proceed-print-checkout').addEventListener('click', () => {
    if (!uploadedFileState) {
      alert('Please select a PDF document first.');
      return;
    }

    const rates = getPrintRates();
    const ratePerPage = printOptions.type === 'colour' ? rates.colour : rates.blackAndWhite;
    const totalAmount = Math.ceil(printOptions.selectedPagesCount * ratePerPage * printOptions.copies);

    const cart = getCartState();
    cart.activeShop = 'printing';
    cart.printJob = {
      id: `print_${Date.now()}`,
      shop: 'printing',
      fileName: uploadedFileState.name,
      fileSizeStr: uploadedFileState.sizeStr,
      totalDocumentPages: uploadedFileState.pageCount,
      type: printOptions.type,
      sides: printOptions.sides,
      paperSize: printOptions.paperSize,
      copies: printOptions.copies,
      pageMode: printOptions.pageMode,
      pageRange: printOptions.pageRangeStr,
      pagesToPrint: printOptions.selectedPagesCount,
      ratePerPage: ratePerPage,
      totalAmount: totalAmount
    };
    saveCartState(cart);

    navigateTo('cart', { shop: 'printing' });
  });

  updateUploadUI(container);
  updateCostCalculations(container);
}

async function processSelectedFile(file, container) {
  const errorBanner = container.querySelector('#pdf-error-banner');
  const errorMsg = container.querySelector('#pdf-error-msg');
  const progressBox = container.querySelector('#upload-progress-box');
  const rates = getPrintRates();

  errorBanner.style.display = 'none';

  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  if (!isPdf) {
    errorMsg.textContent = 'Please choose a valid PDF (.pdf) file.';
    errorBanner.style.display = 'flex';
    return;
  }

  const maxBytes = rates.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    errorMsg.textContent = `File size exceeds the ${rates.maxFileSizeMB}MB limit.`;
    errorBanner.style.display = 'flex';
    return;
  }

  progressBox.style.display = 'block';

  try {
    const pageCount = await extractPdfPageCount(file);
    const sizeStr = formatBytes(file.size);

    uploadedFileState = {
      name: file.name,
      size: file.size,
      sizeStr,
      pageCount: Math.max(1, pageCount),
      lastModified: file.lastModified
    };

    printOptions.selectedPagesCount = uploadedFileState.pageCount;
    progressBox.style.display = 'none';
    updateUploadUI(container);
    updateCostCalculations(container);
  } catch (err) {
    progressBox.style.display = 'none';
    const sizeStr = formatBytes(file.size);
    uploadedFileState = {
      name: file.name,
      size: file.size,
      sizeStr,
      pageCount: 1,
      lastModified: file.lastModified
    };
    printOptions.selectedPagesCount = 1;
    updateUploadUI(container);
    updateCostCalculations(container);
  }
}

function extractPdfPageCount(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const regex = /\/Type\s*\/Page\b/g;
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          resolve(matches.length);
          return;
        }

        const countMatch = text.match(/\/Count\s+(\d+)/);
        if (countMatch && parseInt(countMatch[1], 10) > 0) {
          resolve(parseInt(countMatch[1], 10));
          return;
        }

        resolve(1);
      } catch (err) {
        resolve(1);
      }
    };
    reader.onerror = () => resolve(1);
    reader.readAsBinaryString(file);
  });
}

function evaluatePageRange(container) {
  const rangeStr = (printOptions.pageRangeStr || '').trim();
  const feedback = container.querySelector('#range-feedback-msg');
  const totalDocPages = uploadedFileState ? uploadedFileState.pageCount : 100;

  if (!rangeStr) {
    if (feedback) feedback.textContent = 'Enter page ranges, e.g. 1-5, 8';
    return;
  }

  try {
    const pagesSet = new Set();
    const parts = rangeStr.split(',');

    for (const part of parts) {
      const clean = part.trim();
      if (!clean) continue;

      if (clean.includes('-')) {
        const [startStr, endStr] = clean.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
          for (let p = start; p <= Math.min(end, totalDocPages); p++) {
            pagesSet.add(p);
          }
        }
      } else {
        const single = parseInt(clean, 10);
        if (!isNaN(single) && single > 0 && single <= totalDocPages) {
          pagesSet.add(single);
        }
      }
    }

    if (pagesSet.size > 0) {
      printOptions.selectedPagesCount = pagesSet.size;
      if (feedback) feedback.textContent = `Valid range: ${pagesSet.size} pages selected`;
    } else {
      if (feedback) feedback.textContent = `Range must be within 1 to ${totalDocPages}`;
    }
  } catch (e) {
    if (feedback) feedback.textContent = 'Use numbers, dashes, and commas (e.g. 1-4, 7)';
  }
}

function updateUploadUI(container) {
  const dropzone = container.querySelector('#pdf-upload-dropzone');
  const fileCard = container.querySelector('#uploaded-file-card');
  const nameEl = container.querySelector('#display-file-name');
  const sizeEl = container.querySelector('#display-file-size');
  const pagesEl = container.querySelector('#display-file-pages');

  if (uploadedFileState) {
    dropzone.style.display = 'none';
    fileCard.style.display = 'flex';
    nameEl.textContent = uploadedFileState.name;
    sizeEl.textContent = uploadedFileState.sizeStr;
    pagesEl.textContent = `${uploadedFileState.pageCount} ${uploadedFileState.pageCount === 1 ? 'Page' : 'Pages'}`;
  } else {
    dropzone.style.display = 'flex';
    fileCard.style.display = 'none';
  }
}

function updateCostCalculations(container) {
  const rates = getPrintRates();
  const ratePerPage = printOptions.type === 'colour' ? rates.colour : rates.blackAndWhite;
  const pages = Math.max(1, printOptions.selectedPagesCount);
  const copies = Math.max(1, printOptions.copies);
  const totalCost = Math.ceil(pages * ratePerPage * copies);

  const dispPages = container.querySelector('#display-selected-pages');
  const dispCopies = container.querySelector('#display-copies-count');
  if (dispPages) dispPages.textContent = pages;
  if (dispCopies) dispCopies.textContent = copies;

  const rateText = container.querySelector('#b-rate-text');
  const sheetsText = container.querySelector('#b-sheets-text');
  const totalText = container.querySelector('#b-total-text');

  if (rateText) rateText.textContent = `₹${ratePerPage.toFixed(2)}`;
  if (sheetsText) sheetsText.textContent = `${pages * copies} sheets (${pages} pgs × ${copies} sets)`;
  if (totalText) totalText.textContent = `₹${totalCost}.00`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
