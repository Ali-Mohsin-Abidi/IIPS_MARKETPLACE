// 1. STATE MANAGEMENT
let listings = JSON.parse(localStorage.getItem('iips_listings')) || [];

// 2. DOM ELEMENTS (Safely matched to your exact HTML)
const modal = document.getElementById('listingModal');
const openBtn = document.getElementById('openFormBtn');
const closeBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelFormBtn');
const listingForm = document.getElementById('listingForm');

const marketplaceSection = document.getElementById('marketplaceSection');
const managerSection = document.getElementById('managerSection');
const viewManagerBtn = document.getElementById('viewManagerBtn');

const listingsContainer = document.getElementById('listingsContainer');
const pendingListingsContainer = document.getElementById('pendingListingsContainer');
const pendingCount = document.getElementById('pendingCount');
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    renderListings(); // Re-render feed dynamically as user types
  });
}

// Helper to convert files into Base64 strings
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

// 3. MODAL CONTROLS
if (openBtn && modal) openBtn.addEventListener('click', () => modal.showModal());
if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.close());
if (cancelBtn && modal) cancelBtn.addEventListener('click', () => modal.close());

// Backdrop click close handling
if (modal) {
  modal.addEventListener('click', (e) => {
    const dialogDimensions = modal.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      modal.close();
    }
  });
}

// 4. NAVIGATION TOGGLE (Manager Dashboard vs Live Feed)
if (viewManagerBtn) {
  viewManagerBtn.addEventListener('click', () => {
    if (managerSection.hasAttribute('hidden')) {
      managerSection.removeAttribute('hidden');
      marketplaceSection.setAttribute('hidden', 'true');
      viewManagerBtn.textContent = '← Back to Marketplace';
    } else {
      managerSection.setAttribute('hidden', 'true');
      marketplaceSection.removeAttribute('hidden');
      renderListings(); // Refresh feed when returning
    }
  });
}

// 5. FORM SUBMISSION WITH FILE READERS
if (listingForm) {
  listingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      // Product Images Input
      const productFiles = document.getElementById('productPhotos').files;
      if (!productFiles || productFiles.length === 0) {
        alert('Please select at least one product image.');
        return;
      }

      // Seller Face Image Input
      const sellerFiles = document.getElementById('sellerphotos').files;
      let sellerPhotoBase64 = 'https://via.placeholder.com/150'; // fallback placeholder
      if (sellerFiles && sellerFiles.length > 0) {
        sellerPhotoBase64 = await readFileAsDataURL(sellerFiles[0]);
      }

      // Convert all product images to Base64 array
      const productImagesArray = await Promise.all(
        Array.from(productFiles).map(file => readFileAsDataURL(file))
      );

      // Create new listing object
      const newListing = {
        id: Date.now(),
        sellerName: document.getElementById('sellerName').value,
        sellerPhoto: sellerPhotoBase64,
        phone: document.getElementById('phone').value,
        whatsapp: document.getElementById('whatsapp').value,
        title: document.getElementById('title').value,
        price: document.getElementById('price').value,
        productPhotos: productImagesArray,
        usage: document.getElementById('usage').value,
        warranty: document.getElementById('warranty').value,
        description: document.getElementById('description').value,
        status: 'pending' // Enters review queue
      };

      listings.push(newListing);
      saveAndRefresh();

      listingForm.reset();
      modal.close();
      alert('Listing submitted successfully! Pending manager approval.');

    } catch (err) {
      console.error("Submission error:", err);
      alert("⚠️ File processing error: " + err.message);
    }
  });
}
const productPhotosInput = document.getElementById('productPhotos');
const previewContainer = document.getElementById('imagePreviewContainer');

if (productPhotosInput && previewContainer) {
  productPhotosInput.addEventListener('change', (e) => {
    previewContainer.innerHTML = ''; // Clear old previews
    const files = e.target.files;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const thumb = document.createElement('img');
        thumb.src = event.target.result;
        thumb.style.width = '60px';
        thumb.style.height = '60px';
        thumb.style.objectFit = 'cover';
        thumb.style.borderRadius = '4px';
        thumb.style.border = '1px solid #ccc';
        previewContainer.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    });
  });
}
window.openImageModal = function(imgSrc) {
  const modal = document.getElementById('imagePreviewModal');
  const fullImg = document.getElementById('fullImagePreview');
  if (modal && fullImg) {
    fullImg.src = imgSrc;
    modal.showModal();
  }
};
// 6. LOCAL STORAGE SAVE & RENDER TRIGGER
function saveAndRefresh() {
  try {
    localStorage.setItem('iips_listings', JSON.stringify(listings));
    renderListings();
  } catch (err) {
    console.error("Storage error:", err);
    alert("⚠️ Images selected are too large for browser memory. Try choosing smaller or fewer images.");
  }
}

// 7. APPROVE / REJECT ACTIONS
window.updateStatus = function(id, newStatus) {
  listings = listings.map(item => {
    if (item.id === id) item.status = newStatus;
    return item;
  });
  saveAndRefresh();
};

window.deleteListing = function(id) {
  listings = listings.filter(item => item.id !== id);
  saveAndRefresh();
};



 // 8. RENDER LISTINGS TO UI
