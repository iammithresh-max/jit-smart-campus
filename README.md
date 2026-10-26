# JIT SMART CAMPUS
### Mobile-First Canteen & Stationery Crowd Management System
**Jansons Institute of Technology (JIT)**

---

## 🌟 Overview & Design Transformation

**JIT SMART CAMPUS** has been redesigned as a consumer-grade mobile super-app combining the aesthetic quality of leading food delivery applications with the speed and usability of modern campus portals.

### 🎨 Design System & Visual Identity

| Token | Specification | Hex / Value | Usage |
|---|---|---|---|
| **Primary** | Deep Midnight Navy | `#0A0F1D` / `#151D30` | Core headers, primary action CTAs, deep contrast elements |
| **Secondary** | Electric Violet | `#6366F1` / `#4F46E5` | Active indicators, focus rings, interactive brand highlights |
| **Secondary Light** | Soft Iris Tint | `#EEF2FF` | Selection pills, active category chips, subtle badges |
| **Accent** | Emerald Green | `#10B981` / `#059669` | Success confirmations, "Low Crowd" telemetry, verified orders |
| **Background** | Warm Off-White | `#F8FAFC` | Primary app screen backdrop |
| **Surface** | Pure White | `#FFFFFF` | Cards, product tiles, bottom sheet surfaces |
| **Warning** | Soft Amber | `#F59E0B` | "Moderate Crowd" telemetry, pending notifications |
| **Error** | Clear Red | `#EF4444` | "High Crowd" telemetry, out of stock indicators |
| **Typography** | Modern Sans | `Plus Jakarta Sans` | Tight tracking headings (`-0.02em`), comfortable body leading |
| **Monospace** | Clean Technical | `JetBrains Mono` | Queue tokens, order IDs, register numbers, amounts |
| **Icons** | Unified Vector SVGs | `24x24 viewBox, 2px stroke` | Uniform, crisp Feather-style SVGs replacing mixed emojis |

---

## 📱 Mobile Screen Redesigns

### 1. Mobile Home Dashboard
- **Compact Header:** College wordmark badge (`JIT SMART CAMPUS`), student register number pill (`21CS042`), quick shopping cart badge, and student avatar.
- **Modern Hero:** *"Your Campus, Without the Queue. Order ahead. Save time. Get back to what matters."* with a subtle, abstract geometry accent.
- **Dynamic Activity Island:** Real-time floating banner displaying active in-flight tokens and order progression at a glance.
- **Quick Action Pills:** Rapid one-tap shortcuts for *Print PDF*, *Track Order*, *My Tokens*, and *Staff Desk*.
- **Asymmetric Service Showcases (Non-Repetitive):**
  - **JIT Canteen:** Appetite-inducing food photography banner, live crowd status badge (*"Low crowd • 4-6 min wait"*), popular category chips (*Ghee Dosa, Thali Meals, Filter Coffee*), and *Explore Canteen Menu →* CTA.
  - **JIT Stationery:** Academic store aesthetic with live crowd badge, product categories, and *Explore Stationery Supplies →* CTA.
  - **Printing Spotlight:** High-contrast blue gradient callout (*"Need a printout? Upload your PDF and get it ready for collection"*) with *Upload PDF →* CTA.

### 2. JIT Canteen Browsing Experience
- Instant search bar with clear button.
- Horizontally scrollable category chips (*All, Breakfast, Meals, Snacks, Fast Food, Desserts, Beverages*).
- Dietary filters: *All*, *Pure Veg* (FSSAI green square/dot), and *Non-Veg* (FSSAI red square/dot).
- **Food Product Cards:** 2-column balanced grid with food photography, dish names, prep times (`⏱️ 5-8 mins`), star ratings, bold prices in ₹INR, strike-through original prices, discount badges, and modern floating `ADD +` buttons that transform seamlessly into `- [qty] +` steppers.
- **Floating Cart Summary Bar:** Floating pill (`X ITEMS • ₹TOTAL [View Cart →]`) with zero overlap over bottom navigation.

### 3. JIT Stationery Store
- Categories: *Pens, Pencils, Notebooks, Record Books, Files, Art Supplies*.
- Stock validation (prevents ordering when out of stock with *NO STOCK* pill).
- Product cards with unit prices and quantity steppers.
- Integrated quick access to document printing.

### 4. Step-by-Step PDF Printing
- **Step 1: Upload Document:** Drag & drop / browse with PDF validation and automatic client-side page count extraction.
- **Step 2: Print Settings:** Touch-friendly segmented controls for *Black & White* (₹1.00/pg) vs *Colour* (₹5.00/pg), *Single-Sided* vs *Double-Sided (Duplex)*, *All Pages* vs *Custom Range* (e.g., `1-5, 8, 12`), and *Copies* stepper.
- **Step 3: Price Summary:** Transparent pricing table recalculating automatically.
- **Step 4: Continue:** Direct handoff to checkout review.

### 5. Shopping Cart & Dedicated Checkout
- Unified cart and checkout experience across Canteen, Stationery, and Printing services.
- Real-time order calculation in ₹ INR; server-side price and availability validation.
- **Pay on Delivery (POD) - Dedicated Workflow:**
  - Token generated immediately upon checkout.
  - Initial Payment Status: `NOT PAID` (`NOT PAID — Pay at the shop`).
  - Clear guidance: *"Order placed successfully! Please pay at the shop when collecting your order."*
  - Authorized physical payment collection by staff required before marking `PAID`.
