import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const loadingScreen = document.getElementById("loading-screen");
const loadingText = document.getElementById("loading-text");
const loadingBackBtn = document.getElementById("loading-back-btn");
const mainContainer = document.getElementById("product-detail-container");

const pdMainImage = document.getElementById("pd-main-image");
const pdThumbnails = document.getElementById("pd-thumbnails");
const pdName = document.getElementById("pd-name");
const pdPrice = document.getElementById("pd-price");
const pdStockStatus = document.getElementById("pd-stock-status");
const addToCartBtn = document.getElementById("add-to-cart-btn");
const sizeBtns = document.querySelectorAll(".size-btn");

const reviewForm = document.getElementById("review-form");
const loginPrompt = document.getElementById("login-prompt");
const reviewsList = document.getElementById("reviews-list");
const starBtns = document.querySelectorAll(".star-btn");
const ratingInput = document.getElementById("review-rating");
const avgRatingBig = document.getElementById("avg-rating-big");
const avgStarsBig = document.getElementById("avg-stars-big");
const totalReviewsCount = document.getElementById("total-reviews-count");
const relatedProductsContainer = document.getElementById("related-products");

let currentSelectedSize = "M"; 
let productData = null;
let currentProductId = null;
let currentUser = null;

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

if (!productId) {
  if (loadingText) {
    loadingText.textContent = "HATA: LÜTFEN ANA SAYFADAN BİR ÜRÜN SEÇİN.";
    loadingText.classList.replace("text-zinc-500", "text-red-500");
  }
  if (loadingBackBtn) loadingBackBtn.classList.remove("hidden");
} else {
  initApp();
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    if (reviewForm) reviewForm.classList.remove("hidden");
    if (loginPrompt) loginPrompt.classList.add("hidden");
  } else {
    if (reviewForm) reviewForm.classList.add("hidden");
    if (loginPrompt) loginPrompt.classList.remove("hidden");
  }
});

async function initApp() {
  await fetchProduct();
  if (productData) {
    await loadReviews();
    await loadRelatedProducts();
  }
}

async function fetchProduct() {
  try {
    const docSnap = await getDoc(doc(db, "products", productId));

    if (docSnap.exists()) {
      productData = docSnap.data();
      currentProductId = docSnap.id;
      
      const stock = productData.stock !== undefined ? productData.stock : 10;
      const isOut = stock <= 0;

      // Çoklu Görsel Desteği (Eğer array varsa onları, yoksa tek image'ı dizi yap)
      let images = productData.images && productData.images.length > 0 ? productData.images : [productData.image || "https://via.placeholder.com/800"];
      
      if (pdMainImage) pdMainImage.src = images[0];
      
      // Thumbnail görsellerini oluştur
      if (pdThumbnails) {
        pdThumbnails.innerHTML = "";
        images.forEach((imgUrl, index) => {
          const thumb = document.createElement("div");
          thumb.className = `bg-[#111] rounded-xl overflow-hidden border cursor-pointer h-24 flex items-center justify-center transition ${index === 0 ? 'border-white' : 'border-zinc-900 hover:border-zinc-700'}`;
          thumb.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover">`;
          thumb.addEventListener("click", () => {
            pdMainImage.src = imgUrl;
            document.querySelectorAll("#pd-thumbnails > div").forEach(d => {
              d.classList.remove("border-white");
              d.classList.add("border-zinc-900");
            });
            thumb.classList.remove("border-zinc-900");
            thumb.classList.add("border-white");
          });
          pdThumbnails.appendChild(thumb);
        });
      }

      if (pdName) pdName.textContent = productData.name;
      if (pdPrice) pdPrice.textContent = `€${productData.price}`;
      
      if (isOut) {
        if (pdStockStatus) {
          pdStockStatus.textContent = "STOKLAR TÜKENDİ";
          pdStockStatus.classList.add("text-red-500");
        }
        if (addToCartBtn) {
          addToCartBtn.textContent = "STOKTA YOK";
          addToCartBtn.disabled = true;
        }
        sizeBtns.forEach(b => b.classList.add("opacity-50", "cursor-not-allowed"));
      } else {
        if (pdStockStatus) pdStockStatus.textContent = `STOKTA ${stock} ADET MEVCUT`;
      }

      if (loadingScreen) loadingScreen.classList.add("hidden");
      if (mainContainer) {
        mainContainer.classList.remove("hidden");
        mainContainer.classList.add("flex"); 
      }

    } else {
      if (loadingText) loadingText.textContent = "ÜRÜN BULUNAMADI.";
      if (loadingBackBtn) loadingBackBtn.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Hata:", error);
    if (loadingText) loadingText.textContent = "VERİTABANI HATASI.";
    if (loadingBackBtn) loadingBackBtn.classList.remove("hidden");
  }
}

sizeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (addToCartBtn && addToCartBtn.disabled) return;
    currentSelectedSize = btn.getAttribute("data-size");
    sizeBtns.forEach(b => {
      b.classList.remove('bg-white', 'text-black', 'border-white');
      b.classList.add('bg-transparent', 'text-zinc-400', 'border-zinc-800');
    });
    btn.classList.add('bg-white', 'text-black', 'border-white');
    btn.classList.remove('bg-transparent', 'text-zinc-400', 'border-zinc-800');
  });
});