function renderListings() {
  const pendingItems = listings.filter(item => item.status === 'pending');
  const approvedItems = listings.filter(item => item.status === 'approved');

  // Update Pending Count Badge
  if (pendingCount) pendingCount.textContent = pendingItems.length;

  // Render Approved Feed
// Render Approved Feed
  if (listingsContainer) {
    // Grab the current search query text (lowercase for case-insensitive matching)
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Filter approved items based on title or description match
    const filteredApprovedItems = approvedItems.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const descMatch = item.description.toLowerCase().includes(searchQuery);
      return titleMatch || descMatch;
    });

    if (filteredApprovedItems.length === 0) {
      listingsContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No matching listings found.</p>';
    } else {
      listingsContainer.innerHTML = filteredApprovedItems.map(item => `
        <div class="ad-card" data-id="${item.id}" style="border:1px solid #e0e0e0; padding:15px; margin-bottom:15px; border-radius:8px; display:flex; gap:15px; background:#fff; cursor:pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
          <img src="${item.productPhotos[0]}" alt="${item.title}" style="width:130px; height:130px; object-fit:cover; border-radius:6px;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; color:#555;">
              <img src="${item.sellerPhoto}" style="width:26px; height:26px; border-radius:50%; object-fit:cover;">
              <span style="font-size:0.9rem;">${item.sellerName}</span>
            </div>
            <h3 style="margin:0 0 5px 0; color:#222;">${item.title}</h3>
            <p style="color:#28a745; font-weight:bold; font-size:1.15rem; margin:0 0 6px 0;">₹${item.price}</p>
            <p style="margin:0 0 8px 0; font-size:0.85rem; color:#666;"><strong>Condition:</strong> ${item.usage}</p>
            <span style="background:#eef2f7; color:#0066cc; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">View Details →</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Render Manager Queue
  if (pendingListingsContainer) {
    if (pendingItems.length === 0) {
      pendingListingsContainer.innerHTML = '<p>No pending approvals in queue.</p>';
    } else {
      pendingListingsContainer.innerHTML = pendingItems.map(item => `
        <div class="card" style="border-left:5px solid orange; border:1px solid #ccc; padding:15px; margin-bottom:15px; border-radius:8px; display:flex; gap:15px; background:#fff;">
          <img src="${item.productPhotos[0]}" alt="${item.title}" style="width:120px; height:120px; object-fit:cover; border-radius:6px;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; color:#555;">
              <img src="${item.sellerPhoto}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">
              <span>Seller: <strong>${item.sellerName}</strong> (Ph: ${item.phone})</span>
            </div>
            <h3 style="margin:0 0 5px 0;">${item.title} - ₹${item.price}</h3>
            <p style="margin:0 0 5px 0;"><strong>Condition:</strong> ${item.usage} | <strong>Warranty:</strong> ${item.warranty}</p>
            <p style="margin:0 0 10px 0; color:#444;">${item.description}</p>
            <div>
              <button onclick="updateStatus(${item.id}, 'approved')" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-right:8px;">✅ Approve Listing</button>
              <button onclick="deleteListing(${item.id})" style="background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">❌ Reject / Delete</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

// Global Event Listener for clicking ad cards securely
if (listingsContainer) {
  listingsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.ad-card');
    if (card) {
      const id = Number(card.getAttribute('data-id'));
      openAdDetails(id);
    }
  });
}
// 9. OPEN AD DETAILS MODAL
window.openAdDetails = function(id) {
  const item = listings.find(l => l.id === id);
  if (!item) {
    console.error("Listing not found for ID:", id);
    return;
  }

  // Populate text fields safely
  document.getElementById('detailTitle').textContent = item.title;
  document.getElementById('detailPrice').textContent = '₹' + item.price;
  document.getElementById('detailUsage').textContent = item.usage;
  document.getElementById('detailWarranty').textContent = item.warranty;
  document.getElementById('detailDescription').textContent = item.description;
  document.getElementById('detailSellerName').textContent = item.sellerName;
  document.getElementById('detailSellerPhoto').src = item.sellerPhoto;

  // Set contact links
  document.getElementById('detailCallBtn').href = `tel:${item.phone}`;
  document.getElementById('detailWhatsappBtn').href = `https://wa.me/${item.whatsapp}?text=Hi%20${encodeURIComponent(item.sellerName)}%2C%20I%20saw%20your%20ad%20for%20${encodeURIComponent(item.title)}%20on%20IIPS%20Marketplace.`;

  // Set initial main image
  const mainImg = document.getElementById('detailMainImage');
  if (mainImg && item.productPhotos && item.productPhotos.length > 0) {
    mainImg.src = item.productPhotos[0];
  }

  // Populate thumbnail gallery switcher
  const thumbsContainer = document.getElementById('detailThumbnailsContainer');
  if (thumbsContainer && item.productPhotos) {
    thumbsContainer.innerHTML = item.productPhotos.map((photo, index) => `
      <img src="${photo}" onclick="document.getElementById('detailMainImage').src='${photo}'" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid ${index === 0 ? '#007bff' : 'transparent'};">
    `).join('');
  }

  // Show the modal
  const modal = document.getElementById('adDetailModal');
  if (modal) {
    modal.showModal();
  } else {
    console.error("Modal element #adDetailModal missing from index.html!");
  }
};
// Initial render on page load
renderListings();
