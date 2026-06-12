// ===== AUTH HEADERS =====
function authHeaders() {
  const token = localStorage.getItem('shoestore-token');
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') };
}
function authHeadersNoContent() {
  const token = localStorage.getItem('shoestore-token');
  return { 'Authorization': 'Bearer ' + (token || '') };
}

// ===== STATE =====
let allAdminProducts = [];
let deleteTargetId   = null;
let uploadedImages   = { image: '', image2: '', image3: '' };

const MEN_SIZES   = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13];
const WOMEN_SIZES = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const KIDS_SIZES  = ['10C','11C','12C','13C','1','2','3','4','5'];

// ===== CHECK ADMIN ACCESS =====
function checkAdminAccess() {
  const user  = JSON.parse(localStorage.getItem('shoestore-user') || 'null');
  const token = localStorage.getItem('shoestore-token');
  if (!user || !token || user.role !== 'admin') {
    alert('Access denied. Admins only.');
    window.location.href = 'login.html';
    return false;
  }
  document.getElementById('adminName').textContent = user.name;
  return true;
}

// ===== FETCH ALL PRODUCTS =====
async function fetchProducts() {
  try {
    const res = await fetch('/api/admin/products', { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      alert('Session expired. Please login again.');
      window.location.href = 'login.html';
      return;
    }
    allAdminProducts = await res.json();
    renderDashboard();
    renderProductsTable(allAdminProducts);
  } catch (err) {
    console.error('Failed to fetch:', err);
  }
}

// ===== SHOW SECTION =====
function showSection(name, btnEl) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.remove('hidden');
  const titles = { dashboard: 'Dashboard', products: 'Products', add: 'Add Product' };
  document.getElementById('topbarTitle').textContent = titles[name] || name;
  if (btnEl) btnEl.classList.add('active');
  if (name === 'products')  renderProductsTable(allAdminProducts);
  if (name === 'dashboard') renderDashboard();
  if (name === 'add') {
    document.getElementById('formTitle').textContent     = 'Add New Product';
    document.getElementById('submitBtnText').textContent = 'Save Product';
    document.getElementById('editProductId').value       = '';
  }
}

// ===== DASHBOARD =====
function renderDashboard() {
  const men   = allAdminProducts.filter(p => p.gender === 'men').length;
  const women = allAdminProducts.filter(p => p.gender === 'women').length;
  const kids  = allAdminProducts.filter(p => p.gender === 'kids').length;
  document.getElementById('dashTotalProducts').textContent = allAdminProducts.length;
  document.getElementById('dashMen').textContent           = men;
  document.getElementById('dashWomen').textContent         = women;
  document.getElementById('dashKids').textContent          = kids;
  const recent = allAdminProducts.slice(0, 5);
  document.getElementById('dashRecentProducts').innerHTML = recent.length > 0
    ? miniTable(recent)
    : '<p class="no-data">No products yet. <button onclick="showSection(\'add\', null)" class="link-btn">Add your first product</button></p>';
}

function miniTable(products) {
  return `<div class="table-wrap"><table class="admin-table">
    <thead><tr><th>Name</th><th>Category</th><th>Gender</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
    <tbody>${products.map(p => tableRow(p)).join('')}</tbody>
  </table></div>`;
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  const noMsg = document.getElementById('noProductsMsg');
  if (products.length === 0) { tbody.innerHTML = ''; noMsg.classList.remove('hidden'); return; }
  noMsg.classList.add('hidden');
  tbody.innerHTML = products.map(p => tableRow(p)).join('');
}

