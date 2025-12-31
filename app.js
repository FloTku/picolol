console.log("🔥 app.js chargé");

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD6JtqXHDk4TglDyNZ4iRPA8gYWi0uSjjM",
  authDomain: "picolol-d75f9.firebaseapp.com",
  databaseURL: "https://picolol-d75f9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "picolol-d75f9",
  storageBucket: "picolol-d75f9.appspot.com",
  messagingSenderId: "1046593597094",
  appId: "1:1046593597094:web:6237edbf11813a3824ce67"
};

// ✅ Init Firebase (une seule fois)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

console.log("✅ Firebase initialisé");







let joueurs = [];

const stats = [
  "Kills",
  "Deaths",
  "Assists",
  "Vision Score",
  "Dégâts",
  "Gold/min"
];
const bonusPool = [
  // ⚪ COMMUN
  { text: "Peut ignorer UN call d’équipe sans reproche", rarity: "⚪ Commun", weight: 35 },
  { text: "Peut forcer un allié à dire 'my bad' après un missplay", rarity: "⚪ Commun", weight: 35 },
  { text: "Peut prendre un buff ennemi UNE fois si l’occasion se présente", rarity: "⚪ Commun", weight: 35 },

  // 🔵 RARE
  { text: "+1 reroll de champion (si random)", rarity: "🔵 Rare", weight: 20 },
  { text: "Peut shotcaller pendant 10 minutes (les autres doivent écouter)", rarity: "🔵 Rare", weight: 20 },
  { text: "Peut swap de rôle avec un allié AVANT le début de la game", rarity: "🔵 Rare", weight: 20 },
  { text: "Peut décider du prochain objectif (même mauvais)", rarity: "🔵 Rare", weight: 20 },

  // 🟣 ÉPIQUE
  { text: "Devient shotcaller ABSOLU pendant 10 minutes", rarity: "🟣 Épique", weight: 10 },
  { text: "Peut imposer un swap de lane à 10 minutes", rarity: "🟣 Épique", weight: 10 },
  { text: "Peut voler le bonus d’un autre joueur", rarity: "🟣 Épique", weight: 10 },

  // 🟠 LÉGENDAIRE
  { text: "Peut choisir son champion ET sa lane pour la prochaine partie", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut annuler UN malus d’un autre joueur", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut annuler UN vote ou décision d’équipe", rarity: "🟠 Légendaire", weight: 5 }
];

