let currentProduct = null;
let selectedColour = null;
let selectedSize   = null;
let quantity       = 1;
let allProducts    = [];

// ===== FETCH PRODUCT FROM MONGODB =====
async function fetchProduct() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  try {
    const res     = await fetch('/api/products/' + id);
    currentProduct = await res.json();

    const resAll  = await fetch('/api/products');
    allProducts   = await resAll.json();

    loadProduct();
  } catch (err) {
    document.querySelector('.product-detail-section').innerHTML =
      '<p style="padding:3rem;color:#888;">Could not load product. Make sure the server is running.</p>';
  }
}

// ===== SIZE LABEL =====
function sizeLabel(size, gender) {
  return gender === 'kids' ? size : 'UK ' + size;
}

// ===== RENDER STARS =====
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '<i class="fas fa-star"></i>'.repeat(full) +
         (half ? '<i class="fas fa-star-half-alt"></i>' : '') +
         '<i class="far fa-star"></i>'.repeat(empty);
}

// ===== LOAD PRODUCT =====
function loadProduct() {
  const p = currentProduct;
  if (!p) return;

  document.getElementById('breadcrumbName').textContent = p.name;
  document.title = p.name + ' — ShoeStore';

  // Badges
  let badges = '';
  if (p.badge)  badges += `<span class="product-badge">${p.badge}</span>`;
  if (p.gender) badges += `<span class="product-badge" style="background:#444">${p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}</span>`;
  document.getElementById('productBadges').innerHTML = badges;

  document.getElementById('productName').textContent        = p.name;
  document.getElementById('productPrice').textContent       = '£' + parseFloat(p.price).toFixed(2);
  document.getElementById('productDescription').textContent = p.description || '';

  const rating  = p.rating  || 0;
  const reviews = p.reviews || 0;
  document.querySelector('.product-rating').innerHTML =
    renderStars(rating) + `<span>${rating} (${reviews} reviews)</span>`;

  document.getElementById('productCategory').textContent =
    p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : '';
  document.getElementById('productStock').textContent =
    p.stock > 10 ? 'In Stock (' + p.stock + ')'
    : p.stock > 0 ? 'Low Stock (' + p.stock + ' left)'
    : 'Out of Stock';

  document.getElementById('tabDescription').textContent = p.description || '';
  document.getElementById('detailMaterial').textContent = p.material  || '—';
  document.getElementById('detailSole').textContent     = p.sole      || '—';
  document.getElementById('detailClosure').textContent  = p.closure   || '—';
  document.getElementById('detailCategory').textContent =
    p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : '—';
  document.getElementById('detailWeight').textContent   = p.weight    || '—';

  // Colours
  const colours     = p.colours     || [];
  const colourNames = p.colourNames || [];
  const colourContainer = document.getElementById('colourOptions');
  colourContainer.innerHTML = colours.length > 0
    ? colours.map((hex, i) => `
        <button class="colour-swatch" style="background:${hex}"
          title="${colourNames[i] || hex}"
          onclick="selectColour('${colourNames[i] || hex}', this)">
        </button>`).join('')
    : '<span style="color:#888;font-size:0.85rem;">No colours specified</span>';

  // Sizes
  const sizes = p.sizes || [];
  const sizeContainer = document.getElementById('sizeOptions');
  sizeContainer.innerHTML = sizes.length > 0
    ? sizes.map(s => `
        <button class="size-btn" onclick="selectSize('${s}', this)">
          ${sizeLabel(s, p.gender)}
        </button>`).join('')
    : '<span style="color:#888;font-size:0.85rem;">No sizes specified</span>';

  // Update size label
  document.querySelectorAll('.selector-group label').forEach(lbl => {
    if (lbl.textContent.includes('Size')) {
      lbl.innerHTML = (p.gender === 'kids' ? 'Size (Junior UK):' : 'Size (UK):') +
                      ' <strong id="selectedSize">—</strong>';
    }
  });

  // Images gallery
  const images = [p.image, p.image2, p.image3].filter(Boolean);
  const mainImg = document.getElementById('mainImage');
  if (images.length > 0) {
    mainImg.innerHTML = `<img id="mainImgTag" src="${images[0]}" alt="${p.name}"
      style="width:100%;height:460px;object-fit:cover;border-radius:12px;"/>`;
  } else {
    mainImg.innerHTML = `<div class="product-img-placeholder large-placeholder"><i class="fas fa-shoe-prints"></i></div>`;
  }

  // Thumbnails
  const thumbs = document.getElementById('galleryThumbs');
  if (images.length > 0) {
    thumbs.innerHTML = images.map((src, i) => `
      <div class="thumb ${i === 0 ? 'active' : ''}" onclick="switchMainImage('${src}', this)">
        <img src="${src}" alt="View ${i+1}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;"/>
      </div>`).join('');
    for (let i = images.length; i < 3; i++) {
      thumbs.innerHTML += `<div class="thumb"><div class="product-img-placeholder thumb-placeholder"><i class="fas fa-shoe-prints"></i></div></div>`;
    }
  } else {
    thumbs.innerHTML = [1,2,3].map((_, i) => `
      <div class="thumb ${i === 0 ? 'active' : ''}">
        <div class="product-img-placeholder thumb-placeholder"><i class="fas fa-shoe-prints"></i></div>
      </div>`).join('');
  }

  // Set wishlist button state
  updateWishlistBtn();

  renderReviews(p);
  renderRelated(p);
}

