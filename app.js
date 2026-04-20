// ================================================
//  PICOLOL — app.js
//  Phases : lobby → roles → deliberation → reveal → verdict → effects
// ================================================

const state = {
  gameId: null, playerId: null, playerName: null, isHost: false,
  riotId: null, puuid: null, region: 'euw1',
};

// ========================
//  DONNÉES DU JEU
// ========================
const ROLES = [
  { nom: "Mister White",        objectif: "Être accusé par la majorité des joueurs à la fin de la partie." },
  { nom: "Super-Héro",          objectif: "Avoir le plus de morts (Deaths)." },
  { nom: "Le PGM",              objectif: "Avoir le plus de dégâts infligés." },
  { nom: "Le Sup Originel",     objectif: "Avoir le plus d'assists." },
  { nom: "Le Roi des Trolls",   objectif: "Faire tilt au moins un coéquipier (subjectif, validé par l'équipe)." },
  { nom: "Le Farmer",           objectif: "Avoir le plus de gold ou farm (CS)." },
  { nom: "L'Intouchable",       objectif: "Avoir le moins de morts." },
  { nom: "Le Visionnaire",      objectif: "Avoir le plus de vision score." },
  { nom: "Le Feeder Assumé",    objectif: "Finir avec le plus de morts ET le moins de kills de l'équipe." },
  { nom: "Le Split Pusher",     objectif: "Ne jamais participer à un teamfight après la minute 15 (subjectif, validé par l'équipe)." },
  { nom: "L'Objectif First",    objectif: "Être le premier à pinger ou caller chaque objectif neutre (Baron, Dragon...)." },
  { nom: "Le Fantôme",          objectif: "Ne jamais mourir seul — toujours en groupe de 2 minimum." },
  { nom: "L'Invocateur",        objectif: "Utiliser ses 2 sorts d'invocateur dans la même minute au moins une fois." },
  { nom: "Le Coach",            objectif: "Donner au moins 5 callouts utiles reconnus par l'équipe." },
  { nom: "Le Kamikaze",         objectif: "Mourir dans les 3 premières minutes de la partie (premier sang inclus)." },
  { nom: "L'Avocat du Diable",  objectif: "Défendre publiquement chaque décision de l'équipe sans jamais critiquer, même les mauvaises." },
  { nom: "Le Sosie",            objectif: "Imiter le style de jeu d'un allié désigné secrètement — même façon de jouer, même aggression, même positioning." },
  { nom: "Le Fantôme Offensif", objectif: "N'initier aucun combat, mais être présent dans au moins 80% des kills de l'équipe (subjectif, validé par l'équipe)." },
  { nom: "Le Diplomate",        objectif: "Écrire au moins 10 messages positifs ou encourageants dans le chat pendant la partie." },
];

