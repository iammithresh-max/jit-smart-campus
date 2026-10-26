/**
 * JIT SMART CAMPUS - Initial Seed Data & Configurations
 * Food items, Stationery inventory, Print rates, and Demo Accounts
 */

export const APP_CONFIG = {
  merchantUpiId: 'iammithresh@oksbi', // Treated as UNVERIFIED configuration value until bank/merchant API authorization
  merchantName: 'JIT Smart Campus Concessions',
  paymentGatewayProvider: 'Razorpay / Cashfree / NPCI UPI',
  isMerchantVerified: false, // Production gateway requires merchant onboarding
  qrCodesEnabled: false // STRICT: No QR codes anywhere
};

// 1. Authorized Demonstration Student Records
export const DEMO_STUDENT_ACCOUNTS = [
  {
    role: 'STUDENT',
    regNo: '711125104066',
    name: 'Mithresh Kanna S',
    department: 'Computer Science & Engineering',
    year: '1st Year (B.E.)',
    phone: '+91 98765 43210',
    dob: '2007-11-04',
    avatar: '👨‍🎓',
    isDemo: true
  },
  {
    role: 'STUDENT',
    regNo: '711125104069',
    name: 'MuthuChellaKumar',
    department: 'Electronics & Communication',
    year: '1st Year (B.E.)',
    phone: '+91 98451 23456',
    dob: '2008-01-17',
    avatar: '👨‍🎓',
    isDemo: true
  },
  {
    role: 'STUDENT',
    regNo: '711125104114',
    name: 'Udhaya K',
    department: 'Mechanical Engineering',
    year: '1st Year (B.E.)',
    phone: '+91 97890 65432',
    dob: '2007-05-08',
    avatar: '👨‍🎓',
    isDemo: true
  }
];

// 2. Fictional Demo Worker Accounts (5 Workers with plausible adult DOBs and assigned shops)
export const DEMO_WORKER_ACCOUNTS = [
  {
    role: 'WORKER',
    empId: 'JIT-W001',
    name: 'Anitha M',
    dob: '1989-04-12', // Plausible adult DOB
    assignedShop: 'canteen',
    canCollectPayment: true,
    status: 'ACTIVE',
    phone: '+91 94432 11001',
    avatar: '👩‍🍳',
    pin: 'demo123',
    isDemo: true
  },
  {
    role: 'WORKER',
    empId: 'JIT-W002',
    name: 'Senthil Kumar',
    dob: '1993-08-25', // Plausible adult DOB
    assignedShop: 'canteen',
    canCollectPayment: true,
    status: 'ACTIVE',
    phone: '+91 94432 11002',
    avatar: '👨‍🍳',
    pin: 'demo123',
    isDemo: true
  },
  {
    role: 'WORKER',
    empId: 'JIT-W003',
    name: 'Ramesh Kumar',
    dob: '1988-06-15', // Plausible adult DOB
    assignedShop: 'stationery',
    canCollectPayment: true,
    status: 'ACTIVE',
    phone: '+91 94432 11003',
    avatar: '📚',
    pin: 'demo123',
    isDemo: true
  },
  {
    role: 'WORKER',
    empId: 'JIT-W004',
    name: 'Deepa S',
    dob: '1995-11-03', // Plausible adult DOB
    assignedShop: 'stationery',
    canCollectPayment: false, // Permission test: cannot collect cash until authorized
    status: 'ACTIVE',
    phone: '+91 94432 11004',
    avatar: '👩‍💼',
    pin: 'demo123',
    isDemo: true
  },
  {
    role: 'WORKER',
    empId: 'JIT-W005',
    name: 'Karthik Raja',
    dob: '1992-02-18', // Plausible adult DOB
    assignedShop: 'printing',
    canCollectPayment: true,
    status: 'ACTIVE',
    phone: '+91 94432 11005',
    avatar: '🖨️',
    pin: 'demo123',
    isDemo: true
  }
];

