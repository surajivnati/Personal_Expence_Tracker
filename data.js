/**
 * data.js — Data layer for ExpenseIQ
 * Handles: storage, expense CRUD, budget management, CSV I/O
 */

// ─── Storage keys ────────────────────────────────────────────────
const STORAGE_KEY_EXPENSES = 'expenseiq_expenses_v2';
const STORAGE_KEY_BUDGETS  = 'expenseiq_budgets_v2';

// ─── In-memory state ─────────────────────────────────────────────
let _expenses = [];   // Array of expense objects
let _budgets  = {};   // { 'YYYY-MM': amount }

// ─── Category config ─────────────────────────────────────────────
const CATEGORIES = {
  Food:          { emoji: '🍕', color: '#F97316' },
  Travel:        { emoji: '✈️', color: '#3B82F6' },
  Shopping:      { emoji: '🛍️', color: '#EC4899' },
  Entertainment: { emoji: '🎬', color: '#A855F7' },
  Health:        { emoji: '💊', color: '#10B981' },
  Utilities:     { emoji: '💡', color: '#6B7280' },
  Education:     { emoji: '📚', color: '#EAB308' },
  Rent:          { emoji: '🏠', color: '#14B8A6' },
  Other:         { emoji: '📦', color: '#8B5CF6' },
};

function getCatColor(cat) {
  return (CATEGORIES[cat] || { color: '#8B5CF6' }).color;
}
function getCatEmoji(cat) {
  return (CATEGORIES[cat] || { emoji: '📦' }).emoji;
}

// ─── Persistence ─────────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    _expenses = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load expenses:', e);
    _expenses = [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUDGETS);
    _budgets = raw ? JSON.parse(raw) : {};
  } catch (e) {
    _budgets = {};
  }

  // Seed sample data on first visit
  if (_expenses.length === 0) {
    _seedSampleData();
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(_expenses));
    localStorage.setItem(STORAGE_KEY_BUDGETS,  JSON.stringify(_budgets));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

function _seedSampleData() {
  const today = new Date();
  const m = today.toISOString().slice(0, 7);
  const d = (offset) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - offset);
    return dt.toISOString().slice(0, 10);
  };
  const samples = [
    { date: d(0),  category: 'Food',          amount: 250,  description: 'Lunch at café' },
    { date: d(1),  category: 'Travel',        amount: 800,  description: 'Uber to airport' },
    { date: d(2),  category: 'Shopping',      amount: 1500, description: 'New headphones' },
    { date: d(3),  category: 'Food',          amount: 120,  description: 'Grocery run' },
    { date: d(4),  category: 'Entertainment', amount: 400,  description: 'Movie tickets' },
    { date: d(5),  category: 'Health',        amount: 900,  description: 'Doctor consultation' },
    { date: d(6),  category: 'Utilities',     amount: 1200, description: 'Electricity bill' },
    { date: d(7),  category: 'Food',          amount: 350,  description: 'Dinner with friends' },
    { date: d(8),  category: 'Education',     amount: 2000, description: 'Online course' },
    { date: d(9),  category: 'Rent',          amount: 8000, description: 'Monthly rent' },
    { date: d(10), category: 'Shopping',      amount: 600,  description: 'Clothes' },
    { date: d(11), category: 'Food',          amount: 180,  description: 'Coffee & snacks' },
  ];
  samples.forEach(s => _addExpense(s));
  _budgets[m] = 20000;
  saveToStorage();
}

// ─── Expense CRUD ─────────────────────────────────────────────────
/**
 * Validate an expense object. Returns null if valid, or an error string.
 */
function validateExpense({ date, category, amount, description }) {
  if (!date)        return 'Date is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Date must be in YYYY-MM-DD format.';
  if (!category)    return 'Category is required.';
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
                    return 'Amount must be a positive number.';
  if (!description || description.trim().length === 0)
                    return 'Description is required.';
  return null;
}

function _addExpense({ date, category, amount, description }) {
  const expense = {
    id:          Date.now() + Math.random(),
    date:        date.trim(),
    category:    category.trim(),
    amount:      parseFloat(amount),
    description: description.trim(),
    createdAt:   new Date().toISOString(),
  };
  _expenses.push(expense);
  return expense;
}

function addExpenseData(fields) {
  const err = validateExpense(fields);
  if (err) return { success: false, error: err };
  const expense = _addExpense(fields);
  saveToStorage();
  return { success: true, expense };
}

function deleteExpenseData(id) {
  const before = _expenses.length;
  _expenses = _expenses.filter(e => e.id !== id);
  if (_expenses.length < before) { saveToStorage(); return true; }
  return false;
}

