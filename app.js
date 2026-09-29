import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnGubOKlQvh8spOhtLalO4ez9J8yu0PpI",
  authDomain: "hoodie-store-9af27.firebaseapp.com",
  projectId: "hoodie-store-9af27",
  storageBucket: "hoodie-store-9af27.firebasestorage.app",
  messagingSenderId: "51378890059",
  appId: "1:51378890059:web:9ebd26be949320d6c5b4ce",
  measurementId: "G-Y1C8QYZVX1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let products = [];
let cart = JSON.parse(localStorage.getItem("hoodie_cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("hoodie_wishlist")) || [];

// ⚠️ KESİN ADMIN MAİLİNİZ
const ADMIN_EMAIL = "16ardaguner@gmail.com";

// Oturum ve Profil Menüsü Yönetimi
onAuthStateChanged(auth, async (user) => {
  const userAuthArea = document.getElementById("user-auth-area");
  if (!userAuthArea) return;

  if (user) {
    const isAdmin = user.email === ADMIN_EMAIL;
    let walletBalance = 0;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        walletBalance = userDoc.data().wallet || 0;
      }
    } catch (e) {
      console.error("Bakiye okunamadı:", e);
    }

    userAuthArea.innerHTML = `
      <div class="relative flex items-center">
        <button id="profile-menu-btn" class="text-zinc-300 hover:text-white transition cursor-pointer p-1.5 flex items-center gap-1.5 focus:outline-none" title="Profilim" aria-label="Profil Menüsü">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span class="text-xs font-bold text-amber-400">€${walletBalance.toFixed(2)}</span>
        </button>
        
        <div id="profile-dropdown" class="absolute right-0 mt-2 w-52 bg-[#111] border border-zinc-800 rounded-2xl shadow-2xl py-2 hidden z-50 top-full">
          <a href="wallet.html" class="block px-4 py-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition font-bold uppercase">Cüzdanım</a>
          <a href="my-orders.html" class="block px-4 py-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition font-bold uppercase">Siparişlerim</a>
          ${isAdmin ? '<a href="admin.html" class="block px-4 py-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition font-bold uppercase">Yönetim</a>' : ""}
          <div class="border-t border-zinc-800/80 mt-1 pt-1">
            <button id="logout-btn" class="w-full text-left px-4 py-2.5 text-xs text-zinc-400 hover:text-red-500 hover:bg-zinc-900 transition font-bold uppercase cursor-pointer">Çıkış Yap</button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const profileBtn = document.getElementById("profile-menu-btn");
      const profileDropdown = document.getElementById("profile-dropdown");
      if (profileBtn && profileDropdown) {
        profileBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle("hidden");
        });
        document.addEventListener("click", () => {
          profileDropdown.classList.add("hidden");
        });
      }
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          await signOut(auth);
          window.location.reload();
        });
      }
    }, 100);
  } else {
    userAuthArea.innerHTML = `
      <a href="login.html" class="bg-white text-black font-extrabold px-3.5 py-2 rounded-sm text-xs uppercase tracking-wider hover:bg-zinc-200 transition">
        Giriş Yap
      </a>
    `;
  }
});

// Beden Rehberi Modal Kontrolü
const openSizeChartBtn = document.getElementById("open-size-chart-btn");
const closeSizeChartBtn = document.getElementById("close-size-chart-btn");
const sizeChartModal = document.getElementById("size-chart-modal");

if (openSizeChartBtn && sizeChartModal) {
  openSizeChartBtn.addEventListener("click", () =>
    sizeChartModal.classList.remove("opacity-0", "pointer-events-none"),
  );
}
if (closeSizeChartBtn && sizeChartModal) {
  closeSizeChartBtn.addEventListener("click", () =>
    sizeChartModal.classList.add("opacity-0", "pointer-events-none"),
  );
}
if (sizeChartModal) {
  sizeChartModal.addEventListener("click", (e) => {
    if (e.target === sizeChartModal)
      sizeChartModal.classList.add("opacity-0", "pointer-events-none");
  });
}

// Ürünleri Çekme ve Listeleme
async function fetchProducts() {
  const productListEl = document.getElementById("product-list");
  if (!productListEl) return;
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    products = [];
    querySnapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderProducts(products);
  } catch (err) {
    console.error(err);
  }
}

function renderProducts(items) {
  const productListEl = document.getElementById("product-list");
  if (!productListEl) return;
  if (items.length === 0) {
    productListEl.innerHTML =
      "<p class='text-zinc-500 col-span-full text-center py-20 text-sm'>Parça bulunamadı.</p>";
    return;
  }
  productListEl.innerHTML = items
    .map((p) => {
      const imgSrc =
        p.images && p.images.length > 0 ? p.images[0] : p.image || "";
      const isFav = wishlist.includes(p.id);
      return `
      <div class="group relative bg-[#111] border border-zinc-900 rounded-2xl overflow-hidden flex flex-col justify-between transition hover:border-zinc-700">
        <div>
          <div class="aspect-[3/4] bg-zinc-950 overflow-hidden relative cursor-pointer" onclick="window.location.href='product-detail.html?id=${p.id}'">
            <img src="${imgSrc}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${p.name}">
            <button onclick="event.stopPropagation(); toggleWishlist('${p.id}')" class="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black transition cursor-pointer">
              <svg class="w-4 h-4 ${isFav ? "text-red-500 fill-red-500" : "text-white"}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>
            </button>
          </div>
          <div class="p-4">
            <h3 onclick="window.location.href='product-detail.html?id=${p.id}'" class="text-xs font-bold text-white uppercase tracking-wider cursor-pointer truncate mb-1">${p.name}</h3>
            <p class="text-xs text-zinc-400 font-medium">€${p.price}</p>
          </div>
        </div>
        <div class="p-4 pt-0">
          <button onclick="window.location.href='product-detail.html?id=${p.id}'" class="w-full bg-zinc-900 hover:bg-white hover:text-black text-zinc-200 font-bold py-2.5 rounded-xl text-[11px] uppercase tracking-widest transition cursor-pointer">
            İncele & Seç
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

// Arama & Sıralama
const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    renderProducts(products.filter((p) => p.name.toLowerCase().includes(val)));
  });
}

