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

### 5. Shopping Cart & Checkout Review
- Isolated checkout pipelines for Canteen, Stationery, and Printing.
- Quantity steppers, remove item actions, and clear bill summary.
- **Checkout Review:** Destination pickup counter, student register number, special instructions input, and dynamic prominent CTA: `Pay ₹[Total]`.
- **Payment Sheet:** Instant UPI apps, dynamic QR code simulation, and clearly labelled simulation buttons:
  - `[ ✅ Simulate Successful Payment ]` — Validates on server and allocates guaranteed token.
  - `[ ❌ Simulate Failed Payment ]` — Tests decline handling without token generation.
- **Animated Success Screen:** *"Payment Verified! 🎉"* before transitioning to Digital Token.

### 6. Digital Token Display (Boarding Pass Ticket)
- Ticket styling with notch cutouts, dashed perforation line, and high-contrast typography.
- Giant focal collection token number (e.g. `C-024`, `S-010`, `P-005`).
- Telemetry metrics: **Queue Position**, **Orders Ahead**, and **Estimated Wait Time**.
- Vector SVG QR code for counter scanning.
- Direct actions: *Track Live Queue Timeline*, *All Orders*, and *Back to Home*.

### 7. Order Tracking Timeline
- Vertical progression timeline: *Confirmed ➔ Preparing/Processing/Printing ➔ Ready for Collection ➔ Completed*.
- Auto-sync polling every 2.5 seconds.
- **Web Audio API Chime:** Plays a chime when staff marks the order *"Ready for Collection!"*.

### 8. Staff & Admin Desks
- **Canteen Staff:** Live kitchen queue sorted by sequence (*Start Preparing ➔ Mark Ready ➔ Complete Handover*).
- **Stationery Staff:** Store packing queue (*Start Packing ➔ Mark Ready ➔ Complete*).
- **Printing Staff:** Reprographics queue showing full document specifications (Total Pages, B&W/Color, Copies, Range) (*Start Laser Print ➔ Mark Ready ➔ Collected*).
- **Campus Admin:** Edit product prices, toggle stock availability, configure B&W and Colour rates per page, and inspect total revenue and active tokens.

---

## 🔑 Demo Accounts

| Role | Name | Register Number | DOB / Password |
|---|---|---|---|
| **Student** | Rahul Sharma | `21CS042` | `2003-05-14` |
| **Student** | Priya Patel | `21EC015` | `2004-08-22` |
| **Canteen Staff** | Chef Murugan | `STAFF-CANTEEN` | One-tap |
| **Stationery Staff** | Ramesh Kumar | `STAFF-STATIONERY` | One-tap |
| **Printing Staff** | Karthik Raja | `STAFF-PRINTING` | One-tap |
| **Campus Admin** | Dr. S. Sundararajan | `ADMIN-001` | One-tap |

---

## 🚀 Running the Application

The application runs with zero external npm dependencies:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Access in your browser at:
```
http://localhost:5500/
```