// 3. Fictional Demo Shop Owner Accounts
export const DEMO_OWNER_ACCOUNTS = [
  {
    role: 'SHOP_OWNER',
    ownerId: 'JIT-O001',
    name: 'Thiru. K. Rajendran',
    assignedShops: ['canteen'],
    status: 'ACTIVE',
    phone: '+91 98421 99001',
    avatar: '👔',
    pin: 'owner123',
    isDemo: true
  },
  {
    role: 'SHOP_OWNER',
    ownerId: 'JIT-O002',
    name: 'Tmt. Lakshmi Narayanan',
    assignedShops: ['stationery', 'printing'],
    status: 'ACTIVE',
    phone: '+91 98421 99002',
    avatar: '👩‍💼',
    pin: 'owner123',
    isDemo: true
  }
];

// 4. Campus System Admin Account
export const DEMO_ADMIN_ACCOUNT = {
  role: 'SYSTEM_ADMIN',
  adminId: 'ADMIN-001',
  name: 'Dr. S. Sundararajan',
  department: 'Campus Administration',
  phone: '+91 94432 99887',
  avatar: '⚙️',
  pin: 'admin123',
  isDemo: true
};

// Unified export for backward compatibility
export const DEMO_ACCOUNTS = [
  ...DEMO_STUDENT_ACCOUNTS.map(s => ({ ...s, role: 'student' })),
  {
    role: 'canteen_staff',
    regNo: 'JIT-W001',
    name: 'Anitha M (Canteen)',
    department: 'JIT Canteen Operations',
    phone: '+91 94432 11001',
    dob: '1989-04-12',
    avatar: '👩‍🍳',
    empId: 'JIT-W001',
    assignedShop: 'canteen'
  },
  {
    role: 'stationery_staff',
    regNo: 'JIT-W003',
    name: 'Ramesh Kumar (Stationery)',
    department: 'JIT Stationery Store',
    phone: '+91 94432 11003',
    dob: '1988-06-15',
    avatar: '📚',
    empId: 'JIT-W003',
    assignedShop: 'stationery'
  },
  {
    role: 'printing_staff',
    regNo: 'JIT-W005',
    name: 'Karthik Raja (Printing)',
    department: 'JIT Reprographics & Printing',
    phone: '+91 94432 11005',
    dob: '1992-02-18',
    avatar: '🖨️',
    empId: 'JIT-W005',
    assignedShop: 'printing'
  },
  {
    role: 'admin',
    regNo: 'ADMIN-001',
    name: 'Dr. S. Sundararajan',
    department: 'Campus Administration',
    phone: '+91 94432 99887',
    dob: '1975-04-10',
    avatar: '⚙️',
    adminId: 'ADMIN-001'
  }
];