const sortSelect = document.getElementById("sort-select");
if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    let sorted = [...products];
    if (e.target.value === "price-asc")
      sorted.sort((a, b) => a.price - b.price);
    else if (e.target.value === "price-desc")
      sorted.sort((a, b) => b.price - a.price);
    renderProducts(sorted);
  });
}

window.toggleWishlist = function (id) {
  if (wishlist.includes(id)) wishlist = wishlist.filter((i) => i !== id);
  else wishlist.push(id);
  localStorage.setItem("hoodie_wishlist", JSON.stringify(wishlist));
  const countEl = document.getElementById("wishlist-count");
  if (countEl) countEl.textContent = wishlist.length;
  renderProducts(products);
};

// Sepet Drawer
const cartModal = document.getElementById("cart-modal");
const openCartBtn = document.getElementById("open-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");

if (openCartBtn)
  openCartBtn.addEventListener("click", () =>
    cartModal.classList.remove("opacity-0", "pointer-events-none"),
  );
if (closeCartBtn)
  closeCartBtn.addEventListener("click", () =>
    cartModal.classList.add("opacity-0", "pointer-events-none"),
  );

function updateCartUI() {
  const cartItemsEl = document.getElementById("cart-items");
  const cartCountEl = document.getElementById("cart-count");
  const cartSubtotalEl = document.getElementById("cart-subtotal");
  const cartTotalEl = document.getElementById("cart-total");

  let totalCount = 0;
  let subtotal = 0;
  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML =
      "<p class='text-zinc-500 text-center py-8 text-xs'>Sepetiniz boş.</p>";
  } else {
    cartItemsEl.innerHTML = cart
      .map((item, idx) => {
        totalCount += item.qty;
        subtotal += item.price * item.qty;
        return `
        <div class="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-900">
          <div class="flex items-center gap-3">
            <img src="${item.image}" class="w-12 h-12 object-cover rounded-lg">
            <div>
              <h4 class="text-xs font-bold text-white uppercase">${item.name}</h4>
              <p class="text-[10px] text-zinc-400">Beden: ${item.size} | €${item.price}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="changeQty(${idx}, -1)" class="w-6 h-6 bg-zinc-900 rounded text-zinc-300 font-bold text-xs cursor-pointer">-</button>
            <span class="text-xs font-bold text-white">${item.qty}</span>
            <button onclick="changeQty(${idx}, 1)" class="w-6 h-6 bg-zinc-900 rounded text-zinc-300 font-bold text-xs cursor-pointer">+</button>
          </div>
        </div>
      `;
      })
      .join("");
  }
  if (cartCountEl) cartCountEl.textContent = totalCount;
  if (cartSubtotalEl) cartSubtotalEl.textContent = `€${subtotal.toFixed(2)}`;
  if (cartTotalEl) cartTotalEl.textContent = `€${subtotal.toFixed(2)}`;
}

window.changeQty = function (index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  localStorage.setItem("hoodie_cart", JSON.stringify(cart));
  updateCartUI();
};

const completeOrderBtn = document.getElementById("complete-order-btn");
if (completeOrderBtn) {
  completeOrderBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Sepetiniz boş!");
      return;
    }
    if (!auth.currentUser) {
      alert("Giriş yapmalısınız!");
      window.location.href = "login.html";
      return;
    }
    alert("Sipariş başarıyla oluşturuldu!");
    cart = [];
    localStorage.setItem("hoodie_cart", JSON.stringify(cart));
    updateCartUI();
    cartModal.classList.add("opacity-0", "pointer-events-none");
    window.location.href = "my-orders.html";
  });
}

// Arama Modalı
const searchToggleBtn = document.getElementById("search-toggle-btn");
const searchModal = document.getElementById("search-modal");
const closeSearchModal = document.getElementById("close-search-modal");
const modalSearchInput = document.getElementById("modal-search-input");
const modalSearchResults = document.getElementById("modal-search-results");

if (searchToggleBtn)
  searchToggleBtn.addEventListener("click", () =>
    searchModal?.classList.remove("opacity-0", "pointer-events-none"),
  );
if (closeSearchModal)
  closeSearchModal.addEventListener("click", () =>
    searchModal?.classList.add("opacity-0", "pointer-events-none"),
  );

if (modalSearchInput) {
  modalSearchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    if (!val) {
      modalSearchResults.innerHTML = "";
      return;
    }
    const matches = products.filter((p) => p.name.toLowerCase().includes(val));
    modalSearchResults.innerHTML = matches
      .map(
        (p) => `
      <div onclick="window.location.href='product-detail.html?id=${p.id}'" class="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-900 cursor-pointer hover:border-zinc-700 transition">
        <img src="${p.images?.[0] || p.image}" class="w-10 h-10 object-cover rounded-lg">
        <div>
          <h4 class="text-xs font-bold text-white uppercase">${p.name}</h4>
          <p class="text-[10px] text-zinc-400">€${p.price}</p>
        </div>
      </div>
    `,
      )
      .join("");
  });
}

fetchProducts();
updateCartUI();
if (document.getElementById("wishlist-count")) {
  document.getElementById("wishlist-count").textContent = wishlist.length;
}
