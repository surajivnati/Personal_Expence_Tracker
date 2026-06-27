# 💰 ExpenseIQ — Personal Expense Tracker

A fully client-side personal expense tracker built with vanilla HTML, CSS, and JavaScript.
No backend, no build tools — just open `index.html` in any browser.

---

## 📁 Project Structure

```
expense-tracker/
├── index.html          ← Main HTML (all screens, layout, markup)
├── css/
│   └── style.css       ← Complete dark-theme stylesheet + responsive layout
├── js/
│   ├── data.js         ← Data layer: storage, CRUD, CSV I/O, aggregations
│   ├── ui.js           ← UI rendering: screens, tables, budget bars, charts
│   ├── charts.js       ← Chart.js wrappers: bar, donut, trend line
│   └── app.js          ← Main controller: event wiring, actions, init
└── README.md
```

---

## ✨ Features

### 1. Add Expense
- Date (YYYY-MM-DD format), Category, Amount (₹), Description
- Full validation with clear error messages
- Quick-add category chips for fast entry
- Keyboard shortcut: press `a` to jump to the Add screen

### 2. View Expenses
- Table view with all logged expenses
- Filter by **category**, **month**, and **free-text search**
- Sort by newest, oldest, highest, or lowest amount
- Live count and filtered total
- Delete with confirmation modal

### 3. Budget Tracker
- Set a monthly budget (₹) per month
- Visual progress bar with % used
- Clear over-budget warning: `🚨 You have exceeded your budget!`
- Remaining balance: `✅ You have ₹X left for the month.`
- Per-category spending breakdown with proportional bars

### 4. Save & Load (CSV)
- **Export**: Download all expenses as `expenses.csv`
- **Import**: Upload a CSV (date, category, amount, description columns)
- **Export Budgets**: Download budget settings as `budgets.json`
- **Clear All**: Wipe all data with confirmation

### 5. Dashboard
- KPI cards: Month spending, budget, remaining balance, avg/day
- Spending by category (bar chart)
- Category distribution (donut chart)
- 6 most recent expenses

### 6. Reports
- Monthly spending trend line chart (6 or 12 months) vs budget
- Top 5 highest-spending days
- Statistics: total, average, highest, lowest, top category

---

## 🚀 Getting Started

### Option A — Open directly
```
double-click index.html
```

### Option B — Local server (recommended for file imports)
```bash
# Python 3
python3 -m http.server 8080
# then visit: http://localhost:8080
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `d` | Dashboard |
| `a` | Add Expense |
| `e` | View Expenses |
| `b` | Budget Tracker |
| `r` | Reports |
| `s` | Save & Load |

---

## 💾 Data Storage

All data is stored in **browser localStorage** under two keys:
- `expenseiq_expenses_v2` — JSON array of expense objects
- `expenseiq_budgets_v2`  — JSON object `{ "YYYY-MM": amount }`

Data persists across page refreshes in the same browser.

---

## 📊 CSV Format

```csv
date,category,amount,description
2024-09-18,Food,250.00,Lunch at café
2024-09-19,Travel,800.00,Uber to airport
```

---

## 🧩 Expense Object Schema

```json
{
  "id": 1726656000000.123,
  "date": "2024-09-18",
  "category": "Food",
  "amount": 250.00,
  "description": "Lunch at café",
  "createdAt": "2024-09-18T12:00:00.000Z"
}
```

---

## 📦 Dependencies (CDN)

| Library | Version | Use |
|---------|---------|-----|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | Bar, donut, line charts |
| [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) | — | Body font |
| [Google Fonts — Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) | — | Display/heading font |

No npm, no bundler, no framework. Zero build step.