// ===== WISHLIST BUTTON STATE =====
function updateWishlistBtn() {
  const btn = document.getElementById('wishlistBtn');
  if (!btn || !currentProduct) return;
  const wishlisted = isWishlisted(currentProduct._id);
  btn.innerHTML = wishlisted
    ? '<i class="fas fa-heart" style="color:var(--accent)"></i>'
    : '<i class="far fa-heart"></i>';
  btn.title = wishlisted ? 'Remove from wishlist' : 'Add to wishlist';
}

// ===== TOGGLE WISHLIST =====
function toggleWishlist() {
  const user = localStorage.getItem('shoestore-user');
  if (!user) {
    alert('Please login to save items to your wishlist.');
    window.location.href = 'login.html';
    return;
  }

  const added = toggleWishlistItem({
    _id:      currentProduct._id,
    name:     currentProduct.name,
    price:    currentProduct.price,
    image:    currentProduct.image || '',
    category: currentProduct.category,
    gender:   currentProduct.gender,
  });

  updateWishlistBtn();

  // Show toast
  showWishlistToast(added ? 'Added to wishlist!' : 'Removed from wishlist');
}

// ===== WISHLIST TOAST =====
function showWishlistToast(msg) {
  let toast = document.getElementById('wishlistToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wishlistToast';
    toast.style.cssText = `
      position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
      background:var(--black); color:white; padding:0.7rem 1.5rem;
      border-radius:30px; font-size:0.9rem; font-weight:600;
      z-index:9999; opacity:0; transition:opacity 0.3s;
      display:flex; align-items:center; gap:0.5rem;`;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas fa-heart" style="color:var(--accent)"></i> ${msg}`;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ===== COLOUR / SIZE / QTY =====
function selectColour(name, btn) {
  selectedColour = name;
  document.getElementById('selectedColour').textContent = name;
  document.querySelectorAll('.colour-swatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function selectSize(size, btn) {
  selectedSize = size;
  document.getElementById('selectedSize').textContent = sizeLabel(size, currentProduct.gender);
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function changeQty(delta) {
  quantity = Math.max(1, Math.min(10, quantity + delta));
  document.getElementById('qtyDisplay').textContent = quantity;
}

// ===== GALLERY =====
function switchMainImage(src, thumb) {
  const mainImgTag = document.getElementById('mainImgTag');
  if (mainImgTag) mainImgTag.src = src;
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}
function selectThumb(thumb) {
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

// ===== ADD TO CART =====
function addProductToCart() {
  const colours = currentProduct.colours || [];
  const sizes   = currentProduct.sizes   || [];

  if (colours.length > 0 && !selectedColour) { alert('Please select a colour.'); return; }
  if (sizes.length   > 0 && !selectedSize)   { alert('Please select a size.');   return; }

  const details = [
    selectedColour || '',
    selectedSize   ? sizeLabel(selectedSize, currentProduct.gender) : ''
  ].filter(Boolean).join(', ');

  const name = details ? `${currentProduct.name} (${details})` : currentProduct.name;
  addToCart(name, currentProduct.price * quantity);

  const msg = document.getElementById('addMsg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 2500);
}

// ===== REVIEWS =====
function renderReviews(p) {
  const sampleReviews = [
    { name: 'James T.', rating: 5, text: 'Absolutely love these! Super comfortable and look great.', date: '2 weeks ago' },
    { name: 'Sarah M.', rating: 4, text: 'Great quality for the price. Fit is true to size.', date: '1 month ago' },
    { name: 'Raj P.',   rating: 5, text: 'Best shoes I have bought in years. Highly recommend!', date: '1 month ago' },
  ];
  document.getElementById('reviewsList').innerHTML = sampleReviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="reviewer-avatar">${r.name.charAt(0)}</div>
        <div><div class="reviewer-name">${r.name}</div><div class="review-stars">${renderStars(r.rating)}</div></div>
        <span class="review-date">${r.date}</span>
      </div>
      <p class="review-text">${r.text}</p>
    </div>`).join('');
}

// ===== RELATED PRODUCTS =====
function renderRelated(p) {
  const related = allProducts
    .filter(x => x.category === p.category && (x._id || x.id) !== (p._id || p.id))
    .slice(0, 4);

  document.getElementById('relatedGrid').innerHTML = related.length > 0
    ? related.map(r => {
        const rid = r._id || r.id;
        return `
          <div class="product-card" onclick="window.location.href='product-detail.html?id=${rid}'" style="cursor:pointer">
            <div class="product-img-wrap">
              ${r.image ? `<img src="${r.image}" alt="${r.name}" style="width:100%;height:220px;object-fit:cover;"/>` : `<div class="product-img-placeholder"><i class="fas fa-shoe-prints"></i></div>`}
              <span class="gender-tag gender-${r.gender}">${r.gender}</span>
              <button class="quick-add" onclick="event.stopPropagation(); addToCart('${r.name}', ${r.price})">Add to Cart</button>
            </div>
            <div class="product-info">
              <h4>${r.name}</h4>
              <p class="product-cat">${r.category}</p>
              <span class="product-price">£${parseFloat(r.price).toFixed(2)}</span>
            </div>
          </div>`;
      }).join('')
    : '<p style="color:#888;">No related products found.</p>';
}

// ===== PRODUCT TABS =====
function switchProductTab(tab, btn) {
  document.querySelectorAll('.product-tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.product-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  btn.classList.add('active');
}

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  fetchProduct();
});