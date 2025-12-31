const params = new URLSearchParams(window.location.search);
const playerData = params.get("data");
let currentGameId = null;

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
function drawEffect(pool) {
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * total;

  for (let effect of pool) {
    rand -= effect.weight;
    if (rand <= 0) return effect;
  }
}


let statCible = null;

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
function encode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function decode(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}

const roles = [
  { nom: "Mister White", objectif: "Être accusé par la majorité." },
  { nom: "Super-Héro", objectif: "Avoir le plus de morts." },
  { nom: "Le PGM", objectif: "Avoir le plus de dégâts." },
  { nom: "Le Sup Originel", objectif: "Avoir le plus d’assists." },
  { nom: "Le Roi des Trolls", objectif: "Faire tilt un mate." }
];

const champions = ["Ahri", "Yasuo", "Teemo", "Lux", "Garen"];
const lanes = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

let joueurs = [];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

window.addEventListener("DOMContentLoaded", () => {
  if (getParam("data")) {
    showPlayerView();
  } else {
    showHome();
  }
});


function showHome() {
  let html = `<h1>🎭 Picolol</h1>`;

  // 🔁 Effets sauvegardés
  const savedEffects = loadEffects();
  if (savedEffects) {
    html += `<h3>🎒 Effets actifs (partie précédente)</h3>`;

    savedEffects.forEach(e => {
      html += `
        <div class="card fail">
          <strong>Joueur : ${e.name || "Joueur " + e.id}</strong><br>
          ${e.effet.rarity} ${e.effet.text}
        </div>
      `;
    });
html += `
  <button id="createGameBtn">🔥 Créer une partie</button>
`;

    html += `
      <button id="clearEffects">
        ❌ Effacer les effets
      </button>
      <hr>
    `;
    }

  // 👥 Choix du nombre de joueurs
  html += `
    <label>Nombre de joueurs</label><br>
    <input type="number" id="players" min="2" max="5" value="5">
    <div id="nameInputs" style="margin-top:10px;"></div>

    <br>
    <button id="start">Lancer la partie</button>
  `;

  // ⬇️ Injection HTML
   document.getElementById("game").innerHTML = html;
document
  .getElementById("createGameBtn")
  .addEventListener("click", createGame);

  // 🔁 Génération dynamique des champs de noms
  const playersInput = document.getElementById("players");
  const namesDiv = document.getElementById("nameInputs");
function updateNameInputs() {
  const nb = Number(playersInput.value);
  namesDiv.innerHTML = "";

  for (let i = 1; i <= nb; i++) {
    namesDiv.innerHTML += `
      <input
        type="text"
        id="name-${i}"
        placeholder="Nom du joueur ${i}"
        style="display:block; margin:5px 0;"
      >
    `;
  }
}

playersInput.addEventListener("change", updateNameInputs);
updateNameInputs();


  document.getElementById("start").addEventListener("click", startGame);


  function updateNameInputs() {
    const nb = Number(playersInput.value);
    namesDiv.innerHTML = "";

    for (let i = 1; i <= nb; i++) {
      namesDiv.innerHTML += `
        <input
          type="text"
          id="name-${i}"
          placeholder="Nom du joueur ${i}"
          style="display:block; margin:5px 0;"
        >
      `;
    }
  }

  playersInput.addEventListener("change", updateNameInputs);
  updateNameInputs();

  // ▶️ Bouton start
  document.getElementById("start").addEventListener("click", startGame);

  // 🧹 Effacer les effets
  const clearBtn = document.getElementById("clearEffects");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem("picolol_effects");
      showHome();
    });
  }
}




