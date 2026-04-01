// ===== LOGIN =====
async function login() {
    const btn = document.getElementById('loginBtn');
    const loader = document.getElementById('loader');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validation
    if (!email) {
        showToast('Email is required', 'error');
        return;
    }

    if (!password) {
        showToast('Password is required', 'error');
        return;
    }

    btn.disabled = true;
    loader.style.display = 'inline-block';

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            showToast(error.message, 'error');
            return;
        }

        showToast('Login successful!', 'success');

        setTimeout(() => {
            window.location.href = '/pages/dashboard.html';
        }, 1000);

    } catch (err) {
        console.error(err);
        showToast('Something went wrong', 'error');
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
    }
}

// ===== PASSWORD TOGGLE =====
function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        input.type = 'password';
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}

// ===== ENTER KEY SUPPORT =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
});

// ===== GUEST CHECK =====
document.addEventListener('DOMContentLoaded', requireGuest);