console.log("✅ app.js chargé");

document.addEventListener("DOMContentLoaded", () => {
  showHome();
});

function showHome() {
  const game = document.getElementById("game");
  game.innerHTML = `
    <h1>🎭 Picolol</h1>

    <label>Nombre de joueurs</label><br>
    <input type="number" id="players" min="2" max="5" value="5"><br><br>

    <button id="start">Lancer la partie</button>
  `;

  document.getElementById("start").addEventListener("click", () => {
    alert("🚀 Bouton cliqué : JS OK !");
  });
}
