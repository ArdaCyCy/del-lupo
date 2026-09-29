import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnGubOKlQvh8spOhtLalO4ez9J8yu0PpI",
  authDomain: "hoodie-store-9af27.firebaseapp.com",
  projectId: "hoodie-store-9af27",
  storageBucket: "hoodie-store-9af27.firebasestorage.app",
  messagingSenderId: "51378890059",
  appId: "1:51378890059:web:9ebd26be949320d6c5b4ce",
  measurementId: "G-Y1C8QYZVX1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const productList = document.getElementById("product-list");
const searchInput = document.getElementById("search-input");
const searchToggleBtn = document.getElementById("search-toggle-btn");
const searchModal = document.getElementById("search-modal");
const closeSearchModalBtn = document.getElementById("close-search-modal");
const modalSearchInput = document.getElementById("modal-search-input");
const modalSearchResults = document.getElementById("modal-search-results");

const sortSelect = document.getElementById("sort-select");
const cartCountEl = document.getElementById("cart-count");
const openCartBtn = document.getElementById("open-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartTotalEl = document.getElementById("cart-total");
const discountRow = document.getElementById("discount-row");
const cartDiscountEl = document.getElementById("cart-discount");
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const couponCodeInput = document.getElementById("coupon-code-input");
const couponMessage = document.getElementById("coupon-message");
const completeOrderBtn = document.getElementById("complete-order-btn");
const checkoutForm = document.getElementById("checkout-form");
const paymentMethodSelect = document.getElementById("payment-method-select");

const openSizeChartBtn = document.getElementById("open-size-chart-btn");
const closeSizeChartBtn = document.getElementById("close-size-chart-btn");
const sizeChartModal = document.getElementById("size-chart-modal");

const showWishlistBtn = document.getElementById("show-wishlist-btn");
const wishlistCountEl = document.getElementById("wishlist-count");

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("hoodie_cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("hoodie_wishlist")) || [];
let currentDiscountPercent = 0;
let currentUser = null;
let showingWishlistOnly = false;

// Steam Tarzı Navbar & Cüzdan Bakiyesi Entegrasyonu
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  const userAuthArea = document.getElementById("user-auth-area");
  if (!userAuthArea) return;

  if (user) {
    let walletBadgeHtml = `<a href="wallet.html" class="text-xs font-black text-amber-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg hover:border-zinc-700 transition" title="Cüzdan Bakiyesi">€0.00</a>`;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists() && userSnap.data().walletBalance !== undefined) {
        const bal = userSnap.data().walletBalance;
        walletBadgeHtml = `<a href="wallet.html" class="text-xs font-black text-amber-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg hover:border-zinc-700 transition" title="Cüzdan Bakiyesi">€${bal.toFixed(2)}</a>`;
      }
    } catch (e) {
      console.error(e);
    }

    userAuthArea.innerHTML = `
      <div class="flex items-center gap-3">
        ${walletBadgeHtml}
        <div class="relative">
          <button id="profile-menu-btn" class="text-zinc-300 hover:text-white transition flex items-center p-1 cursor-pointer" title="Hesabım">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </button>
          <div id="profile-dropdown" class="absolute right-0 mt-3 w-48 bg-[#111] border border-zinc-800 rounded-xl shadow-2xl py-2 hidden z-50">
            <a href="wallet.html" class="block px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-zinc-900 transition">💳 Cüzdanım</a>
            <a href="my-orders.html" class="block px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-900 transition">Siparişlerim</a>
            <a href="admin.html" class="block px-4 py-2.5 text-xs font-bold text-indigo-400 hover:bg-zinc-900 transition">Yönetim Paneli</a>
            <button id="logout-btn" class="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-red-400 hover:bg-zinc-900 transition cursor-pointer">Oturumu Kapat</button>
          </div>
        </div>
      </div>
    `;

    const profileBtn = document.getElementById("profile-menu-btn");
    const profileDropdown = document.getElementById("profile-dropdown");
    
    if (profileBtn && profileDropdown) {
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", () => {
        if (!profileDropdown.classList.contains("hidden")) {
          profileDropdown.classList.add("hidden");
        }
      });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
      });
    }
  } else {
    userAuthArea.innerHTML = `
      <a href="login.html" class="text-zinc-300 hover:text-white transition p-1 cursor-pointer" title="Giriş Yap">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </a>
    `;
  }
});

