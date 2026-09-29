import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
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

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

const loadingScreen = document.getElementById("loading-screen");
const loadingText = document.getElementById("loading-text");
const loadingBackBtn = document.getElementById("loading-back-btn");
const productDetailContainer = document.getElementById(
  "product-detail-container",
);

const pdMainImage = document.getElementById("pd-main-image");
const pdThumbnails = document.getElementById("pd-thumbnails");
const pdName = document.getElementById("pd-name");
const pdPrice = document.getElementById("pd-price");
const pdStockStatus = document.getElementById("pd-stock-status");
const addToCartBtn = document.getElementById("add-to-cart-btn");

let selectedSize = "M";
let currentProduct = null;
let currentUser = null;

const ADMIN_EMAIL = "arda@gmail.com";

// Oturum, Profil Adam Simgesi ve Bakiye Yönetimi (Ürün Detay Sayfası İçin)
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  const userAuthArea = document.getElementById("user-auth-area");
  const reviewForm = document.getElementById("review-form");
  const loginPrompt = document.getElementById("login-prompt");

  if (user) {
    if (reviewForm) reviewForm.classList.remove("hidden");
    if (loginPrompt) loginPrompt.classList.add("hidden");

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

    if (userAuthArea) {
      userAuthArea.innerHTML = `
        <div class="relative flex items-center">
          <button id="profile-menu-btn" class="text-zinc-300 hover:text-white transition cursor-pointer p-1.5 flex items-center gap-1.5 focus:outline-none" title="Profilim">
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
    }
  } else {
    if (reviewForm) reviewForm.classList.add("hidden");
    if (loginPrompt) loginPrompt.classList.remove("hidden");
    if (userAuthArea) {
      userAuthArea.innerHTML = `
        <a href="login.html" class="bg-white text-black font-extrabold px-3.5 py-2 rounded-sm text-xs uppercase tracking-wider hover:bg-zinc-200 transition">
          Giriş Yap
        </a>
      `;
    }
  }
});

// Beden Rehberi Modal Kontrolü (Ürün Detay Sayfası)
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

// Beden Seçimi Mantığı
document.querySelectorAll(".size-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".size-btn").forEach((b) => {
      b.classList.remove("border-white", "bg-white", "text-black");
      b.classList.add("border-zinc-800", "bg-transparent", "text-zinc-400");
    });
    e.target.classList.remove(
      "border-zinc-800",
      "bg-transparent",
      "text-zinc-400",
    );
    e.target.classList.add("border-white", "bg-white", "text-black");
    selectedSize = e.target.getAttribute("data-size");
  });
});

async function loadProduct() {
  if (!productId) {
    loadingText.textContent = "Ürün bulunamadı!";
    loadingBackBtn.classList.remove("hidden");
    return;
  }
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      loadingText.textContent = "Böyle bir ürün mevcut değil.";
      loadingBackBtn.classList.remove("hidden");
      return;
    }

    currentProduct = { id: docSnap.id, ...docSnap.data() };
    loadingScreen.classList.add("hidden");
    productDetailContainer.classList.remove("hidden");

    pdName.textContent = currentProduct.name;
    pdPrice.textContent = `€${currentProduct.price}`;

    const stock =
      currentProduct.stock !== undefined ? currentProduct.stock : 10;
    if (stock <= 0) {
      pdStockStatus.textContent = "Tükendi";
      addToCartBtn.disabled = true;
      addToCartBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      pdStockStatus.textContent = `Stok Durumu: ${stock} adet kaldı`;
    }

    let images =
      currentProduct.images && currentProduct.images.length > 0
        ? currentProduct.images
        : [currentProduct.image];
    pdMainImage.src = images[0];
    pdThumbnails.innerHTML = "";
    images.forEach((imgUrl, idx) => {
      const thumb = document.createElement("button");
      thumb.className = `rounded-xl overflow-hidden border-2 ${idx === 0 ? "border-white" : "border-zinc-800"} transition bg-zinc-950 h-24 cursor-pointer`;
      thumb.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover">`;
      thumb.addEventListener("click", () => {
        pdMainImage.src = imgUrl;
        document
          .querySelectorAll("#pd-thumbnails button")
          .forEach((b) =>
            b.classList.replace("border-white", "border-zinc-800"),
          );
        thumb.classList.replace("border-zinc-800", "border-white");
      });
      pdThumbnails.appendChild(thumb);
    });

    loadReviews();
  } catch (err) {
    console.error(err);
    loadingText.textContent = "Ürün yüklenirken hata oluştu.";
    loadingBackBtn.classList.remove("hidden");
  }
}

