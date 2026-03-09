# Finance Module Complete Overhaul — Developer Prompt
### CRM Application: Echo Manager

---

## Overview

Completely redesign the Finance module of the Echo Manager CRM to support a project-based financial lifecycle — from budget planning and phased client payments, through expense/profit tracking, to profit-sharing between the company and admins.

---

## 1. Project Creation — Budget & Phase Planning

### 1.1 Updates to the "New Project" Modal

When creating a project, add the following new fields **below the existing fields**:

**Total Planned Budget (₹)**
- Numeric input, required
- This represents the total amount agreed with the client for the full project

**Project Phases**
- Default: 3 phases
- Each phase has:
  - `Phase Name` (e.g., Phase 1 / Discovery, Phase 2 / Development, etc.) — text input
  - `Phase Amount (₹)` — numeric input (the amount to be collected from the client for this phase)
  - `Phase Description` — optional text
- The sum of all phase amounts **does not need to equal** the total budget. The split ratio is fully flexible and decided per client agreement (e.g., 4 phases could be 40:30:20:10 or any custom ratio)
- Add an **"+ Add Phase"** button to dynamically add more phases (no maximum limit)
- Add a **"✕ Remove"** button on each phase row (minimum 1 phase must remain)
- Display a running total of phase amounts vs. total budget as a helper hint (non-blocking)

---

## 2. Project Detail View — Phase Payment Management

### 2.1 Project Detail Page

When a user clicks on a project in the Projects list, navigate to a dedicated **Project Detail Page** that shows:

- Project name, client, status, priority, deadline, tech stack, description
- Total Planned Budget
- **Payment Progress Section:**
  - Overall progress bar: `Total Collected / Total Budget` with percentage
  - Per-phase breakdown table with columns:
    - Phase Name
    - Phase Amount (agreed)
    - Amount Paid (collected so far)
    - Remaining
    - Status badge: `Unpaid` / `Partially Paid` / `Fully Paid`
    - Action button: **"Update Payment"**

### 2.2 Update Payment Flow

Clicking **"Update Payment"** on a phase opens a modal with:
- Phase name (read-only label)
- `Amount Received (₹)` — numeric input
- `Payment Date` — date picker (defaults to today)
- `Payment Method` — dropdown (Bank Transfer, UPI, Cash, Cheque, Other)
- `Notes / Reference` — optional text
- **"Record Payment"** button

**On submission:**
- Update the phase's paid amount
- If phase is now fully paid → auto-set phase status to `Fully Paid`
- Automatically create an **Income transaction** in the Finance module with:
  - Type: Income
  - Category: Project Payment
  - Project: linked to this project
  - Amount: the amount just recorded
  - Description: `[Project Name] — [Phase Name] Payment`
  - Date: payment date entered
- Recalculate the overall payment progress bar

### 2.3 Mark Project as Complete

When **all phases** have status `Fully Paid`:
- Show a prominent **"Mark Project as Complete ✓"** button on the Project Detail page
- On click, prompt a confirmation dialog: _"All phases are fully paid. Mark this project as complete?"_
- On confirm: set project status to `Completed`

---

## 3. Finance Page — Overhaul

### 3.1 Summary Cards

Keep the existing 3 summary cards but update their logic:

| Card | Logic |
|------|-------|
| **Income** | Sum of all Income transactions |
| **Expenses** | Sum of all Expense transactions |
| **Balance / Profit** | Income − Expenses |

### 3.2 Project Financial Overview Table

Add a new section on the Finance page titled **"Project Financials"** with a table:

| Column | Description |
|--------|-------------|
| Project Name | Linked to project detail |
| Total Budget | Planned budget |
| Total Collected | Sum of all phase payments received |
| Total Expenses | Expenses tagged to this project |
| Profit / Loss | Collected − Expenses |
| Status | `On Track` / `Over Budget` / `Completed` |

**Loss Display Rule:**
- If `Total Expenses > Total Budget`, display the difference as a **red negative value** (e.g., `-₹5,000`) in the Profit/Loss column
- Show a red warning badge: `Over Budget`

---

## 4. Profit Sharing System

### 4.1 Profit Sharing Tab

Add a new **sub-tab within the Finance page** called **"Profit Sharing"**.

