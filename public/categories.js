let allProducts    = [];
let activeCategory = 'all';
let activeGender   = 'all';

// ===== FETCH PRODUCTS FROM MONGODB =====
async function fetchProducts() {
  try {
    const res  = await fetch('/api/products');
    const data = await res.json();
    allProducts = data;
    renderCategoryProducts();
    checkUrlParams();
  } catch (err) {
    document.getElementById('catProductsGrid').innerHTML =
      '<p class="no-products">Could not load products. Make sure the server is running.</p>';
  }
}

// ===== SELECT CATEGORY =====
function selectCategory(cat, btnEl) {
  activeCategory = cat;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  document.querySelectorAll('.cat-banner-card').forEach(c => c.classList.remove('active'));
  const banner = document.getElementById('banner-' + cat);
  if (banner) banner.classList.add('active');
  const titleEl = document.getElementById('catTitle');
  if (titleEl) titleEl.textContent = cat === 'all'
    ? 'All Products'
    : cat.charAt(0).toUpperCase() + cat.slice(1);
  renderCategoryProducts();
}

// ===== SELECT GENDER =====
function selectGender(gender, btnEl) {
  activeGender = gender;
  document.querySelectorAll('.gender-tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  // Also highlight gender card
  document.querySelectorAll('.gender-card').forEach(c => c.classList.remove('active'));
  const card = document.querySelector(`.gender-card[data-gender="${gender}"]`);
  if (card) card.classList.add('active');

  renderCategoryProducts();
}

// ===== RENDER PRODUCTS =====
function renderCategoryProducts() {
  const grid    = document.getElementById('catProductsGrid');
  const countEl = document.getElementById('productCount');

  const filtered = allProducts.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category === activeCategory;
    const matchGender = activeGender   === 'all' || p.gender   === activeGender;
    return matchCat && matchGender;
  });

  countEl.textContent = filtered.length + ' Products';

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-products">No products found in this category.</p>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const id  = p._id || p.id;
    const img = p.image
      ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:220px;object-fit:cover;"/>`
      : `<div class="product-img-placeholder"><i class="fas fa-shoe-prints"></i></div>`;

    return `
      <div class="product-card" onclick="window.location.href='product-detail.html?id=${id}'" style="cursor:pointer">
        <div class="product-img-wrap">
          ${img}
          <span class="gender-tag gender-${p.gender}">${p.gender}</span>
          <button class="quick-add" onclick="event.stopPropagation(); addToCart('${p.name}', ${p.price})">Add to Cart</button>
        </div>
        <div class="product-info">
          <h4>${p.name}</h4>
          <p class="product-cat">${p.category}</p>
          <span class="product-price">£${parseFloat(p.price).toFixed(2)}</span>
        </div>
      </div>`;
  }).join('');
}

// ===== CHECK URL PARAMS =====
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat    = params.get('cat');
  const gender = params.get('gender');

  if (cat) {
    activeCategory = cat;
    document.querySelectorAll('.tab-btn').forEach(b => {
      const matches = b.textContent.trim().toLowerCase().includes(cat);
      b.classList.toggle('active', matches);
    });
    const banner = document.getElementById('banner-' + cat);
    if (banner) banner.classList.add('active');
    const titleEl = document.getElementById('catTitle');
    if (titleEl) titleEl.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  if (gender) {
    activeGender = gender;
    document.querySelectorAll('.gender-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.gender === gender);
    });
    const card = document.querySelector(`.gender-card[data-gender="${gender}"]`);
    if (card) card.classList.add('active');
  }

  renderCategoryProducts();
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
});