const BONUS_POOL = [
  { text: "Peut ignorer un call d'équipe sans reproche.",              rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut forcer un allié à dire 'my bad' après un missplay.",   rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut prendre un buff ennemi une fois.",                     rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut demander un report de roam à un allié une fois.",      rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut réclamer un objectif neutre en priorité pour la prochaine partie.", rarity: "⚪ Commun", weight: 35 },
  { text: "Peut reroll son champion une fois.",                        rarity: "🔵 Rare",       weight: 20 },
  { text: "Peut shotcaller pendant 10 minutes.",                       rarity: "🔵 Rare",       weight: 20 },
  { text: "Peut décider du prochain objectif.",                        rarity: "🔵 Rare",       weight: 20 },
  { text: "Peut imposer un champion à un allié pour la prochaine partie.", rarity: "🔵 Rare",   weight: 20 },
  { text: "Peut refuser un swap de champion en champ select.",         rarity: "🔵 Rare",       weight: 20 },
  { text: "Devient shotcaller absolu pendant 10 minutes.",             rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut imposer un swap de lane.",                             rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut voler le bonus d'un autre joueur.",                    rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut bannir le champion d'un allié en champ select.",       rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut choisir son côté de carte (bleu/rouge) pour la prochaine partie.", rarity: "🟣 Épique", weight: 10 },
  { text: "Peut choisir son champion et sa lane pour la prochaine partie.", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut annuler un malus.",                                    rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut annuler une décision d'équipe.",                       rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut imposer une composition d'équipe entière pour la prochaine partie.", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Immunité totale aux malus pendant 2 parties.",              rarity: "🟠 Légendaire", weight: 5 },
];

const MALUS_POOL = [
  { text: "Doit dire 'bien joué' après chaque mort.",                  rarity: "⚪ Commun",     weight: 35 },
  { text: "Doit annoncer chaque back.",                                rarity: "⚪ Commun",     weight: 35 },
  { text: "Ne peut pas engage pendant 5 minutes.",                     rarity: "⚪ Commun",     weight: 35 },
  { text: "Doit commencer la partie sans acheter de potions.",         rarity: "⚪ Commun",     weight: 35 },
  { text: "Doit écrire 'gg ez' dans le chat équipe après chaque mort.", rarity: "⚪ Commun",   weight: 35 },
  { text: "Interdiction de ping pendant 10 minutes.",                  rarity: "🔵 Rare",       weight: 20 },
  { text: "Doit suivre tous les calls d'équipe.",                      rarity: "🔵 Rare",       weight: 20 },
  { text: "Interdiction de prendre des objectifs neutres.",            rarity: "🔵 Rare",       weight: 20 },
  { text: "Doit jouer avec un build imposé par l'équipe.",             rarity: "🔵 Rare",       weight: 20 },
  { text: "Ne peut pas utiliser de trinket pendant 10 minutes.",       rarity: "🔵 Rare",       weight: 20 },
  { text: "Pas de Flash pendant 10 minutes.",                          rarity: "🟣 Épique",     weight: 10 },
  { text: "Pas de ward pendant 10 minutes.",                           rarity: "🟣 Épique",     weight: 10 },
  { text: "Donne son premier buff à un allié.",                        rarity: "🟣 Épique",     weight: 10 },
  { text: "Doit jouer le premier rôle disponible en champ select (pas de dodge).", rarity: "🟣 Épique", weight: 10 },
  { text: "Ne peut pas communiquer par pings pendant toute la partie.", rarity: "🟣 Épique",   weight: 10 },
  { text: "Swap de lane imposé à 10 minutes.",                         rarity: "🟠 Légendaire", weight: 5  },
  { text: "Interdiction totale de ward.",                              rarity: "🟠 Légendaire", weight: 5  },
  { text: "Ne peut pas back pendant 10 minutes.",                      rarity: "🟠 Légendaire", weight: 5  },
  { text: "Doit jouer le champion le moins joué de sa lane ce patch.", rarity: "🟠 Légendaire", weight: 5  },
  { text: "Interdit de recall pendant les 15 premières minutes.",      rarity: "🟠 Légendaire", weight: 5  },
];

// ========================
//  POOLS CHAMPIONS PAR POSTE
//  Meta patch 26.8 — champions flex inclus dans leurs 2 postes
//  Format : nom exact Riot (pour l'URL ddragon)
// ========================
const CHAMPION_POOLS = {
  top: [
    "Aatrox","Camille","Cho'Gath","Darius","Fiora","Gangplank","Garen","Gnar",
    "Gragas","Gwen","Illaoi","Irelia","Jax","Jayce","Kennen","Kled","Malphite",
    "Mordekaiser","Nasus","Ornn","Poppy","Quinn","Renekton","Riven","Rumble",
    "Sett","Shen","Singed","Sion","Swain","Teemo","Tryndamere","Urgot",
    "Volibear","Wukong","Yorick","Zaahen","Zac"
  ],
  jungle: [
    "Amumu","Bel'Veth","Brand","Briar","Diana","Ekko","Elise","Evelynn",
    "Gragas","Graves","Hecarim","Ivern","Jarvan IV","Jax","Kha'Zix","Kindred",
    "Lee Sin","Lillia","Master Yi","Nidalee","Nocturne","Nunu & Willump","Olaf",
    "Rammus","Rek'Sai","Rengar","Sejuani","Shaco","Shyvana","Taliyah","Trundle",
    "Udyr","Vi","Viego","Warwick","Wukong","Xin Zhao","Zac","Zed"
  ],
  mid: [
    "Ahri","Akali","Akshan","Annie","Aurelion Sol","Azir","Cassiopeia","Corki",
    "Diana","Ekko","Fizz","Galio","Hwei","Irelia","Kassadin","Katarina",
    "LeBlanc","Lissandra","Lux","Malzahar","Naafiri","Neeko","Orianna",
    "Qiyana","Ryze","Seraphine","Smolder","Sylas","Syndra","Taliyah","Talon",
    "Twisted Fate","Veigar","Vel'Koz","Vex","Victor","Yasuo","Yone","Zed","Zoe"
  ],
  adc: [
    "Aphelios","Ashe","Caitlyn","Draven","Ezreal","Jhin","Jinx","Kai'Sa",
    "Kalista","Kog'Maw","Lucian","Miss Fortune","Nilah","Samira","Seraphine",
    "Senna","Sivir","Smolder","Tristana","Twitch","Varus","Vayne","Xayah",
    "Zeri","Ziggs"
  ],
  support: [
    "Alistar","Bard","Blitzcrank","Brand","Braum","Janna","Karma","Leona",
    "Lulu","Lux","Milio","Morgana","Nami","Nautilus","Pyke","Rakan","Rell",
    "Renata Glasc","Seraphine","Senna","Sona","Soraka","Swain","Tahm Kench",
    "Thresh","Vel'Koz","Xerath","Yuumi","Zilean","Zyra"
  ],
};

const LANE_LABELS = { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'ADC', support: 'Support' };
const LANE_ICONS  = { top: '🛡️', jungle: '🌿', mid: '⚡', adc: '🏹', support: '💊' };

// URL image officielle Riot ddragon
// Certains noms ont un format spécial (espaces, apostrophes retirés)
function championImageUrl(name) {
  const key = name
    .replace(/'/g, '')       // Cho'Gath → ChoGath
    .replace(/\s+/g, '')     // Jarvan IV → JarvanIV
    .replace(/&/g, '')       // Nunu & Willump → NunuWillump
    .replace(/\./g, '');     // Renata Glasc → RenataGlasc
  return `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/${key}.png`;
}

// Tire un champion aléatoire pour un poste, en évitant les déjà utilisés
function drawChampion(lane, usedChampions) {
  const pool      = CHAMPION_POOLS[lane] || [];
  const available = pool.filter(c => !usedChampions.includes(c));
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}


function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedDraw(pool) {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let rnd = Math.random() * total;
  for (const item of pool) { rnd -= item.weight; if (rnd <= 0) return item; }
  return pool[pool.length - 1];
}

function drawEffect(success) {
  const drawn = weightedDraw(success ? BONUS_POOL : MALUS_POOL);
  return { type: success ? 'bonus' : 'malus', rarity: drawn.rarity, description: drawn.text };
}

function generateGameId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generatePlayerId() { return 'p_' + Math.random().toString(36).slice(2, 10); }
function showError(msg) { alert('⚠️ ' + msg); }
function setVisible(id, visible) { const el = document.getElementById(id); if (el) el.style.display = visible ? 'block' : 'none'; }
function playersArray(obj) { if (!obj) return []; return Object.entries(obj).map(([id, data]) => ({ id, ...data })); }

// ========================
//  NAVIGATION
// ========================
const VIEWS = ['home', 'lobby', 'roles', 'deliberation', 'reveal', 'verdict', 'effects', 'ingame'];
function showView(name) {
  VIEWS.forEach(v => { const el = document.getElementById('view-' + v); if (el) el.style.display = (v === name) ? 'flex' : 'none'; });
}

// ========================
//  ANIMATIONS
// ========================
const RARITY_MAP = { '⚪ Commun': 'commun', '🔵 Rare': 'rare', '🟣 Épique': 'epique', '🟠 Légendaire': 'legendaire' };
const BURST_COLORS = { bonus: '#22c55e', malus: '#ef4444', role: '#c9a84c', reveal: '#a78bfa' };

const ICONS = {
  role: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="none" stroke="#c9a84c" stroke-width="2"/>
    <polygon points="32,10 52,21 52,43 32,54 12,43 12,21" fill="rgba(201,168,76,0.06)" stroke="rgba(201,168,76,0.3)" stroke-width="1"/>
    <path d="M32 18 L38 28 L50 28 L41 35 L44 46 L32 39 L20 46 L23 35 L14 28 L26 28 Z" fill="#c9a84c" opacity="0.9"/>
  </svg>`,
  bonus: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="26" stroke="#22c55e" stroke-width="1.5" opacity="0.4"/>
    <path d="M32 10 L36 24 L50 24 L39 33 L43 47 L32 38 L21 47 L25 33 L14 24 L28 24 Z" fill="#22c55e" opacity="0.9"/>
    <circle cx="32" cy="32" r="4" fill="#86efac"/>
  </svg>`,
  malus: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="26" stroke="#ef4444" stroke-width="1.5" opacity="0.4"/>
    <path d="M32 8 L56 52 L8 52 Z" fill="none" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/>
    <path d="M32 20 L29 36 L35 36 Z" fill="#ef4444"/>
    <circle cx="32" cy="42" r="3" fill="#ef4444"/>
  </svg>`,
};

function playBurst(color) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;pointer-events:none;';

  // Premier anneau
  const ring1 = document.createElement('div');
  ring1.className = 'burst-ring';
  ring1.style.cssText = `width:20px;height:20px;background:${color};box-shadow:0 0 40px ${color};`;

  // Deuxième anneau décalé — bordure seulement
  const ring2 = document.createElement('div');
  ring2.className = 'burst-ring-2';
  ring2.style.cssText = `width:14px;height:14px;border:2px solid ${color};box-shadow:0 0 20px ${color};`;

  wrap.appendChild(ring1);
  wrap.appendChild(ring2);
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1200);
}

function showDrawOverlay({ icon, title, titleColor, subtitle, body, tapLabel }, onDismiss) {
  if (document.querySelector('.draw-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'draw-overlay';
  overlay.innerHTML = `
    <div class="draw-card-wrap"><div class="draw-card" ${body && body.type ? `data-type="${body.type}"` : ''}>
      <div class="draw-card-icon">${icon}</div>
      <div class="draw-card-role" style="color:${titleColor || '#f0d080'};text-shadow:0 0 20px ${titleColor || '#c9a84c'}55">${title}</div>
      ${subtitle ? `<div style="font-size:0.75rem;font-weight:700;letter-spacing:2px;color:${subtitle.color || '#aaa'};text-transform:uppercase">${subtitle.text}</div>` : ''}
      ${body ? `<div class="draw-card-objectif">${body.text}</div>` : ''}
      <div class="draw-card-tap">${tapLabel || 'Toucher pour continuer'}</div>
    </div></div>`;
  document.body.appendChild(overlay);
  function dismiss() {
    overlay.style.animation = 'fadeOut 0.25s ease both';
    setTimeout(() => { overlay.remove(); if (onDismiss) onDismiss(); }, 240);
  }
  overlay.addEventListener('pointerup', dismiss, { once: true });
}

function showRoleDraw(role, onDismiss) {
  playBurst(BURST_COLORS.role);
  showDrawOverlay({ icon: ICONS.role, title: role.nom, titleColor: '#f0d080', body: { text: role.objectif } }, onDismiss);
}

// Overlay champion — image + nom + poste
function showChampionReveal(champion, onDismiss) {
  if (!champion) { if (onDismiss) onDismiss(); return; }
  if (document.querySelector('.draw-overlay')) return;

  const lane      = champion.lane || '';
  const laneLabel = LANE_LABELS[lane] || lane;
  const laneIcon  = LANE_ICONS[lane]  || '';
  const imgUrl    = championImageUrl(champion.name);

  playBurst('#60a5fa');

  const overlay = document.createElement('div');
  overlay.className = 'draw-overlay';
  overlay.innerHTML = `
    <div style="perspective:1200px;display:flex;align-items:center;justify-content:center;width:100%">
      <div class="draw-card" style="width:320px;gap:1.2rem;animation:cardFlip 1.1s cubic-bezier(0.22,1,0.36,1) 0.1s both">
        <div style="font-size:1rem;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;animation:textReveal 0.4s ease 0.9s both">
          ${laneIcon} ${laneLabel}
        </div>
        <img
          src="${imgUrl}"
          alt="${champion.name}"
          class="champion-draw-img"
          onerror="this.style.display='none'"
        />
        <div class="draw-card-role" style="font-size:1.5rem;color:#93c5fd;text-shadow:0 0 24px rgba(59,130,246,0.7);animation:textReveal 0.4s ease 1s both">
          ${champion.name}
        </div>
        <div style="font-size:0.8rem;letter-spacing:3px;text-transform:uppercase;color:#8898b0;font-weight:600;animation:textReveal 0.4s ease 1.3s both">
          Toucher pour continuer
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  function dismiss() {
    overlay.style.animation = 'fadeOut 0.25s ease both';
    setTimeout(() => { overlay.remove(); if (onDismiss) onDismiss(); }, 240);
  }
  overlay.addEventListener('pointerup', dismiss, { once: true });
}

function showEffectReveal(effect, onDismiss) {
  if (!effect || !effect.description) { if (onDismiss) onDismiss(); return; }
  const isBonus = effect.type === 'bonus';
  const color   = isBonus ? BURST_COLORS.bonus : BURST_COLORS.malus;
  const rc      = { commun: '#aaa', rare: '#60a5fa', epique: '#c084fc', legendaire: '#f59e0b' };
  playBurst(color);
  showDrawOverlay({
    icon: isBonus ? ICONS.bonus : ICONS.malus,
    title: isBonus ? 'Objectif réussi !' : 'Objectif raté…',
    titleColor: isBonus ? '#4ade80' : '#f87171',
    subtitle: { text: effect.rarity || '', color: rc[RARITY_MAP[effect.rarity] || 'commun'] },
    body: { text: effect.description, type: effect.type },
  }, onDismiss);
}

function applyRarityColor(el, rarity) {
  if (!el || !rarity) return;
  const map = { commun: '#aaa', rare: '#60a5fa', epique: '#c084fc', legendaire: '#f59e0b' };
  el.style.color = map[RARITY_MAP[rarity] || 'commun'] || '#aaa';
}

// ========================
//  FIREBASE
// ========================
function gameRef(id)         { return db.ref('games/' + id); }
function playerRef(gid, pid) { return db.ref('games/' + gid + '/players/' + pid); }

function fbCreateGame(gameId, hostId) {
  return gameRef(gameId).set({
    phase: 'lobby', hostId,
    votes: {}, deliberationVotes: {}, verdictVotes: {}, replayVotes: {},
    previousEffects: {}, revealIndex: 0,
    championMode: false, randomLane: false, usedChampions: [],
    scores: {}, immunity: {}, usedBonus: {},
    bonusEvent: null, // dernière action bonus visible par tous
    players: {},
  });
}

// Scores
function fbAddScore(gid, pid, points) {
  return db.ref('games/' + gid + '/scores/' + pid).transaction(cur => (cur || 0) + points);
}

// Immunité
function fbSetImmunity(gid, pid, parties) {
  return db.ref('games/' + gid + '/immunity/' + pid).set(parties);
}
function fbDecreaseImmunity(gid, pid) {
  return db.ref('games/' + gid + '/immunity/' + pid).transaction(cur => {
    if (!cur || cur <= 1) return null; // supprime le nœud
    return cur - 1;
  });
}

// Bonus utilisé
function fbMarkBonusUsed(gid, pid) {
  return db.ref('games/' + gid + '/usedBonus/' + pid).set(true);
}

// Événement bonus (annonce visible par tous)
function fbBonusEvent(gid, message, type = 'info') {
  return gameRef(gid).update({
    bonusEvent: { message, type, ts: Date.now() }
  });
}

// Voler le bonus d'un autre joueur
async function fbStealBonus(gid, thiefId, victimId) {
  const snap         = await gameRef(gid).once('value');
  const g            = snap.val();
  const thief        = g.players[thiefId];
  const victim       = g.players[victimId];
  if (!victim || !victim.effect) return;

  // Le voleur récupère l'effet de la victime
  await playerRef(gid, thiefId).update({ effect: victim.effect });
  // La victime perd son effet
  await playerRef(gid, victimId).update({ effect: null });
  // Marquer le bonus comme utilisé
  await fbMarkBonusUsed(gid, thiefId);
  // Annonce globale
  await fbBonusEvent(gid,
    `🦊 ${thief.name} a volé l'effet de ${victim.name} !`,
    'steal'
  );
}

// Annuler son propre malus
async function fbCancelOwnMalus(gid, pid) {
  const snap = await gameRef(gid).once('value');
  const p    = snap.val().players[pid];
  if (!p) return;
  await playerRef(gid, pid).update({ effect: null });
  await fbMarkBonusUsed(gid, pid);
  await fbBonusEvent(gid,
    `🛡️ ${p.name} a annulé son malus !`,
    'cancel'
  );
}

function fbJoinGame(gid, pid, name, riotId) {
  return playerRef(gid, pid).set({ name, riotId: riotId || null, puuid: null, role: null, success: null, effect: null, lane: null, champion: null });
}
function fbGameExists(gid)          { return gameRef(gid).once('value').then(s => s.exists()); }
function fbSetPhase(gid, phase)     { return gameRef(gid).update({ phase }); }
function fbSetRole(gid, pid, role)  { return playerRef(gid, pid).update({ role }); }
function fbSetSuccess(gid, pid, v)  { return playerRef(gid, pid).update({ success: v }); }
function fbSetEffect(gid, pid, e)   { return playerRef(gid, pid).update({ effect: e }); }

// Champion mode
function fbSetChampionMode(gid, enabled) { return gameRef(gid).update({ championMode: enabled }); }
function fbSetRandomLane(gid, enabled)   { return gameRef(gid).update({ randomLane: enabled }); }
function fbSetLane(gid, pid, lane)       { return playerRef(gid, pid).update({ lane }); }
function fbSetChampion(gid, pid, champ)  { return playerRef(gid, pid).update({ champion: champ }); }
function fbAddUsedChampion(gid, name)    { return db.ref('games/' + gid + '/usedChampions').transaction(list => [...(list || []), name]); }

function fbVote(gid, pid)           { return db.ref('games/' + gid + '/votes/' + pid).set(true); }
function fbResetVotes(gid)          { return db.ref('games/' + gid + '/votes').set({}); }

function fbDeliberationVote(gid, voterId, targetId, roleNom) {
  return db.ref('games/' + gid + '/deliberationVotes/' + voterId + '/' + targetId).set(roleNom);
}
function fbResetDeliberationVotes(gid) { return db.ref('games/' + gid + '/deliberationVotes').set({}); }

function fbVerdictVote(gid, targetId, voterId, value) {
  return db.ref('games/' + gid + '/verdictVotes/' + targetId + '/' + voterId).set(value);
}
function fbResetVerdictVotes(gid) { return db.ref('games/' + gid + '/verdictVotes').set({}); }

function fbNextReveal(gid, index) { return gameRef(gid).update({ revealIndex: index }); }
function fbSetRevealOrder(gid, playerIds) { return gameRef(gid).update({ revealOrder: playerIds }); }

function fbVoteReplay(gid, pid)   { return db.ref('games/' + gid + '/replayVotes/' + pid).set(true); }
function fbResetReplayVotes(gid)  { return db.ref('games/' + gid + '/replayVotes').set({}); }

function fbSavePreviousEffects(gid, players) {
  const prev = {};
  players.forEach(p => { if (p.effect) prev[p.id] = { name: p.name, effect: p.effect }; });
  return gameRef(gid).update({ previousEffects: prev });
}

function fbWatch(gid, cb) {
  const ref = gameRef(gid);
  ref.on('value', snap => { if (snap.exists()) cb(snap.val()); });
  return () => ref.off('value');
}

function assignRoles(gid, players) {
  const shuffled = shuffleArray(ROLES);
  return Promise.all(players.map((p, i) => {
    const role = { ...shuffled[i % shuffled.length] };
    // Le Sosie reçoit une cible aléatoire parmi les autres joueurs
    if (role.nom === 'Le Sosie') {
      const others = players.filter(o => o.id !== p.id);
      const target = others[Math.floor(Math.random() * others.length)];
      if (target) {
        role.objectif = `Imite le style de jeu de ${target.name} — même façon de jouer, même agressivité, même positioning. ${target.name} ne sait pas qu'il est ta cible.`;
        role.cible = target.name;
      }
    }
    return fbSetRole(gid, p.id, role);
  }));
}

// Mode champion : tire un champion unique par joueur selon sa lane, puis distribue les rôles
async function assignChampionsAndRoles(gid, players, randomLane) {
  const usedChampions = [];
  const usedLanes     = [];
  const allLanes      = Object.keys(LANE_LABELS);

  const championPromises = players.map(p => {
    let lane = p.lane;

    // Mode poste aléatoire — tire une lane unique pour ce joueur
    if (randomLane) {
      const availableLanes = allLanes.filter(l => !usedLanes.includes(l));
      lane = availableLanes.length > 0
        ? availableLanes[Math.floor(Math.random() * availableLanes.length)]
        : allLanes[Math.floor(Math.random() * allLanes.length)];
      usedLanes.push(lane);
    }

    const champion = drawChampion(lane, usedChampions);
    if (champion) usedChampions.push(champion);
    const champObj = champion ? { name: champion, lane } : null;

    // En mode randomLane, on stocke aussi la lane sur le joueur
    const updates = randomLane
      ? playerRef(gid, p.id).update({ lane, champion: champObj })
      : fbSetChampion(gid, p.id, champObj);
    return updates;
  });

  await Promise.all(championPromises);
  await gameRef(gid).update({ usedChampions });

  const shuffled = shuffleArray(ROLES);
  await Promise.all(players.map((p, i) => {
    const role = { ...shuffled[i % shuffled.length] };
    if (role.nom === 'Le Sosie') {
      const others = players.filter(o => o.id !== p.id);
      const target = others[Math.floor(Math.random() * others.length)];
      if (target) {
        role.objectif = `Imite le style de jeu de ${target.name} — même façon de jouer, même agressivité, même positioning. ${target.name} ne sait pas qu'il est ta cible.`;
        role.cible = target.name;
      }
    }
    return fbSetRole(gid, p.id, role);
  }));
}

// ========================
//  HELPERS VOTE
// ========================
function allVoted(votes, players) {
  if (!votes || !players.length) return false;
  return players.every(p => votes[p.id] === true);
}

function allDeliberationVoted(dVotes, players) {
  if (!dVotes || !players.length) return false;
  return players.every(voter => {
    const my = dVotes[voter.id] || {};
    return players.filter(p => p.id !== voter.id).every(t => my[t.id]);
  });
}

function allVerdictVoted(vVotes, players) {
  if (!vVotes || !players.length) return false;
  return players.every(t => Object.keys(vVotes[t.id] || {}).length >= players.length - 1);
}

function majority(targetVotes) {
  if (!targetVotes) return false;
  const vals = Object.values(targetVotes);
  return vals.length > 0 && vals.filter(v => v === true).length > vals.length / 2;
}

function allReplayVoted(rVotes, players) {
  if (!rVotes || !players.length) return false;
  return players.every(p => rVotes[p.id] === true);
}

// ========================
//  HOME
// ========================
document.getElementById('btn-create').addEventListener('click', async () => {
  const name   = document.getElementById('input-host-name').value.trim();
  const riotId = document.getElementById('input-host-riot').value.trim();
  if (!name) return showError('Saisis ton pseudo.');
  if (typeof db === 'undefined') return showError('Firebase non initialisé.');
  const gameId = generateGameId(), playerId = generatePlayerId();
  state.gameId = gameId; state.playerId = playerId;
  state.playerName = name; state.isHost = true;
  state.riotId = riotId || null;
  try { await fbCreateGame(gameId, playerId); await fbJoinGame(gameId, playerId, name, riotId); enterLobby(); }
  catch (err) { showError('Erreur Firebase : ' + (err.message || err)); }
});

document.getElementById('btn-join').addEventListener('click', async () => {
  const code   = document.getElementById('input-code').value.trim().toUpperCase();
  const name   = document.getElementById('input-name').value.trim();
  const riotId = document.getElementById('input-riot').value.trim();
  if (!code || code.length < 4) return showError('Saisis un code valide.');
  if (!name) return showError('Saisis ton pseudo.');
  if (typeof db === 'undefined') return showError('Firebase non initialisé.');
  try {
    if (!await fbGameExists(code)) return showError('Partie introuvable.');
    state.gameId = code; state.playerId = generatePlayerId();
    state.playerName = name; state.isHost = false;
    state.riotId = riotId || null;
    await fbJoinGame(state.gameId, state.playerId, name, riotId); enterLobby();
  } catch (err) { showError('Erreur Firebase : ' + (err.message || err)); }
});

// ========================
//  LOBBY
// ========================
let unsubscribeGame = null;
let transitioning   = false;
let currentPhase    = null;

function enterLobby() {
  document.getElementById('display-code').textContent = state.gameId;
  currentPhase = null;
  showView('lobby');
  if (unsubscribeGame) unsubscribeGame();
  unsubscribeGame = fbWatch(state.gameId, onGameUpdate);
}

// ========================
//  ROUTEUR
// ========================
function onGameUpdate(game) {
  const players         = playersArray(game.players);
  const votes           = game.votes             || {};
  const dVotes          = game.deliberationVotes || {};
  const vVotes          = game.verdictVotes      || {};
  const rVotes          = game.replayVotes       || {};
  const prevEffects     = game.previousEffects   || {};
  const revealIndex     = game.revealIndex       || 0;
  const revealOrder     = game.revealOrder       || null;
  const championMode    = game.championMode      || false;
  const randomLane      = game.randomLane        || false;
  const usedChampions   = game.usedChampions     || [];
  const scores          = game.scores            || {};
  const immunity        = game.immunity          || {};
  const usedBonus       = game.usedBonus         || {};
  const bonusEvent      = game.bonusEvent        || null;
  const phase           = game.phase;

  // Retour lobby depuis effects — reset complet sans bloquer la suite
  if (phase === 'lobby' && currentPhase === 'effects') {
    currentPhase = null;
    document.querySelectorAll('.draw-overlay').forEach(o => o.remove());
    // On continue — handleLobby sera appelé normalement
  }

  // Overlays au changement de phase (une seule fois)
  // Ne pas déclencher d'overlay si on vient de restarted (currentPhase est null et phase est lobby)
  const justRestarted = currentPhase === null && phase === 'lobby';

  if (phase !== currentPhase) {
    currentPhase = phase;

    if (!justRestarted && phase === 'roles' && !document.querySelector('.draw-overlay')) {
      const me = players.find(p => p.id === state.playerId);
      if (me && me.role) {
        // Si mode champion : afficher champion d'abord, puis rôle
        if (me.champion) {
          showChampionReveal(me.champion, () => {
            showRoleDraw(me.role, () => { showView('roles'); renderRoles(players, votes); });
          });
        } else {
          showRoleDraw(me.role, () => { showView('roles'); renderRoles(players, votes); });
        }
        return;
      }
    }

    if (!justRestarted && phase === 'effects' && !document.querySelector('.draw-overlay')) {
      const me = players.find(p => p.id === state.playerId);
      showEffectReveal(me && me.effect ? me.effect : null, () => {
        gameRef(state.gameId).once('value').then(snap => {
          if (!snap.exists()) return;
          const g = snap.val();
          showView('effects');
          setVisible('player-effect-panel', true);
          renderEffects(
            playersArray(g.players),
            g.replayVotes || {},
            g.immunity    || {},
            g.usedBonus   || {}
          );
        });
      });
      return;
    }
  }

  if (document.querySelector('.draw-overlay') && phase !== 'effects') return;

  // Leaderboard toujours mis à jour
  renderLeaderboard(players, scores);

  // Animation bonus event
  if (bonusEvent && bonusEvent.ts) renderBonusEvent(bonusEvent);

  switch (phase) {
    case 'lobby':        handleLobby(players, votes, prevEffects, championMode, randomLane);   break;
    case 'roles':        handleRoles(players, votes);                              break;
    case 'in_game':      handleInGame(players, game);                              break;
    case 'deliberation': handleDeliberation(players, dVotes);                     break;
    case 'reveal':       handleReveal(players, revealIndex, revealOrder);          break;
    case 'verdict':      handleVerdict(players, vVotes);                           break;
    case 'effects':      handleEffects(players, rVotes, immunity, usedBonus);      break;
  }
}

// ========================
//  PHASE LOBBY
// ========================
function handleLobby(players, votes, prevEffects, championMode, randomLane) {
  showView('lobby');
  renderLobby(players, votes, prevEffects, championMode, randomLane);

  // En mode poste aléatoire, pas besoin que les joueurs choisissent leur lane
  const allLanesChosen = !championMode || randomLane || players.every(p => p.lane);
  if (!allLanesChosen) return;

  if (allVoted(votes, players) && state.isHost && !transitioning) {
    transitioning = true;
    const doAssign = championMode
      ? assignChampionsAndRoles(state.gameId, players, randomLane)
      : assignRoles(state.gameId, players);
    doAssign
      .then(() => fbResetVotes(state.gameId))
      .then(() => fbSetPhase(state.gameId, 'roles'))
      .finally(() => { transitioning = false; });
  }
}

function renderLobby(players, votes, prevEffects, championMode, randomLane) {
  const ul = document.getElementById('player-list');
  ul.innerHTML = '';

  const takenLanes = players
    .filter(p => p.id !== state.playerId && p.lane)
    .map(p => p.lane);

  players.forEach(p => {
    const li = document.createElement('li');
    li.className = 'lobby-player-item';
    const isSelf = p.id === state.playerId;

    let champInfo = '';
    if (championMode) {
      if (randomLane) {
        champInfo = `<span class="lobby-lane">🎲 Poste aléatoire</span>`;
      } else if (p.lane) {
        champInfo = `<span class="lobby-lane">${LANE_ICONS[p.lane]} ${LANE_LABELS[p.lane]}</span>`;
      } else {
        champInfo = `<span class="lobby-lane muted">— poste non choisi</span>`;
      }
    }

    li.innerHTML = `
      <div class="lobby-player-main">
        <span class="lobby-ready">${votes[p.id] ? '✅' : '⏳'}</span>
        <span class="lobby-name">${p.name}${isSelf ? ' <span class="muted">(toi)</span>' : ''}</span>
        ${champInfo}
      </div>`;

    // Menu lane — uniquement si mode champion ET pas poste aléatoire ET c'est soi ET pas encore choisi
    if (championMode && !randomLane && isSelf && !p.lane) {
      const sel = document.createElement('select');
      sel.className = 'lane-select';
      sel.innerHTML = `<option value="">— Choisis ton poste —</option>` +
        Object.entries(LANE_LABELS).map(([key, label]) => {
          const taken = takenLanes.includes(key);
          return `<option value="${key}" ${taken ? 'disabled' : ''}>${LANE_ICONS[key]} ${label}${taken ? ' (pris)' : ''}</option>`;
        }).join('');
      sel.addEventListener('change', () => { if (sel.value) fbSetLane(state.gameId, state.playerId, sel.value); });
      li.appendChild(sel);
    }

    ul.appendChild(li);
  });

  // Contrôles hôte
  const hostControls = document.getElementById('host-champion-controls');
  if (hostControls) {
    // Afficher tant que la partie n'est pas encore lancée (pas de rôles distribués)
    const launched = players.some(p => p.role !== null && p.role !== undefined);
    hostControls.style.display = state.isHost && !launched ? 'block' : 'none';

    const cb = document.getElementById('cb-champion-mode');
    if (cb) cb.checked = championMode;

    // Checkbox poste aléatoire — visible seulement si mode champion activé
    const wrapRandLane = document.getElementById('cb-random-lane-wrap');
    if (wrapRandLane) wrapRandLane.style.display = championMode ? 'flex' : 'none';

    const cbRand = document.getElementById('cb-random-lane');
    if (cbRand) cbRand.checked = randomLane;
  }

  const prev = prevEffects[state.playerId];
  renderPreviousEffect(prev ? prev.effect : null);

  // Bouton prêt bloqué si mode champion sans poste aléatoire et lane non choisie
  const me = players.find(p => p.id === state.playerId);
  const needsLane = championMode && !randomLane && (!me || !me.lane);
  if (needsLane) {
    const c = document.getElementById('vote-container-lobby');
    if (c) c.innerHTML = `<p class="muted" style="text-align:center">Choisis ton poste pour continuer</p>`;
  } else {
    renderVoteButton('lobby', votes, players);
  }
}

function renderPreviousEffect(effect) {
  const c = document.getElementById('previous-effect-container');
  if (!c) return;
  if (!effect || !effect.description) { c.style.display = 'none'; return; }
  c.style.display = 'block';
  c.innerHTML = `
    <p class="previous-effect-label">Ton effet de la partie précédente :</p>
    <div class="effect-card effect-card--small">
      <span class="effect-rarity">${effect.rarity || ''}</span>
      <p class="effect-desc">${effect.description}</p>
    </div>`;
}

// ========================
//  PHASE ROLES
// ========================
function handleRoles(players, votes) {
  showView('roles');
  renderRoles(players, votes);
  if (allVoted(votes, players) && state.isHost && !transitioning) {
    transitioning = true;
    fbResetVotes(state.gameId)
      .then(() => fbSetPhase(state.gameId, 'in_game'))
      .finally(() => { transitioning = false; });
  }
}

function renderRoles(players, votes) {
  setVisible('player-role-panel', true);
  setVisible('host-roles-panel', false);
  const me = players.find(p => p.id === state.playerId);

  // Bloc champion (si applicable)
  const champBlock = document.getElementById('role-champion-block');
  if (champBlock) {
    if (me && me.champion) {
      const { name, lane } = me.champion;
      champBlock.style.display = 'flex';
      champBlock.innerHTML = `
        <img src="${championImageUrl(name)}" alt="${name}" class="role-champ-img" onerror="this.style.display='none'"/>
        <div class="role-champ-info">
          <span class="role-champ-name">${name}</span>
          <span class="role-champ-lane">${LANE_ICONS[lane] || ''} ${LANE_LABELS[lane] || lane}</span>
        </div>`;
    } else {
      champBlock.style.display = 'none';
    }
  }

  document.getElementById('role-name').textContent      = me && me.role ? me.role.nom      : 'En attente…';
  document.getElementById('role-objective').textContent = me && me.role ? me.role.objectif : '';
  renderVoteButton('roles', votes, players, "J'ai lu mon rôle");
}

// ========================
//  PHASE IN_GAME
// ========================
let ingameTimerInterval = null;
let ingameStartTime     = null;

function handleInGame(players, game) {
  showView('ingame');

  // Rappel rôle + champion pour ce joueur
  const me = players.find(p => p.id === state.playerId);
  const recapEl = document.getElementById('ingame-recap');
  if (recapEl && me) {
    recapEl.innerHTML = '';
    if (me.champion) {
      const img = document.createElement('img');
      img.src       = championImageUrl(me.champion.name);
      img.alt       = me.champion.name;
      img.className = 'ingame-recap-champ';
      img.onerror   = () => img.style.display = 'none';
      recapEl.appendChild(img);
    }
    const info = document.createElement('div');
    info.className = 'ingame-recap-info';
    if (me.champion) info.innerHTML += `<span class="ingame-recap-champion">${LANE_ICONS[me.champion.lane] || ''} ${me.champion.name}</span>`;
    if (me.role) {
      info.innerHTML += `<span class="ingame-recap-role">🎭 ${me.role.nom}</span>`;
      info.innerHTML += `<span class="ingame-recap-obj">${me.role.objectif}</span>`;
    }
    recapEl.appendChild(info);
    recapEl.style.display = 'flex';
  }

  // Timer synchronisé via Firebase
  const startTime = game.gameStartTime || Date.now();
  if (!game.gameStartTime && state.isHost) {
    gameRef(state.gameId).update({ gameStartTime: startTime });
  }
  if (!ingameTimerInterval) {
    ingameTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      const el = document.getElementById('ingame-timer');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);
  }

  // Bouton "Partie terminée" — uniquement pour l'hôte
  const container = document.getElementById('vote-container-ingame');
  if (container) {
    if (state.isHost) {
      if (!container.querySelector('button')) {
        const btn = document.createElement('button');
        btn.textContent = '🏁 La partie est terminée';
        btn.addEventListener('click', async () => {
          btn.disabled    = true;
          btn.textContent = '⏳ Récupération des stats…';
          await fetchAndApplyStats(players);
        });
        container.appendChild(btn);
      }
    } else {
      if (!container.querySelector('p')) {
        const p = document.createElement('p');
        p.className   = 'muted';
        p.textContent = "En attente de l'hôte…";
        container.appendChild(p);
      }
    }
  }
}

async function fetchAndApplyStats(players) {
  const btn = document.querySelector('#vote-container-ingame button');

  try {
    const playersWithRiot = players.filter(p => p.riotId && p.riotId.includes('#'));

    // Pas de Riot ID → passage direct en délibération
    if (!playersWithRiot.length) {
      clearInterval(ingameTimerInterval); ingameTimerInterval = null;
      transitioning = false;
      await fbResetVotes(state.gameId);
      await fbSetPhase(state.gameId, 'deliberation');
      return;
    }

    // 2. On prend le 1er joueur avec Riot ID pour récupérer les stats du match
    //    (tous les joueurs de la même partie auront le même matchId)
    const anchor = playersWithRiot[0];
    const [gameName, tagLine] = anchor.riotId.split('#');

    // Récupère le PUUID si pas encore en base
    let puuid = anchor.puuid;
    if (!puuid) {
      puuid = await getPuuid(gameName, tagLine, state.region);
      await playerRef(state.gameId, anchor.id).update({ puuid });
    }

    // 3. Récupère les stats du dernier match
    const stats = await getLastMatchStats(puuid, state.region);

    if (!stats || !stats.length) {
      showError('Impossible de récupérer les stats. Passage en vote manuel.');
      if (state.isHost && !transitioning) {
        transitioning = true;
        clearInterval(ingameTimerInterval); ingameTimerInterval = null; ingameStartTime = null;
        await fbResetVotes(state.gameId);
        await fbSetPhase(state.gameId, 'deliberation');
        transitioning = false;
      }
      return;
    }

    // 4. Résout les PUUIDs de tous les joueurs avec Riot ID
    for (const p of playersWithRiot) {
      if (!p.puuid) {
        try {
          const [gn, tl] = p.riotId.split('#');
          const pid = await getPuuid(gn, tl, state.region);
          await playerRef(state.gameId, p.id).update({ puuid: pid });
          p.puuid = pid;
        } catch (e) {
          console.warn('PUUID introuvable pour', p.riotId);
        }
      }
    }

    // 5. Stocke les stats dans Firebase
    await gameRef(state.gameId).update({ matchStats: stats });

    // 6. L'hôte calcule les verdicts automatiques
    if (state.isHost && !transitioning) {
      transitioning = true;
      clearInterval(ingameTimerInterval); ingameTimerInterval = null; ingameStartTime = null;

      const snap         = await gameRef(state.gameId).once('value');
      const freshPlayers = playersArray(snap.val().players);
      const matchStats   = snap.val().matchStats || [];

      await Promise.all(freshPlayers.map(async p => {
        if (!p.role || !p.puuid) return;
        const autoResult = checkObjectifAuto(p.role, matchStats, p.puuid);
        if (autoResult !== null) {
          await fbSetSuccess(state.gameId, p.id, autoResult);
        }
      }));

      await fbResetVotes(state.gameId);
      await fbSetPhase(state.gameId, 'deliberation');
      transitioning = false;
    }

  } catch (err) {
    console.error('Erreur stats Riot :', err);
    if (btn) { btn.disabled = false; btn.textContent = '🏁 La partie est terminée'; }
    showError('Erreur API Riot : ' + (err.message || JSON.stringify(err)));
    // Fallback — passe en délibération manuelle même si l'API plante
    try {
      clearInterval(ingameTimerInterval); ingameTimerInterval = null;
      await fbResetVotes(state.gameId);
      await fbSetPhase(state.gameId, 'deliberation');
    } catch(e) { console.error('Fallback failed:', e); }
  }
}
function handleDeliberation(players, dVotes) {
  showView('deliberation');
  renderDeliberation(players, dVotes);
  if (allDeliberationVoted(dVotes, players) && state.isHost && !transitioning) {
    transitioning = true;
    fbResetDeliberationVotes(state.gameId)
      .then(() => {
        // Fixe l'ordre des joueurs une fois pour toutes au moment du reveal
        const order = players.map(p => p.id);
        return fbSetRevealOrder(state.gameId, order);
      })
      .then(() => gameRef(state.gameId).update({ revealIndex: 0 }))
      .then(() => fbSetPhase(state.gameId, 'reveal'))
      .finally(() => { transitioning = false; });
  }
}

function renderDeliberation(players, dVotes) {
  const c = document.getElementById('deliberation-list');
  if (!c) return;

  const myVotes = dVotes[state.playerId] || {};
  const others  = players.filter(p => p.id !== state.playerId);

  others.forEach(target => {
    const voted   = myVotes[target.id];
    const itemId  = 'delib-item-' + target.id;
    let   item    = document.getElementById(itemId);

    // Si l'item existe déjà et que le vote n'est pas encore confirmé → ne pas reconstruire
    if (item) {
      const btn = item.querySelector('button');
      const sel = item.querySelector('select');
      // Si le vote vient d'être confirmé par Firebase → désactiver
      if (voted && sel && !sel.disabled) {
        sel.disabled = true;
        sel.value    = voted;
        if (btn) { btn.disabled = true; btn.textContent = '✅ Voté'; }
      }
      return; // on ne reconstruit pas l'item
    }

    // Première construction de l'item
    item = document.createElement('div');
    item.className = 'deliberation-item';
    item.id        = itemId;

    const label = document.createElement('p');
    label.className   = 'deliberation-name';
    label.textContent = target.name;

    const sel = document.createElement('select');
    sel.innerHTML = `<option value="">— Choisir un rôle —</option>` +
      ROLES.map(r => `<option value="${r.nom}" ${voted === r.nom ? 'selected' : ''}>${r.nom}</option>`).join('');
    if (voted) sel.disabled = true;

    const btn = document.createElement('button');
    btn.className   = 'btn-confirm-vote';
    btn.textContent = voted ? '✅ Voté' : 'Confirmer';
    if (voted) btn.disabled = true;

    btn.addEventListener('click', () => {
      if (!sel.value) return showError('Choisis un rôle pour ' + target.name);
      fbDeliberationVote(state.gameId, state.playerId, target.id, sel.value);
      sel.disabled = true; btn.disabled = true; btn.textContent = '✅ Voté';
    });

    item.appendChild(label); item.appendChild(sel); item.appendChild(btn);
    c.appendChild(item);
  });

  // Compteur uniquement
  const done = players.filter(voter => {
    const v = dVotes[voter.id] || {};
    return players.filter(p => p.id !== voter.id).every(t => v[t.id]);
  }).length;
  const counter = document.getElementById('deliberation-counter');
  if (counter) counter.textContent = `${done} / ${players.length} joueurs ont voté`;
}

// ========================
//  PHASE REVEAL
// ========================
function handleReveal(players, revealIndex) {
  showView('reveal');
  if (revealIndex >= players.length) {
    if (state.isHost && !transitioning) {
      transitioning = true;
      fbSetPhase(state.gameId, 'verdict').finally(() => { transitioning = false; });
    }
    return;
  }
  const c = document.getElementById('reveal-container');
  if (!c) return;
  c.innerHTML = '';

  const current = players[revealIndex];
  if (!current) return;

  const card = document.createElement('div');
  card.className = 'reveal-card';
  card.style.animation = 'cardRevealAnim 0.8s cubic-bezier(0.22,1,0.36,1) both';
  playBurst(BURST_COLORS.reveal);
  card.innerHTML = `
    <p class="reveal-turn">Révélation ${revealIndex + 1} / ${players.length}</p>
    <h3 class="reveal-name">${current.name}</h3>
    <p class="reveal-role-label">est…</p>
    <div class="reveal-role-name">${current.role ? current.role.nom : '?'}</div>
    <p class="reveal-objectif">${current.role ? current.role.objectif : ''}</p>`;
  c.appendChild(card);

  if (state.isHost) {
    const btn = document.createElement('button');
    const isLast = revealIndex >= players.length - 1;
    btn.textContent = isLast ? '→ Passer au verdict' : '→ Joueur suivant';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      // Calcule les points de délibération pour ce joueur révélé
      await calculateRevealPoints(current, players);
      fbNextReveal(state.gameId, revealIndex + 1);
    });
    c.appendChild(btn);
  } else {
    const w = document.createElement('p');
    w.className = 'muted'; w.textContent = "L'hôte contrôle le rythme…";
    c.appendChild(w);
  }
}

