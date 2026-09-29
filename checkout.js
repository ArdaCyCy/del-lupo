import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

let currentUser = null;
let cart = JSON.parse(localStorage.getItem("hoodie_cart")) || [];
let appliedDiscountPercent = 0;
let appliedCouponCode = "";

onAuthStateChanged(auth, (user) => { currentUser = user; });

const form = document.getElementById("checkout-form");
const itemsContainer = document.getElementById("checkout-summary-items");
const subtotalEl = document.getElementById("subtotal-display");
const discountRow = document.getElementById("discount-row");
const discountEl = document.getElementById("discount-display");
const finalTotalEl = document.getElementById("final-total-display");
const couponInput = document.getElementById("coupon-code-input");
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const couponMsg = document.getElementById("coupon-msg");
const submitBtn = document.getElementById("checkout-submit-btn");

function renderCheckoutSummary() {
  if (cart.length === 0) {
    itemsContainer.innerHTML = "<p class='text-gray-400 text-xs'>Sepetiniz boş.</p>";
    subtotalEl.textContent = "€0";
    finalTotalEl.textContent = "€0";
    return;
  }

  itemsContainer.innerHTML = "";
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;
    const div = document.createElement("div");
    div.className = "flex justify-between text-xs text-gray-700";
    div.innerHTML = `<span>${item.name} (${item.size}) x${item.qty}</span><strong>€${item.price * item.qty}</strong>`;
    itemsContainer.appendChild(div);
  });

  const discountAmount = (subtotal * appliedDiscountPercent) / 100;
  const finalTotal = subtotal - discountAmount;

  subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
  if (appliedDiscountPercent > 0) {
    discountRow.classList.remove("hidden");
    discountEl.textContent = `-€${discountAmount.toFixed(2)}`;
  } else {
    discountRow.classList.add("hidden");
  }
  finalTotalEl.textContent = `€${finalTotal.toFixed(2)}`;
}

if (applyCouponBtn) {
  applyCouponBtn.addEventListener("click", async () => {
    const code = couponInput.value.trim().toUpperCase();
    if (!code) return;

    try {
      const snap = await getDoc(doc(db, "coupons", code));
      if (snap.exists() && snap.data().active) {
        appliedDiscountPercent = snap.data().discountPercent;
        appliedCouponCode = code;
        couponMsg.className = "text-xs mt-1 text-emerald-600 font-bold block";
        couponMsg.textContent = `%${appliedDiscountPercent} indirim uygulandı!`;
        renderCheckoutSummary();
      } else {
        couponMsg.className = "text-xs mt-1 text-red-500 font-bold block";
        couponMsg.textContent = "Geçersiz kupon.";
      }
    } catch (err) { console.error(err); }
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (cart.length === 0) { alert("Sepetiniz boş!"); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sipariş Alınıyor...";

    try {
      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const discountAmount = (subtotal * appliedDiscountPercent) / 100;
      const finalTotal = subtotal - discountAmount;

      await addDoc(collection(db, "orders"), {
        customer: {
          name: document.getElementById("cust-name").value,
          phone: document.getElementById("cust-phone").value,
          address: document.getElementById("cust-address").value,
          email: currentUser ? currentUser.email : "Misafir"
        },
        userId: currentUser ? currentUser.uid : null,
        items: cart,
        subtotal: subtotal,
        discountApplied: discountAmount,
        couponCode: appliedCouponCode,
        totalAmount: finalTotal,
        status: "Yeni Sipariş",
        carrier: "",
        trackingNumber: "",
        createdAt: serverTimestamp()
      });

      // Stokları düş
      for (const item of cart) {
        if (item.id) {
          const pRef = doc(db, "products", item.id);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const currentStock = pSnap.data().stock !== undefined ? pSnap.data().stock : 10;
            await updateDoc(pRef, { stock: Math.max(0, currentStock - item.qty) });
          }
        }
      }

      alert("Ödeme alındı! Siparişiniz oluşturuldu.");
      localStorage.removeItem("hoodie_cart");
      window.location.href = "my-orders.html";
    } catch (err) {
      console.error(err);
      alert("Hata oluştu.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Ödemeyi Tamamla";
    }
  });
}

renderCheckoutSummary();