function tableRow(p) {
  const stockClass = p.stock === 0 ? 'stock-out' : p.stock <= 5 ? 'stock-low' : 'stock-ok';
  const thumb = p.image
    ? `<img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-right:8px;vertical-align:middle;"/>`
    : `<span class="no-img-thumb"><i class="fas fa-shoe-prints"></i></span>`;
  return `<tr>
    <td>${thumb}<strong>${p.name}</strong></td>
    <td><span class="cat-pill">${p.category}</span></td>
    <td><span class="gender-pill gender-${p.gender}">${p.gender}</span></td>
    <td>£${parseFloat(p.price).toFixed(2)}</td>
    <td><span class="${stockClass}">${p.stock}</span></td>
    <td>${p.badge ? `<span class="badge-pill">${p.badge}</span>` : '—'}</td>
    <td><div class="action-btns">
      <button class="btn-edit"   onclick="editProduct('${p._id}')"><i class="fas fa-edit"></i> Edit</button>
      <button class="btn-delete" onclick="openDeleteModal('${p._id}')"><i class="fas fa-trash"></i> Delete</button>
    </div></td>
  </tr>`;
}

function filterAdminProducts() {
  const search = document.getElementById('adminSearch').value.toLowerCase();
  const gender = document.getElementById('adminGenderFilter').value;
  const cat    = document.getElementById('adminCatFilter').value;
  const filtered = allAdminProducts.filter(p =>
    p.name.toLowerCase().includes(search) &&
    (gender === 'all' || p.gender === gender) &&
    (cat    === 'all' || p.category === cat)
  );
  renderProductsTable(filtered);
}

// ===== IMAGE UPLOAD — single image slot =====
async function uploadSingleImage(inputId) {
  const input = document.getElementById(inputId);
  const file  = input.files[0];
  if (!file) return null;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res  = await fetch('/api/admin/upload', {
      method: 'POST', headers: authHeadersNoContent(), body: formData
    });
    const data = await res.json();
    if (res.ok) return data.imageUrl;
    else { showMsg('formError', 'Upload failed: ' + data.message); return null; }
  } catch (err) {
    showMsg('formError', 'Image upload error.'); return null;
  }
}

