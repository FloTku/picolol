console.log("🔥 app.js chargé");

/* ================= GLOBAL ================= */
let currentGameId = null;
let playerId = localStorage.getItem("picolol_playerId");
let role = localStorage.getItem("picolol_role"); // "host" | "player"

if (!playerId) {
  playerId = Math.random().toString(36).substring(2, 9);
  localStorage.setItem("picolol_playerId", playerId);
}

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyD6JtqXHDk4TglDyNZ4iRPA8gYWi0uSjjM",
  authDomain: "picolol-d75f9.firebaseapp.com",
  databaseURL: "https://picolol-d75f9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "picolol-d75f9",
  storageBucket: "picolol-d75f9.appspot.com",
  messagingSenderId: "1046593597094",
  appId: "1:1046593597094:web:6237edbf11813a3824ce67"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
console.log("✅ Firebase initialisé");

/* ================= DATA ================= */
const roles = [
  { nom: "Mister White", objectif: "Être accusé par la majorité." },
  { nom: "Super-Héro", objectif: "Avoir le plus de morts." },
  { nom: "Le PGM", objectif: "Avoir le plus de dégâts." },
  { nom: "Le Sup Originel", objectif: "Avoir le plus d’assists." },
  { nom: "Le Roi des Trolls", objectif: "Faire tilt un mate." }
];

const bonusPool = [
  { text: "Ignore un call d’équipe", rarity: "⚪ Commun", weight: 35 },
  { text: "Shotcaller 10 min", rarity: "🔵 Rare", weight: 20 },
  { text: "Shotcaller ABSOLU", rarity: "🟣 Épique", weight: 10 },
  { text: "Choisit champion + lane", rarity: "🟠 Légendaire", weight: 5 }
];

const malusPool = [
  { text: "Dire 'bien joué' après chaque mort", rarity: "⚪ Commun", weight: 35 },
  { text: "Pas de ping 10 min", rarity: "🔵 Rare", weight: 20 },
  { text: "Pas de Flash 10 min", rarity: "🟣 Épique", weight: 10 },
  { text: "Swap de lane imposé", rarity: "🟠 Légendaire", weight: 5 }
];

/* ================= UTILS ================= */
function drawEffect(pool) {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (let e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
}

/* ================= HOME ================= */
function showHome() {
  document.getElementById("game").innerHTML = `
    <h2>🎭 Picolol</h2>

    <button id="createGame">🔥 Créer une partie</button>
    <hr>

    <input id="joinCode" placeholder="Code de la partie">
    <button id="joinGame">➡️ Rejoindre</button>
  `;

  document.getElementById("createGame").onclick = createGame;
  document.getElementById("joinGame").onclick = () => {
    const code = document.getElementById("joinCode").value.trim().toUpperCase();
    if (!code) return alert("Entre un code");
    joinGame(code);
  };
}

/* ================= GAME FLOW ================= */
function createGame() {
  currentGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  role = "host";

  localStorage.setItem("picolol_role", "host");
  localStorage.setItem("picolol_gameId", currentGameId);

  db.ref("games/" + currentGameId).set({
    phase: "lobby",
    players: {}
  });

  listenGame(currentGameId);
  alert("🎮 Code de la partie : " + currentGameId);
}

function joinGame(code) {
  currentGameId = code;
  role = "player";

  localStorage.setItem("picolol_role", "player");
  localStorage.setItem("picolol_gameId", code);

  db.ref(`games/${code}/players/${playerId}`).set({
    id: playerId,
    name: "Joueur " + playerId.substring(0, 4)
  });

  listenGame(code);
}

function listenGame(gameId) {
  db.ref("games/" + gameId).on("value", snap => {
    const game = snap.val();
    if (!game) return;

    if (role === "host") renderHost(game);
    else renderPlayer(game);
  });
}

/* ================= HOST ================= */
function renderHost(game) {
  let html = `
    <h2>👑 Hôte — Partie ${currentGameId}</h2>
    <p>Phase : <b>${game.phase}</b></p>
  `;

  if (game.phase === "lobby") {
    html += `<button id="distributeRoles">🎴 Distribuer les rôles</button>`;
  }

  html += `<h3>👥 Joueurs</h3>`;

  Object.values(game.players || {}).forEach(p => {
    html += `
      <div class="card">
        ${p.name}<br>
        🎭 ${p.role ? p.role.nom : "⏳ En attente"}
      </div>
    `;
  });

  document.getElementById("game").innerHTML = html;

  if (game.phase === "lobby") {
    document.getElementById("distributeRoles").onclick = () => distributeRoles(game);
  }
}

function distributeRoles(game) {
  const shuffled = [...roles].sort(() => Math.random() - 0.5);
  let i = 0;

  Object.keys(game.players).forEach(pid => {
    db.ref(`games/${currentGameId}/players/${pid}/role`).set(shuffled[i++]);
  });

  db.ref(`games/${currentGameId}/phase`).set("roles");
}

/* ================= PLAYER ================= */
function renderPlayer(game) {
  const me = game.players[playerId];

  if (!me) {
    document.getElementById("game").innerHTML = "⏳ En attente…";
    return;
  }

  if (game.phase !== "roles") {
    document.getElementById("game").innerHTML = `
      <h2>🎮 Partie ${currentGameId}</h2>
      <p>⏳ En attente de la distribution</p>
    `;
    return;
  }

  document.getElementById("game").innerHTML = `
    <h2>🎴 Ton rôle secret</h2>
    <div class="card">
      <strong>${me.name}</strong><br><br>
      🎭 <b>${me.role.nom}</b><br>
      🎯 ${me.role.objectif}
    </div>
  `;
}

/* ================= BOOT ================= */
document.addEventListener("DOMContentLoaded", showHome);
