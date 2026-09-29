import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const googleBtn = document.getElementById("google-login-btn");
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const registerBtn = document.getElementById("register-submit-btn");
const authError = document.getElementById("auth-error");

// Zaten giriş yapmışsa ana sayfaya at
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.includes("login.html")) {
    window.location.href = "index.html";
  }
});

function showError(msg) {
  if (authError) {
    authError.textContent = msg;
    authError.classList.remove("hidden");
  }
}

// Google ile Giriş Yap
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Google Auth hatası:", err);
      showError("Google ile giriş yapılamadı: " + err.message);
    }
  });
}

// E-posta ile Giriş Yap
if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Giriş hatası:", err);
      showError("E-posta veya şifre hatalı.");
    }
  });
}

// E-posta ile Kayıt Ol
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    if (!emailInput.value || !passwordInput.value) {
      showError("Lütfen e-posta ve şifre girin.");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      alert("Kayıt başarılı! Yönlendiriliyorsunuz...");
      window.location.href = "index.html";
    } catch (err) {
      console.error("Kayıt hatası:", err);
      showError("Kayıt oluşturulamadı: " + err.message);
    }
  });
}