// Calcule +1 point par bonne réponse de délibération pour le joueur révélé
async function calculateRevealPoints(revealedPlayer, players) {
  if (!revealedPlayer || !revealedPlayer.role) return;
  const snap   = await gameRef(state.gameId).once('value');
  const dVotes = snap.val().deliberationVotes || {};

  // Pour chaque voteur, vérifie s'il a trouvé le bon rôle du joueur révélé
  const promises = players
    .filter(voter => voter.id !== revealedPlayer.id)
    .map(voter => {
      const myVotes   = dVotes[voter.id] || {};
      const votedRole = myVotes[revealedPlayer.id];
      if (votedRole && votedRole === revealedPlayer.role.nom) {
        return fbAddScore(state.gameId, voter.id, 1);
      }
      return Promise.resolve();
    });
  await Promise.all(promises);
}

// Ajoute les points de verdict (+2 si réussi, 0 si raté)
async function applyVerdictPoints(players) {
  await Promise.all(players.map(p => {
    if (p.success === true) return fbAddScore(state.gameId, p.id, 2);
    return Promise.resolve();
  }));
}
function handleVerdict(players, vVotes) {
  showView('verdict');
  renderVerdict(players, vVotes);
  if (allVerdictVoted(vVotes, players) && state.isHost && !transitioning) {
    transitioning = true;
    applyVerdictAndLaunchEffects(players, vVotes).finally(() => { transitioning = false; });
  }
}

