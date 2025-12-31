console.log("SCRIPT LOCAL OK");
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
  document.getElementById("game").innerHTML = `
    <h1>🎭 PICOLORÔLE</h1>
    <input type="number" id="players" min="2" max="5" value="5">
    <br><br>
    <button id="start">Lancer la partie</button>
  `;

  document
    .getElementById("start")
    .addEventListener("click", startGame);
}

function startGame() {
  const nb = Number(document.getElementById("players").value);
  const gameDiv = document.getElementById("game");

  joueurs = [];
  const rolesMelanges = shuffle([...roles]);

  for (let i = 0; i < nb; i++) {
    joueurs.push({
      id: i + 1,
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
        Joueur ${j.id}<br>
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
  document.getElementById("game").innerHTML = `
    <h2>🎮 Vue Hôte</h2>
    <p>Les joueurs ont reçu leurs rôles.</p>
  `;
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