// Preview image when file selected
function previewImage(input, previewId, placeholderId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview     = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// Remove a specific image slot
function removeImage(slot) {
  uploadedImages[slot] = '';
  const slotNum = slot === 'image' ? '1' : slot === 'image2' ? '2' : '3';
  document.getElementById('fImage'    + (slotNum === '1' ? '' : slotNum)).value = '';
  document.getElementById('preview'   + slotNum).src = '';
  document.getElementById('preview'   + slotNum).classList.add('hidden');
  document.getElementById('placeholder' + slotNum).classList.remove('hidden');
  document.getElementById('currentImg' + slotNum + 'Wrap').classList.add('hidden');
}

// ===== SIZE OPTIONS =====
function updateSizeOptions() {
  const gender    = document.getElementById('fGender').value;
  const container = document.getElementById('sizeCheckboxes');
  const label     = document.getElementById('sizeGuideLabel');
  if (!gender) { container.innerHTML = '<p class="select-gender-msg">Please select a gender above.</p>'; return; }
  const sizes = gender === 'men' ? MEN_SIZES : gender === 'women' ? WOMEN_SIZES : KIDS_SIZES;
  const unit  = gender === 'kids' ? '' : 'UK ';
  label.textContent = gender === 'kids' ? '(Junior UK sizing)' : '(UK sizing)';
  const currentSelected = [...document.querySelectorAll('.size-checkbox:checked')].map(cb => cb.value);
  container.innerHTML = sizes.map(s => `
    <label class="size-check-label">
      <input type="checkbox" class="size-checkbox" value="${s}" ${currentSelected.includes(String(s)) ? 'checked' : ''}/>
      ${unit}${s}
    </label>`).join('');
}

// ===== COLOURS =====
function addColourRow() {
  const container = document.getElementById('colourInputs');
  const row = document.createElement('div');
  row.className = 'colour-row';
  row.innerHTML = `
    <input type="color" class="colour-picker" value="#ff0000"/>
    <input type="text" class="colour-name-input" placeholder="Colour name e.g. Red"/>
    <button type="button" class="btn-remove-colour" onclick="removeColourRow(this)"><i class="fas fa-times"></i></button>`;
  container.appendChild(row);
}
function removeColourRow(btn) {
  if (document.querySelectorAll('.colour-row').length > 1) btn.parentElement.remove();
}

// ===== MESSAGES =====
function showMsg(type, text) {
  const el = document.getElementById(type);
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ===== RESET FORM =====
function resetForm() {
  ['editProductId','fName','fPrice','fStock','fBadge','fDescription',
   'fMaterial','fSole','fClosure','fWeight'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fCategory').value = '';
  document.getElementById('fGender').value   = '';
  document.getElementById('sizeCheckboxes').innerHTML =
    '<p class="select-gender-msg">Please select a gender above to see size options.</p>';
  document.getElementById('colourInputs').innerHTML = `
    <div class="colour-row">
      <input type="color" class="colour-picker" value="#222222"/>
      <input type="text" class="colour-name-input" placeholder="Colour name e.g. Black"/>
      <button type="button" class="btn-remove-colour" onclick="removeColourRow(this)"><i class="fas fa-times"></i></button>
    </div>`;

  // Reset all 3 image slots
  uploadedImages = { image: '', image2: '', image3: '' };
  ['', '2', '3'].forEach((n, i) => {
    const slot = i === 0 ? '' : n;
    const inputId = 'fImage' + (i === 0 ? '' : n);
    if (document.getElementById(inputId)) document.getElementById(inputId).value = '';
    document.getElementById('preview' + (i + 1)).src = '';
    document.getElementById('preview' + (i + 1)).classList.add('hidden');
    document.getElementById('placeholder' + (i + 1)).classList.remove('hidden');
    document.getElementById('currentImg' + (i + 1) + 'Wrap').classList.add('hidden');
  });

  document.getElementById('formTitle').textContent     = 'Add New Product';
  document.getElementById('submitBtnText').textContent = 'Save Product';
}

// ===== EDIT PRODUCT =====
async function editProduct(id) {
  showSection('add', null);
  document.getElementById('formTitle').textContent     = 'Edit Product';
  document.getElementById('submitBtnText').textContent = 'Update Product';

  try {
    const res = await fetch('/api/admin/products/' + id, { headers: authHeaders() });
    const p   = await res.json();

    document.getElementById('editProductId').value = p._id;
    document.getElementById('fName').value         = p.name;
    document.getElementById('fPrice').value        = p.price;
    document.getElementById('fCategory').value     = p.category;
    document.getElementById('fGender').value       = p.gender;
    document.getElementById('fStock').value        = p.stock;
    document.getElementById('fBadge').value        = p.badge       || '';
    document.getElementById('fDescription').value  = p.description || '';
    document.getElementById('fMaterial').value     = p.material    || '';
    document.getElementById('fSole').value         = p.sole        || '';
    document.getElementById('fClosure').value      = p.closure     || '';
    document.getElementById('fWeight').value       = p.weight      || '';

    // Set uploaded image state
    uploadedImages = {
      image:  p.image  || '',
      image2: p.image2 || '',
      image3: p.image3 || '',
    };

    // Show existing images in slots
    [
      { key: 'image',  num: '1' },
      { key: 'image2', num: '2' },
      { key: 'image3', num: '3' },
    ].forEach(({ key, num }) => {
      const wrap = document.getElementById('currentImg' + num + 'Wrap');
      const img  = document.getElementById('currentImg' + num);
      if (p[key]) {
        img.src = p[key];
        wrap.classList.remove('hidden');
      } else {
        wrap.classList.add('hidden');
      }
      // Reset upload inputs
      document.getElementById('fImage' + (num === '1' ? '' : num)).value = '';
      document.getElementById('preview' + num).classList.add('hidden');
      document.getElementById('placeholder' + num).classList.remove('hidden');
    });

    updateSizeOptions();
    if (p.sizes) p.sizes.forEach(s => {
      const cb = document.querySelector(`.size-checkbox[value="${s}"]`);
      if (cb) cb.checked = true;
    });

    if (p.colours && p.colours.length > 0) {
      document.getElementById('colourInputs').innerHTML = p.colours.map((hex, i) => `
        <div class="colour-row">
          <input type="color" class="colour-picker" value="${hex}"/>
          <input type="text" class="colour-name-input" value="${p.colourNames?.[i] || ''}"/>
          <button type="button" class="btn-remove-colour" onclick="removeColourRow(this)"><i class="fas fa-times"></i></button>
        </div>`).join('');
    }
  } catch (err) {
    showMsg('formError', 'Failed to load product.');
  }
}

// ===== SUBMIT PRODUCT =====
async function submitProduct() {
  const id       = document.getElementById('editProductId').value;
  const name     = document.getElementById('fName').value.trim();
  const price    = document.getElementById('fPrice').value;
  const category = document.getElementById('fCategory').value;
  const gender   = document.getElementById('fGender').value;

  if (!name || !price || !category || !gender) {
    showMsg('formError', 'Please fill in all required fields.');
    return;
  }

  // Upload any new images
  const slots = [
    { inputId: 'fImage',  key: 'image'  },
    { inputId: 'fImage2', key: 'image2' },
    { inputId: 'fImage3', key: 'image3' },
  ];
  for (const slot of slots) {
    const input = document.getElementById(slot.inputId);
    if (input && input.files.length > 0) {
      const url = await uploadSingleImage(slot.inputId);
      if (url) uploadedImages[slot.key] = url;
    }
  }

  const sizes          = [...document.querySelectorAll('.size-checkbox:checked')].map(cb => cb.value);
  const colours        = [...document.querySelectorAll('.colour-picker')].map(cp => cp.value);
  const colourNamesArr = [...document.querySelectorAll('.colour-name-input')].map(cn => cn.value.trim());

  const payload = {
    name, category, gender,
    price:       parseFloat(price),
    stock:       parseInt(document.getElementById('fStock').value) || 0,
    badge:       document.getElementById('fBadge').value.trim(),
    description: document.getElementById('fDescription').value.trim(),
    material:    document.getElementById('fMaterial').value.trim(),
    sole:        document.getElementById('fSole').value.trim(),
    closure:     document.getElementById('fClosure').value.trim(),
    weight:      document.getElementById('fWeight').value.trim(),
    image:       uploadedImages.image,
    image2:      uploadedImages.image2,
    image3:      uploadedImages.image3,
    sizes, colours, colourNames: colourNamesArr,
  };

  try {
    const url    = id ? '/api/admin/products/' + id : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    const data   = await res.json();
    if (res.ok) {
      showMsg('formSuccess', id ? '✅ Product updated!' : '✅ Product added!');
      resetForm();
      await fetchProducts();
    } else {
      showMsg('formError', data.message || 'Failed to save product.');
    }
  } catch (err) {
    showMsg('formError', 'Server error. Make sure the server is running.');
  }
}

// ===== DELETE =====
function openDeleteModal(id) { deleteTargetId = id; document.getElementById('deleteModal').classList.remove('hidden'); }
function closeDeleteModal()  { deleteTargetId = null; document.getElementById('deleteModal').classList.add('hidden'); }
async function confirmDelete() {
  if (!deleteTargetId) return;
  try {
    const res = await fetch('/api/admin/products/' + deleteTargetId, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) { closeDeleteModal(); await fetchProducts(); }
    else alert('Failed to delete product.');
  } catch (err) { alert('Server error.'); }
}

// ===== LOGOUT =====
function adminLogout() {
  localStorage.removeItem('shoestore-user');
  localStorage.removeItem('shoestore-token');
  window.location.href = 'login.html';
}

// ===== ON LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  if (checkAdminAccess()) fetchProducts();
});