function renderVerdict(players, vVotes) {
  const c = document.getElementById('verdict-list');
  if (!c) return;
  c.innerHTML = '';

  players.forEach(target => {
    const tv      = vVotes[target.id] || {};
    const myVote  = tv[state.playerId];
    const isSelf  = target.id === state.playerId;
    const count   = Object.keys(tv).length;
    const needed  = players.length - 1;
    const allDone = count >= needed;
    const result  = allDone ? majority(tv) : null;

    const item = document.createElement('div');
    item.className = 'stat-vote-item';

    const badge = allDone
      ? `<span class="badge ${result ? 'badge--success' : 'badge--fail'}">${result ? '✔ Réussi' : '✘ Raté'}</span>`
      : `<span class="badge badge--pending">${count}/${needed}</span>`;

    if (isSelf) {
      item.innerHTML = `<div class="stat-vote-name">${target.name} <span class="muted">(toi)</span></div><div>${badge}</div>`;
    } else if (myVote !== undefined) {
      const myIcon = myVote ? '<span class="badge badge--success">✔</span>' : '<span class="badge badge--fail">✘</span>';
      item.innerHTML = `<div class="stat-vote-name">${target.name}</div><div style="display:flex;gap:.4rem;align-items:center">${myIcon}${badge}</div>`;
    } else {
      item.innerHTML = `
        <div class="stat-vote-name">${target.name}</div>
        <div style="display:flex;gap:.4rem">
          <button class="btn-success" data-id="${target.id}">✔ Réussi</button>
          <button class="btn-fail"    data-id="${target.id}">✘ Raté</button>
        </div>`;
    }
    c.appendChild(item);
  });

  c.onclick = e => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.id) return;
    fbVerdictVote(state.gameId, btn.dataset.id, state.playerId, btn.classList.contains('btn-success'));
  };

  const done = players.filter(t => Object.keys(vVotes[t.id] || {}).length >= players.length - 1).length;
  const counter = document.getElementById('verdict-counter');
  if (counter) counter.textContent = `${done} / ${players.length} joueurs évalués`;
}