if (searchToggleBtn && searchModal) {
  searchToggleBtn.addEventListener("click", () => {
    searchModal.classList.remove("opacity-0", "pointer-events-none");
    if (modalSearchInput) { modalSearchInput.value = ""; modalSearchInput.focus(); renderModalSearchResults(""); }
  });
}
if (closeSearchModalBtn && searchModal) {
  closeSearchModalBtn.addEventListener("click", () => searchModal.classList.add("opacity-0", "pointer-events-none"));
}
if (modalSearchInput) {
  modalSearchInput.addEventListener("input", (e) => renderModalSearchResults(e.target.value.toLowerCase().trim()));
}

function renderModalSearchResults(query) {
  if (!modalSearchResults) return;
  modalSearchResults.innerHTML = "";
  if (!query) { modalSearchResults.innerHTML = "<p class='text-zinc-500 text-xs text-center py-4'>Aramak istediğiniz ürün adını yazın...</p>"; return; }
  const matches = allProducts.filter(p => p.name.toLowerCase().includes(query));
  if (matches.length === 0) { modalSearchResults.innerHTML = "<p class='text-zinc-500 text-xs text-center py-4'>Eşleşen parça bulunamadı.</p>"; return; }
  matches.forEach(p => {
    let img = p.images ? p.images[0] : p.image;
    const item = document.createElement("a");
    item.href = `product-detail.html?id=${p.id}`;
    item.className = "flex items-center justify-between bg-zinc-900/80 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-800 transition";
    item.innerHTML = `
      <div class="flex items-center gap-3"><img src="${img}" class="w-10 h-10 object-cover rounded-lg bg-zinc-950"><div><h4 class="font-bold text-white text-xs uppercase">${p.name}</h4><p class="text-[10px] text-zinc-400">€${p.price}</p></div></div>
      <span class="text-xs font-bold text-indigo-400 underline">İncele →</span>
    `;
    modalSearchResults.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", () => { fetchProducts(); updateCartUI(); updateWishlistUI(); });

async function fetchProducts() {
  if (!productList) return;
  try {
    const snap = await getDocs(collection(db, "products"));
    allProducts = [];
    snap.forEach(docSnap => allProducts.push({ id: docSnap.id, ...docSnap.data() }));
    renderProducts(allProducts);
  } catch (err) { console.error(err); }
}

function renderProducts(productsToRender) {
  if (!productList) return;
  productList.innerHTML = "";
  if (productsToRender.length === 0) { productList.innerHTML = "<p class='text-zinc-500 col-span-full text-center text-xs py-10'>Hiç ürün bulunamadı.</p>"; return; }

  productsToRender.forEach(p => {
    let mainImg = p.images ? p.images[0] : p.image;
    const isFav = wishlist.includes(p.id);
    const card = document.createElement("div");
    card.className = "group bg-[#111] border border-zinc-900 rounded-xl overflow-hidden relative flex flex-col justify-between hover:border-zinc-700 transition duration-300";
    card.innerHTML = `
      <div class="relative w-full h-80 overflow-hidden bg-zinc-950">
        <a href="product-detail.html?id=${p.id}" class="block w-full h-full"><img src="${mainImg}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500"></a>
        <button onclick="window.toggleWishlist('${p.id}')" class="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-black transition z-10 cursor-pointer">${isFav ? '❤️' : '🤍'}</button>
      </div>
      <div class="p-5 flex justify-between items-center">
        <div><a href="product-detail.html?id=${p.id}" class="font-bold text-white text-sm uppercase truncate block hover:underline">${p.name}</a><p class="text-zinc-400 text-xs font-semibold mt-1">€${p.price}</p></div>
        <a href="product-detail.html?id=${p.id}" class="bg-white text-black hover:bg-zinc-200 text-xs font-bold px-4 py-2.5 rounded-lg transition uppercase tracking-wider">İncele</a>
      </div>
    `;
    productList.appendChild(card);
  });
}

if (searchInput) searchInput.addEventListener("input", filterAndSortProducts);
if (sortSelect) sortSelect.addEventListener("change", filterAndSortProducts);

function filterAndSortProducts() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const sortVal = sortSelect ? sortSelect.value : "default";
  let filtered = allProducts.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query);
    const matchesWishlist = showingWishlistOnly ? wishlist.includes(p.id) : true;
    return matchesQuery && matchesWishlist;
  });
  if (sortVal === "price-asc") filtered.sort((a, b) => a.price - b.price);
  else if (sortVal === "price-desc") filtered.sort((a, b) => b.price - a.price);
  renderProducts(filtered);
}

