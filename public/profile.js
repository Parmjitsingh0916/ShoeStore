let currentUser = null;

// ===== WISHLIST HELPERS (defined here so profile doesn't depend on app.js) =====
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

// ===== LOAD USER =====
function loadUser() {
  const stored = localStorage.getItem('shoestore-user');
  if (!stored) { window.location.href = 'login.html'; return; }
  currentUser = JSON.parse(stored);

  const nameParts = currentUser.name.split(' ');
  document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent   = currentUser.name;
  document.getElementById('sidebarEmail').textContent  = currentUser.email;
  document.getElementById('welcomeName').textContent   = nameParts[0];

  document.getElementById('detailFirstName').value = nameParts[0] || '';
  document.getElementById('detailLastName').value  = nameParts.slice(1).join(' ') || '';
  document.getElementById('detailEmail').value     = currentUser.email;

  const savedAddr = JSON.parse(localStorage.getItem('shoestore-address') || '{}');
  if (savedAddr.line1) {
    document.getElementById('addrLine1').value    = savedAddr.line1    || '';
    document.getElementById('addrLine2').value    = savedAddr.line2    || '';
    document.getElementById('addrCity').value     = savedAddr.city     || '';
    document.getElementById('addrPostcode').value = savedAddr.postcode || '';
  }

  loadOrders();
  loadWishlist();
}

// ===== LOAD ORDERS =====
function loadOrders() {
  const userKey = 'shoestore-orders-' + (currentUser ? currentUser.id : 'guest');
  const orders  = JSON.parse(localStorage.getItem(userKey) || '[]');
  renderOrders(orders);
}

function renderOrders(orders) {
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById('totalOrders').textContent = orders.length;
  document.getElementById('totalSpent').textContent  = '£' + totalSpent.toFixed(2);

  document.getElementById('recentOrders').innerHTML = orders.length > 0
    ? orders.slice(0, 2).map(o => orderCard(o)).join('')
    : '<p class="no-orders">No orders yet. <a href="products.html">Start shopping!</a></p>';

  document.getElementById('allOrdersList').innerHTML = orders.length > 0
    ? orders.map(o => orderCard(o)).join('')
    : '<p class="no-orders">No orders yet. <a href="products.html">Start shopping!</a></p>';
}

function orderCard(order) {
  const statusClass = order.status === 'Delivered'  ? 'status-delivered'
                    : order.status === 'Processing' ? 'status-processing'
                    : order.status === 'Shipped'    ? 'status-shipped'
                    : 'status-pending';

  const itemsHtml = order.items.map(item => `
    <div class="order-item-row">
      <div class="order-item-icon"><i class="fas fa-shoe-prints"></i></div>
      <div class="order-item-info">
        <span class="order-item-name">${item.name}</span>
        <span class="order-item-qty">x${item.qty}</span>
      </div>
      <span class="order-item-price">£${(item.price * item.qty).toFixed(2)}</span>
    </div>`).join('');

  return `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <span class="order-ref">${order.ref}</span>
          <span class="order-date"><i class="fas fa-calendar-alt"></i> ${order.date}</span>
        </div>
        <span class="order-status ${statusClass}">${order.status}</span>
      </div>
      <div class="order-items-list">${itemsHtml}</div>
      <div class="order-card-footer">
        <span class="order-total">Total: <strong>£${order.total.toFixed(2)}</strong></span>
      </div>
    </div>`;
}

