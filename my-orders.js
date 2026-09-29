import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

const ordersListEl = document.getElementById("orders-list");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadUserOrders(user.uid);
  }
});

async function loadUserOrders(uid) {
  try {
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const snap = await getDocs(q);
    ordersListEl.innerHTML = "";

    if (snap.empty) {
      ordersListEl.innerHTML = "<p class='text-zinc-500 text-xs py-10 text-center'>Henüz hiç siparişiniz bulunmuyor.</p>";
      return;
    }

    snap.forEach(docSnap => {
      const o = docSnap.data();
      const orderId = docSnap.id;
      const itemsStr = o.items ? o.items.map(i => `${i.name} (${i.size}) x${i.qty}`).join(", ") : "";
      
      let dateStr = "Yeni Sipariş";
      if (o.createdAt && typeof o.createdAt.toMillis === 'function') {
        dateStr = new Date(o.createdAt.toMillis()).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' });
      }

      let trackingHtml = "";
      if (o.trackingNumber) {
        trackingHtml = `<p class='text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/50'><strong>Kargo Takip:</strong> ${o.carrier || 'Kargo'} — Takip No: <strong>${o.trackingNumber}</strong></p>`;
      }

      let returnStatusHtml = "";
      if (o.status === 'İade Talep Edildi') {
        returnStatusHtml = `<p class='text-amber-400 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/50'><strong>Durum:</strong> İade talebiniz işleme alınmıştır.</p>`;
      }

      let actionButtonHtml = "";
      if (o.status === 'Kargolandı' || o.status === 'Tamamlandı') {
        actionButtonHtml = `<button onclick="window.requestReturn('${orderId}')" class="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition border border-zinc-800 cursor-pointer">İade / Değişim Talep Et (14 Gün)</button>`;
      } else {
        actionButtonHtml = `<span class="text-[10px] text-zinc-500 uppercase tracking-wider italic">İptal ve iade süreçleri için kargolanma durumunu bekleyiniz.</span>`;
      }

      const card = document.createElement("div");
      card.className = "bg-[#111] border border-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl";
      card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-4 gap-2">
          <div>
            <span class="text-[10px] text-zinc-500 uppercase tracking-widest block">Sipariş ID: ${orderId}</span>
            <span class="text-xs font-bold text-zinc-400">${dateStr}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-zinc-900 text-indigo-400 text-xs font-extrabold rounded-lg border border-zinc-800 uppercase">${o.status}</span>
            <span class="text-white font-black text-sm">€${o.totalAmount ? o.totalAmount.toFixed(2) : '0.00'}</span>
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <p class="text-zinc-300"><strong>Ürünler:</strong> ${itemsStr}</p>
          <p class="text-zinc-400"><strong>Teslimat Adresi:</strong> ${o.customer.address} (${o.customer.phone})</p>
          <p class="text-zinc-400"><strong>Ödeme Yöntemi:</strong> ${o.paymentMethod || 'Simülasyon Kart'}</p>
          ${trackingHtml}
          ${returnStatusHtml}
        </div>

        <div class="flex justify-end pt-2 border-t border-zinc-900">
          ${actionButtonHtml}
        </div>
      `;
      ordersListEl.appendChild(card);
    });
  } catch (err) {
    console.error("Sipariş yükleme hatası:", err);
    ordersListEl.innerHTML = `<p class='text-red-500 text-xs py-10 text-center'>Siparişler yüklenirken hata oluştu: ${err.message}</p>`;
  }
}

window.requestReturn = async function(orderId) {
  const reason = prompt("İade veya değişim sebebinizi kısaca yazar mısınız?");
  if (reason) {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "İade Talep Edildi",
        returnReason: reason
      });
      alert("İade talebiniz başarıyla oluşturuldu.");
      location.reload();
    } catch (err) {
      alert("Talep oluşturulamadı: " + err.message);
    }
  }
};