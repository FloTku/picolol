
console.log("🚀 APP.JS CHARGÉ (VERSION TEST)");

let joueurs = [];
const roles = [
  { nom: "Mister White", objectif: "Être accusé par la majorité." },
  { nom: "Super-Héro", objectif: "Avoir le plus de morts." },
  { nom: "Le PGM", objectif: "Avoir le plus de dégâts." },
  { nom: "Le Sup Originel", objectif: "Avoir le plus d’assists." },
  { nom: "Le Roi des Trolls", objectif: "Faire tilt un mate." }
];
function encode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function decode(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ================= HOME ================= */
function showHome() {
  const game = document.getElementById("game");

  game.innerHTML = `
    <h2>🎭 Picolol</h2>

    <label>Nombre de joueurs</label><br>
    <input type="number" id="players" min="2" max="5" value="5">
    <div id="nameInputs" style="margin-top:10px;"></div>

    <br>
    <button id="start">🎲 Générer les joueurs</button>
    <button id="createGame">🔥 Créer une partie</button>

    <hr>

    <input id="joinCode" placeholder="Code de la partie">
    <button id="joinGame">➡️ Rejoindre</button>
  `;

  // ⬇️ LISTENERS APRÈS injection HTML (OBLIGATOIRE)
  document.getElementById("start").addEventListener("click", startGame);
  document.getElementById("createGame").addEventListener("click", createGame);

  document.getElementById("joinGame").addEventListener("click", () => {
    const code = document.getElementById("joinCode").value.toUpperCase();
    if (!code) return alert("Entre un code");
    currentGameId = code;
    listenGame(code);
  });
}


/* ================= GAME ================= */
function startGame() {
  const nb = Number(document.getElementById("players").value);
  joueurs = [];

  const rolesMelanges = shuffle([...roles]);

  for (let i = 1; i <= nb; i++) {
    joueurs.push({
      id: i,
      name: `Joueur ${i}`,
      role: rolesMelanges[i - 1]
    });
  }

  let html = `<h2>🔗 Liens des joueurs</h2>`;

  joueurs.forEach(j => {
    const payload = encode(j);
    const url = `${window.location.origin}${window.location.pathname}?data=${payload}`;

    html += `
      <div class="card">
        <strong>${j.name}</strong><br>
        <input value="${url}" readonly style="width:100%">
      </div>
    `;
  });

  html += `<button id="hostView">🎮 Vue Hôte</button>`;

  document.getElementById("game").innerHTML = html;

  document.getElementById("hostView").addEventListener("click", showHostView);
}

function showHostView() {
  let html = `<h2>🎮 Vue Hôte</h2>`;

  joueurs.forEach(j => {
    html += `
      <div class="card">
        <strong>${j.name}</strong><br>
        🎭 ${j.role.nom}<br>
        🎯 ${j.role.objectif}
      </div>
    `;
  });

  html += `<button onclick="showHome()">⬅️ Retour</button>`;
  document.getElementById("game").innerHTML = html;
}
function showPlayerView(encoded) {
  const joueur = decode(encoded);

  document.getElementById("game").innerHTML = `
    <h2>🎴 Ton rôle secret</h2>
    <div class="card">
      <strong>${joueur.name}</strong><br><br>
      🎭 <strong>${joueur.role.nom}</strong><br>
      🎯 ${joueur.role.objectif}
    </div>
    <p style="opacity:.7">🔒 Ne montre pas cet écran</p>
  `;
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
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
document.addEventListener("DOMContentLoaded", () => {
  const data = getParam("data");
  if (data) {
    showPlayerView(data);
  } else {
    showHome();
  }
});