function startGame() {
  const nb = Number(document.getElementById("players").value);
  const gameDiv = document.getElementById("game");

  joueurs = [];
  const rolesMelanges = shuffle([...roles]);

  for (let i = 0; i < nb; i++) {
const nameInput = document.getElementById(`name-${i + 1}`);
const name = nameInput && nameInput.value.trim()
  ? nameInput.value.trim()
  : `Joueur ${i + 1}`;

joueurs.push({
  id: i + 1,
  name: name,
  role: rolesMelanges[i],
  champion: random(champions),
  lane: lanes[i]
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
  gameDiv.innerHTML = html;

  document
    .getElementById("hostView")
    .addEventListener("click", launchHost);
}

function launchHost() {
  const gameDiv = document.getElementById("game");

  gameDiv.innerHTML = `
    <h2>🎮 Vue Hôte</h2>
    <p>Les joueurs ont reçu leurs rôles.</p>
    <button id="endGame">🏁 Fin de partie / Stats</button>
  `;

  document
    .getElementById("endGame")
    .addEventListener("click", revealStats);
}

function showPlayerView() {
  const data = getParam("data");
  if (!data) {
    showHome();
    return;
  }

  const joueur = decode(data);

  document.getElementById("game").innerHTML = `
    <h2>🎭 Ton rôle</h2>
    <div class="card">
      <h3>${joueur.role.nom}</h3>
      <p><strong>Objectif :</strong> ${joueur.role.objectif}</p>
      <hr>
      <p>🧙 ${joueur.champion}</p>
      <p>🛣️ ${joueur.lane}</p>
    </div>
    <p style="opacity:.7">🔒 Rôle secret jusqu’à la fin de la partie</p>
  `;
}
function revealStats() {
  statCible = stats[Math.floor(Math.random() * stats.length)];

  let html = `<h2>📊 Stat cible : ${statCible}</h2>`;

  joueurs.forEach(joueur => {
    html += `
      <div class="card">
        <strong>${joueur.name}</strong><br>
        <input 
          type="number" 
          id="stat-${joueur.id}" 
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

  for (let joueur of joueurs) {
    const input = document.getElementById(`stat-${joueur.id}`);

    if (!input || input.value === "") {
      alert("Merci de remplir toutes les stats.");
      return;
    }

    joueur.stat = Number(input.value);
  }

  joueurs.forEach(joueur => {
    html += `
      <div class="card">
        <strong>${joueur.name}</strong><br>
        🎭 ${joueur.role.nom}<br>
        🎯 ${joueur.role.objectif}<br>

        <button class="successBtn" data-id="${joueur.id}" data-result="true">
          ✅ Réussie
        </button>
        <button class="failBtn" data-id="${joueur.id}" data-result="false">
          ❌ Ratée
        </button>
      </div>
    `;
  });
html += `
  <button id="applyBM" disabled>
    🎁 Appliquer bonus / malus
  </button>
`;

  // ⬇️ ICI seulement on injecte le HTML
  document.getElementById("game").innerHTML = html;

  // ⬇️ ET SEULEMENT APRÈS on branche les boutons
  document.querySelectorAll(".successBtn, .failBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const success = btn.dataset.result === "true";
      setResult(id, success);
    });
  });

  document
  .getElementById("applyBM")
  .addEventListener("click", applyBonusMalus);
function checkReady() {
  const btn = document.getElementById("applyBM");
  btn.disabled = !allResultsSet();
}

document.querySelectorAll(".successBtn, .failBtn").forEach(btn => {
  btn.addEventListener("click", checkReady);
});

document
  .getElementById("applyBM")
  .addEventListener("click", applyBonusMalus);

}

function setResult(id, success) {
  const joueur = joueurs.find(j => j.id === id);
  joueur.success = success;
  console.log(`Joueur ${id} → ${success ? "RÉUSSIE" : "RATÉE"}`);
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
          ✅ BONUS : ${effet.rarity} ${effet.text}
        </div>
      `;
    } else {
      effet = drawEffect(malusPool);

      html += `
        <div class="card fail">
          <strong>${joueur.name}</strong><br>
          ❌ MALUS : ${effet.rarity} ${effet.text}
        </div>
      `;
    }

    joueur.effet = effet; // ✅ on stocke LE BON effet
  });

  html += `<p>➡️ À appliquer sur la <strong>prochaine partie</strong></p>`;
  document.getElementById("game").innerHTML = html;
  function saveEffects() {
  const data = joueurs.map(j => ({
    id: j.id,
    name:j.name,
    effet: j.effet
  }));

  localStorage.setItem("picolol_effects", JSON.stringify(data));
}
saveEffects();

}
function loadEffects() {
  const data = localStorage.getItem("picolol_effects");
  if (!data) return null;
  return JSON.parse(data);
}
function showPlayerView(encoded) {
  const joueur = decode(encoded);

  let html = `
    <h1>🎴 Ton rôle secret</h1>
    <div class="card">
      <strong>${joueur.name}</strong><br><br>
      🎭 <strong>${joueur.role.nom}</strong><br>
      🎯 ${joueur.role.objectif}<br><br>
      🧙 ${joueur.champion}<br>
      🛣️ ${joueur.lane}
    </div>
  `;

  document.getElementById("game").innerHTML = html;
}
function createGame() {
  const gameId = Math.random().toString(36).substring(2, 8);

  db.ref("games/" + gameId).set({
    phase: "lobby"
  });

  listenGame(gameId);
  alert("Code de la partie : " + gameId);
}
function listenGame(gameId) {
  db.ref("games/" + gameId).on("value", snapshot => {
    const game = snapshot.val();
    if (!game) return;

    console.log("🔥 MAJ GAME :", game);

    document.getElementById("game").innerHTML = `
      <h1>🎮 Partie ${gameId}</h1>
      <p>Phase actuelle : <strong>${game.phase}</strong></p>
      <button onclick="setPhase('${gameId}', 'roles')">➡️ Rôles</button>
      <button onclick="setPhase('${gameId}', 'stats')">📊 Stats</button>
      <button onclick="setPhase('${gameId}', 'bonus')">🎁 Bonus</button>
    `;
  });
}
function setPhase(gameId, phase) {
  db.ref("games/" + gameId + "/phase").set(phase);
}
function allResultsSet() {
  return joueurs.every(j => typeof j.success === "boolean");
}
function createGame() {
  const gameId = Math.random().toString(36).substring(2, 8);
  currentGameId = gameId;

  db.ref("games/" + gameId).set({
    phase: "lobby",
    createdAt: Date.now()
  });

  alert("Code de la partie : " + gameId);
}
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const playerData = params.get("data");

  if (playerData) {
    showPlayerView(playerData);
  } else {
    showHome();
  }
});
