// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem('shoestore-cart')) || [];

// ===== WISHLIST HELPERS =====
function getWishlistKey() {
  const user = JSON.parse(localStorage.getItem('shoestore-user') || 'null');
  return 'shoestore-wishlist-' + (user ? user.id : 'guest');
}
function getWishlist() {
  return JSON.parse(localStorage.getItem(getWishlistKey()) || '[]');
}
function saveWishlist(list) {
  localStorage.setItem(getWishlistKey(), JSON.stringify(list));
}
function isWishlisted(productId) {
  return getWishlist().some(item => item._id === productId);
}
function toggleWishlistItem(product) {
  let list = getWishlist();
  const idx = list.findIndex(item => item._id === product._id);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(product);
  }
  saveWishlist(list);
  return idx === -1; // returns true if added, false if removed
}

// ===== CART TOGGLE =====
function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

// ===== MOBILE MENU =====
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
}

// ===== ADD TO CART =====
function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart();
  renderCart();
  toggleCart();
}

// ===== REMOVE FROM CART =====
function removeFromCart(name) {
  cart = cart.filter(item => item.name !== name);
  saveCart();
  renderCart();
}

// ===== SAVE CART =====
function saveCart() {
  localStorage.setItem('shoestore-cart', JSON.stringify(cart));
}

// ===== RENDER CART =====
function renderCart() {
  const container = document.getElementById('cartItems');
  const totalEl   = document.getElementById('cartTotal');
  const countEl   = document.getElementById('cartCount');

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Your Cart is Empty</p>';
    if (totalEl) totalEl.textContent = '£0.00';
    if (countEl) countEl.textContent = '0';
    return;
  }

  let total = 0, totalQty = 0;
  container.innerHTML = '';

  cart.forEach(item => {
    total    += item.price * item.qty;
    totalQty += item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div style="font-size:0.8rem;color:#888">x${item.qty}</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.8rem">
        <span class="cart-item-price">£${(item.price * item.qty).toFixed(2)}</span>
        <button class="cart-item-remove" onclick="removeFromCart('${item.name}')">✕</button>
      </div>`;
    container.appendChild(div);
  });

  if (totalEl) totalEl.textContent = `£${total.toFixed(2)}`;
  if (countEl) countEl.textContent = totalQty;
}

// ===== APPLY COUPON =====
function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  if (code === 'SHOE10') {
    alert('Coupon applied! 10% discount added.');
  } else {
    alert('Invalid coupon code.');
  }
}

// ===== UPDATE NAVBAR BASED ON LOGIN =====
function updateNavAuth() {
  const user     = JSON.parse(localStorage.getItem('shoestore-user'));
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  if (user) {
    const loginBtn = navRight.querySelector('.btn-login');
    if (loginBtn) loginBtn.remove();

    if (!document.getElementById('userGreeting')) {
      const greeting = document.createElement('a');
      greeting.id        = 'userGreeting';
      greeting.href      = 'profile.html';
      greeting.innerHTML = `<i class="fas fa-user-circle"></i> ${user.name.split(' ')[0]}`;
      greeting.style.cssText = 'font-weight:600;font-size:0.9rem;color:var(--black);display:flex;align-items:center;gap:0.4rem;text-decoration:none;transition:color 0.3s;';
      greeting.onmouseover = () => greeting.style.color = 'var(--accent)';
      greeting.onmouseout  = () => greeting.style.color = 'var(--black)';

      const logoutBtn = document.createElement('button');
      logoutBtn.id          = 'logoutBtn';
      logoutBtn.textContent = 'Logout';
      logoutBtn.style.cssText = 'background:var(--accent);color:white;border:none;padding:0.45rem 1.2rem;border-radius:4px;font-size:0.85rem;font-weight:600;cursor:pointer;';
      logoutBtn.onclick = handleLogout;

      navRight.insertBefore(logoutBtn,  navRight.querySelector('.cart-icon'));
      navRight.insertBefore(greeting,   logoutBtn);
    }
  }
}

// ===== HANDLE LOGOUT =====
function handleLogout() {
  localStorage.removeItem('shoestore-user');
  localStorage.removeItem('shoestore-token');
  window.location.href = 'index.html';
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  updateNavAuth();
});