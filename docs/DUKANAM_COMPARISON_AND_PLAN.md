# What to take from Dukanam into PulseOps

Reviewed 25 Oct 2026 from dukanam.com. Only the parts that fit PulseOps are listed. Left out on purpose:
other languages, e-way bills and GST portal returns (GSTR-1/2B filing). Every payment goes through **Razorpay**,
which shops already connect in PulseOps.

## 1. Counter billing (POS)
- [ ] A full-screen **POS page** for the shop counter
- [ ] Find items by **barcode scan, SKU or name**; an exact barcode match adds the item straight away
- [ ] Keyboard shortcuts: F2 to search, Enter to add, F8 to complete the sale
- [ ] **Walk-in customer**, so a quick sale needs no customer details
- [ ] Quantity and discount per line; available stock shown as you add items
- [ ] **Hold a sale** and serve the next customer, then resume it
- [ ] Payment by **cash, Razorpay UPI QR (exact amount), card, or split** across them
- [ ] **Razorpay payment link** sent by SMS/email for customers who pay later
- [ ] **Print** an 80mm thermal receipt or an A4 invoice, and reprint later
- [ ] **Double-click protection** at checkout (also fixes today's order form)

## 2. Cash register
- [ ] Open the counter with an **opening float**
- [ ] Record **cash in / cash out** during the day
- [ ] **Close** the register: expected cash vs counted cash, showing the **difference**

## 3. Proper GST invoices
- [ ] **Business tax profile**: GSTIN, legal name, state, address, bank details, invoice prefix
- [ ] **Per-item GST**: HSN/SAC code, GST rate (0/5/12/18/28%), exempt items, prices with or without tax, MRP
- [ ] **CGST + SGST** for sales in the shop's state, **IGST** for other states
- [ ] **Business customers**: company name, GSTIN (validated), PAN, billing and shipping address, state
- [ ] **Invoice numbers by financial year**, for example `ACME/2026-27/0001`
- [ ] Invoices **keep a snapshot** of the customer, item and tax details, with an **edit history**

## 4. Sales documents and customer balances
- [ ] **Quotes** that turn into an invoice in one click
- [ ] **Recurring invoices** (monthly customers), collected through a Razorpay payment link
- [ ] **Sales returns / credit notes** that put stock back and refund through Razorpay
- [ ] **Credit sales**: how much each customer owes, record a payment against their bills, customer statement

## 5. Purchases and costs
- [ ] **Suppliers** with their GSTIN and contact details
- [ ] **Purchase orders** → **supplier bills** that add stock automatically
- [ ] **Payments to suppliers** and how much you still owe them
- [ ] **Purchase returns**
- [ ] **Purchase price and average cost** per item, so each sale shows its profit
- [ ] **Expenses** (rent, salaries, transport), including expenses tied to a particular bill

## 6. Reports for the owner and accountant
- [ ] **Profit and loss** for any date range
- [ ] **Money to collect** (receivables) and **money to pay** (payables), with how overdue each is
- [ ] **Day closing report**: sales, payments by method, cash difference
- [ ] **GST summary**: tax collected and paid, by rate (for the accountant to file)
- [ ] **Customer-wise profit**
- [ ] **Referrers and commissions** (who brought the customer, what they earn)
- [ ] **Accountant role**: can see reports and bills, can't sell or change stock

## 7. Shop-type extras
- [ ] **Batch and expiry dates** (pharmacy, food), with expiry alerts
- [ ] **Serial / IMEI numbers** (mobiles, electronics)
- [ ] **Barcode and shelf-label printing**

## 8. Getting businesses on board
- [ ] **Self sign-up** with a **free plan** (no platform admin needed)
- [ ] **Paid plans charged through Razorpay subscriptions**, with upgrade and downgrade
- [ ] **Full business backup** download

## Suggested order
1. **GST invoices (§3)**, which everything else builds on
2. **Counter POS + cash register (§1–2)**
3. **Sales documents and balances (§4)**
4. **Purchases and costs (§5)**
5. **Reports (§6)**
6. **Shop-type extras (§7)**
7. **Self sign-up and paid plans (§8)**
