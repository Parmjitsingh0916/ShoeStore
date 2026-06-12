// ===== STEP NAVIGATION =====
function goToStep(step) {
  if (step === 2 && !validateStep1()) return;
  if (step === 3 && !validateStep2()) return;

  document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step' + step).classList.remove('hidden');

  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 < step) s.classList.add('done');
    if (i + 1 === step) s.classList.add('active');
  });

  if (step === 3) fillConfirmation();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== VALIDATE STEP 1 =====
function validateStep1() {
  const fields = ['firstName', 'lastName', 'checkoutEmail', 'phone', 'address1', 'city', 'postcode'];
  for (const id of fields) {
    if (!document.getElementById(id).value.trim()) {
      showCheckoutError('step1Error', 'Please fill in all required fields.');
      return false;
    }
  }
  document.getElementById('step1Error').textContent = '';
  return true;
}

// ===== VALIDATE STEP 2 =====
function validateStep2() {
  const cardNum = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const expiry  = document.getElementById('cardExpiry').value.trim();
  const cvv     = document.getElementById('cardCvv').value.trim();
  const name    = document.getElementById('cardName').value.trim();

  if (!name) { showCheckoutError('step2Error', 'Please enter the name on your card.'); return false; }
  if (cardNum.length !== 16) { showCheckoutError('step2Error', 'Please enter a valid 16-digit card number.'); return false; }
  if (!/^\d{2}\/\d{2}$/.test(expiry)) { showCheckoutError('step2Error', 'Please enter a valid expiry date (MM/YY).'); return false; }

  // Expiry date validation — must not be in the past
  const [monthStr, yearStr] = expiry.split('/');
  const month = parseInt(monthStr, 10);
  const year  = parseInt('20' + yearStr, 10);

  if (month < 1 || month > 12) { showCheckoutError('step2Error', 'Invalid month. Please enter a valid expiry date.'); return false; }

  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    showCheckoutError('step2Error', 'Your card has expired. Please use a different card.'); return false;
  }

  if (cvv.length !== 3) { showCheckoutError('step2Error', 'Please enter a valid 3-digit CVV.'); return false; }

  document.getElementById('step2Error').textContent = '';
  return true;
}

// ===== SHOW ERROR =====
function showCheckoutError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
}

// ===== FORMAT CARD NUMBER =====
function formatCard(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

// ===== FORMAT EXPIRY =====
function formatExpiry(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 4);
  if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
  input.value = val;
}

// ===== FILL CONFIRMATION =====
function fillConfirmation() {
  const first    = document.getElementById('firstName').value;
  const last     = document.getElementById('lastName').value;
  const address1 = document.getElementById('address1').value;
  const address2 = document.getElementById('address2').value;
  const city     = document.getElementById('city').value;
  const postcode = document.getElementById('postcode').value;
  const cardNum  = document.getElementById('cardNumber').value;

  document.getElementById('confirmAddress').innerHTML =
    `${first} ${last}<br>${address1}${address2 ? ', ' + address2 : ''}<br>${city}, ${postcode}`;
  document.getElementById('confirmCard').textContent =
    'Card ending in ' + cardNum.replace(/\s/g, '').slice(-4);

  const cart = JSON.parse(localStorage.getItem('shoestore-cart')) || [];
  const itemsEl = document.getElementById('confirmItems');
  itemsEl.innerHTML = cart.map(item =>
    `<div class="confirm-item">
      <span>${item.name} x${item.qty}</span>
      <span>£${(item.price * item.qty).toFixed(2)}</span>
    </div>`).join('');

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.getElementById('confirmTotal').textContent = '£' + total.toFixed(2);
}

// ===== RENDER SUMMARY SIDEBAR =====
function renderSummary() {
  const cart      = JSON.parse(localStorage.getItem('shoestore-cart')) || [];
  const container = document.getElementById('summaryItems');

  if (cart.length === 0) {
    container.innerHTML = '<p style="color:#888;font-size:0.9rem;">Your cart is empty.</p>';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    return `<div class="summary-item">
      <span>${item.name} <em>x${item.qty}</em></span>
      <span>£${subtotal.toFixed(2)}</span>
    </div>`;
  }).join('');

  document.getElementById('summarySubtotal').textContent = '£' + total.toFixed(2);
  document.getElementById('summaryTotal').textContent    = '£' + total.toFixed(2);
  document.getElementById('summaryDelivery').textContent = total >= 50 ? 'Free' : '£3.99';
}

// ===== SAVE ORDER TO USER-SPECIFIC KEY =====
function saveOrderToHistory(cart, total, ref) {
  const user    = JSON.parse(localStorage.getItem('shoestore-user'));
  const userKey = 'shoestore-orders-' + (user ? user.id : 'guest');
  const existing = JSON.parse(localStorage.getItem(userKey) || '[]');

  const newOrder = {
    ref,
    date:   new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    status: 'Processing',
    total,
    items:  cart.map(i => ({ name: i.name, price: i.price, qty: i.qty }))
  };

  existing.unshift(newOrder);
  localStorage.setItem(userKey, JSON.stringify(existing));
}

// ===== PLACE ORDER =====
async function placeOrder() {
  const cart = JSON.parse(localStorage.getItem('shoestore-cart')) || [];
  if (cart.length === 0) {
    showCheckoutError('step3Error', 'Your cart is empty!');
    return;
  }

  const token     = localStorage.getItem('shoestore-token');
  const orderData = {
    items: cart,
    total: cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    delivery: {
      name:     document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
      address1: document.getElementById('address1').value,
      address2: document.getElementById('address2').value,
      city:     document.getElementById('city').value,
      postcode: document.getElementById('postcode').value,
      email:    document.getElementById('checkoutEmail').value,
      phone:    document.getElementById('phone').value,
    }
  };

  const ref = 'SS-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (token || '')
      },
      body: JSON.stringify(orderData)
    });

    // Save to user-specific order history
    saveOrderToHistory(cart, orderData.total, ref);

    // Clear cart
    localStorage.removeItem('shoestore-cart');

    document.getElementById('orderRef').textContent = 'Order reference: ' + ref;
    document.getElementById('successModal').classList.remove('hidden');

  } catch (err) {
    // Still save order locally if server unreachable
    saveOrderToHistory(cart, orderData.total, ref);
    localStorage.removeItem('shoestore-cart');
    document.getElementById('orderRef').textContent = 'Order reference: ' + ref;
    document.getElementById('successModal').classList.remove('hidden');
  }
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('shoestore-user');
  if (!user) {
    alert('Please login to checkout.');
    window.location.href = 'login.html';
    return;
  }

  const userData = JSON.parse(user);
  if (userData.email) {
    document.getElementById('checkoutEmail').value = userData.email;
  }

  renderSummary();
});