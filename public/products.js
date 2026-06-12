const ITEMS_PER_PAGE = 8;
let currentPage      = 1;
let allProducts      = [];
let filteredProducts = [];

// ===== FETCH PRODUCTS FROM MONGODB =====
async function fetchProducts() {
  try {
    const res  = await fetch('/api/products');
    const data = await res.json();
    allProducts      = data;
    filteredProducts = [...allProducts];
    renderProducts();
    renderPagination();
  } catch (err) {
    document.getElementById('productsGrid').innerHTML =
      '<p class="no-products">Could not load products. Make sure the server is running.</p>';
  }
}

// ===== APPLY FILTERS =====
function applyFilters() {
  currentPage = 1;

  const search      = document.getElementById('searchInput').value.toLowerCase();
  const sort        = document.getElementById('sortSelect').value;
  const priceFilter = document.querySelector('input[name="price"]:checked').value;
  const checkedCats    = [...document.querySelectorAll('.filter-cat:checked')].map(cb => cb.value);
  const checkedGenders = [...document.querySelectorAll('.filter-gender:checked')].map(cb => cb.value);

  filteredProducts = allProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search);
    const matchCat    = checkedCats.length === 0    || checkedCats.includes(p.category);
    const matchGender = checkedGenders.length === 0 || checkedGenders.includes(p.gender);
    let matchPrice    = true;
    if      (priceFilter === '0-50')   matchPrice = p.price < 50;
    else if (priceFilter === '50-100') matchPrice = p.price >= 50 && p.price <= 100;
    else if (priceFilter === '100+')   matchPrice = p.price > 100;
    return matchSearch && matchCat && matchGender && matchPrice;
  });

  if (sort === 'price-low')       filteredProducts.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') filteredProducts.sort((a, b) => b.price - a.price);
  else if (sort === 'name-az')    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));

  renderProducts();
  renderPagination();
}

// ===== CLEAR FILTERS =====
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('sortSelect').value  = 'default';
  document.querySelectorAll('.filter-cat, .filter-gender').forEach(cb => cb.checked = false);
  document.querySelector('input[name="price"][value="all"]').checked = true;

  // Reset gender nav bar
  document.querySelectorAll('.gender-nav-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.gender-nav-btn');
  if (allBtn) allBtn.classList.add('active');

  applyFilters();
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const grid    = document.getElementById('productsGrid');
  const countEl = document.getElementById('productCount');
  const start   = (currentPage - 1) * ITEMS_PER_PAGE;
  const paged   = filteredProducts.slice(start, start + ITEMS_PER_PAGE);

  countEl.textContent = filteredProducts.length + ' Products';

  if (paged.length === 0) {
    grid.innerHTML = '<p class="no-products">No products found. Try different filters.</p>';
    return;
  }

  grid.innerHTML = paged.map(p => productCard(p)).join('');
}

// ===== PRODUCT CARD =====
function productCard(p) {
  const id     = p._id || p.id;
  const img    = p.image
    ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:220px;object-fit:cover;"/>`
    : `<div class="product-img-placeholder"><i class="fas fa-shoe-prints"></i></div>`;
  const gender = p.gender || '';

  return `
    <div class="product-card" onclick="window.location.href='product-detail.html?id=${id}'" style="cursor:pointer">
      <div class="product-img-wrap">
        ${img}
        ${gender ? `<span class="gender-tag gender-${gender}">${gender}</span>` : ''}
        <button class="quick-add" onclick="event.stopPropagation(); addToCart('${p.name}', ${p.price})">Add to Cart</button>
      </div>
      <div class="product-info">
        <h4>${p.name}</h4>
        <p class="product-cat">${p.category}</p>
        <span class="product-price">£${parseFloat(p.price).toFixed(2)}</span>
      </div>
    </div>`;
}

// ===== RENDER PAGINATION =====
function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const container  = document.getElementById('pagination');
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) html += `<button onclick="goToPage(${currentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button onclick="goToPage(${currentPage + 1})">Next →</button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderProducts();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== GENDER NAV BAR =====
function filterByGender(gender, btn) {
  document.querySelectorAll('.gender-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.filter-gender').forEach(cb => cb.checked = false);
  if (gender !== 'all') {
    const cb = document.querySelector(`.filter-gender[value="${gender}"]`);
    if (cb) cb.checked = true;
  }
  applyFilters();
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
});