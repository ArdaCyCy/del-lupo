import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

const walletBalanceEl = document.getElementById("wallet-balance");
const topupForm = document.getElementById("topup-form");
const topupAmountInput = document.getElementById("topup-amount");
const topupBtn = document.getElementById("topup-btn");

let currentUserId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUserId = user.uid;
    await loadWalletBalance(user.uid);
  }
});

window.setAmount = function(amount) {
  if (topupAmountInput) topupAmountInput.value = amount;
};

async function loadWalletBalance(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const bal = data.walletBalance !== undefined ? data.walletBalance : 0;
      walletBalanceEl.textContent = `€${bal.toFixed(2)}`;
    } else {
      await setDoc(userRef, { walletBalance: 0, email: auth.currentUser.email });
      walletBalanceEl.textContent = "€0.00";
    }
  } catch (err) {
    console.error("Bakiye yüklenirken hata:", err);
  }
}

if (topupForm) {
  topupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmountInput.value);
    if (!amount || amount <= 0 || !currentUserId) return;

    topupBtn.disabled = true;
    topupBtn.textContent = "İşleniyor...";

    try {
      const userRef = doc(db, "users", currentUserId);
      const snap = await getDoc(userRef);
      let currentBal = snap.exists() && snap.data().walletBalance !== undefined ? snap.data().walletBalance : 0;
      let newBal = currentBal + amount;

      await updateDoc(userRef, { walletBalance: newBal });

      alert(`Cüzdanınıza başarıyla €${amount.toFixed(2)} eklendi!`);
      walletBalanceEl.textContent = `€${newBal.toFixed(2)}`;
      topupForm.reset();
    } catch (err) {
      console.error(err);
      alert("Bakiye yüklenemedi: " + err.message);
    } finally {
      topupBtn.disabled = false;
      topupBtn.textContent = "Cüzdana Para Yükle";
    }
  });
}