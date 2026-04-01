// ===== AUTH MANAGER =====

// ===== SESSION CHECK =====
// Pages jo sirf logged in user dekh sake
async function requireAuth() {
    const { data: userData, error } = await supabaseClient.auth.getUser();

    if (error || !userData.user) {
        window.location.href = '/pages/login.html';
        return null;
    }

    return userData.user;
}

// ===== PUBLIC PAGES CHECK =====
// Agar already logged in hai to dashboard pe bhejo
async function requireGuest() {
    const { data: userData } = await supabaseClient.auth.getUser();

    if (userData.user) {
        window.location.href = '/pages/dashboard.html';
    }
}

// ===== LOGOUT =====
async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error('Logout failed:', error);
        return;
    }

    window.location.href = '/pages/login.html';
}

// ===== GET CURRENT USER =====
async function getCurrentUser() {
    const { data: userData, error } = await supabaseClient.auth.getUser();

    if (error || !userData.user) return null;

    return userData.user;
}

// ===== SHOW TOAST =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}