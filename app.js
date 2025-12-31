

let joueurs = [];

/* ================= HOME ================= */
function showHome() {
  document.getElementById("game").innerHTML = `
    <h2>🎭 Picolol</h2>

    <label>Nombre de joueurs</label><br>
    <input type="number" id="players" min="2" max="5" value="5"><br><br>

    <button id="startBtn">Lancer la partie</button>
  `;

  document
    .getElementById("startBtn")
    .addEventListener("click", startGame);
}

/* ================= GAME ================= */
function startGame() {
  alert("🚀 START GAME OK");

  const nb = Number(document.getElementById("players").value);
  joueurs = [];

  for (let i = 1; i <= nb; i++) {
    joueurs.push({ id: i, name: `Joueur ${i}` });
  }

  let html = `<h2>🎮 Partie lancée</h2>`;
  joueurs.forEach(j => {
    html += `<div>👤 ${j.name}</div>`;
  });

  document.getElementById("game").innerHTML = html;
}

/* ================= BOOT ================= */
document.addEventListener("DOMContentLoaded", showHome);
console.log("🔥 app.js chargé");

// 🔥 Firebase config (REMPLACE avec TES VALEURS)
const firebaseConfig = {
  apiKey: "AIzaSyD6JtqXHDk4TglDyNZ4iRPA8gYWi0uSjjM",
  authDomain: "Tpicolol-d75f9.firebaseapp.com",
  databaseURL: "https://picolol-d75f9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "picolol-d75f9",
  storageBucket: "picolol-d75f9.firebasestorage.app",
  messagingSenderId: "1046593597094",
  appId: "1:1046593597094:web:6237edbf11813a3824ce67"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

console.log("✅ Firebase initialisé");
function testFirebase() {
  db.ref("test").set({
    ok: true,
    time: Date.now()
  });
  alert("🔥 Firebase écrit !");
}
