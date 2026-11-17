export interface Guide {slug:string;title:string;category:string;summary:string;audience:string;steps:string[];example:{title:string;steps:string[];result:string};tips:string[];related:string[];}
export const guides:Guide[]=[
  {
    "slug": "quick-start",
    "title": "Start the day in five steps",
    "category": "Simple operations",
    "summary": "Set up the menu, open petty cash, take orders, collect bills and close the day.",
    "audience": "Owner / Admin / Cashier / Waiter",
    "steps": [
      "Sign in as Owner. Check menu prices and available items.",
      "Create staff accounts. Assign tables to regular waiters and select the Parcel & Foodpanda role for counter staff.",
      "Open Cash counter, enter the starting petty cash and choose the cashier.",
      "Waiters submit orders. The cashier collects and prints bills from Orders.",
      "Settle unpaid bills, count physical cash and close the day."
    ],
    "example": {
      "title": "Worked example",
      "steps": [
        "Opening float: BDT 2,000.",
        "Cash bills: BDT 3,000; bKash: BDT 1,000; Foodpanda receivable: BDT 500.",
        "Pay BDT 700 in cash for supplies."
      ],
      "result": "Sales are BDT 4,500. Expected drawer cash is 2,000 + 3,000 - 700 = BDT 4,300."
    },
    "tips": [
      "Opening float is not sales. Foodpanda receivables are not physical cash."
    ],
    "related": [
      "quick-start",
      "cashier",
      "handover",
      "closing"
    ]
  },
  {
    "slug": "cashier",
    "title": "Collect bills and record cash movements",
    "category": "Simple operations",
    "summary": "Choose the actual payment method and keep every cash payout traceable.",
    "audience": "Owner / Admin / Cashier / Waiter",
    "steps": [
      "Open Orders and select Collect payment.",
      "Enter each method and amount. A bill can be paid through multiple methods.",
      "Use Bill preview / print and select the counter printer.",
      "For a cash payout, enter the recipient, amount and purpose. Print the voucher and obtain signatures."
    ],
    "example": {
      "title": "Worked example",
      "steps": [
        "For a BDT 500 bill, receive BDT 300 cash and BDT 200 bKash.",
        "Pay BDT 100 cash to Rahim for supplies."
      ],
      "result": "The drawer increases by BDT 200 net. BDT 200 remains a separate digital collection."
    },
    "tips": [
      "Do not record bank or mobile-banking expenses as physical cash payouts."
    ],
    "related": [
      "quick-start",
      "cashier",
      "handover",
      "closing"
    ]
  },
  {
    "slug": "handover",
    "title": "Hand cash custody to the next cashier",
    "category": "Simple operations",
    "summary": "Both cashiers confirm custody using their own accounts.",
    "audience": "Owner / Admin / Cashier / Waiter",
    "steps": [
      "The outgoing cashier chooses the next cashier and enters the counted cash.",
      "If the count differs, select the reason and send the handover.",
      "The incoming cashier signs in, counts the money and accepts custody.",
      "Print the handover slip and obtain both signatures."
    ],
    "example": {
      "title": "Worked example",
      "steps": [
        "The expected drawer balance is BDT 4,300.",
        "Both cashiers count BDT 4,300 and the next cashier accepts it."
      ],
      "result": "Custody changes; BDT 4,300 is not counted as another sale or deposit."
    },
    "tips": [
      "Counter transactions pause while a handover is pending."
    ],
    "related": [
      "quick-start",
      "cashier",
      "handover",
      "closing"
    ]
  },
  {
    "slug": "closing",
    "title": "Close the day and revisit history",
    "category": "Simple operations",
    "summary": "Reconcile physical cash and retain the final report.",
    "audience": "Owner / Admin / Cashier / Waiter",
    "steps": [
      "Settle all unpaid bills. Cancel incorrect unpaid orders before collecting money.",
      "Count physical cash only; exclude digital payments and platform receivables.",
      "Enter the count, select any variance reason and close the day.",
      "Use Sales & closing reports to view or print any saved day."
    ],
    "example": {
      "title": "Worked example",
      "steps": [
        "Expected cash is BDT 4,300.",
        "You count BDT 4,300 and close the day."
      ],
      "result": "The variance is zero and the report remains available for later review."
    },
    "tips": [
      "A business day does not automatically change at midnight. Close it explicitly before opening the next day."
    ],
    "related": [
      "quick-start",
      "cashier",
      "handover",
      "closing"
    ]
  },
  {
    "slug": "parcel",
    "title": "Enter parcel and Foodpanda orders",
    "category": "Simple operations",
    "summary": "Counter waiters manually enter orders without a Foodpanda API.",
    "audience": "Owner / Admin / Cashier / Waiter",
    "steps": [
      "Sign in with a Parcel & Foodpanda waiter account.",
      "Choose Parcel or Foodpanda and enter the actual external order number.",
      "Select the items, review quantities and submit the order.",
      "The cashier allocates the bill to the actual received method or Foodpanda receivable."
    ],
    "example": {
      "title": "Worked example",
      "steps": [
        "Foodpanda sends an order for BDT 500.",
        "The parcel waiter enters its actual reference.",
        "No money has arrived, so the cashier chooses Foodpanda receivable."
      ],
      "result": "Sales and platform receivables each show BDT 500. Drawer cash does not increase."
    },
    "tips": [
      "The same external reference cannot be entered twice. Gross order value is tracked; commissions and platform settlement are not automated."
    ],
    "related": [
      "quick-start",
      "cashier",
      "handover",
      "closing"
    ]
  },
  {
    "slug": "menu-staff",
    "title": "Manage menu, staff and payment methods",
    "category": "Simple operations",
    "summary": "Maintain a short menu and grant only the access each employee needs.",
    "audience": "Owner / Admin / Cashier / Waiter",
    "steps": [
      "Keep both English and Bengali menu names, a unique code and the correct price.",
      "Create categories, tables and floors as needed.",
      "Create staff or reset their passwords in Staff & permissions.",
      "Create, edit, disable or delete payment methods, including banks by name."
    ],
    "example": {
      "title": "Worked example",
      "steps": [
        "Add Tea at BDT 30 with its Bengali name.",
        "Assign the parcel role to the counter waiter."
      ],
      "result": "The refreshed waiter menu includes the new item."
    },
    "tips": [
      "Items without confirmed prices remain disabled. Historical receipts retain the payment-method names used at the time."
    ],
    "related": [
      "quick-start",
      "cashier",
      "handover",
      "closing"
    ]
  },
  {
    "slug": "counters",
    "title": "Set up multiple cash counters",
    "category": "Simple operations",
    "summary": "Give every drawer its own cashier, orders, float and closing.",
    "audience": "Owner / Admin / Cashier",
    "steps": [
      "Open Counter setup and add a counter name. Select the assigned cashier. The counter code is generated automatically.",
      "Open Staff & permissions. Set each waiter's default cash counter; the waiter must sign in again after an assignment changes.",
      "Open Cash counter, choose the drawer and enter its opening petty cash. Choose the responsible cashier.",
      "Each cashier collects bills for the drawer they hold. Use handover when changing cashiers.",
      "Close each drawer separately. Open Sales & closing reports for counter reports or daily totals."
    ],
    "example": {
      "title": "Two counters, separate money",
      "steps": [
        "Main counter starts with BDT 2,000 and receives BDT 3,000 cash sales.",
        "Parcel counter starts with BDT 500 and receives BDT 1,000 cash sales.",
        "Main counter pays BDT 700 for supplies."
      ],
      "result": "Main expects BDT 4,300; Parcel expects BDT 1,500. Combined sales are BDT 4,000, and combined drawer cash is BDT 5,800."
    },
    "tips": [
      "One cashier holds one open drawer at a time.",
      "A waiter's routing assignment and a cashier's cash custody are separate settings.",
      "Close a counter and reassign its waiters before deleting it. Saved reports remain available."
    ],
    "related": [
      "quick-start",
      "handover",
      "closing"
    ]
  },
  {
    "slug": "menu-codes",
    "title": "Menu codes and duplicate prevention",
    "category": "Setup",
    "summary": "Add English and Bengali names; let the system assign the next unique code.",
    "audience": "Owner / Admin",
    "steps": [
      "Open Menu & categories, then Add item.",
      "Enter the English name, Bengali name, category and price. Add an image or keep the default Alpine artwork.",
      "The new item code is automatic. Save the item and its assigned code appears in the list.",
      "To change a price or name, edit the existing item. Matching names are blocked when adding another item.",
      "Excel import previews matching items before updating them; existing items keep stable IDs."
    ],
    "example": {
      "title": "Next available code",
      "steps": [
        "The highest issued code is 205.",
        "Add Chicken Curry with its Bengali name and price."
      ],
      "result": "The new item receives code 206. Even if code 206 is later deleted, the next new item receives 207."
    },
    "tips": [
      "Use distinct names for Half and Full sizes.",
      "An item without a price stays unavailable for sale."
    ],
    "related": [
      "quick-start",
      "counters"
    ]
  },
  {
    "slug": "printing",
    "title": "Print compact bills and enable auto-cut",
    "category": "Reporting",
    "summary": "Print a narrow receipt and a separate customer parcel token with minimal paper feed.",
    "audience": "Owner / Admin / Cashier",
    "steps": [
      "On each cashier PC, install the correct receipt-printer driver and select its 80mm / 72.1mm printable media. Keep portrait orientation, 100% scale, no margins and browser headers/footers off.",
      "Enable Full cut / Cut after document in Windows Printing preferences. For the supported Rongta 80Normal driver, download the Windows auto-cut setup below and run it in Windows PowerShell as Administrator. If Chrome is installed, it also creates an Alpine Cashier - Auto Print desktop shortcut with a separate printing profile.",
      "If Windows blocks the downloaded script, run it from an elevated PowerShell window with: powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"$env:USERPROFILE\\Downloads\\ENABLE-ALPINE-AUTOCUT.ps1\". Select the exact receipt printer if asked. This changes only that printer and saves the original preferences.",
      "Confirm a fully paid bill or use Bill preview > Print. A parcel bill is submitted first, followed by its small customer token as a separate print document. The same invoice and parcel number appear on both.",
      "Use Token only if only the small customer token needs another copy. A reprint never collects another payment. Ordinary browser windows may show two print dialogs; use the cashier Chrome kiosk-printing shortcut for unattended printing.",
      "Use Compact PDF only when saving a PDF. Physical receipt printing uses the driver paper size and starts at the top."
    ],
    "example": {
      "title": "Parcel bill and token",
      "steps": [
        "A parcel order has invoice B-20261117-C01-0005 and parcel token P-0005.",
        "After confirmed full payment, the printer receives the bill and then the token as separate documents."
      ],
      "result": "With a working auto-cutter and Full cut enabled in the driver, each document is cut at its end. The customer receives the small matching token."
    },
    "tips": [
      "Printer preferences apply to each Windows PC separately. Logging into Alpine on another PC does not change that PC's printer driver settings.",
      "If beeping, flashing or Cutter Error returns, stop printing and check the cutter/paper path. A driver setting cannot repair a jammed or faulty cutter. The previous preferences are backed up under LOCALAPPDATA\\Alpine\\PrinterSetup.",
      "The receipt uses a conservative 68mm outer width so the amount column stays clear of the print edge. If a different printer still clips, verify its paper width and 100% scale.",
      "Some leading paper is physically required between the print head and cutter. Extra page feed is disabled by the supported setup; required cutter feed is retained."
    ],
    "related": [
      "closing",
      "counters",
      "cashier"
    ]
  }
];
export const guideCategories=[...new Set(guides.map(g=>g.category))];
