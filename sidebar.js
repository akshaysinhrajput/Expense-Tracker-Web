// ===== LOAD SIDEBAR =====
async function loadSidebar() {
    try {
        const response = await fetch('/components/sidebar.html');
        const html = await response.text();

        // Sidebar inject karo
        const container = document.getElementById('sidebarContainer');
        if (container) container.innerHTML = html;

        // Active page highlight karo
        setActivePage();

        // User info load karo
        loadSidebarUser();

    } catch (err) {
        console.error('Sidebar load failed:', err);
    }
}

// ===== ACTIVE PAGE SET KARO =====
function setActivePage() {
    const currentPage = window.location.pathname;

    document.querySelectorAll('.nav-item').forEach(item => {
        const page = item.getAttribute('data-page');
        if (currentPage.includes(page)) {
            item.classList.add('active');
        }
    });
}

// ===== USER INFO LOAD KARO =====
async function loadSidebarUser() {
    try {
        const { data: userData } = await supabaseClient.auth.getUser();
        if (!userData.user) return;

        const user = userData.user;
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        const email = user.email;
        const avatar = name.charAt(0).toUpperCase();

        const nameEl = document.getElementById('sidebarName');
        const emailEl = document.getElementById('sidebarEmail');
        const avatarEl = document.getElementById('sidebarAvatar');

        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = email;
        if (avatarEl) avatarEl.textContent = avatar;

    } catch (err) {
        console.error('User load failed:', err);
    }
}

// ===== MOBILE SIDEBAR OPEN =====
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
}

// ===== MOBILE SIDEBAR CLOSE =====
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ===== LOAD ON PAGE READY =====
document.addEventListener('DOMContentLoaded', loadSidebar);