window.toggleWishlist = function(id) {
  if (wishlist.includes(id)) wishlist = wishlist.filter(item => item !== id);
  else wishlist.push(id);
  localStorage.setItem("hoodie_wishlist", JSON.stringify(wishlist));
  updateWishlistUI();
  filterAndSortProducts();
};

function updateWishlistUI() { if (wishlistCountEl) wishlistCountEl.textContent = wishlist.length; }

if (openCartBtn && cartModal) openCartBtn.addEventListener("click", () => cartModal.classList.remove("opacity-0", "pointer-events-none"));
if (closeCartBtn && cartModal) closeCartBtn.addEventListener("click", () => cartModal.classList.add("opacity-0", "pointer-events-none"));

window.updateQty = function(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  else if (cart[index].qty > cart[index].maxStock) { alert("Maksimum stok sınırına ulaştınız!"); cart[index].qty = cart[index].maxStock; }
  localStorage.setItem("hoodie_cart", JSON.stringify(cart));
  updateCartUI();
};

window.removeItem = function(index) { cart.splice(index, 1); localStorage.setItem("hoodie_cart", JSON.stringify(cart)); updateCartUI(); };

function updateCartUI() {
  let totalCount = 0; let subtotal = 0;
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) { cartItemsContainer.innerHTML = "<p class='text-zinc-500 text-center py-8 text-xs'>Sepetiniz boş.</p>"; }
    else {
      cart.forEach((item, index) => {
        totalCount += item.qty; subtotal += item.price * item.qty;
        const div = document.createElement("div");
        div.className = "flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-900";
        div.innerHTML = `
          <div class="flex items-center gap-3"><img src="${item.image}" class="w-12 h-12 object-cover rounded-lg bg-zinc-900"><div><h4 class="font-bold text-white text-xs">${item.name}</h4><p class="text-[10px] text-zinc-400">Beden: <strong class="text-white">${item.size}</strong> | €${item.price}</p></div></div>
          <div class="flex items-center gap-2"><button onclick="window.updateQty(${index}, -1)" class="w-6 h-6 bg-zinc-900 text-white rounded font-bold hover:bg-zinc-800 cursor-pointer">-</button><span class="text-xs font-bold text-white">${item.qty}</span><button onclick="window.updateQty(${index}, 1)" class="w-6 h-6 bg-zinc-900 text-white rounded font-bold hover:bg-zinc-800 cursor-pointer">+</button><button onclick="window.removeItem(${index})" class="text-red-400 text-xs ml-2 hover:underline cursor-pointer">Sil</button></div>
        `;
        cartItemsContainer.appendChild(div);
      });
    }
  }
  if (cartCountEl) cartCountEl.textContent = totalCount;
  if (cartSubtotalEl) cartSubtotalEl.textContent = `€${subtotal.toFixed(2)}`;
  let discountAmount = (subtotal * currentDiscountPercent) / 100;
  let finalTotal = subtotal - discountAmount;
  if (discountRow && cartDiscountEl) {
    if (currentDiscountPercent > 0) { discountRow.classList.remove("hidden"); cartDiscountEl.textContent = `-€${discountAmount.toFixed(2)} (${currentDiscountPercent}%)`; }
    else { discountRow.classList.add("hidden"); }
  }
  if (cartTotalEl) cartTotalEl.textContent = `€${finalTotal.toFixed(2)}`;
}

if (applyCouponBtn) {
  applyCouponBtn.addEventListener("click", async () => {
    const code = couponCodeInput.value.trim().toUpperCase();
    if (!code) return;
    try {
      const couponDoc = await getDoc(doc(db, "coupons", code));
      if (couponDoc.exists() && couponDoc.data().active) {
        currentDiscountPercent = couponDoc.data().discountPercent;
        couponMessage.textContent = `Kupon uygulandı: %${currentDiscountPercent} indirim!`;
        couponMessage.className = "text-xs mt-1 text-emerald-400";
        couponMessage.classList.remove("hidden");
        updateCartUI();
      } else {
        couponMessage.textContent = "Geçersiz veya silinmiş kupon kodu.";
        couponMessage.className = "text-xs mt-1 text-red-400";
        couponMessage.classList.remove("hidden");
      }
    } catch (err) { console.error(err); }
  });
}

