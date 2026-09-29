import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadAdminProducts();
    loadAdminOrders();
    loadAdminCoupons();
  }
});

const addProductForm = document.getElementById("add-product-form");
const addCouponForm = document.getElementById("add-coupon-form");
const adminProductList = document.getElementById("admin-product-list");
const adminCouponList = document.getElementById("admin-coupon-list");
const adminOrdersList = document.getElementById("admin-orders-list");
const saveBtn = document.getElementById("save-btn");

if (addProductForm) {
  addProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(document.getElementById("product-price").value);
    const stock = parseInt(document.getElementById("product-stock").value);
    const fileInput = document.getElementById("product-file");

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Lütfen ürün görseli seç!");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Kaydediliyor...";

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;

      img.onload = async function() {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        try {
          await addDoc(collection(db, "products"), {
            name, price, stock, image: compressedBase64, createdAt: serverTimestamp()
          });
          alert("Ürün başarıyla eklendi!");
          addProductForm.reset();
          loadAdminProducts();
        } catch (err) {
          alert("Hata: " + err.message);
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = "Ürünü Kaydet";
        }
      };
    };
    reader.readAsDataURL(file);
  });
}

if (addCouponForm) {
  addCouponForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("coupon-code").value.trim().toUpperCase();
    const discountPercent = parseInt(document.getElementById("coupon-discount").value);

    try {
      await setDoc(doc(db, "coupons", code), {
        discountPercent,
        active: true,
        createdAt: serverTimestamp()
      });
      alert(`'${code}' kuponu aktif edildi!`);
      addCouponForm.reset();
      loadAdminCoupons();
    } catch (err) {
      alert("Kupon hatası: " + err.message);
    }
  });
}

async function loadAdminCoupons() {
  if (!adminCouponList) return;
  try {
    const snap = await getDocs(collection(db, "coupons"));
    adminCouponList.innerHTML = "";
    if (snap.empty) { adminCouponList.innerHTML = "<p class='text-zinc-500 text-xs'>Aktif kupon yok.</p>"; return; }

    snap.forEach(docSnap => {
      const c = docSnap.data();
      const code = docSnap.id;
      const div = document.createElement("div");
      div.className = "flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800";
      div.innerHTML = `
        <div><span class="font-black text-white text-xs">${code}</span><span class="text-zinc-400 text-xs ml-2">%${c.discountPercent} İndirim</span></div>
        <button onclick="window.deleteCoupon('${code}')" class="text-red-400 text-xs font-bold hover:underline cursor-pointer">Sil / Durdur</button>
      `;
      adminCouponList.appendChild(div);
    });
  } catch (err) { console.error(err); }
}

window.deleteCoupon = async function(code) {
  if (confirm(`'${code}' kuponunu silmek istediğinize emin misiniz?`)) {
    await deleteDoc(doc(db, "coupons", code));
    loadAdminCoupons();
  }
};

