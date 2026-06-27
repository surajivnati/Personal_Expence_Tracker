/**
 * ui.js — UI rendering for ExpenseIQ
 * Handles: screen switching, toast, modal, all render functions
 */

// ─── Screen routing ───────────────────────────────────────────────
const SCREEN_TITLES = {
  dashboard: 'Dashboard',
  add:       'Add Expense',
  expenses:  'View Expenses',
  budget:    'Budget Tracker',
  reports:   'Reports',
  io:        'Save & Load',
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.screen === id);
  });
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
  document.getElementById('topbar-title').textContent = SCREEN_TITLES[id] || id;

  // Render correct screen
  if (id === 'dashboard') renderDashboard();
  if (id === 'expenses')  renderExpenses();
  if (id === 'budget')    renderBudget();
  if (id === 'reports')   renderReports();
  if (id === 'io')        renderIO();

  // Close sidebar on mobile
  if (window.innerWidth <= 820) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// ─── Toast ───────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── Confirm modal ───────────────────────────────────────────────
let _modalCallback = null;
function showModal(title, body, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').textContent  = body;
  document.getElementById('modal-overlay').classList.remove('hidden');
  _modalCallback = onConfirm;
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  _modalCallback = null;
}

// ─── Category badge ───────────────────────────────────────────────
function catBadge(cat) {
  const color = getCatColor(cat);
  const hex16 = color + '28'; // ~15% alpha
  return `<span class="cat-badge" style="background:${hex16};color:${color}">${getCatEmoji(cat)} ${cat}</span>`;
}

function catDot(cat) {
  return `<span class="exp-cat-dot" style="background:${getCatColor(cat)}"></span>`;
}

// ─── Dashboard ───────────────────────────────────────────────────
function renderDashboard() {
  const month   = thisMonth();
  const allExp  = getExpenses();
  const mExp    = allExp.filter(e => e.date && e.date.startsWith(month));
  const total   = mExp.reduce((s, e) => s + e.amount, 0);
  const budget  = getBudget(month);
  const remain  = budget - total;
  const highest = mExp.length ? Math.max(...mExp.map(e => e.amount)) : 0;
  const avgDay  = (() => {
    const days = [...new Set(mExp.map(e => e.date))].length || 1;
    return total / days;
  })();

  // Greeting
  const hr  = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greeting').textContent = `${greet}! Here's your spending overview.`;
  document.getElementById('topbar-month').textContent  = fmtMonth(month);
  document.getElementById('dash-month-label').textContent = fmtMonth(month);

  // KPIs
  const kpiEl = document.getElementById('kpi-grid');
  kpiEl.innerHTML = `
    <div class="kpi">
      <div class="kpi-label">Month Spending</div>
      <div class="kpi-value accent">${fmtAmt(total)}</div>
      <div class="kpi-sub">${mExp.length} transaction${mExp.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Monthly Budget</div>
      <div class="kpi-value">${budget ? fmtAmt(budget) : '—'}</div>
      <div class="kpi-sub">${budget ? fmtMonth(month) : 'Not set'}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">${remain >= 0 ? 'Remaining' : 'Over Budget'}</div>
      <div class="kpi-value ${remain < 0 ? 'red' : 'green'}">${budget ? fmtAmt(Math.abs(remain)) : '—'}</div>
      <div class="kpi-sub">${budget ? (remain < 0 ? '⚠️ Overspent' : `${(total / budget * 100).toFixed(0)}% used`) : 'Set a budget'}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Avg / Active Day</div>
      <div class="kpi-value yellow">${fmtAmt(avgDay)}</div>
      <div class="kpi-sub">Largest: ${fmtAmt(highest)}</div>
    </div>
  `;

  // Sidebar mini
  const miniEl = document.getElementById('sidebar-budget-mini');
  if (budget) {
    const pct = Math.min(100, total / budget * 100);
    miniEl.innerHTML = `
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px">${fmtMonth(month)}</div>
      <div class="budget-bar-wrap" style="height:5px"><div class="budget-bar" style="width:${pct.toFixed(1)}%;background:${remain < 0 ? 'var(--red)' : 'var(--green)'}"></div></div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">${fmtAmt(total)} / ${fmtAmt(budget)}</div>
    `;
  } else {
    miniEl.textContent = 'No budget set';
  }

  // Charts
  renderCategoryCharts(month);

  // Recent
  const recent = [...allExp].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const recentEl = document.getElementById('dash-recent-list');
  if (!recent.length) {
    recentEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No expenses yet</div><div class="empty-sub">Add your first expense to get started.</div></div>`;
    return;
  }
  recentEl.innerHTML = recent.map(e => `
    <div class="exp-row">
      ${catDot(e.category)}
      <div class="exp-info">
        <div class="exp-desc">${e.description}</div>
        <div class="exp-meta">${e.date} · ${e.category}</div>
      </div>
      <div class="exp-amount">${fmtAmt(e.amount)}</div>
    </div>
  `).join('');
}

