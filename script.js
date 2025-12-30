function encode(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decode(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
window.addEventListener("DOMContentLoaded", () => {
  if (getParam("data")) {
    showPlayerView();
  } else {
    showHome();
  }
});

let joueurs = [];

const stats = [
  "Kills",
  "Assists",
  "Deaths",
  "Vision Score",
  "Dégâts",
  "Golds/min ÷ 100"
];

let statCible = null;

const roles = [
  { nom: "Mister White", objectif: "Tu dois être accusé par la majorité." },
  { nom: "Super-Héro", objectif: "Avoir PLUS de morts que tout le monde." },
  { nom: "Le PGM", objectif: "Avoir le PLUS de dégâts." },
  { nom: "Le Sup Originel", objectif: "Avoir le PLUS d’assists." },
  { nom: "Le Roi des Trolls", objectif: "Faire tilt un mate (vote)." },
  { nom: "Jungle Diff", objectif: "Être souvent sur une autre lane." },
  { nom: "Tilted", objectif: "Voler 3 buffs après 15 min." },
  { nom: "DOMINGO", objectif: "Utiliser FLASH dès qu’il est up." },
  { nom: "SHIVA' GOAT", objectif: "Aucun dragon pour l’ennemi." },
  { nom: "Premier Arrivé", objectif: "Première tour de Nexus détruite." }
];

const bonusList = [
  "Immunité à la prochaine partie",
  "Reroll du rôle",
  "Reroll du champion",
  "Inversion de la stat",
  "BANANA : personne ne boit",
  "Forcer un invade (sans kill)",
  "Botlane improvisée pendant 5 min"
];

const malusList = [
  "Stats doublées",
  "Tu bois pour tout le monde",
  "Double rôle à la prochaine partie",
  "Commence avec +5 dans la stat",
  "TEEMO SHROOM : tu bois le double",
  "BURN : cul sec"
];

const champions = [
  "Ahri", "Yasuo", "Teemo", "Lux", "Garen",
  "Lee Sin", "Jinx", "Thresh", "Zed", "Soraka"
];

const lanes = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
function showHome() {
  document.getElementById("game").innerHTML = `
    <h1>🎭 PICOLORÔLE</h1>

    <label>Nombre de joueurs (2 à 5)</label><br>
    <input type="number" id="players" min="2" max="5" value="5"><br><br>

    <button onclick="startGame()">Lancer la partie</button>
  `;
}
// 🔒 Si on est sur un lien joueur, on ne charge PAS l'écran hôte
if (getParam("data")) {
  window.onload = () => {};
}
function showHome() {
  document.getElementById("game").innerHTML = `
    <h1>🎭 PICOLORÔLE</h1>

    <label>Nombre de joueurs (2 à 5)</label><br>
    <input type="number" id="players" min="2" max="5" value="5"><br><br>

    <button onclick="startGame()">Lancer la partie</button>
  `;
}
function showHome() {
  document.getElementById("game").innerHTML = `
    <h1>🎭 PICOLORÔLE</h1>

    <label>Nombre de joueurs (2 à 5)</label><br>
    <input type="number" id="players" min="2" max="5" value="5"><br><br>

    <button id="start">Lancer la partie</button>

    <hr>

    <h2>📜 Règles</h2>
    <div class="card">
      <ul>
        <li>Les rôles sont <strong>secrets</strong> jusqu’à la fin de la partie</li>
        <li>Chaque joueur reçoit un rôle, un champion et une lane</li>
        <li>La <strong>stat cible</strong> est tirée aléatoirement</li>
        <li>En fin de partie : révélation des rôles</li>
        <li>Mission réussie → <strong>Bonus</strong></li>
        <li>Mission ratée → <strong>Malus</strong></li>
        <li>Les bonus/malus s’appliquent à la <strong>partie suivante</strong></li>
      </ul>
    </div>
  `;

  document
    .getElementById("start")
    .addEventListener("click", startGame);
}

function showPlayerView() {
  const data = getParam("data");
  const joueur = decode(data);

  document.getElementById("game").innerHTML = `
    <h2>🎭 Ton rôle</h2>
    <div class="card">
      <strong>${joueur.role.nom}</strong><br><br>
      🎯 ${joueur.role.objectif}<br><br>
      🧙 ${joueur.champion} — ${joueur.lane}
    </div>
    <p>🔒 Garde ce rôle secret jusqu’à la fin de la partie</p>
  `;
}

function random(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function startGame() {
  const nb = Number(document.getElementById("players").value);
  const gameDiv = document.getElementById("game");

  // sécurité
  if (nb < 2 || nb > 5) {
    alert("Le nombre de joueurs doit être entre 2 et 5");
    return;
  }

  joueurs = [];
  statCible = random(stats);

  // rôles uniques
  const rolesMelanges = shuffle([...roles]);

  for (let i = 1; i <= nb; i++) {
    joueurs.push({
      id: i,
      role: rolesMelanges[i - 1],
      champion: random(champions),
      lane: lanes[i - 1]
    });
  }

  // === GÉNÉRATION DES LIENS ===
  let html = `<h2>🔗 Liens des joueurs (${nb})</h2>`;

  joueurs.forEach(joueur => {
    const payload = encode({
      id: joueur.id,
      role: joueur.role,
      champion: joueur.champion,
      lane: joueur.lane
    });

    const url =
      window.location.origin +
      window.location.pathname +
      `?data=${payload}`;

    html += `
      <div class="card">
        <strong>Joueur ${joueur.id}</strong><br>
        <input type="text" value="${url}" readonly style="width:100%">
      </div>
    `;
  });

  html += `<button id="hostView">🎮 Vue Hôte</button>`;
  gameDiv.innerHTML = html;

  document
    .getElementById("hostView")
    .addEventListener("click", launchHost);
}


html += `<button id="hostView">🎮 Vue Hôte</button>`;
gameDiv.innerHTML = html;

document
  .getElementById("hostView")
  .addEventListener("click", launchHost);



  const finBtn = document.createElement("button");
  finBtn.textContent = "🏁 Fin de partie / Stats";
  finBtn.onclick = revealRoles;

  gameDiv.appendChild(document.createElement("br"));
  gameDiv.appendChild(finBtn);


function revealRoles() {
  let html = `<h2>📊 Stat cible : ${statCible}</h2>`;

  joueurs.forEach(joueur => {
    html += `
      <div>
        <strong>Joueur ${joueur.id}</strong><br>
        <input type="number" id="stat-${joueur.id}" placeholder="Valeur">
      </div><br>
    `;
  });

  html += `<button id="validateStats">Valider les stats</button>`;

  const gameDiv = document.getElementById("game");
  gameDiv.innerHTML = html;

  document
    .getElementById("validateStats")
    .addEventListener("click", showResults);
}

function showResults() {
  console.log("showResults appelée ✅");

  let html = `<h2>📊 Résultats — ${statCible}</h2>`;

  for (let joueur of joueurs) {
    const input = document.getElementById(`stat-${joueur.id}`);

    if (!input || input.value === "") {
      alert("Merci de remplir TOUTES les stats.");
      return;
    }

    joueur.stat = Number(input.value);
  }

  joueurs.forEach(joueur => {
  html += `
    <div class="card">
      <strong>Joueur ${joueur.id}</strong><br>
      🎭 <strong>${joueur.role.nom}</strong><br>
      🎯 ${joueur.role.objectif}<br>
      🧙 ${joueur.champion} — ${joueur.lane}<br>
      📊 <strong>${statCible}</strong> : ${joueur.stat}
    </div>
  `;
});

  document.getElementById("game").innerHTML = html;
}


  document.body.innerHTML = html;

function nextStep() {
  alert("Étape suivante : bonus / malus (prochaine étape 😈)");
}

function setResult(id, success) {
  const joueur = joueurs.find(j => j.id === id);
  joueur.success = success;
  alert(`Joueur ${id} : mission ${success ? "RÉUSSIE" : "RATÉE"}`);
}

function applyBonusMalus() {
  let html = `<h2>🎁 Bonus & Malus</h2>`;

  joueurs.forEach(joueur => {
    let effet;

    if (joueur.success) {
  html += `
    <div class="card success">
      <strong>Joueur ${joueur.id}</strong><br>
      ✅ BONUS : ${effet}
    </div>
  `;
} else {
  html += `
    <div class="card fail">
      <strong>Joueur ${joueur.id}</strong><br>
      ❌ MALUS : ${effet}
    </div>
  `;
}

    joueur.effet = effet;
  });

  html += `<h3>➡️ À appliquer sur la PROCHAINE PARTIE</h3>`;
  document.getElementById("game").innerHTML = html;
}
// 🔒 Si on est sur un lien joueur, on ne charge PAS l'écran hôte
if (getParam("data")) {
  window.onload = () => {};
}

(function playerView() {
  const data = getParam("data");
  if (!data) return;

  const joueur = decode(data);

  document.getElementById("game").innerHTML = `
    <h2>🎭 Ton rôle</h2>
    <div class="card">
      <strong>${joueur.role.nom}</strong><br><br>
      🎯 ${joueur.role.objectif}<br><br>
      🧙 ${joueur.champion} — ${joueur.lane}
    </div>
    <p>🔒 Rôle secret jusqu’à la fin de la partie</p>
  `;
})();
if (getParam("data")) {
  // vue joueur
  (function playerView() {
    const joueur = decode(getParam("data"));

    document.getElementById("game").innerHTML = `
      <h2>🎭 Ton rôle</h2>
      <div class="card">
        <strong>${joueur.role.nom}</strong><br><br>
        🎯 ${joueur.role.objectif}<br><br>
        🧙 ${joueur.champion} — ${joueur.lane}
      </div>
      <p>🔒 Rôle secret jusqu’à la fin de la partie</p>
    `;
  })();
} else {
  // vue hôte
  window.onload = showHome;
}
