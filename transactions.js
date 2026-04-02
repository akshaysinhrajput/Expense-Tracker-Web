// ===== TRANSACTIONS JS =====

let allTransactions = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    initTheme();
    await loadTransactions();
});

// ===== LOAD TRANSACTIONS =====
async function loadTransactions() {
    const user = await getCurrentUser();
    if (!user) return;

    // Fetch income
    const { data: incomeData } = await supabaseClient
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    // Fetch expenses
    const { data: expenseData } = await supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    // Merge
    const income = (incomeData || []).map(r => ({ ...r, type: 'Income' }));
    const expenses = (expenseData || []).map(r => ({ ...r, type: 'Expense' }));

    allTransactions = [...income, ...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Populate category filter
    populateCategoryFilter();

    // Render
    renderTransactions(allTransactions);
}

// ===== POPULATE CATEGORY FILTER =====
function populateCategoryFilter() {
    const categories = [...new Set(allTransactions.map(t => t.category))];
    const select = document.getElementById('categoryFilter');

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

// ===== FILTER TRANSACTIONS =====
function filterTransactions() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const type = document.getElementById('typeFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    let filtered = allTransactions.filter(t => {
        const matchSearch = !search ||
            t.category.toLowerCase().includes(search) ||
            t.account.toLowerCase().includes(search) ||
            (t.note && t.note.toLowerCase().includes(search));

        const matchType = !type || t.type === type;
        const matchCategory = !category || t.category === category;
        const matchFrom = !dateFrom || t.date >= dateFrom;
        const matchTo = !dateTo || t.date <= dateTo;

        return matchSearch && matchType && matchCategory && matchFrom && matchTo;
    });

    renderTransactions(filtered);
}

// ===== CLEAR FILTERS =====
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    renderTransactions(allTransactions);
}

// ===== RENDER TRANSACTIONS =====
function renderTransactions(transactions) {
    const tbody = document.getElementById('transactionsList');

    // Update summary
    const totalIncome = transactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    document.getElementById('filterIncome').textContent = `₹ ${formatAmount(totalIncome)}`;
    document.getElementById('filterExpense').textContent = `₹ ${formatAmount(totalExpense)}`;
    document.getElementById('filterBalance').textContent = `₹ ${formatAmount(balance)}`;
    document.getElementById('filterBalance').className =
        `trans-summary-value ${balance >= 0 ? 'text-green' : 'text-red'}`;
    document.getElementById('filterCount').textContent = transactions.length;

    if (!transactions.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state"><p>No transactions found</p></div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.category}</td>
            <td>${t.account}</td>
            <td>
                <span class="badge ${t.type === 'Income' ? 'badge-green' : 'badge-red'}">
                    ${t.type}
                </span>
            </td>
            <td>${t.note || '—'}</td>
            <td class="${t.type === 'Income' ? 'amount-credit' : 'amount-debit'}">
                ${t.type === 'Income' ? '+' : '-'} ₹ ${formatAmount(Number(t.amount))}
            </td>
        </tr>
    `).join('');
}

// ===== EXPORT CSV =====
function exportCSV() {
    if (!allTransactions.length) {
        showToast('No transactions to export', 'error');
        return;
    }

    const headers = ['Date', 'Category', 'Account', 'Type', 'Note', 'Amount'];
    const rows = allTransactions.map(t => [
        t.date,
        t.category,
        t.account,
        t.type,
        t.note || '',
        t.amount
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('CSV exported!', 'success');
}

// ===== FORMAT AMOUNT =====
function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN').format(amount);
}

// ===== FORMAT DATE =====
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}