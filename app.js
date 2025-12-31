console.log("✅ app.js chargé");

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
