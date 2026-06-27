/**
 * app.js — Main controller for ExpenseIQ
 * Wires events, actions, and initialises the app
 */

// ─── Add Expense ──────────────────────────────────────────────────
function addExpense() {
  const date        = document.getElementById('in-date').value;
  const category    = document.getElementById('in-cat').value;
  const amount      = document.getElementById('in-amount').value;
  const description = document.getElementById('in-desc').value;

  const result = addExpenseData({ date, category, amount, description });

  if (!result.success) {
    showFeedback('add-feedback', '⚠️ ' + result.error, 'error');
    return;
  }

  showFeedback(
    'add-feedback',
    `✅ Expense added: ${result.expense.description} — ${fmtAmt(result.expense.amount)}`,
    'success'
  );
  resetAddForm();
  toast('Expense added successfully!', 'success');

  // Auto-clear feedback after 3 s
  setTimeout(() => {
    const fb = document.getElementById('add-feedback');
    if (fb) fb.className = 'feedback hidden';
  }, 3500);
}

// ─── Save Budget ──────────────────────────────────────────────────
function saveBudget() {
  const month  = document.getElementById('bud-month').value;
  const amount = document.getElementById('bud-amount').value;
  const result = setBudget(month, amount);

  if (!result.success) {
    showFeedback('budget-feedback', '⚠️ ' + result.error, 'error');
    return;
  }

  showFeedback('budget-feedback', `✅ Budget saved: ${fmtAmt(amount)} for ${fmtMonth(month)}`, 'success');
  toast('Budget saved!', 'success');
  renderBudget();
  renderDashboard();
}

// ─── Export CSV ───────────────────────────────────────────────────
function exportCSV() {
  const csv = exportToCSV();
  if (!csv) { toast('No expenses to export.', 'error'); return; }
  downloadBlob(csv, 'expenses.csv', 'text/csv;charset=utf-8;');
  toast('CSV downloaded ✓', 'success');
}

// ─── Import CSV ───────────────────────────────────────────────────
function importCSV(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = importFromCSV(e.target.result);
    const { added, skipped, errors } = result;

    let msg, type;
    if (added > 0) {
      msg  = `✅ Imported ${added} expense${added !== 1 ? 's' : ''}${skipped ? `, skipped ${skipped} invalid row(s)` : ''}.`;
      type = 'success';
    } else {
      msg  = `⚠️ Nothing imported. ${errors[0] || 'Check your CSV format.'}`;
      type = 'error';
    }

    showFeedback('import-feedback', msg, type);
    toast(msg.slice(0, 60), type);
    input.value = '';
    renderIO();
    renderDashboard();
  };
  reader.readAsText(file);
}

// ─── Export Budgets ───────────────────────────────────────────────
function exportBudgets() {
  const json = exportBudgetsJSON();
  downloadBlob(json, 'budgets.json', 'application/json');
  toast('Budget data downloaded ✓', 'success');
}

// ─── Clear All ────────────────────────────────────────────────────
function clearAll() {
  showModal(
    'Clear All Data',
    'This will permanently delete all your expenses and budget settings. This action cannot be undone.',
    () => {
      clearAllData();
      renderDashboard();
      renderIO();
      toast('All data cleared.', 'success');
    }
  );
}

// ─── Modal confirm button ─────────────────────────────────────────
document.getElementById('modal-confirm').addEventListener('click', () => {
  if (_modalCallback) _modalCallback();
  closeModal();
});

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ─── Navigation ───────────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen(link.dataset.screen);
  });
});

// ─── Hamburger (mobile) ───────────────────────────────────────────
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ─── Keyboard shortcut: press "a" to jump to Add Expense ─────────
document.addEventListener('keydown', (e) => {
  if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'a') showScreen('add');
  if (e.key === 'd') showScreen('dashboard');
  if (e.key === 'e') showScreen('expenses');
  if (e.key === 'b') showScreen('budget');
  if (e.key === 'r') showScreen('reports');
  if (e.key === 's') showScreen('io');
});

// ─── Initialise ───────────────────────────────────────────────────
(function init() {
  // Load persisted data
  loadFromStorage();

  // Default form values
  document.getElementById('in-date').value   = todayStr();
  document.getElementById('bud-month').value = thisMonth();
  document.getElementById('filter-month').value = thisMonth();

  // Render quick-add category chips
  renderQuickCats();

  // Start on dashboard
  showScreen('dashboard');

  console.log(
    '%c💰 ExpenseIQ loaded',
    'background:#7C6FF7;color:#fff;padding:4px 10px;border-radius:4px;font-weight:700'
  );
})();