function updateExpenseData(id, fields) {
  const idx = _expenses.findIndex(e => e.id === id);
  if (idx === -1) return { success: false, error: 'Expense not found.' };
  const err = validateExpense(fields);
  if (err) return { success: false, error: err };
  _expenses[idx] = { ..._expenses[idx], ...fields, amount: parseFloat(fields.amount) };
  saveToStorage();
  return { success: true, expense: _expenses[idx] };
}

function getExpenses() { return [..._expenses]; }

// ─── Budget ───────────────────────────────────────────────────────
function setBudget(month, amount) {
  if (!month || !amount || isNaN(amount) || amount <= 0)
    return { success: false, error: 'Enter a valid month and positive budget amount.' };
  _budgets[month] = parseFloat(amount);
  saveToStorage();
  return { success: true };
}

function getBudget(month) { return _budgets[month] || 0; }
function getAllBudgets()   { return { ..._budgets }; }

// ─── Aggregations ─────────────────────────────────────────────────
function totalForMonth(month) {
  return _expenses
    .filter(e => e.date && e.date.startsWith(month))
    .reduce((s, e) => s + (e.amount || 0), 0);
}

function spendingByCategory(month) {
  const map = {};
  _expenses
    .filter(e => !month || (e.date && e.date.startsWith(month)))
    .forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
  return map;
}

function monthlyTotals(lastN = 6) {
  const result = [];
  const now = new Date();
  for (let i = lastN - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    result.push({ month: m, total: totalForMonth(m), budget: getBudget(m) });
  }
  return result;
}

function topSpendingDays(n = 5) {
  const map = {};
  _expenses.forEach(e => {
    map[e.date] = (map[e.date] || 0) + e.amount;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([date, total]) => ({ date, total }));
}

function statistics() {
  if (_expenses.length === 0) return null;
  const amounts = _expenses.map(e => e.amount);
  const total   = amounts.reduce((s, a) => s + a, 0);
  const avg     = total / amounts.length;
  const max     = Math.max(...amounts);
  const min     = Math.min(...amounts);
  const maxExp  = _expenses.find(e => e.amount === max);
  const minExp  = _expenses.find(e => e.amount === min);
  const catMap  = spendingByCategory();
  const topCat  = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  return { total, avg, max, min, maxExp, minExp, count: _expenses.length, topCat };
}

// ─── CSV Export ───────────────────────────────────────────────────
function exportToCSV() {
  if (_expenses.length === 0) return null;
  const header = ['date', 'category', 'amount', 'description'];
  const rows = _expenses.map(e => [
    e.date,
    e.category,
    e.amount.toFixed(2),
    `"${(e.description || '').replace(/"/g, '""')}"`,
  ]);
  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ─── CSV Import ───────────────────────────────────────────────────
function importFromCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { added: 0, skipped: 0, errors: ['File is empty or has only a header.'] };

  const header = lines[0].toLowerCase().replace(/\s/g, '');
  if (!header.includes('date') || !header.includes('amount'))
    return { added: 0, skipped: 0, errors: ['Invalid CSV: missing "date" or "amount" columns.'] };

  const cols  = lines[0].split(',').map(c => c.trim().toLowerCase());
  const iDate = cols.indexOf('date');
  const iCat  = cols.indexOf('category');
  const iAmt  = cols.indexOf('amount');
  const iDesc = cols.findIndex(c => c.includes('desc'));

  let added = 0, skipped = 0;
  const errors = [];

  lines.slice(1).forEach((line, li) => {
    if (!line.trim()) return;
    // Handle quoted fields
    const parts = line.match(/("(?:[^"]|"")*"|[^,]*)/g)
      .map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

    const date        = iDate  >= 0 ? parts[iDate]  : '';
    const category    = iCat   >= 0 ? (parts[iCat]  || 'Other') : 'Other';
    const amountRaw   = iAmt   >= 0 ? parts[iAmt]   : '';
    const description = iDesc  >= 0 ? parts[iDesc]  : '';
    const amount      = parseFloat(amountRaw);

    const err = validateExpense({ date, category, amount, description: description || 'Imported' });
    if (err) {
      skipped++;
      errors.push(`Row ${li + 2}: ${err}`);
    } else {
      _addExpense({ date, category, amount, description: description || 'Imported' });
      added++;
    }
  });

  if (added > 0) saveToStorage();
  return { added, skipped, errors };
}

// ─── Export budgets as JSON ───────────────────────────────────────
function exportBudgetsJSON() {
  return JSON.stringify(_budgets, null, 2);
}

// ─── Clear all ───────────────────────────────────────────────────
function clearAllData() {
  _expenses = [];
  _budgets  = {};
  saveToStorage();
}

// ─── Helpers ─────────────────────────────────────────────────────
function fmtAmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function thisMonth() {
  return new Date().toISOString().slice(0, 7);
}

function fmtMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(+y, +mo - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