// ─── Expenses list ───────────────────────────────────────────────
function renderExpenses() {
  let list = getExpenses();
  const cat    = document.getElementById('filter-cat').value;
  const month  = document.getElementById('filter-month').value;
  const sort   = document.getElementById('filter-sort').value;
  const search = document.getElementById('filter-search').value.toLowerCase().trim();

  if (cat)    list = list.filter(e => e.category === cat);
  if (month)  list = list.filter(e => e.date && e.date.startsWith(month));
  if (search) list = list.filter(e => (e.description || '').toLowerCase().includes(search) || e.category.toLowerCase().includes(search));

  if (sort === 'newest')  list.sort((a, b) => b.date.localeCompare(a.date));
  if (sort === 'oldest')  list.sort((a, b) => a.date.localeCompare(b.date));
  if (sort === 'highest') list.sort((a, b) => b.amount - a.amount);
  if (sort === 'lowest')  list.sort((a, b) => a.amount - b.amount);

  const filteredTotal = list.reduce((s, e) => s + e.amount, 0);
  document.getElementById('expenses-count-label').textContent =
    `${list.length} expense${list.length !== 1 ? 's' : ''} · Total: ${fmtAmt(filteredTotal)}`;

  const tbody   = document.getElementById('expense-tbody');
  const emptyEl = document.getElementById('expense-empty');
  const tableEl = document.getElementById('expense-table');

  if (!list.length) {
    tbody.innerHTML = '';
    tableEl.style.display = 'none';
    emptyEl.classList.remove('hidden');
    document.getElementById('filter-summary').textContent = 'No results match your filters.';
    return;
  }

  tableEl.style.display = '';
  emptyEl.classList.add('hidden');
  document.getElementById('filter-summary').textContent =
    `Showing ${list.length} of ${getExpenses().length} expenses`;

  tbody.innerHTML = list.map(e => `
    <tr>
      <td style="white-space:nowrap;color:var(--text2);font-size:13px">${e.date}</td>
      <td>${catBadge(e.category)}</td>
      <td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.description}</td>
      <td style="font-family:'Space Grotesk',sans-serif;font-weight:600">${fmtAmt(e.amount)}</td>
      <td>
        <button class="del-btn" onclick="confirmDelete(${e.id})" title="Delete">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function confirmDelete(id) {
  showModal(
    'Delete Expense',
    'Are you sure you want to delete this expense? This action cannot be undone.',
    () => {
      deleteExpenseData(id);
      renderExpenses();
      renderDashboard();
      toast('Expense deleted', 'success');
    }
  );
}

// ─── Budget ───────────────────────────────────────────────────────
function renderBudget() {
  const month  = thisMonth();
  document.getElementById('bud-month').value = month;

  const budget = getBudget(month);
  const total  = totalForMonth(month);
  const remain = budget - total;
  const pct    = budget ? Math.min(100, total / budget * 100) : 0;
  const over   = remain < 0;

  // Status card
  const statusEl = document.getElementById('budget-status-body');
  if (!budget) {
    statusEl.innerHTML = `<div class="budget-alert no-bud">⚠️ No budget set for ${fmtMonth(month)}. Set one on the left.</div>`;
  } else {
    statusEl.innerHTML = `
      <div class="budget-alert ${over ? 'over' : 'under'}">
        ${over
          ? `🚨 You have exceeded your budget by ${fmtAmt(Math.abs(remain))}!`
          : `✅ You have ${fmtAmt(remain)} left for the month.`}
      </div>
      <div class="budget-row"><span>Spent</span><span>${fmtAmt(total)}</span></div>
      <div class="budget-row"><span>Budget</span><span>${fmtAmt(budget)}</span></div>
      <div class="budget-bar-wrap">
        <div class="budget-bar" style="width:${pct.toFixed(1)}%;background:${over ? 'var(--red)' : 'var(--green)'}"></div>
      </div>
      <div class="budget-pct">${pct.toFixed(0)}% of budget used</div>
    `;
  }

  // Category breakdown
  const catMap = spendingByCategory(month);
  const cats   = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const maxAmt = cats.length ? cats[0][1] : 1;
  const bdEl   = document.getElementById('budget-cat-breakdown');

  if (!cats.length) {
    bdEl.innerHTML = `<div class="empty-state" style="padding:1.5rem 0"><div class="empty-sub">No expenses this month yet.</div></div>`;
    return;
  }

  bdEl.innerHTML = cats.map(([cat, amt]) => `
    <div class="cat-row">
      <div class="cat-row-label">${getCatEmoji(cat)} ${cat}</div>
      <div class="cat-row-bar-wrap">
        <div class="cat-row-bar" style="width:${(amt / maxAmt * 100).toFixed(1)}%;background:${getCatColor(cat)}"></div>
      </div>
      <div class="cat-row-amount" style="color:${getCatColor(cat)}">${fmtAmt(amt)}</div>
    </div>
  `).join('');
}

// ─── Reports ─────────────────────────────────────────────────────
function renderReports() {
  renderTrend();

  // Top days
  const days   = topSpendingDays(5);
  const daysEl = document.getElementById('top-days-list');
  if (!days.length) {
    daysEl.innerHTML = `<div class="empty-sub" style="padding:1rem 0;color:var(--text3)">No expense data yet.</div>`;
  } else {
    daysEl.innerHTML = days.map(d => `
      <div class="top-day-row">
        <span style="font-size:14px">${d.date}</span>
        <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:var(--accent)">${fmtAmt(d.total)}</span>
      </div>
    `).join('');
  }

  // Stats
  const st    = statistics();
  const stEl  = document.getElementById('stats-grid');
  if (!st) {
    stEl.innerHTML = `<div class="empty-sub" style="color:var(--text3)">Add expenses to see statistics.</div>`;
    return;
  }
  stEl.innerHTML = `
    <div class="stat-item"><div class="stat-label">Total All-time</div><div class="stat-value">${fmtAmt(st.total)}</div></div>
    <div class="stat-item"><div class="stat-label">Avg per Transaction</div><div class="stat-value">${fmtAmt(st.avg)}</div></div>
    <div class="stat-item"><div class="stat-label">Highest Expense</div><div class="stat-value">${fmtAmt(st.max)}</div><div style="font-size:11px;color:var(--text3);margin-top:3px">${st.maxExp?.description || ''}</div></div>
    <div class="stat-item"><div class="stat-label">Lowest Expense</div><div class="stat-value">${fmtAmt(st.min)}</div><div style="font-size:11px;color:var(--text3);margin-top:3px">${st.minExp?.description || ''}</div></div>
    <div class="stat-item"><div class="stat-label">Top Category</div><div class="stat-value">${st.topCat ? getCatEmoji(st.topCat[0]) + ' ' + st.topCat[0] : '—'}</div><div style="font-size:11px;color:var(--text3);margin-top:3px">${st.topCat ? fmtAmt(st.topCat[1]) : ''}</div></div>
    <div class="stat-item"><div class="stat-label">Total Transactions</div><div class="stat-value">${st.count}</div></div>
  `;
}

// ─── Save/Load ───────────────────────────────────────────────────
function renderIO() {
  const exps   = getExpenses();
  const budgets = getAllBudgets();
  const total  = exps.reduce((s, e) => s + e.amount, 0);
  const el     = document.getElementById('io-summary');
  el.innerHTML = `
    <div class="io-summary-row"><span>Total expenses logged</span><span class="io-summary-val">${exps.length}</span></div>
    <div class="io-summary-row"><span>Total amount tracked</span><span class="io-summary-val">${fmtAmt(total)}</span></div>
    <div class="io-summary-row"><span>Monthly budgets set</span><span class="io-summary-val">${Object.keys(budgets).length}</span></div>
    <div class="io-summary-row"><span>Date range</span><span class="io-summary-val">${exps.length ? exps.map(e => e.date).sort()[0] + ' → ' + exps.map(e => e.date).sort().slice(-1)[0] : '—'}</span></div>
  `;
}

// ─── Add form helpers ─────────────────────────────────────────────
function resetAddForm() {
  document.getElementById('in-date').value   = todayStr();
  document.getElementById('in-cat').value    = '';
  document.getElementById('in-amount').value = '';
  document.getElementById('in-desc').value   = '';
  const fb = document.getElementById('add-feedback');
  fb.className = 'feedback hidden';
  fb.textContent = '';
}

function renderQuickCats() {
  const cats   = Object.keys(CATEGORIES);
  const el     = document.getElementById('quick-cats');
  el.innerHTML = cats.map(cat => `
    <button class="quick-chip" onclick="quickFillCat('${cat}')">${getCatEmoji(cat)} ${cat}</button>
  `).join('');
}

function quickFillCat(cat) {
  document.getElementById('in-cat').value = cat;
  document.getElementById('in-amount').focus();
}

function showFeedback(elId, msg, type) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = `feedback ${type}`;
}