This tab shows:
- **Total Profit** (Income − Expenses, synced from Finance summary)
- **Company Share (₹)** — calculated from the ratio setting
- **Admins Share (₹)** — calculated from the ratio setting
- **Per-Admin Breakdown table** showing each admin's individual share

### 4.2 Default Profit Split Logic

```
Total Profit
├── Company Share: 50% (configurable)
└── Admins Share: 50% (configurable)
       ├── Admin 1: 50% of Admins Share (configurable)
       └── Admin 2: 50% of Admins Share (configurable)
```

All ratios are fully configurable via the Settings panel (see Section 4.4).

**Example with ₹1,00,000 profit (default ratios, 2 admins):**
- Company: ₹50,000
- Admins Pool: ₹50,000
  - Admin 1: ₹25,000
  - Admin 2: ₹25,000

### 4.3 Admin Management for Profit Sharing

Within the **Profit Sharing** tab (or accessible from User Mgmt), add an **"Admin Profit Sharing"** panel:

- List of admins included in profit sharing (Name, Role, Share %)
- **"+ Add Admin"** button — select from existing admin users
- **"Remove"** button per admin
- When a new admin is added, their percentage defaults to an equal split of the admins pool
- The admin shares must always total **100%** of the admins pool (show live validation)

### 4.4 Profit Sharing Settings

Add a **"⚙ Profit Sharing Settings"** button/section in the Profit Sharing tab with:

**Company vs. Admins Split:**
- `Company Share %` — numeric input (default: 50)
- `Admins Share %` — auto-calculated as `100 - Company Share %`
- Validation: must sum to 100

**Per-Admin Split:**
- Table listing each admin with an editable `Share %` input
- Validation: all admin percentages must sum to 100%
- **"Save Settings"** button

Changes to settings should **immediately recalculate** the displayed profit sharing breakdown.

---

## 5. Expense & Profit Linking

### 5.1 Expense Tagging

When adding a new Expense transaction, add an optional **"Link to Project"** dropdown (same project selector as income).

This allows expenses to be attributed to specific projects, enabling accurate per-project P&L in the Project Financials table (Section 3.2).

### 5.2 Automatic Finance Entries

All payment recordings from the Project Detail page (Section 2.2) should automatically appear in the main Finance transaction list — no manual re-entry required.

---

## 6. UI / UX Guidelines

- Maintain the existing purple/violet color theme of Echo Manager
- Use badge colors consistently: Green = Income/Paid, Red = Expense/Loss/Overdue, Orange = Partial
- All new modals should follow the existing modal design pattern (white card, close ✕ button, purple CTA)
- Progress bars: use green fill for healthy progress, red fill if over budget
- All monetary values displayed in Indian Rupee format: `₹X,XX,XXX`
- Finance and Project Detail pages should be responsive

---

## 7. Data Model Changes (Backend / DB)

> Implement as needed based on your current stack.

**Projects table — add fields:**
- `total_budget` (number)
- `status` (update to include `completed`)

**New table: `project_phases`**
- `id`, `project_id` (FK), `phase_name`, `phase_description`, `phase_amount`, `amount_paid`, `status` (unpaid/partial/paid), `created_at`

**New table: `phase_payments`**
- `id`, `phase_id` (FK), `amount`, `payment_date`, `payment_method`, `notes`, `finance_transaction_id` (FK, auto-linked)

**Finance transactions table — add fields:**
- `project_id` (FK, nullable) — for linking income/expense to a project

**New table: `profit_sharing_settings`**
- `company_share_percent`, `admins_share_percent`, `updated_at`

**New table: `admin_profit_shares`**
- `id`, `user_id` (FK), `share_percent`, `is_active`

---

## 8. Summary of New Pages / Components

| Component | Type | Description |
|-----------|------|-------------|
| Project Detail Page | New Page | Full project info + phase payment tracker |
| Update Payment Modal | New Modal | Record phase payment |
| Project Financials Table | New Section (Finance page) | Per-project P&L |
| Profit Sharing Tab | New Tab (Finance page) | Company + admin split view |
| Profit Sharing Settings | New Settings Panel | Configure all split ratios |
| Admin Profit Sharing Panel | New Panel | Manage which admins are in the pool |

---

*End of Prompt — Echo Manager Finance Module Overhaul v1.0*
