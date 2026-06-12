// ===== SWITCH BETWEEN LOGIN / REGISTER TABS =====
function switchTab(tab, btnEl) {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(tab + 'Form').classList.remove('hidden');
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    document.querySelectorAll('.auth-tab').forEach(b => {
      if (b.textContent.toLowerCase() === tab) b.classList.add('active');
    });
  }
  document.getElementById('loginError').textContent    = '';
  document.getElementById('registerError').textContent = '';
}

// ===== SHOW / HIDE PASSWORD =====
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ===== SHOW ERROR =====
function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.style.display = 'block';
}

// ===== HANDLE LOGIN =====
async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    showError('loginError', 'Please fill in all fields.');
    return;
  }

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('shoestore-user',  JSON.stringify(data.user));
      localStorage.setItem('shoestore-token', data.token);

      // ===== REDIRECT BASED ON ROLE =====
      if (data.user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    } else {
      showError('loginError', data.message || 'Login failed. Please try again.');
    }
  } catch (err) {
    showError('loginError', 'Server error. Please try again later.');
  }
}

// ===== HANDLE REGISTER =====
async function handleRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const confirm  = document.getElementById('regConfirm').value.trim();

  if (!name || !email || !password || !confirm) {
    showError('registerError', 'Please fill in all fields.');
    return;
  }
  if (password.length < 6) {
    showError('registerError', 'Password must be at least 6 characters.');
    return;
  }
  if (password !== confirm) {
    showError('registerError', 'Passwords do not match.');
    return;
  }

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      alert('Account created! Please login.');
      switchTab('login', null);
    } else {
      showError('registerError', data.message || 'Registration failed.');
    }
  } catch (err) {
    showError('registerError', 'Server error. Please try again later.');
  }
}

// ===== CHECK IF ALREADY LOGGED IN =====
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('shoestore-user') || 'null');
  if (user) {
    // Already logged in — redirect based on role
    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'index.html';
    }
  }
});