if (completeOrderBtn) {
  completeOrderBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (cart.length === 0) { alert("Sepetiniz boş!"); return; }

    const name = document.getElementById("cust-name").value.trim();
    const phone = document.getElementById("cust-phone").value.trim();
    const address = document.getElementById("cust-address").value.trim();
    const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : "wallet";

    if (!name || !phone || !address) { alert("Lütfen tüm teslimat alanlarını doldurun!"); return; }

    let subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    let discountAmount = (subtotal * currentDiscountPercent) / 100;
    let totalAmount = subtotal - discountAmount;

    if (paymentMethod === "wallet") {
      if (!currentUser) { alert("Cüzdan ile ödeme yapmak için giriş yapmalısınız!"); window.location.href = "login.html"; return; }
      
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      const balance = userSnap.exists() && userSnap.data().walletBalance !== undefined ? userSnap.data().walletBalance : 0;

      if (balance < totalAmount) {
        alert(`Cüzdan bakiyeniz yetersiz! (Mevcut Bakiye: €${balance.toFixed(2)}, Tutar: €${totalAmount.toFixed(2)}).\nLütfen Cüzdanım sayfasından bakiye yükleyin.`);
        window.location.href = "wallet.html";
        return;
      }

      await updateDoc(userRef, { walletBalance: balance - totalAmount });
    }

    completeOrderBtn.disabled = true;
    completeOrderBtn.textContent = "Sipariş İşleniyor...";

    try {
      await addDoc(collection(db, "orders"), {
        customer: { name, phone, address },
        items: cart,
        subtotal,
        discount: discountAmount,
        totalAmount,
        paymentMethod: paymentMethod === 'wallet' ? 'Cüzdan Bakiyesi' : 'Simülasyon Kart',
        status: "Yeni Sipariş",
        createdAt: serverTimestamp(),
        userId: currentUser ? currentUser.uid : "guest"
      });

      for (const item of cart) {
        const prodRef = doc(db, "products", item.id);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const currentStock = prodSnap.data().stock !== undefined ? prodSnap.data().stock : 10;
          await updateDoc(prodRef, { stock: Math.max(0, currentStock - item.qty) });
        }
      }

      alert("Siparişiniz başarıyla alındı ve ödemeniz tamamlandı!");
      localStorage.removeItem("hoodie_cart");
      cart = [];
      updateCartUI();
      cartModal.classList.add("opacity-0", "pointer-events-none");
      if (checkoutForm) checkoutForm.reset();
    } catch (err) {
      alert("Sipariş oluşturulamadı: " + err.message);
    } finally {
      completeOrderBtn.disabled = false;
      completeOrderBtn.textContent = "Siparişi Tamamla";
    }
  });
}

if (openSizeChartBtn && sizeChartModal) openSizeChartBtn.addEventListener("click", () => sizeChartModal.classList.remove("opacity-0", "pointer-events-none"));
if (closeSizeChartBtn && sizeChartModal) closeSizeChartBtn.addEventListener("click", () => sizeChartModal.classList.add("opacity-0", "pointer-events-none"));

window.openLegalModal = function(type) {
  const modal = document.getElementById("legal-modal");
  const titleEl = document.getElementById("legal-title");
  const contentEl = document.getElementById("legal-content");
  if (!modal) return;

  const data = {
    about: { title: "Hakkımızda", text: "Del Lupo, sokak modasının en saf halini heavyweight kumaşlarla buluşturan bağımsız bir streetwear markasıdır." },
    blog: { title: "Blog / Hikayemiz", text: "Sokak kültüründen beslenen Del Lupo hikayesi Bursa'dan doğdu." },
    contact: { title: "İletişim", text: "support@dellupo.com | WhatsApp Destek: +90 (850) 000 00 00" },
    shipping: { title: "Kargo ve İade Koşulları", text: "Siparişleriniz 24 saat içinde kargoda. 14 gün içinde iade/değişim yapılabilir." },
    privacy: { title: "Gizlilik Sözleşmesi", text: "256-bit SSL şifreleme altyapısıyla bilgileriniz güvence altındadır." },
    terms: { title: "Kullanıcı Sözleşmesi", text: "Sitemizi kullanan herkes koşulları kabul etmiş sayılır." },
    sales: { title: "Mesafeli Satış Sözleşmesi", text: "6502 sayılı kanuna uygundur." },
    faq: { title: "Sıkça Sorulan Sorular (SSS)", text: "Kargo ücretsiz mi? Kampanya dönemlerinde geçerlidir." }
  };

  if (data[type]) { titleEl.textContent = data[type].title; contentEl.textContent = data[type].text; modal.classList.remove("opacity-0", "pointer-events-none"); }
};

window.closeLegalModal = function() {
  const modal = document.getElementById("legal-modal");
  if (modal) modal.classList.add("opacity-0", "pointer-events-none");
};