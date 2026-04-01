// ===== DASHBOARD JS =====

let monthlyChart = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    initTheme();
    setCurrentDate();
    await loadUserName();
    await loadSummary();
    await loadRecentTransactions();
    setupChartYears();
    await loadChart();
});

// ===== CURRENT DATE =====
function setCurrentDate() {
    const el = document.getElementById('currentDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ===== LOAD USER NAME =====
async function loadUserName() {
    const user = await getCurrentUser();
    if (!user) return;
    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    const el = document.getElementById('welcomeName');
    if (el) el.textContent = name;
}

// ===== LOAD SUMMARY =====
async function loadSummary() {
    const user = await getCurrentUser();
    if (!user) return;

    // Total Income
    const { data: incomeData } = await supabaseClient
        .from('income')
        .select('amount')
        .eq('user_id', user.id);

    // Total Expense
    const { data: expenseData } = await supabaseClient
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id);

    const totalIncome = incomeData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    const totalExpense = expenseData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    const totalBalance = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = `₹ ${formatAmount(totalIncome)}`;
    document.getElementById('totalExpense').textContent = `₹ ${formatAmount(totalExpense)}`;
    document.getElementById('totalBalance').textContent = `₹ ${formatAmount(totalBalance)}`;
}

// ===== LOAD RECENT TRANSACTIONS =====
async function loadRecentTransactions() {
    const user = await getCurrentUser();
    if (!user) return;

    // Last 5 income
    const { data: incomeData } = await supabaseClient
        .from('income')
        .select('amount, date, category, account')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

    // Last 5 expenses
    const { data: expenseData } = await supabaseClient
        .from('expenses')
        .select('amount, date, category, account')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

    // Merge + sort by date
    const income = (incomeData || []).map(r => ({ ...r, type: 'Income' }));
    const expenses = (expenseData || []).map(r => ({ ...r, type: 'Expense' }));
    const all = [...income, ...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);

    const tbody = document.getElementById('recentTransactions');
    if (!all.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state"><p>No transactions yet</p></div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = all.map(r => `
        <tr>
            <td>${formatDate(r.date)}</td>
            <td>${r.category}</td>
            <td>${r.account}</td>
            <td>
                <span class="badge ${r.type === 'Income' ? 'badge-green' : 'badge-red'}">
                    ${r.type}
                </span>
            </td>
            <td class="${r.type === 'Income' ? 'amount-credit' : 'amount-debit'}">
                ${r.type === 'Income' ? '+' : '-'} ₹ ${formatAmount(Number(r.amount))}
            </td>
        </tr>
    `).join('');
}

// ===== SETUP CHART YEARS =====
function setupChartYears() {
    const select = document.getElementById('chartYear');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 3; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
    }
}

// ===== LOAD CHART =====
async function loadChart() {
    const user = await getCurrentUser();
    if (!user) return;

    const year = document.getElementById('chartYear').value;

    // Income per month
    const { data: incomeData } = await supabaseClient
        .from('income')
        .select('amount, income_month')
        .eq('user_id', user.id);

    // Expense per month
    const { data: expenseData } = await supabaseClient
        .from('expenses')
        .select('amount, date')
        .eq('user_id', user.id)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    // Income monthly totals
    const incomeMonthly = new Array(12).fill(0);
    (incomeData || []).forEach(r => {
        const idx = monthNames.indexOf(r.income_month);
        if (idx !== -1) incomeMonthly[idx] += Number(r.amount);
    });

    // Expense monthly totals
    const expenseMonthly = new Array(12).fill(0);
    (expenseData || []).forEach(r => {
        const month = new Date(r.date).getMonth();
        expenseMonthly[month] += Number(r.amount);
    });

    // Destroy old chart
    if (monthlyChart) monthlyChart.destroy();

    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeMonthly,
                    backgroundColor: 'rgba(0, 200, 150, 0.7)',
                    borderRadius: 6,
                },
                {
                    label: 'Expense',
                    data: expenseMonthly,
                    backgroundColor: 'rgba(255, 91, 91, 0.7)',
                    borderRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#A0A3B1',
                        font: { family: 'Inter' }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#A0A3B1' },
                    grid: { color: '#2A2D3E' }
                },
                y: {
                    ticks: { color: '#A0A3B1' },
                    grid: { color: '#2A2D3E' }
                }
            }
        }
    });
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