async function applyVerdictAndLaunchEffects(players, vVotes) {
  await Promise.all(players.map(p => fbSetSuccess(state.gameId, p.id, majority(vVotes[p.id] || {}))));
  const snap = await gameRef(state.gameId).once('value');
  const g    = snap.val();
  const fresh = playersArray(g.players);
  const imm   = g.immunity || {};

  // Points de verdict
  await applyVerdictPoints(fresh);

  // Distribue les effets — bloque le malus si immunisé
  await Promise.all(fresh.map(p => {
    const isImmune = imm[p.id] > 0;
    if (p.success === true) {
      return fbSetEffect(state.gameId, p.id, drawEffect(true));
    } else if (isImmune) {
      // Immunisé → pas de malus, pas d'effet
      return fbSetEffect(state.gameId, p.id, null);
    } else {
      return fbSetEffect(state.gameId, p.id, drawEffect(false));
    }
  }));

  await fbResetVerdictVotes(state.gameId);
  await fbResetVotes(state.gameId);
  await fbSetPhase(state.gameId, 'effects');
}

// ========================
//  PHASE EFFECTS
// ========================
function handleEffects(players, rVotes, immunity, usedBonus) {
  showView('effects');
  renderEffects(players, rVotes, immunity || {}, usedBonus || {});
  if (allReplayVoted(rVotes, players) && state.isHost && !transitioning) {
    transitioning = true;
    restartGame(immunity || {}).finally(() => { transitioning = false; });
  }
}