- **Online Payment Gateways:**
  - Dynamic button reflecting selected method and exact order total (e.g., `Pay ₹120 with Google Pay`, `Pay ₹120 with PhonePe`, `Pay ₹120 by Card`, `Place Order · Pay on Delivery`).
  - Configured UPI ID: `iammithresh@oksbi` (unverified configuration value pending bank merchant onboarding).
  - Explicit outcomes: Success, Failed, Cancelled, Pending, Unknown/Network Error.
  - **Zero QR Codes:** QR codes are strictly prohibited and eliminated across all flows.

### 6. Digital Token & Queue Display
- Clean boarding pass design with high-contrast typography.
- Prominent collection token number (e.g. `C-024`, `S-010`, `P-005`).
- Dynamic payment verification badge (`PAID — Verified ✓` vs `NOT PAID — Pay at shop`).
- Queue position and estimated wait time based on actual in-flight orders.
- Direct navigation: *Track Live Queue*, *My Orders*, and *Back to Home*.

### 7. Staff & Shop Owner Desks
- **Dedicated Worker Portal (`#worker-login`):**
  - Unique Employee IDs (`JIT-W001` through `JIT-W005`).
  - Strict shop-level data isolation.
  - Physical Cash Collection Modal with order verification, collected amount, and audit logging.
- **Dedicated Shop Owner Portal (`#owner-login`):**
  - Unique Owner IDs (`JIT-O001`, `JIT-O002`).
  - Real-time shop order monitoring and cash collection history (staff ID, amount, timestamp).
  - Product catalog, prices, and stock toggle.
  - Worker permission management (grant/revoke cash collection privilege).

---

## 🔑 Authorized Credentials & Accounts

### 🎓 Authorized Student Accounts (Reg No + DOB Only)
*No student name is ever asked on the login page; DOB is strictly validated and never stored in client localStorage.*

| Student Name | Register Number | Date of Birth | Department | Year |
|---|---|---|---|---|
| **Mithresh Kanna S** | `711125104066` | `2007-10-18` | Computer Science | 1st Year (B.E.) |
| **MuthuChellaKumar** | `711125104069` | `2008-01-17` | Electronics & Comm. | 1st Year (B.E.) |
| **Udhaya K** | `711125104114` | `2007-05-08` | Mechanical Engg. | 1st Year (B.E.) |

### 👷 Authorized Demo Workers (`#worker-login`)
*Employee ID + Security PIN (Default demo PIN: `demo123`)*

| Employee ID | Name | Plausible DOB | Assigned Shop | Can Collect Cash |
|---|---|---|---|---|
| **JIT-W001** | Anitha M | `1989-04-12` | JIT Canteen | ✅ Yes |
| **JIT-W002** | Senthil Kumar | `1993-08-25` | JIT Canteen | ✅ Yes |
| **JIT-W003** | Ramesh Kumar | `1988-06-15` | JIT Stationery | ✅ Yes |
| **JIT-W004** | Deepa R | `1995-11-03` | JIT Stationery | ❌ No (Owner Managed) |
| **JIT-W005** | Karthik Raja | `1992-02-18` | Printing Service | ✅ Yes |

### 👔 Authorized Shop Owners (`#owner-login`)
*Owner ID + Security PIN (Default demo PIN: `owner123`)*

| Owner ID | Name | Authorized Shop(s) | Role |
|---|---|---|---|
| **JIT-O001** | Sundararajan S | JIT Canteen | SHOP_OWNER |
| **JIT-O002** | Meenakshi Sundaram | JIT Stationery, Printing Service | SHOP_OWNER |

---

## 🚀 Running the Application

### Option A: Local Development & Verification (Zero Dependencies)
Runs with native PowerShell HTTP + REST API Server:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Open in browser:
- Main Web Application: `http://localhost:5500/`
- Full Automated Test Suite: `http://localhost:5500/test_verification.html`

### Option B: Turnkey Node.js / Express Production Backend
```bash
cd server
npm install
npm start
```
Default port: `http://localhost:5000` (configurable via `.env`).

### Option C: GitHub Pages Deployment
The frontend is statically self-contained and deploys directly to GitHub Pages. It connects automatically to the configured backend API or uses safe client validation when offline.

---

## 🧪 Automated Test Suite

To run the automated verification test harness against headless Edge:
```powershell
powershell -ExecutionPolicy Bypass -File .\run_tests.ps1
```
The test suite validates:
1. Student login (Reg No + DOB only, no student name input, DOB stripped from session).
2. Worker login (Employee ID + PIN, 5 demo worker profiles, shop isolation).
3. Owner login & RBAC isolation (Owner ID + PIN, owner dashboard, student access blocked).
4. Pay on Delivery separate workflow (`PLACED`, `NOT PAID`, immediate token, prompt).
5. Physical cash collection (authorized worker confirmation, receipt timestamp, staff ID, duplicate prevention).
6. Dynamic payment button labels and strictly zero QR codes.
7. Profile and My Orders navigation, filtering, and persistence.
8. Owner worker permission toggle.