const malusPool = [
  // ⚪ COMMUN
  { text: "Doit dire 'bien joué' après CHAQUE mort", rarity: "⚪ Commun", weight: 35 },
  { text: "Doit annoncer chaque back à l’oral ou dans le chat", rarity: "⚪ Commun", weight: 35 },
  { text: "Doit jouer prudemment : aucun engage volontaire pendant 5 minutes", rarity: "⚪ Commun", weight: 35 },
  { text: "Doit jouer sans musique / sans son pendant 10 minutes", rarity: "⚪ Commun", weight: 35 },

  // 🔵 RARE
  { text: "Interdiction de back avant 5 minutes", rarity: "🔵 Rare", weight: 20 },
  { text: "Interdiction d’utiliser les pings pendant 10 minutes", rarity: "🔵 Rare", weight: 20 },
  { text: "Doit suivre un call d’équipe même s’il est discutable", rarity: "🔵 Rare", weight: 20 },
  { text: "Ne peut pas toucher aux objectifs neutres pendant 10 minutes", rarity: "🔵 Rare", weight: 20 },

  // 🟣 ÉPIQUE
  { text: "Interdiction d’utiliser Flash pendant les 10 premières minutes", rarity: "🟣 Épique", weight: 10 },
  { text: "Pas de ward pendant 10 minutes", rarity: "🟣 Épique", weight: 10 },
  { text: "Doit donner son premier buff à un allié", rarity: "🟣 Épique", weight: 10 },
  { text: "Interdiction d’utiliser UN sort de base choisi par l’équipe pendant 5 minutes", rarity: "🟣 Épique", weight: 10 },

  // 🟠 LÉGENDAIRE
  { text: "Doit changer de lane à 10 minutes (swap imposé)", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Interdiction totale de ward pendant 15 minutes", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Ne peut pas back sauf si mort pendant 10 minutes", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Ne peut pas toucher aux objectifs neutres pendant 15 minutes", rarity: "🟠 Légendaire", weight: 5 }
];

let statCible = null;


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
let homeRendered = false;

function showHome() {
  console.log("🏠 showHome");

  const gameDiv = document.getElementById("game");

  gameDiv.innerHTML = `
    <h2>🎭 Picolol</h2>

    <label>Nombre de joueurs</label><br>
    <input type="number" id="players" min="2" max="5" value="5">

    <br><br>

    <button id="start">🎲 Générer les joueurs</button>
    <button id="createGame">🔥 Créer une partie</button>

    <hr>

    <input id="joinCode" placeholder="Code de la partie">
    <button id="joinGame">➡️ Rejoindre</button>
  `;

  // ⚠️ LES BOUTONS SONT BRANCHÉS APRÈS L’INJECTION HTML
  document.getElementById("start").addEventListener("click", () => {
    console.log("🎲 Click start");
    startGame();
  });

  document.getElementById("createGame").addEventListener("click", () => {
    console.log("🔥 Click createGame");
    createGame();
  });

  document.getElementById("joinGame").addEventListener("click", () => {
    const code = document.getElementById("joinCode").value.trim().toUpperCase();
    if (!code) {
      alert("Entre un code");
      return;
    }
    console.log("➡️ Join game", code);
    joinGame(code);
  });
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

// Init Firebase


console.log("✅ Firebase initialisé");
function testFirebase() {
  db.ref("test").set({
    ok: true,
    time: Date.now()
  });

}
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
document.addEventListener("DOMContentLoaded", () => {
  const data = getParam("data");
  if (data) {
    showPlayerView(data);
  } else {
   
  }
});
function revealStats() {
  statCible = stats[Math.floor(Math.random() * stats.length)];

  let html = `<h2>📊 Stat cible : ${statCible}</h2>`;

  joueurs.forEach(j => {
    html += `
      <div class="card">
        <strong>${j.name}</strong><br>
        <input
          type="number"
          id="stat-${j.id}"
          placeholder="Valeur"
        >
      </div>
    `;
  });

  html += `<button id="validateStats">Valider les stats</button>`;

  document.getElementById("game").innerHTML = html;

  document
    .getElementById("validateStats")
    .addEventListener("click", showResults);
}
function showResults() {
  let html = `<h2>📊 Résultats — ${statCible}</h2>`;

  joueurs.forEach(joueur => {
    html += `
      <div class="card">
        <strong>${joueur.name}</strong><br>

        <button class="successBtn" data-id="${joueur.id}">
          ✅ Réussie
        </button>
        <button class="failBtn" data-id="${joueur.id}">
          ❌ Ratée
        </button>
      </div>
    `;
  });

  // ✅ UN SEUL bouton global
  html += `
    <button id="applyBM" disabled>
      🎁 Appliquer bonus / malus
    </button>
  `;

  document.getElementById("game").innerHTML = html;

  // 🎯 Gestion des clics réussite / ratée
  document.querySelectorAll(".successBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      setResult(Number(btn.dataset.id), true);
      checkReady();
    });
  });

  document.querySelectorAll(".failBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      setResult(Number(btn.dataset.id), false);
      checkReady();
    });
  });

  // 🎁 Bouton final
  document
    .getElementById("applyBM")
    .addEventListener("click", applyBonusMalus);
}

function setResult(id, success) {
  const joueur = joueurs.find(j => j.id === id);
  joueur.success = success;
  console.log(joueur.name, success ? "RÉUSSIE" : "RATÉE");
}
function allResultsSet() {
  return joueurs.every(j => typeof j.success === "boolean");
}
function applyBonusMalus() {
  let html = `<h2>🎁 Bonus & Malus</h2>`;

  joueurs.forEach(joueur => {
    let effet;

    if (joueur.success) {
      effet = drawEffect(bonusPool);

      html += `
        <div class="card success">
          <strong>${joueur.name}</strong><br>
          ✅ ${effet.rarity} — ${effet.text}
        </div>
      `;
    } else {
      effet = drawEffect(malusPool);

      html += `
        <div class="card fail">
          <strong>${joueur.name}</strong><br>
          ❌ ${effet.rarity} — ${effet.text}
        </div>
      `;
    }

    joueur.effet = effet;
  });

  saveEffects();
  document.getElementById("game").innerHTML = html;
}

function saveEffects() {
  const data = joueurs.map(j => ({
    id: j.id,
    name: j.name,
    effet: j.effet
  }));

  localStorage.setItem("picolol_effects", JSON.stringify(data));
}
function loadEffects() {
  const data = localStorage.getItem("picolol_effects");
  return data ? JSON.parse(data) : null;
}
const saved = loadEffects();
if (saved) {
  let html = `<h3>🎒 Effets actifs</h3>`;
  saved.forEach(e => {
    html += `
      <div class="card fail">
        ${e.name} — ${e.effet.rarity} ${e.effet.text}
      </div>
    `;
  });
  html += `<hr>`;
}
function checkReady() {
  const btn = document.getElementById("applyBM");
  btn.disabled = !joueurs.every(j => typeof j.success === "boolean");
}
function drawEffect(pool) {
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const effect of pool) {
    rand -= effect.weight;
    if (rand <= 0) {
      return effect;
    }
  }
}


let currentGameId = null;
let isHost = false;

function createGame() {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  currentGameId = gameId;
  isHost = true;

  db.ref("games/" + gameId).set({
    phase: "lobby",
    createdAt: Date.now()
  });

  alert("🎮 Code de la partie : " + gameId);

  listenGame(gameId);
}