function renderEffects(players, rVotes, immunity, usedBonus) {
  immunity   = immunity   || {};
  usedBonus  = usedBonus  || {};
  setVisible('host-effects-panel', false);
  setVisible('player-effect-panel', true);
  const me        = players.find(p => p.id === state.playerId);
  const myEffect  = me && me.effect ? me.effect : null;
  const hasUsed   = !!usedBonus[state.playerId];
  const isImmune  = (immunity[state.playerId] || 0) > 0;

  renderMyEffect(myEffect, isImmune);

  // Boutons interactifs selon le bonus
  const actionsEl = document.getElementById('effects-actions');
  if (actionsEl) {
    actionsEl.innerHTML = '';

    if (myEffect && !hasUsed) {
      const txt = myEffect.description || '';

      // VOLER le bonus d'un autre joueur
      if (txt.includes('voler le bonus')) {
        const others = players.filter(p => p.id !== state.playerId && p.effect);
        if (others.length) {
          const label = document.createElement('p');
          label.className   = 'muted';
          label.textContent = 'Choisis qui voler :';
          actionsEl.appendChild(label);
          others.forEach(target => {
            const btn = document.createElement('button');
            btn.className   = 'btn-bonus-action';
            btn.textContent = `🦊 Voler ${target.name} (${target.effect?.rarity || '?'})`;
            btn.addEventListener('click', () => {
              btn.disabled = true;
              fbStealBonus(state.gameId, state.playerId, target.id);
            });
            actionsEl.appendChild(btn);
          });
        }
      }

      // ANNULER son propre malus
      else if (txt.includes('annuler un malus') && myEffect.type === 'bonus') {
        // Ce joueur a un bonus "annuler un malus" — il peut annuler son prochain malus
        // (s'applique à la prochaine partie — on stocke l'immunité 1 partie)
        const btn = document.createElement('button');
        btn.className   = 'btn-bonus-action';
        btn.textContent = '🛡️ Annuler mon prochain malus';
        btn.addEventListener('click', () => {
          btn.disabled = true;
          fbSetImmunity(state.gameId, state.playerId, 1);
          fbMarkBonusUsed(state.gameId, state.playerId);
          fbBonusEvent(state.gameId, `🛡️ ${me.name} est immunisé contre le prochain malus !`, 'immunity');
        });
        actionsEl.appendChild(btn);
      }

      // IMMUNITÉ 2 parties
      else if (txt.includes('Immunité totale')) {
        const btn = document.createElement('button');
        btn.className   = 'btn-bonus-action';
        btn.textContent = '🛡️ Activer l\'immunité (2 parties)';
        btn.addEventListener('click', () => {
          btn.disabled = true;
          fbSetImmunity(state.gameId, state.playerId, 2);
          fbMarkBonusUsed(state.gameId, state.playerId);
          fbBonusEvent(state.gameId, `🛡️ ${me.name} est immunisé contre les malus pendant 2 parties !`, 'immunity');
        });
        actionsEl.appendChild(btn);
      }
    }

    // Badge immunité
    if (isImmune) {
      const badge = document.createElement('div');
      badge.className   = 'immunity-badge';
      badge.textContent = `🛡️ Immunisé — ${immunity[state.playerId]} partie${immunity[state.playerId] > 1 ? 's' : ''} restante${immunity[state.playerId] > 1 ? 's' : ''}`;
      actionsEl.appendChild(badge);
    }
  }

  // Effets des autres joueurs (visibles par tous)
  const othersEl = document.getElementById('effects-others');
  if (othersEl) {
    othersEl.innerHTML = '';
    players.filter(p => p.id !== state.playerId).forEach(p => {
      if (!p.effect) return;
      const item = document.createElement('div');
      item.className = 'effect-other-item';
      const isImmuneOther = immunity[p.id] > 0;
      item.innerHTML = `
        <span class="effect-other-name">${p.name}</span>
        <span class="effect-other-type ${p.effect.type === 'bonus' ? 'bonus' : 'malus'}">
          ${p.effect.type === 'bonus' ? '✨' : '💀'} ${p.effect.rarity}
          ${isImmuneOther ? ' 🛡️' : ''}
        </span>`;
      othersEl.appendChild(item);
    });
  }

  // Bouton Rejouer
  const c = document.getElementById('vote-container-effects');
  if (!c) return;
  const count = Object.keys(rVotes).length;
  const voted = rVotes[state.playerId];
  c.innerHTML = `
    <p class="vote-count">${count} / ${players.length} prêt${count > 1 ? 's' : ''}</p>
    <button id="btn-vote-effects" ${voted ? 'disabled' : ''}>${voted ? '✅ Rejouer' : '✔ Rejouer'}</button>`;
  if (!voted) {
    document.getElementById('btn-vote-effects')?.addEventListener('click', () => fbVoteReplay(state.gameId, state.playerId));
  }
}

function renderMyEffect(effect, isImmune) {
  const card  = document.querySelector('.effect-card');
  const badge = document.getElementById('effect-type-badge');
  const name  = document.getElementById('effect-name');
  const desc  = document.getElementById('effect-description');
  if (effect && effect.description) {
    if (card)  card.setAttribute('data-type', effect.type || '');
    if (badge) { badge.textContent = effect.rarity || ''; applyRarityColor(badge, effect.rarity); }
    if (name)  name.textContent = effect.type === 'bonus' ? '✨ Objectif réussi !' : '💀 Objectif raté…';
    if (desc)  desc.textContent = effect.description;
  } else if (isImmune) {
    if (card)  card.removeAttribute('data-type');
    if (badge) badge.textContent = '🛡️';
    if (name)  name.textContent  = 'Immunisé !';
    if (desc)  desc.textContent  = 'Tu es protégé contre les malus cette partie.';
  } else {
    if (card)  card.removeAttribute('data-type');
    if (badge) badge.textContent = '—';
    if (name)  name.textContent  = 'Aucun effet';
    if (desc)  desc.textContent  = '';
  }
}

