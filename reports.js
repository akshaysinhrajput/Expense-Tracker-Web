// ===== REPORTS JS =====

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    initTheme();
    setupYears();
    setCurrentMonth();
    document.getElementById('generatedDate').textContent =
        new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    await loadReport();
});

// ===== SETUP YEARS =====
function setupYears() {
    const select = document.getElementById('reportYear');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 3; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
    }
}

// ===== SET CURRENT MONTH =====
function setCurrentMonth() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = months[new Date().getMonth()];
    document.getElementById('reportMonth').value = currentMonth;
}

// ===== LOAD REPORT =====
async function loadReport() {
    const user = await getCurrentUser();
    if (!user) return;

    const month = document.getElementById('reportMonth').value;
    const year = document.getElementById('reportYear').value;

    document.getElementById('statementPeriod').textContent =
        `${month} ${year}`;

    // Month index
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIdx = months.indexOf(month);
    const monthNum = String(monthIdx + 1).padStart(2, '0');

    const startDate = new Date(year, monthIdx, 1);
    const endDate = new Date(year, monthIdx + 1, 0); // last valid day

    const dateFrom = startDate.toISOString().split('T')[0];
    const dateTo = endDate.toISOString().split('T')[0];

    // ===== FETCH INCOME (by income_month) =====
    const { data: incomeData } = await supabaseClient
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .eq('income_month', month);

    // ===== FETCH EXPENSES (by date) =====
    const { data: expenseData } = await supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', dateFrom)
        .lte('date', dateTo);

    

    // ===== OPENING BALANCE =====
    // All income before this month
    const { data: prevIncome } = await supabaseClient
        .from('income')
        .select('amount, income_month')
        .eq('user_id', user.id);

    const { data: prevExpense } = await supabaseClient
        .from('expenses')
        .select('amount, date')
        .eq('user_id', user.id)
        .lt('date', dateFrom);

    // Calculate opening balance
    const prevIncomeTotal = (prevIncome || [])
        .filter(r => {
            const rIdx = months.indexOf(r.income_month);
            return rIdx < monthIdx;
        })
        .reduce((sum, r) => sum + Number(r.amount), 0);

    const prevExpenseTotal = (prevExpense || [])
        .reduce((sum, r) => sum + Number(r.amount), 0);

    const openingBalance = prevIncomeTotal - prevExpenseTotal;

    // ===== MERGE & SORT =====
    const income = (incomeData || []).map(r => ({
        ...r,
        type: 'Credit',
        sortDate: r.date
    }));

    const expenses = (expenseData || []).map(r => ({
        ...r,
        type: 'Debit',
        sortDate: r.date
    }));

    const allTrans = [...income, ...expenses]
        .sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));

    // ===== CALCULATE TOTALS =====
    const totalCredit = income.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalDebit = expenses.reduce((sum, r) => sum + Number(r.amount), 0);
    const closingBalance = openingBalance + totalCredit - totalDebit;

    // ===== UPDATE SUMMARY =====
    document.getElementById('openingBalance').textContent =
        `₹ ${formatAmount(openingBalance)}`;
    document.getElementById('totalCredit').textContent =
        `₹ ${formatAmount(totalCredit)}`;
    document.getElementById('totalDebit').textContent =
        `₹ ${formatAmount(totalDebit)}`;
    document.getElementById('closingBalance').textContent =
        `₹ ${formatAmount(closingBalance)}`;
    document.getElementById('closingBalance').className =
        `stmt-sum-value ${closingBalance >= 0 ? 'text-green' : 'text-red'}`;

    // ===== RENDER TABLE =====
    const tbody = document.getElementById('statementRows');

    if (!allTrans.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <p>No transactions for ${month} ${year}</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    let runningBalance = openingBalance;

    tbody.innerHTML = allTrans.map(t => {
        const isCredit = t.type === 'Credit';
        runningBalance += isCredit ? Number(t.amount) : -Number(t.amount);

        return `
            <tr class="${isCredit ? 'credit-row' : 'debit-row'}">
                <td>${formatDate(t.date)}</td>
                <td>${t.note || t.description || '—'}</td>
                <td>${t.category}</td>
                <td>
                    <span class="badge ${isCredit ? 'badge-green' : 'badge-red'}">
                        ${t.type}
                    </span>
                </td>
                <td class="amount-debit">
                    ${!isCredit ? '₹ ' + formatAmount(Number(t.amount)) : '—'}
                </td>
                <td class="amount-credit">
                    ${isCredit ? '₹ ' + formatAmount(Number(t.amount)) : '—'}
                </td>
                <td class="${runningBalance >= 0 ? 'balance-positive' : 'balance-negative'}">
                    ₹ ${formatAmount(runningBalance)}
                </td>
            </tr>
        `;
    }).join('');
}

// ===== PRINT REPORT =====
function printReport() {
    window.print();
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