async function loadAdminProducts() {
  if (!adminProductList) return;
  try {
    const snap = await getDocs(collection(db, "products"));
    adminProductList.innerHTML = "";
    if (snap.empty) { adminProductList.innerHTML = "<p class='text-zinc-500 text-xs'>Ürün yok.</p>"; return; }

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const div = document.createElement("div");
      div.className = "flex items-center justify-between border-b border-zinc-800 pb-2";
      div.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${p.image}" class="w-10 h-10 object-cover rounded-xl bg-zinc-950">
          <div><h4 class="font-bold text-zinc-200 text-xs">${p.name}</h4><p class="text-[11px] text-zinc-500">€${p.price} | Stok: <strong class="text-zinc-300">${p.stock || 0}</strong></p></div>
        </div>
        <button onclick="window.deleteProduct('${docSnap.id}')" class="text-red-400 text-xs font-bold hover:underline cursor-pointer">Sil</button>
      `;
      adminProductList.appendChild(div);
    });
  } catch (err) { console.error(err); }
};

window.deleteProduct = async function(id) {
  if (confirm("Bu ürünü silmek istiyor musunuz?")) {
    await deleteDoc(doc(db, "products", id));
    loadAdminProducts();
  }
};

async function loadAdminOrders() {
  if (!adminOrdersList) return;
  try {
    const snap = await getDocs(collection(db, "orders"));
    adminOrdersList.innerHTML = "";
    if (snap.empty) { adminOrdersList.innerHTML = "<p class='text-zinc-500 text-xs'>Sipariş bulunmuyor.</p>"; return; }

    snap.forEach((docSnap) => {
      const o = docSnap.data();
      const orderId = docSnap.id;
      const items = o.items ? o.items.map(i => `${i.name} (${i.size}) x${i.qty}`).join(", ") : "";

      let returnRequestHtml = "";
      if (o.status === 'İade Talep Edildi' || o.returnReason) {
        returnRequestHtml = `
          <div class="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl space-y-1">
            <p class="text-xs font-bold text-amber-400 uppercase tracking-wider">⚠️ İade Talebi Oluşturuldu</p>
            <p class="text-xs text-zinc-300"><strong>Sebep:</strong> ${o.returnReason || 'Belirtilmedi'}</p>
          </div>
        `;
      }

      const card = document.createElement("div");
      card.className = "p-4 border border-zinc-800 rounded-xl bg-zinc-950 space-y-3";
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-bold text-zinc-200 text-xs">${o.customer ? o.customer.name : 'Müşteri'} (${o.customer ? o.customer.phone : ''})</h4>
            <p class="text-[11px] text-zinc-500">${o.customer ? o.customer.address : ''}</p>
          </div>
          <span class="text-indigo-400 font-black text-sm">€${o.totalAmount ? o.totalAmount.toFixed(2) : 0}</span>
        </div>
        <p class="text-xs text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800"><strong>Ürünler:</strong> ${items}</p>
        <p class="text-[11px] text-zinc-400"><strong>Ödeme Yöntemi:</strong> ${o.paymentMethod || 'Simülasyon Kart'}</p>
        ${returnRequestHtml}
        ${o.trackingNumber ? `<p class='text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/50'><strong>Kargo:</strong> ${o.carrier} - Takip No: <strong>${o.trackingNumber}</strong></p>` : ''}
        
        <div class="flex flex-col sm:flex-row items-center justify-between pt-2 gap-2 border-t border-zinc-900">
          <span class="text-xs font-bold text-zinc-400">Durum: <span class="text-indigo-400">${o.status}</span></span>
          <div class="flex gap-2 w-full sm:w-auto">
            <button onclick="window.addTrackingInfo('${orderId}')" class="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg font-semibold border border-zinc-700 cursor-pointer">Kargo Ekle</button>
            <select onchange="window.updateOrderStatus('${orderId}', this.value)" class="text-xs border border-zinc-800 rounded-lg p-1.5 bg-zinc-900 text-zinc-200 cursor-pointer font-bold">
              <option value="Yeni Sipariş" ${o.status === 'Yeni Sipariş' ? 'selected' : ''}>Yeni Sipariş</option>
              <option value="Hazırlanıyor" ${o.status === 'Hazırlanıyor' ? 'selected' : ''}>Hazırlanıyor</option>
              <option value="Kargolandı" ${o.status === 'Kargolandı' ? 'selected' : ''}>Kargolandı</option>
              <option value="Tamamlandı" ${o.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
              <option value="İade Onaylandı" ${o.status === 'İade Onaylandı' ? 'selected' : ''}>İade Onaylandı (Cüzdana İade Et)</option>
              <option value="İade Reddedildi" ${o.status === 'İade Reddedildi' ? 'selected' : ''}>İade Reddedildi</option>
            </select>
          </div>
        </div>
      `;
      adminOrdersList.appendChild(card);
    });
  } catch (err) { console.error(err); }
};

window.addTrackingInfo = async function(id) {
  const carrier = prompt("Kargo Firması (Örn: Yurtiçi Kargo):");
  const trackingNumber = prompt("Kargo Takip Numarası:");
  if (carrier && trackingNumber) {
    await updateDoc(doc(db, "orders", id), { carrier, trackingNumber, status: "Kargolandı" });
    loadAdminOrders();
  }
};

window.updateOrderStatus = async function(id, newStatus) {
  const orderRef = doc(db, "orders", id);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return;
  const orderData = orderSnap.data();

  // Eğer admin "İade Onaylandı" seçerse ve daha önce iade edilmediyse, parayı kullanıcının cüzdanına iade et
  if (newStatus === "İade Onaylandı" && orderData.status !== "İade Onaylandı" && orderData.userId && orderData.userId !== "guest") {
    try {
      const userRef = doc(db, "users", orderData.userId);
      const userSnap = await getDoc(userRef);
      let currentBal = userSnap.exists() && userSnap.data().walletBalance !== undefined ? userSnap.data().walletBalance : 0;
      let refundAmount = orderData.totalAmount;
      
      await updateDoc(userRef, { walletBalance: currentBal + refundAmount });
      alert(`İade onaylandı! €${refundAmount.toFixed(2)} tutar müşterinin dijital cüzdanına başarıyla iade edildi.`);
    } catch (e) {
      console.error("Cüzdan iade hatası:", e);
    }
  }

  await updateDoc(orderRef, { status: newStatus });
  loadAdminOrders();
};