// Animation bonus event — annonce visible par tous
let lastBonusEventTs = 0;
function renderBonusEvent(event) {
  if (!event || event.ts <= lastBonusEventTs) return;
  lastBonusEventTs = event.ts;

  const toast = document.createElement('div');
  toast.className = 'bonus-toast';
  const colors = { steal: '#f59e0b', cancel: '#22c55e', immunity: '#a78bfa', info: '#60a5fa' };
  toast.style.borderColor = colors[event.type] || colors.info;
  toast.style.boxShadow   = `0 0 20px ${colors[event.type] || colors.info}40`;
  toast.textContent = event.message;
  document.body.appendChild(toast);

  // Animation entrée
  requestAnimationFrame(() => toast.classList.add('bonus-toast--visible'));

  // Disparaît après 3.5s
  setTimeout(() => {
    toast.classList.remove('bonus-toast--visible');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ========================
//  RESTART
// ========================
async function restartGame(immunity = {}) {
  currentPhase  = null;
  transitioning = false;
  clearInterval(ingameTimerInterval); ingameTimerInterval = null; ingameStartTime = null;

  // Ferme tout overlay résiduel
  document.querySelectorAll('.draw-overlay').forEach(o => o.remove());

  // Reset complet du DOM entre les parties
  const resetEls = [
    'vote-container-ingame',
    'deliberation-list',
    'effects-actions',
    'effects-others',
    'vote-container-effects',
    'reveal-container',
    'verdict-list',
  ];
  resetEls.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  const recap = document.getElementById('ingame-recap');
  if (recap) { recap.innerHTML = ''; recap.style.display = 'none'; }
  const snap   = await gameRef(state.gameId).once('value');
  const g      = snap.val();
  const fresh  = playersArray(g.players);
  const imm    = g.immunity || {};

  await fbSavePreviousEffects(state.gameId, fresh);
  await Promise.all(fresh.map(p => playerRef(state.gameId, p.id).update({ role: null, success: null, effect: null, lane: null, champion: null })));

  // Décrémente l'immunité de chaque joueur immunisé
  const newImmunity = {};
  Object.entries(imm).forEach(([pid, count]) => {
    if (count > 1) newImmunity[pid] = count - 1;
    // Si count === 1 → on le retire (immunité expirée)
  });

  await gameRef(state.gameId).update({
    phase: 'lobby', votes: {}, deliberationVotes: {},
    verdictVotes: {}, replayVotes: {}, revealIndex: 0,
    usedChampions: [], randomLane: false,
    usedBonus: {}, bonusEvent: null,
    immunity: newImmunity, gameStartTime: null,
  });
}

// ========================
//  LEADERBOARD
// ========================
function renderLeaderboard(players, scores) {
  const sidebar = document.getElementById('leaderboard-sidebar');
  const panel   = document.getElementById('leaderboard-panel-inner');
  if (!players.length) return;

  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const html   = sorted.map((p, i) => {
    const pts    = scores[p.id] || 0;
    const isMe   = p.id === state.playerId;
    const medals = ['🥇','🥈','🥉'];
    const rank   = medals[i] || `${i+1}.`;
    return `
      <div class="lb-item ${isMe ? 'lb-item--me' : ''}">
        <span class="lb-rank">${rank}</span>
        <span class="lb-name">${p.name}${isMe ? ' <span class="lb-you">(toi)</span>' : ''}</span>
        <span class="lb-pts">${pts} <span class="lb-pts-label">pts</span></span>
      </div>`;
  }).join('');

  const title = `<div class="lb-title">🏆 Classement</div>`;
  if (sidebar) sidebar.innerHTML = title + html;
  if (panel)   panel.innerHTML   = title + html;
}

function openLeaderboardPanel() {
  document.getElementById('leaderboard-panel')?.classList.add('open');
}
function closeLeaderboardPanel() {
  document.getElementById('leaderboard-panel')?.classList.remove('open');
}

// ========================
//  RAPPEL IN_GAME — rôle + champion
// ========================
function renderVoteButton(phase, votes, players, label) {
  const c = document.getElementById('vote-container-' + phase);
  if (!c) return;
  const count  = Object.keys(votes).length;
  const voted  = votes[state.playerId];
  const lbl    = label || 'Je suis prêt';
  c.innerHTML = `
    <p class="vote-count">${count} / ${players.length} prêt${count > 1 ? 's' : ''}</p>
    <button id="btn-vote-${phase}" ${voted ? 'disabled' : ''}>${voted ? `✅ ${lbl}` : `✔ ${lbl}`}</button>`;
  if (!voted) {
    document.getElementById('btn-vote-' + phase).addEventListener('click', () => fbVote(state.gameId, state.playerId));
  }
}

// ========================
//  RIOT API
// ========================

const REGIONS = {
  euw1: 'europe', na1: 'americas', eun1: 'europe',
  kr: 'asia', br1: 'americas', la1: 'americas',
  la2: 'americas', oc1: 'sea', tr1: 'europe', jp1: 'asia',
};

let riotApiKey = null;

// Récupère la clé depuis Firebase
async function getRiotKey() {
  if (riotApiKey) return riotApiKey;
  const snap = await db.ref('config/riotKey').once('value');
  riotApiKey = snap.val();
  return riotApiKey;
}

// Appel générique à l'API Riot via corsproxy.io
async function riotCall(url) {
  const key = await getRiotKey();
  if (!key) throw new Error('Clé API Riot non configurée');
  const separator  = url.includes('?') ? '&' : '?';
  const urlWithKey = url + separator + 'api_key=' + encodeURIComponent(key);
  const proxyUrl   = 'https://corsproxy.io/?url=' + encodeURIComponent(urlWithKey);
  const res  = await fetch(proxyUrl);
  const data = await res.json();
  if (data.status && data.status.status_code === 401) throw { code: 401, message: 'Clé API expirée — renouvelle-la sur developer.riotgames.com' };
  if (data.status && data.status.status_code === 404) throw { code: 404, message: 'Compte introuvable' };
  if (!res.ok) throw { code: res.status, message: JSON.stringify(data) };
  return data;
}

// Récupère le PUUID depuis un Riot ID (Pseudo#TAG)
async function getPuuid(gameName, tagLine, region = 'euw1') {
  const regional = REGIONS[region] || 'europe';
  const url = `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const data = await riotCall(url);
  return data.puuid;
}

// Vérifie si une partie est en cours pour un PUUID
async function getLiveGame(puuid, region = 'euw1') {
  const url = `https://${region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
  return riotCall(url);
}

// Récupère les stats du dernier match
async function getLastMatchStats(puuid, region = 'euw1') {
  const regional = REGIONS[region] || 'europe';
  // 1. Récupère l'ID du dernier match
  const ids = await riotCall(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`
  );
  if (!ids || !ids.length) return null;
  // 2. Récupère les stats du match
  const match = await riotCall(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/${ids[0]}`
  );
  return match.info.participants.map(p => ({
    puuid:        p.puuid,
    kills:        p.kills,
    deaths:       p.deaths,
    assists:      p.assists,
    damage:       p.totalDamageDealtToChampions,
    cs:           p.totalMinionsKilled + p.neutralMinionsKilled,
    gold:         p.goldEarned,
    visionScore:  p.visionScore,
    win:          p.win,
    championName: p.championName,
  }));
}

// Vérifie automatiquement les objectifs basés sur les stats
function checkObjectifAuto(role, stats, myPuuid) {
  if (!stats || !role) return null;
  const me = stats.find(p => p.puuid === myPuuid);
  if (!me) return null;

  const max  = (key) => stats.every(p => p.puuid === myPuuid || me[key] >= p[key]);
  const min  = (key) => stats.every(p => p.puuid === myPuuid || me[key] <= p[key]);

  switch (role.nom) {
    case 'Le PGM':         return max('damage');
    case 'Le Farmer':      return max('cs') || max('gold');
    case "L'Intouchable":  return min('deaths');
    case 'Le Visionnaire': return max('visionScore');
    case 'Le Sup Originel':return max('assists');
    case 'Super-Héro':     return max('deaths');
    case 'Le Feeder Assumé':
      return max('deaths') && min('kills');
    default: return null; // objectif subjectif → vote manuel
  }
}

// ========================
//  SOMMAIRE
// ========================

const RARITY_CLASS = {
  '⚪ Commun':     'rarity-commun',
  '🔵 Rare':       'rarity-rare',
  '🟣 Épique':     'rarity-epique',
  '🟠 Légendaire': 'rarity-legendaire',
};

function openRulesPanel() {
  const panel = document.getElementById('rules-panel');
  if (!panel) return;

  // Remplit les listes si vides
  populateRulesRoles();
  populateRulesEffects('rules-bonus-list', BONUS_POOL);
  populateRulesEffects('rules-malus-list', MALUS_POOL);

  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
}

function closeRulesPanel() {
  const panel = document.getElementById('rules-panel');
  if (!panel) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

function populateRulesRoles() {
  const list = document.getElementById('rules-roles-list');
  if (!list || list.children.length > 0) return;
  ROLES.forEach(role => {
    const card = document.createElement('div');
    card.className = 'rules-role-card';
    card.innerHTML = `
      <div class="rules-role-name">${role.nom}</div>
      <div class="rules-role-obj">${role.objectif}</div>`;
    list.appendChild(card);
  });
}

function populateRulesEffects(containerId, pool) {
  const list = document.getElementById(containerId);
  if (!list || list.children.length > 0) return;

  // Groupe par rareté pour l'affichage
  const groups = {};
  pool.forEach(item => {
    if (!groups[item.rarity]) groups[item.rarity] = [];
    groups[item.rarity].push(item);
  });

  Object.entries(groups).forEach(([rarity, items]) => {
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'rules-effect-card';
      const rarityClass = RARITY_CLASS[rarity] || 'rarity-commun';
      card.innerHTML = `
        <span class="rules-effect-rarity ${rarityClass}">${rarity}</span>
        <span class="rules-effect-text">${item.text}</span>`;
      list.appendChild(card);
    });
  });
}

// Bouton home
document.getElementById('btn-rules-home')?.addEventListener('click', openRulesPanel);

// Bouton flottant (pendant la partie)
document.getElementById('btn-rules-float')?.addEventListener('click', openRulesPanel);

// Fermeture
document.getElementById('btn-rules-close')?.addEventListener('click', closeRulesPanel);

// Clic sur le fond ferme le panel
document.getElementById('rules-panel')?.addEventListener('click', e => {
  if (e.target === document.getElementById('rules-panel')) closeRulesPanel();
});

// Leaderboard mobile
document.getElementById('btn-lb-float')?.addEventListener('click', openLeaderboardPanel);
document.getElementById('leaderboard-panel')?.addEventListener('click', e => {
  if (e.target === document.getElementById('leaderboard-panel')) closeLeaderboardPanel();
});

document.getElementById('cb-champion-mode')?.addEventListener('change', e => {
  fbSetChampionMode(state.gameId, e.target.checked);
  if (!e.target.checked) fbSetRandomLane(state.gameId, false);
});

document.getElementById('cb-random-lane')?.addEventListener('change', e => {
  fbSetRandomLane(state.gameId, e.target.checked);
});

// ========================
//  FOND ANIMÉ — SUMMONER'S RIFT
//  Canvas 2D : particules, runes flottantes, éclairs de mana
// ========================
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Palette LoL
  const COLORS = {
    teal:   [0,   210, 255],
    gold:   [201, 168, 76 ],
    purple: [160, 40,  255],
    blue:   [60,  120, 255],
    white:  [220, 235, 255],
  };

  function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

  // Resize
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // ── PARTICULES flottantes ────────────────────────────────
  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x    = Math.random() * canvas.width;
      this.y    = init ? Math.random() * canvas.height : canvas.height + 10;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.25;
      this.alpha  = 0;
      this.maxAlpha = Math.random() * 0.55 + 0.1;
      this.life   = 0;
      this.maxLife = Math.random() * 400 + 200;
      const keys = Object.keys(COLORS);
      this.color  = COLORS[keys[Math.floor(Math.random() * keys.length)]];
      // forme : 0=rond, 1=losange, 2=croix
      this.shape  = Math.floor(Math.random() * 3);
    }
    update() {
      this.x    += this.speedX;
      this.y    += this.speedY;
      this.life++;
      // fade in / out
      const t = this.life / this.maxLife;
      this.alpha = t < 0.2 ? (t / 0.2) * this.maxAlpha
                 : t > 0.8 ? ((1 - t) / 0.2) * this.maxAlpha
                 : this.maxAlpha;
      if (this.life >= this.maxLife || this.y < -10) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = rgba(this.color, 1);
      ctx.translate(this.x, this.y);
      if (this.shape === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 1) {
        const s = this.size * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s, 0);
        ctx.lineTo(0,  s); ctx.lineTo(-s, 0);
        ctx.closePath(); ctx.fill();
      } else {
        const s = this.size;
        ctx.strokeStyle = rgba(this.color, 1);
        ctx.lineWidth   = s * 0.6;
        ctx.beginPath();
        ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
        ctx.moveTo(0, -s); ctx.lineTo(0, s);
        ctx.stroke();
      }
      // halo lumineux
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 4);
      grd.addColorStop(0, rgba(this.color, 0.3));
      grd.addColorStop(1, rgba(this.color, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── RUNES flottantes ─────────────────────────────────────
  class Rune {
    constructor() { this.reset(true); }
    reset(init) {
      this.x      = Math.random() * canvas.width;
      this.y      = init ? Math.random() * canvas.height : canvas.height + 60;
      this.size   = Math.random() * 28 + 14;
      this.speedY = -(Math.random() * 0.15 + 0.04);
      this.speedX = (Math.random() - 0.5) * 0.08;
      this.rot    = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.004;
      this.alpha  = 0;
      this.maxAlpha = Math.random() * 0.18 + 0.05;
      this.life   = 0;
      this.maxLife = Math.random() * 800 + 400;
      const keys  = Object.keys(COLORS);
      this.color  = COLORS[keys[Math.floor(Math.random() * keys.length)]];
      // type de rune : 0=hexagone, 1=étoile, 2=cercles concentriques, 3=pentagramme
      this.type   = Math.floor(Math.random() * 4);
    }
    update() {
      this.x   += this.speedX;
      this.y   += this.speedY;
      this.rot += this.rotSpeed;
      this.life++;
      const t   = this.life / this.maxLife;
      this.alpha = t < 0.15 ? (t / 0.15) * this.maxAlpha
                 : t > 0.85 ? ((1 - t) / 0.15) * this.maxAlpha
                 : this.maxAlpha;
      if (this.life >= this.maxLife || this.y < -80) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha  = this.alpha;
      ctx.strokeStyle  = rgba(this.color, 1);
      ctx.lineWidth    = 0.8;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      const s = this.size;
      if (this.type === 0) {
        // Hexagone
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          i === 0 ? ctx.moveTo(Math.cos(a)*s, Math.sin(a)*s)
                  : ctx.lineTo(Math.cos(a)*s, Math.sin(a)*s);
        }
        ctx.closePath(); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          i === 0 ? ctx.moveTo(Math.cos(a)*s*0.6, Math.sin(a)*s*0.6)
                  : ctx.lineTo(Math.cos(a)*s*0.6, Math.sin(a)*s*0.6);
        }
        ctx.closePath(); ctx.stroke();
      } else if (this.type === 1) {
        // Étoile à 6 branches
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          const r = i % 2 === 0 ? s : s * 0.45;
          i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
                  : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        ctx.closePath(); ctx.stroke();
      } else if (this.type === 2) {
        // Cercles concentriques + croix
        for (const r of [s, s*0.65, s*0.3]) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI*2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
        ctx.moveTo(0, -s); ctx.lineTo(0, s);
        ctx.stroke();
      } else {
        // Pentagramme
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          i === 0 ? ctx.moveTo(Math.cos(a)*s, Math.sin(a)*s)
                  : ctx.lineTo(Math.cos(a)*s, Math.sin(a)*s);
        }
        ctx.closePath(); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a  = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const a2 = ((i+2) * 2 * Math.PI) / 5 - Math.PI / 2;
          ctx.moveTo(Math.cos(a)*s, Math.sin(a)*s);
          ctx.lineTo(Math.cos(a2)*s, Math.sin(a2)*s);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ── ÉCLAIRS DE MANA ──────────────────────────────────────
  class ManaOrb {
    constructor() { this.reset(); }
    reset() {
      this.x      = Math.random() * canvas.width;
      this.y      = Math.random() * canvas.height;
      this.r      = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.alpha  = Math.random() * 0.4 + 0.05;
      this.pulse  = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      const palette = [COLORS.teal, COLORS.blue, COLORS.purple];
      this.color  = palette[Math.floor(Math.random() * palette.length)];
    }
    update() {
      this.x     += this.speedX;
      this.y     += this.speedY;
      this.pulse += this.pulseSpeed;
      if (this.x < -10 || this.x > canvas.width + 10 ||
          this.y < -10 || this.y > canvas.height + 10) this.reset();
    }
    draw() {
      const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
      ctx.save();
      ctx.globalAlpha = a;
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5);
      grd.addColorStop(0, rgba(this.color, 0.9));
      grd.addColorStop(0.3, rgba(this.color, 0.4));
      grd.addColorStop(1,   rgba(this.color, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── LIGNES DE MANA (connexions entre orbes proches) ──────
  function drawConnections(orbs) {
    const maxDist = 120;
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        const dx   = orbs[i].x - orbs[j].x;
        const dy   = orbs[i].y - orbs[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < maxDist) {
          const a = (1 - dist / maxDist) * 0.08;
          ctx.save();
          ctx.globalAlpha = a;
          ctx.strokeStyle = rgba(COLORS.teal, 1);
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(orbs[i].x, orbs[i].y);
          ctx.lineTo(orbs[j].x, orbs[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // ── INIT ─────────────────────────────────────────────────
  const particles = Array.from({ length: 80  }, () => new Particle());
  const runes     = Array.from({ length: 12  }, () => new Rune());
  const orbs      = Array.from({ length: 40  }, () => new ManaOrb());

  // ── BOUCLE ───────────────────────────────────────────────
  function draw() {
    // Fond dégradé permanent
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fond de base bleu nuit
    const bg = ctx.createLinearGradient(0, 0, W*0.5, H);
    bg.addColorStop(0,   '#060c1a');
    bg.addColorStop(0.4, '#050810');
    bg.addColorStop(0.7, '#040610');
    bg.addColorStop(1,   '#070510');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Lueur teal en haut
    const gt = ctx.createRadialGradient(W*0.5, -H*0.1, 0, W*0.5, -H*0.1, H*0.7);
    gt.addColorStop(0,   'rgba(0,210,255,0.12)');
    gt.addColorStop(0.5, 'rgba(0,150,200,0.06)');
    gt.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gt; ctx.fillRect(0, 0, W, H);

    // Lueur or bas-gauche
    const gg = ctx.createRadialGradient(-W*0.1, H*1.1, 0, -W*0.1, H*1.1, H*0.7);
    gg.addColorStop(0,   'rgba(201,168,76,0.14)');
    gg.addColorStop(0.5, 'rgba(160,120,40,0.07)');
    gg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);

    // Lueur violette bas-droite
    const gp = ctx.createRadialGradient(W*1.1, H*1.05, 0, W*1.1, H*1.05, H*0.65);
    gp.addColorStop(0,   'rgba(140,40,255,0.12)');
    gp.addColorStop(0.5, 'rgba(100,20,200,0.06)');
    gp.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gp; ctx.fillRect(0, 0, W, H);

    // Vignette
    const gv = ctx.createRadialGradient(W*0.5, H*0.5, H*0.2, W*0.5, H*0.5, H*0.85);
    gv.addColorStop(0,   'rgba(0,0,0,0)');
    gv.addColorStop(1,   'rgba(2,4,12,0.75)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);

    // Orbes + connexions
    orbs.forEach(o => { o.update(); o.draw(); });
    drawConnections(orbs);

    // Runes
    runes.forEach(r => { r.update(); r.draw(); });

    // Particules
    particles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(draw);
  }

  draw();
})();

// ========================
//  INIT
// ========================
showView('home');