if (addToCartBtn) {
  addToCartBtn.addEventListener("click", () => {
    if (!productData) return;
    const maxStock = productData.stock !== undefined ? productData.stock : 10;
    let cart = JSON.parse(localStorage.getItem("hoodie_cart")) || [];
    const existing = cart.find(i => i.id === currentProductId && i.size === currentSelectedSize);
    let mainImg = productData.images ? productData.images[0] : productData.image;

    if (existing) {
      if (existing.qty + 1 > maxStock) {
        alert("Stok sınırına ulaştınız!");
        return;
      }
      existing.qty += 1;
    } else {
      cart.push({ id: currentProductId, name: productData.name, price: productData.price, image: mainImg, size: currentSelectedSize, qty: 1, maxStock });
    }

    localStorage.setItem("hoodie_cart", JSON.stringify(cart));
    alert(`${productData.name} (${currentSelectedSize} Beden) sepete eklendi!`);
    window.location.href = "cart.html";
  });
}

// Yıldız Seçim Animasyonu
starBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const val = parseInt(btn.getAttribute("data-value"));
    if (ratingInput) ratingInput.value = val;
    starBtns.forEach((b, idx) => {
      if (idx < val) {
        b.classList.add("text-amber-400");
        b.classList.remove("text-zinc-700");
      } else {
        b.classList.remove("text-amber-400");
        b.classList.add("text-zinc-700");
      }
    });
  });
});

if (reviewForm) {
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const rating = parseInt(ratingInput ? ratingInput.value : 5);
    const commentInput = document.getElementById("review-comment");
    const comment = commentInput ? commentInput.value.trim() : "";
    const authorName = currentUser.displayName || currentUser.email.split('@')[0];

    try {
      await addDoc(collection(db, "reviews"), {
        productId: currentProductId,
        author: authorName,
        userId: currentUser.uid,
        rating: rating,
        comment: comment,
        createdAt: serverTimestamp()
      });
      alert("Değerlendirmeniz yayınlandı!");
      reviewForm.reset();
      loadReviews();
    } catch (err) {
      console.error(err);
      alert("Yorum gönderilemedi.");
    }
  });
}

// Büyük ve Şık Yorum Kartları Akışı
async function loadReviews() {
  if (!reviewsList) return;
  try {
    const q = query(collection(db, "reviews"), where("productId", "==", currentProductId));
    const snap = await getDocs(q);
    reviewsList.innerHTML = "";

    let reviewsArray = [];
    snap.forEach(docSnap => reviewsArray.push(docSnap.data()));
    
    reviewsArray.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });

    if (reviewsArray.length === 0) {
      reviewsList.innerHTML = "<p class='text-zinc-500 text-xs py-6 text-center'>Henüz değerlendirme yapılmamış. İlk yorumu sen yap!</p>";
      if (avgRatingBig) avgRatingBig.textContent = "5.0";
      if (avgStarsBig) avgStarsBig.textContent = "★★★★★";
      if (totalReviewsCount) totalReviewsCount.textContent = "(0)";
      return;
    }

    let totalRating = 0;
    let reviewsHTML = "";

    reviewsArray.forEach(r => {
      totalRating += (r.rating || 5);
      const stars = "★".repeat(r.rating || 5) + "☆".repeat(5 - (r.rating || 5));
      reviewsHTML += `
        <div class="bg-[#111] border border-zinc-800 p-6 rounded-2xl space-y-3 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center uppercase text-sm">
                ${(r.author || 'A').charAt(0)}
              </div>
              <div>
                <h5 class="font-bold text-white text-sm">${r.author || 'Gizli Müşteri'}</h5>
                <span class="text-amber-400 text-sm tracking-widest">${stars}</span>
              </div>
            </div>
            <span class="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Doğrulanmış Alıcı</span>
          </div>
          <p class="text-sm text-zinc-300 leading-relaxed pl-13 pt-1">${r.comment}</p>
        </div>
      `;
    });

    const avg = (totalRating / reviewsArray.length).toFixed(1);
    if (avgRatingBig) avgRatingBig.textContent = avg;
    if (avgStarsBig) avgStarsBig.textContent = "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
    if (totalReviewsCount) totalReviewsCount.textContent = `(${reviewsArray.length})`;

    reviewsList.innerHTML = reviewsHTML;
  } catch (err) {
    console.error(err);
  }
}

async function loadRelatedProducts() {
  if (!relatedProductsContainer) return;
  try {
    const snap = await getDocs(collection(db, "products"));
    relatedProductsContainer.innerHTML = "";
    
    let count = 0;
    snap.forEach(docSnap => {
      if (docSnap.id !== currentProductId && count < 4) {
        const p = docSnap.data();
        count++;
        let img = p.images ? p.images[0] : p.image;
        const card = document.createElement("a");
        card.href = `product-detail.html?id=${docSnap.id}`;
        card.className = "group bg-[#111] border border-zinc-900 rounded-xl overflow-hidden block hover:border-zinc-700 transition";
        card.innerHTML = `
          <div class="w-full h-64 overflow-hidden bg-zinc-950">
            <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
          </div>
          <div class="p-4">
            <h4 class="font-bold text-white text-sm uppercase truncate mb-1">${p.name}</h4>
            <p class="text-zinc-400 text-xs font-semibold">€${p.price}</p>
          </div>
        `;
        relatedProductsContainer.appendChild(card);
      }
    });

    if (count === 0) {
      relatedProductsContainer.innerHTML = "<p class='text-zinc-600 text-xs col-span-full'>Koleksiyonda başka ürün bulunmuyor.</p>";
    }
  } catch (err) {
    console.error("Diğer ürünler yüklenirken hata:", err);
  }
}