function listenGame(gameId) {
  db.ref("games/" + gameId).on("value", snap => {
    const game = snap.val();
    if (!game) return;

    if (isHost) {
      renderHostView(game);
    } else {
      renderPlayerView(game);
    }


    console.log("🔥 GAME UPDATE", game);

    document.getElementById("game").innerHTML = `
      <h2>🎮 Partie ${gameId}</h2>
      <p>Phase actuelle : <strong>${game.phase}</strong></p>
    `;
  });
}
function startGame() {
  joueurs = [];

  const rolesMix = shuffle([...roles]);

  for (let i = 1; i <= 5; i++) {
    joueurs.push({
      id: i,
      name: "Joueur " + i,
      role: rolesMix[i - 1],
      champion: random(champions),
      lane: lanes[i - 1]
    });
  }

  db.ref("games/" + currentGameId + "/players").set(joueurs);
}

function showRolesHost() {
  document.getElementById("game").innerHTML = `
    <h2>🎮 Vue Hôte</h2>
    <p>Les joueurs consultent leur rôle</p>

    <button onclick="setPhase('stats')">📊 Fin de partie</button>
  `;
}
function setPhase(phase) {
  if (!currentGameId) return;

  db.ref("games/" + currentGameId + "/phase").set(phase);
}
function createGame() {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  currentGameId = gameId;

  db.ref("games/" + gameId).set({
    phase: "lobby",
    createdAt: Date.now()
  });

  alert("🎮 Code de la partie : " + gameId);
  listenGame(gameId);
}
function listenGame(gameId) {
  db.ref("games/" + gameId).on("value", snap => {
    const game = snap.val();
    if (!game) return;
      if (isHost) {
  showHostView(game);
} else {
  showPlayerView(game);
}

    switch (game.phase) {
      case "lobby":
        showLobby();
        break;

      case "roles":
        showRolesHost();
        break;

      case "stats":
        revealStats();
        break;

      case "bonus":
        applyBonusMalus();
        break;
        
    }
  });
}
function showLobby() {
  document.getElementById("game").innerHTML = `
    <h2>🎮 Partie ${currentGameId}</h2>
    <p>Phase : Lobby</p>

    <button id="startGame">🎲 Générer les joueurs</button>
  `;

  document.getElementById("startGame").onclick = () => {
    startGame();           // génère UNE FOIS
    setPhase("roles");     // notifie TOUT LE MONDE
  };
}
function startGame() {
  joueurs = [];

  for (let i = 1; i <= 5; i++) {
    joueurs.push({
      id: i,
      name: "Joueur " + i
    });
  }

  db.ref("games/" + currentGameId + "/players").set(joueurs);
}
function setPhase(phase) {
  db.ref("games/" + currentGameId + "/phase").set(phase);
}
function showRolesHost() {
  document.getElementById("game").innerHTML = `
    <h2>🎭 Rôles distribués</h2>
    <p>Les joueurs peuvent voir leur rôle.</p>
    <button onclick="setPhase('stats')">➡️ Passer aux stats</button>
  `;
}
function showPlayerRole(playerId) {
  db.ref("games/" + currentGameId + "/players").once("value", snap => {
    const players = snap.val();
    const me = players.find(p => p.id === playerId);

    document.getElementById("game").innerHTML = `
      <h2>🎴 Ton rôle</h2>
      <div class="card">
        <strong>${me.name}</strong><br><br>
        🎭 <b>${me.role.nom}</b><br>
        🎯 ${me.role.objectif}<br><br>
        🧙 ${me.champion}<br>
        🛣️ ${me.lane}
      </div>
      <p style="opacity:.7">🔒 Secret jusqu’à la fin</p>
    `;
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const playerId = Number(params.get("player"));

  if (playerId && currentGameId) {
    showPlayerRole(playerId);
  } else {
   
  }
});
function createGame() {
  isHost = true;

  const gameId = generateCode();
  currentGameId = gameId;

  db.ref("games/" + gameId).set({
    phase: "lobby",
    players: {}
  });

  listenGame(gameId);
}
function joinGame(code, id) {
  isHost = false;
  playerId = id;

  currentGameId = code;
  listenGame(code);
}
function renderHostView(game) {
  if (game.phase === "lobby") showLobbyHost();
  if (game.phase === "roles") showRolesHost();
  if (game.phase === "stats") showStatsHost();
}
function renderPlayerView(game) {
  const me = game.players[playerId];

  if (game.phase === "lobby") showWaiting();
  if (game.phase === "roles") showMyRole(me);
  if (game.phase === "stats") showStatsPlayer();
}
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM prêt");

  const params = new URLSearchParams(window.location.search);
  const playerData = params.get("data");

  if (playerData) {
    showPlayerView(playerData);
  } else {

  }
});
function joinGame(gameId) {
  currentGameId = gameId;
  isHost = false;

  listenGame(gameId);
}