export const INITIAL_CANTEEN_MENU = [
  {
    id: 'food_1',
    name: 'Crispy Ghee Podi Dosa',
    category: 'Breakfast',
    price: 45,
    originalPrice: 55,
    discount: '18% OFF',
    isVeg: true,
    available: true,
    prepTime: '5-8 mins',
    rating: 4.8,
    ordersCount: 340,
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=80',
    description: 'Crispy golden crepe roasted in pure ghee, spiced with gunpowder (podi), served with coconut chutney & piping hot sambar.'
  },
  {
    id: 'food_2',
    name: 'Medu Vada with Sambar (2 pcs)',
    category: 'Breakfast',
    price: 30,
    originalPrice: 35,
    discount: '14% OFF',
    isVeg: true,
    available: true,
    prepTime: '3-5 mins',
    rating: 4.7,
    ordersCount: 520,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
    description: 'Crispy lentil donuts freshly fried, dipped in aromatic vegetable sambar and accompanied by fresh coriander chutney.'
  },
  {
    id: 'food_3',
    name: 'Hot Ghee Ven Pongal',
    category: 'Breakfast',
    price: 40,
    originalPrice: null,
    discount: null,
    isVeg: true,
    available: true,
    prepTime: '3-5 mins',
    rating: 4.9,
    ordersCount: 290,
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=80',
    description: 'Traditional pepper and cumin tempered rice & moong dal porridge laced with roasted cashews and pure melted ghee.'
  },
  {
    id: 'food_4',
    name: 'Steamed Idli Sambar (2 pcs)',
    category: 'Breakfast',
    price: 25,
    originalPrice: null,
    discount: null,
    isVeg: true,
    available: true,
    prepTime: '2-4 mins',
    rating: 4.6,
    ordersCount: 480,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
    description: 'Pillowy soft fermented rice cakes served with homemade drumstick sambar and roasted chana dal chutney.'
  },
  {
    id: 'food_5',
    name: 'JIT Special South Indian Thali',
    category: 'Meals',
    price: 80,
    originalPrice: 95,
    discount: '15% OFF',
    isVeg: true,
    available: true,
    prepTime: '6-10 mins',
    rating: 4.9,
    ordersCount: 680,
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&auto=format&fit=crop&q=80',
    description: 'Complete wholesome lunch: Steamed rice, Sambar, Rasam, Kootu, Poriyal, Appalam, Pickle & creamy Curd.'
  },
  {
    id: 'food_6',
    name: 'Spiced Chicken Fried Rice',
    category: 'Meals',
    price: 110,
    originalPrice: 130,
    discount: '15% OFF',
    isVeg: false,
    available: true,
    prepTime: '8-12 mins',
    rating: 4.8,
    ordersCount: 410,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80',
    description: 'Wok-tossed fragrant basmati rice with succulent marinated chicken chunks, scrambled eggs, and fresh spring onions.'
  },
  {
    id: 'food_7',
    name: 'Wok-Tossed Veg Fried Rice',
    category: 'Meals',
    price: 70,
    originalPrice: null,
    discount: null,
    isVeg: true,
    available: true,
    prepTime: '7-10 mins',
    rating: 4.5,
    ordersCount: 330,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80',
    description: 'Fresh shredded carrots, beans, cabbage, and bell peppers stir-fried with basmati rice and oriental spices.'
  },
  {
    id: 'food_8',
    name: 'Crispy Veg Punjabi Samosa (2 pcs)',
    category: 'Snacks',
    price: 25,
    originalPrice: 30,
    discount: '16% OFF',
    isVeg: true,
    available: true,
    prepTime: '2-3 mins',
    rating: 4.7,
    ordersCount: 750,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80',
    description: 'Flaky pastry crust stuffed with spiced potato and green peas, served with sweet tamarind and spicy mint chutneys.'
  },
  {
    id: 'food_9',
    name: 'Grilled Cheese Corn Sandwich',
    category: 'Fast Food',
    price: 60,
    originalPrice: 75,
    discount: '20% OFF',
    isVeg: true,
    available: true,
    prepTime: '5-7 mins',
    rating: 4.8,
    ordersCount: 390,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80',
    description: 'Golden toasted bread stuffed with sweet corn kernels, melted mozzarella, capsicum, and green herb chutney.'
  },
  {
    id: 'food_10',
    name: 'Crispy Chicken Zinger Burger',
    category: 'Fast Food',
    price: 95,
    originalPrice: 120,
    discount: '21% OFF',
    isVeg: false,
    available: true,
    prepTime: '8-10 mins',
    rating: 4.9,
    ordersCount: 460,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
    description: 'Crunchy battered spiced chicken patty layered with iceberg lettuce, pickled gherkins, and garlic mayonnaise in sesame bun.'
  },
  {
    id: 'food_11',
    name: 'Warm Choco Lava Cake',
    category: 'Desserts',
    price: 50,
    originalPrice: 65,
    discount: '23% OFF',
    isVeg: true,
    available: true,
    prepTime: '3-5 mins',
    rating: 4.9,
    ordersCount: 310,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
    description: 'Decadent dark chocolate sponge cake with an irresistible molten chocolate center that flows with every bite.'
  },
  {
    id: 'food_12',
    name: 'Red Velvet Swirl Cupcake',
    category: 'Desserts',
    price: 35,
    originalPrice: null,
    discount: null,
    isVeg: true,
    available: true,
    prepTime: '2 mins',
    rating: 4.6,
    ordersCount: 190,
    image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&auto=format&fit=crop&q=80',
    description: 'Fluffy cocoa-infused red velvet cupcake topped with vanilla cream cheese frosting and festive sprinkles.'
  },
  {
    id: 'food_13',
    name: 'Authentic Filter Coffee',
    category: 'Beverages',
    price: 15,
    originalPrice: null,
    discount: null,
    isVeg: true,
    available: true,
    prepTime: '2-3 mins',
    rating: 4.9,
    ordersCount: 890,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    description: 'Strong, freshly decocted chicory-blend South Indian coffee frothed with boiling cow milk in brass davarah.'
  },
  {
    id: 'food_14',
    name: 'Ginger Cardamom Masala Chai',
    category: 'Beverages',
    price: 12,
    originalPrice: null,
    discount: null,
    isVeg: true,
    available: true,
    prepTime: '2-3 mins',
    rating: 4.8,
    ordersCount: 940,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
    description: 'Steaming Assam tea brewed with freshly crushed ginger, aromatic cardamom pods, and rich creamy milk.'
  },
  {
    id: 'food_15',
    name: 'Freshly Pressed Watermelon Juice',
    category: 'Beverages',
    price: 40,
    originalPrice: 50,
    discount: '20% OFF',
    isVeg: true,
    available: true,
    prepTime: '3-4 mins',
    rating: 4.7,
    ordersCount: 280,
    image: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400&auto=format&fit=crop&q=80',
    description: '100% pure chilled watermelon juice with a touch of mint and black salt, prepared fresh on order with zero added sugar.'
  }
];