if (addToCartBtn) {
  addToCartBtn.addEventListener("click", () => {
    if (!currentProduct) return;
    let cart = JSON.parse(localStorage.getItem("hoodie_cart")) || [];
    const existingIndex = cart.findIndex(
      (item) => item.id === currentProduct.id && item.size === selectedSize,
    );
    const maxStock =
      currentProduct.stock !== undefined ? currentProduct.stock : 10;

    if (existingIndex > -1) {
      if (cart[existingIndex].qty + 1 > maxStock) {
        alert("Maksimum stok sınırına ulaştınız!");
        return;
      }
      cart[existingIndex].qty += 1;
    } else {
      if (1 > maxStock) {
        alert("Ürün tükendi!");
        return;
      }
      cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.images
          ? currentProduct.images[0]
          : currentProduct.image,
        size: selectedSize,
        qty: 1,
        maxStock: maxStock,
      });
    }
    localStorage.setItem("hoodie_cart", JSON.stringify(cart));
    alert("Ürün sepetinize eklendi!");
  });
}

// Yıldız Değerlendirme
const starRatingContainer = document.getElementById("star-rating-container");
const reviewRatingInput = document.getElementById("review-rating");
if (starRatingContainer) {
  const stars = starRatingContainer.querySelectorAll(".star-btn");
  stars.forEach((star) => {
    star.addEventListener("click", (e) => {
      const val = parseInt(e.target.getAttribute("data-value"));
      reviewRatingInput.value = val;
      stars.forEach((s, i) => {
        if (i < val) {
          s.classList.add("text-amber-400");
          s.classList.remove("text-zinc-700");
        } else {
          s.classList.remove("text-amber-400");
          s.classList.add("text-zinc-700");
        }
      });
    });
  });
}

const reviewForm = document.getElementById("review-form");
if (reviewForm) {
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Giriş yapmalısınız!");
      return;
    }
    const comment = document.getElementById("review-comment").value.trim();
    const rating = parseInt(reviewRatingInput.value);
    if (!comment) return;

    try {
      await addDoc(collection(db, "reviews"), {
        productId: productId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split("@")[0],
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      document.getElementById("review-comment").value = "";
      alert("Değerlendirmeniz eklendi!");
      loadReviews();
    } catch (err) {
      alert("Yorum eklenemedi: " + err.message);
    }
  });
}

async function loadReviews() {
  const reviewsListEl = document.getElementById("reviews-list");
  const avgStarsBig = document.getElementById("avg-stars-big");
  const avgRatingBig = document.getElementById("avg-rating-big");
  const totalReviewsCount = document.getElementById("total-reviews-count");
  if (!reviewsListEl) return;

  try {
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
    );
    const snap = await getDocs(q);
    reviewsListEl.innerHTML = "";

    if (snap.empty) {
      reviewsListEl.innerHTML =
        "<p class='text-zinc-500 text-xs py-4 text-center'>Bu ürün için henüz değerlendirme yapılmamış.</p>";
      if (avgRatingBig) avgRatingBig.textContent = "5.0";
      if (totalReviewsCount) totalReviewsCount.textContent = "(0)";
      return;
    }

    let totalScore = 0;
    let count = 0;
    let reviewsHtml = "";

    snap.forEach((docSnap) => {
      const r = docSnap.data();
      totalScore += r.rating;
      count++;
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      let dateStr = "Yeni";
      if (r.createdAt && typeof r.createdAt.toMillis === "function") {
        dateStr = new Date(r.createdAt.toMillis()).toLocaleDateString("tr-TR");
      }

      reviewsHtml += `
        <div class="bg-zinc-950 border border-zinc-900 p-5 rounded-xl space-y-2">
          <div class="flex justify-between items-center">
            <span class="font-bold text-white text-xs uppercase">${r.userName || "Müşteri"}</span>
            <span class="text-[10px] text-zinc-500">${dateStr}</span>
          </div>
          <div class="text-amber-400 text-xs">${stars}</div>
          <p class="text-xs text-zinc-300 leading-relaxed">${r.comment}</p>
        </div>
      `;
    });

    let avg = (totalScore / count).toFixed(1);
    if (avgRatingBig) avgRatingBig.textContent = avg;
    if (totalReviewsCount) totalReviewsCount.textContent = `(${count})`;
    if (avgStarsBig) {
      let fullStars = Math.round(totalScore / count);
      avgStarsBig.textContent =
        "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
    }
    reviewsListEl.innerHTML = reviewsHtml;
  } catch (err) {
    console.error(err);
  }
}

loadProduct();