// ===== LOAD WISHLIST =====
function loadWishlist() {
  const wishlist = getWishlist();

  // Update stat count on overview
  const countEl = document.getElementById('wishlistCount');
  if (countEl) countEl.textContent = wishlist.length;

  const container = document.getElementById('wishlistItems');
  if (!container) return;

  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="wishlist-empty">
        <i class="fas fa-heart"></i>
        <p>Your wishlist is empty.</p>
        <a href="products.html" style="display:inline-block;margin-top:1rem;padding:0.7rem 1.5rem;
          background:var(--accent);color:white;border-radius:6px;font-weight:700;text-decoration:none;">
          Browse Products
        </a>
      </div>`;
    return;
  }

  container.innerHTML = wishlist.map(item => `
    <div class="wishlist-card" id="wishcard-${item._id}">
      <div class="wishlist-img">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}"/>`
          : `<div class="wishlist-img-placeholder"><i class="fas fa-shoe-prints"></i></div>`}
      </div>
      <div class="wishlist-info">
        <h4>${item.name}</h4>
        <p class="wishlist-cat">
          ${item.category}
          <span class="gender-tag-inline gender-${item.gender}">${item.gender}</span>
        </p>
        <span class="wishlist-price">£${parseFloat(item.price).toFixed(2)}</span>
      </div>
      <div class="wishlist-actions">
        <a href="product-detail.html?id=${item._id}" class="btn-view-product">
          <i class="fas fa-eye"></i> View
        </a>
        <button class="btn-add-from-wishlist" onclick="addToCartFromWishlist('${item.name}', ${item.price})">
          <i class="fas fa-shopping-bag"></i> Add to Cart
        </button>
        <button class="btn-remove-wishlist" onclick="removeFromWishlistProfile('${item._id}')" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>`).join('');
}

// ===== ADD TO CART FROM WISHLIST =====
function addToCartFromWishlist(name, price) {
  // Use app.js addToCart if available, otherwise do it manually
  if (typeof addToCart === 'function') {
    addToCart(name, price);
  } else {
    let cart = JSON.parse(localStorage.getItem('shoestore-cart') || '[]');
    const existing = cart.find(i => i.name === name);
    if (existing) existing.qty += 1;
    else cart.push({ name, price, qty: 1 });
    localStorage.setItem('shoestore-cart', JSON.stringify(cart));
    alert(name + ' added to cart!');
  }
}

// ===== REMOVE FROM WISHLIST =====
function removeFromWishlistProfile(productId) {
  let list = getWishlist();
  list     = list.filter(item => item._id !== productId);
  saveWishlist(list);

  const card = document.getElementById('wishcard-' + productId);
  if (card) {
    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity    = '0';
    card.style.transform  = 'translateX(20px)';
    setTimeout(() => loadWishlist(), 350);
  }
}

// ===== SWITCH TAB =====
function switchTab(tabName, btnEl) {
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.profile-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.remove('hidden');
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    document.querySelectorAll('.profile-nav-btn').forEach(b => {
      if (b.textContent.trim().toLowerCase().includes(tabName)) b.classList.add('active');
    });
  }
  // Always refresh wishlist when switching to it
  if (tabName === 'wishlist') loadWishlist();
}

// ===== SAVE DETAILS =====
function saveDetails() {
  const first = document.getElementById('detailFirstName').value.trim();
  const last  = document.getElementById('detailLastName').value.trim();
  const email = document.getElementById('detailEmail').value.trim();
  if (!first || !email) { alert('Please fill in your name and email.'); return; }

  currentUser.name  = first + ' ' + last;
  currentUser.email = email;
  localStorage.setItem('shoestore-user', JSON.stringify(currentUser));
  document.getElementById('sidebarName').textContent   = currentUser.name;
  document.getElementById('sidebarEmail').textContent  = currentUser.email;
  document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('welcomeName').textContent   = first;

  const msg = document.getElementById('detailsSuccess');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
}

// ===== SAVE ADDRESS =====
function saveAddress() {
  const addr = {
    line1:    document.getElementById('addrLine1').value.trim(),
    line2:    document.getElementById('addrLine2').value.trim(),
    city:     document.getElementById('addrCity').value.trim(),
    postcode: document.getElementById('addrPostcode').value.trim(),
    country:  document.getElementById('addrCountry').value,
  };
  if (!addr.line1 || !addr.city || !addr.postcode) {
    alert('Please fill in required address fields.'); return;
  }
  localStorage.setItem('shoestore-address', JSON.stringify(addr));
  const msg = document.getElementById('addressSuccess');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
}

// ===== CHANGE PASSWORD =====
async function changePassword() {
  const current = document.getElementById('currentPw').value.trim();
  const newPw   = document.getElementById('newPw').value.trim();
  const confirm = document.getElementById('confirmPw').value.trim();
  const errEl   = document.getElementById('pwError');
  const sucEl   = document.getElementById('pwSuccess');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  if (!current || !newPw || !confirm) {
    errEl.textContent = 'Please fill in all fields.'; errEl.classList.remove('hidden'); return;
  }
  if (newPw.length < 6) {
    errEl.textContent = 'Min 6 characters.'; errEl.classList.remove('hidden'); return;
  }
  if (newPw !== confirm) {
    errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('hidden'); return;
  }

  try {
    const token = localStorage.getItem('shoestore-token');
    const res   = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
      body: JSON.stringify({ email: currentUser.email, currentPassword: current, newPassword: newPw })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('currentPw').value = '';
      document.getElementById('newPw').value     = '';
      document.getElementById('confirmPw').value = '';
      sucEl.classList.remove('hidden');
      setTimeout(() => sucEl.classList.add('hidden'), 3000);
    } else {
      errEl.textContent = data.message || 'Failed.'; errEl.classList.remove('hidden');
    }
  } catch (err) {
    errEl.textContent = 'Server error.'; errEl.classList.remove('hidden');
  }
}

// ===== LOGOUT =====
function handleLogout() {
  localStorage.removeItem('shoestore-user');
  localStorage.removeItem('shoestore-token');
  window.location.href = 'index.html';
}

// ===== ON LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
});