export const INITIAL_STATIONERY_ITEMS = [
  {
    id: 'stat_1',
    name: 'Cello Butterflow Blue Ball Pen',
    category: 'Pens',
    price: 10,
    stock: 120,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80',
    description: 'Ultra-smooth lubricating ink pen with 0.7mm tip, ideal for rapid lecture notes and university examinations.'
  },
  {
    id: 'stat_2',
    name: 'Reynolds 045 Black Ball Pen',
    category: 'Pens',
    price: 10,
    stock: 95,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1585336261026-6fb3088b77a0?w=400&auto=format&fit=crop&q=80',
    description: 'Classic durable black ball pen with laser-tip precision for engineering drawings and exam headings.'
  },
  {
    id: 'stat_3',
    name: 'Uniball Eye Rollerball Gel Pen (0.5mm)',
    category: 'Pens',
    price: 45,
    stock: 40,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=400&auto=format&fit=crop&q=80',
    description: 'Waterproof fade-proof pigment ink roller pen with stainless steel precision tip and smooth ink flow window.'
  },
  {
    id: 'stat_4',
    name: 'Apsara Platinum Extra Dark Pencils (Pack of 5)',
    category: 'Pencils',
    price: 35,
    stock: 65,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&auto=format&fit=crop&q=80',
    description: 'Extra dark lead pencils for clear writing and engineering graphics, includes sharpener & eraser.'
  },
  {
    id: 'stat_5',
    name: 'Apsara Non-Dust Eraser (Pack of 3)',
    category: 'Pencils',
    price: 15,
    stock: 150,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=400&auto=format&fit=crop&q=80',
    description: 'Dust-free soft vinyl eraser that rolls up residue into strands without tearing delicate paper.'
  },
  {
    id: 'stat_6',
    name: 'Classmate Stainless Steel Scale (30 cm)',
    category: 'Pencils',
    price: 25,
    stock: 55,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80',
    description: 'Rust-resistant 30cm steel ruler with etched metric and imperial markings with non-slip edge.'
  },
  {
    id: 'stat_7',
    name: 'Classmate A4 Long Notebook (180 Pages)',
    category: 'Notebooks',
    price: 65,
    stock: 85,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    description: 'Elemental chlorine-free paper, soft cover, smooth ruled sheets, ideal for semester course note-taking.'
  },
  {
    id: 'stat_8',
    name: 'Hardbound Engineering Lab Record (192 Pages)',
    category: 'Record Books',
    price: 90,
    stock: 110,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
    description: 'Official JIT format hardbound record with alternate graph & rule sheets for physics, chemistry & coding labs.'
  },
  {
    id: 'stat_9',
    name: 'Engineering Practical Observation Book',
    category: 'Record Books',
    price: 45,
    stock: 70,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=400&auto=format&fit=crop&q=80',
    description: 'Rough practical observation notebook with calibrated column grids and tabular calculation layouts.'
  },
  {
    id: 'stat_10',
    name: 'Clear Document Folder with Button (Pack of 2)',
    category: 'Files',
    price: 25,
    stock: 80,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80',
    description: 'Durable waterproof polypropylene transparent envelope folders for project submission documents.'
  },
  {
    id: 'stat_11',
    name: 'JK Copier A4 Paper Bundle (75 GSM, 500 Sheets)',
    category: 'Files',
    price: 280,
    stock: 25,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
    description: 'High brightness 75 GSM multipurpose A4 white copier sheets for assignments and high-speed laser printing.'
  },
  {
    id: 'stat_12',
    name: 'Camlin Technical Drawing Sheet Pad (A3 Size)',
    category: 'Art Supplies',
    price: 65,
    stock: 35,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=80',
    description: '20 cartridge sheets (130 GSM) designed specifically for Engineering Graphics and Orthographic Projections.'
  }
];

