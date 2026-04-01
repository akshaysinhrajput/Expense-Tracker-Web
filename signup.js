// ===== SIGNUP =====
async function signup() {
    const btn = document.getElementById('signupBtn');
    const loader = document.getElementById('loader');

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // ===== VALIDATION =====
    if (!fullName) {
        showToast('Full name is required', 'error');
        return;
    }

    if (!email) {
        showToast('Email is required', 'error');
        return;
    }

    if (!password) {
        showToast('Password is required', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    btn.disabled = true;
    loader.style.display = 'inline-block';

    try {
        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) {
            showToast(error.message, 'error');
            return;
        }

        showToast('Account created! Please check your email to verify.', 'success');

        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 2500);

    } catch (err) {
        console.error(err);
        showToast('Something went wrong', 'error');
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
    }
}

// ===== PASSWORD TOGGLE =====
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

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
    if (e.key === 'Enter') signup();
});

// ===== GUEST CHECK =====
document.addEventListener('DOMContentLoaded', requireGuest);