export const INITIAL_PRINT_RATES = {
  blackAndWhite: 1.00, // INR per page
  colour: 5.00,       // INR per page
  doubleSidedDiscountFactor: 0.90, // 10% discount on 2nd side paper saving
  maxFileSizeMB: 25
};

export const INITIAL_ORDERS = [
  {
    orderId: 'JIT-ORD-1018',
    shop: 'canteen',
    token: 'C-018',
    queuePos: 0,
    ordersAhead: 0,
    studentRegNo: '711125104066',
    studentName: 'Mithresh Kanna S',
    status: 'Completed',
    totalAmount: 75,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    items: [
      { id: 'food_1', name: 'Crispy Ghee Podi Dosa', price: 45, quantity: 1 },
      { id: 'food_2', name: 'Medu Vada with Sambar (2 pcs)', price: 30, quantity: 1 }
    ],
    payment: {
      method: 'UPI',
      status: 'VERIFIED',
      txnId: 'UPI-TXN-984210'
    }
  },
  {
    orderId: 'JIT-ORD-1021',
    shop: 'stationery',
    token: 'S-009',
    queuePos: 0,
    ordersAhead: 0,
    studentRegNo: '711125104066',
    studentName: 'Mithresh Kanna S',
    status: 'Completed',
    totalAmount: 110,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      { id: 'stat_1', name: 'Cello Butterflow Blue Ball Pen', price: 10, quantity: 2 },
      { id: 'stat_8', name: 'Hardbound Engineering Lab Record (192 Pages)', price: 90, quantity: 1 }
    ],
    payment: {
      method: 'UPI',
      status: 'VERIFIED',
      txnId: 'UPI-TXN-984255'
    }
  },
  {
    orderId: 'JIT-ORD-1023',
    shop: 'canteen',
    token: 'C-021',
    queuePos: 1,
    ordersAhead: 0,
    studentRegNo: '711125104069',
    studentName: 'MuthuChellaKumar',
    status: 'Ready for Collection',
    totalAmount: 95,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    items: [
      { id: 'food_10', name: 'Crispy Chicken Zinger Burger', price: 95, quantity: 1 }
    ],
    payment: {
      method: 'UPI',
      status: 'VERIFIED',
      txnId: 'UPI-TXN-984301'
    }
  },
  {
    orderId: 'JIT-ORD-1024',
    shop: 'canteen',
    token: 'C-022',
    queuePos: 2,
    ordersAhead: 1,
    studentRegNo: '711125104114',
    studentName: 'Udhaya K',
    status: 'Preparing',
    totalAmount: 125,
    createdAt: new Date(Date.now() - 600000).toISOString(),
    items: [
      { id: 'food_6', name: 'Spiced Chicken Fried Rice', price: 110, quantity: 1 },
      { id: 'food_13', name: 'Authentic Filter Coffee', price: 15, quantity: 1 }
    ],
    payment: {
      method: 'UPI',
      status: 'VERIFIED',
      txnId: 'UPI-TXN-984320'
    }
  }
];
