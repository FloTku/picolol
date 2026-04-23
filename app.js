// ================================================
//  PICOLOL app.js — Version refactorisée propre
//  Phases : lobby → roles → in_game → deliberation → reveal → verdict → effects
// ================================================

"use strict";

// ========================
//  STATE
// ========================
const state = {
  gameId: null, playerId: null, playerName: null,
  isHost: false, riotId: null, region: "euw1",
};
let unsubscribeGame   = null;
let transitioning     = false;
let currentPhase      = null;
let overlayShownPhase = null;
let ingameTimer       = null;
let lastBonusTs       = 0;

// ========================
//  DONNÉES
// ========================
const ROLES = [
  { nom: "Mister White",        objectif: "Être accusé par la majorité des joueurs à la fin de la partie." },
  { nom: "Super-Héro",          objectif: "Avoir le plus de morts (Deaths)." },
  { nom: "Le PGM",              objectif: "Avoir le plus de dégâts infligés." },
  { nom: "Le Sup Originel",     objectif: "Avoir le plus d'assists." },
  { nom: "Le Roi des Trolls",   objectif: "Faire tilt au moins un coéquipier (subjectif, validé par l'équipe)." },
  { nom: "Le Farmer",           objectif: "Avoir le plus de gold ou farm (CS)." },
  { nom: "L'Intouchable",      objectif: "Avoir le moins de morts." },
  { nom: "Le Visionnaire",      objectif: "Avoir le plus de vision score." },
  { nom: "Le Feeder Assumé",    objectif: "Finir avec le plus de morts ET le moins de kills de l'équipe." },
  { nom: "Le Split Pusher",     objectif: "Ne jamais participer à un teamfight après la minute 15 (subjectif, validé par l'équipe)." },
  { nom: "L'Objectif First",   objectif: "Être le premier à pinger ou caller chaque objectif neutre (Baron, Dragon...)." },
  { nom: "Le Fantôme",          objectif: "Ne jamais mourir seul — toujours en groupe de 2 minimum." },
  { nom: "L'Invocateur",       objectif: "Utiliser ses 2 sorts d'invocateur dans la même minute au moins une fois." },
  { nom: "Le Coach",            objectif: "Donner au moins 5 callouts utiles reconnus par l'équipe." },
  { nom: "Le Kamikaze",         objectif: "Mourir dans les 3 premières minutes de la partie (premier sang inclus)." },
  { nom: "L'Avocat du Diable", objectif: "Défendre publiquement chaque décision de l'équipe sans jamais critiquer, même les mauvaises." },
  { nom: "Le Sosie",            objectif: "Imiter le style de jeu d'un allié désigné secrètement." },
  { nom: "Le Fantôme Offensif", objectif: "N'initier aucun combat, mais être présent dans au moins 80% des kills de l'équipe (subjectif, validé par l'équipe)." },
  { nom: "Le Diplomate",        objectif: "Écrire au moins 10 messages positifs ou encourageants dans le chat pendant la partie." },
];

const BONUS_POOL = [
  { text: "Peut ignorer un call d'équipe sans reproche.",              rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut forcer un allié à dire 'my bad' après un missplay.", rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut prendre un buff ennemi une fois.",                     rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut demander un report de roam à un allié une fois.",      rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut réclamer un objectif neutre en priorité.",             rarity: "⚪ Commun",     weight: 35 },
  { text: "Peut reroll son champion une fois.",                        rarity: "🔵 Rare",       weight: 20 },
  { text: "Peut shotcaller pendant 10 minutes.",                       rarity: "🔵 Rare",       weight: 20 },
  { text: "Peut décider du prochain objectif.",                        rarity: "🔵 Rare",       weight: 20 },
  { text: "Peut imposer un champion à un allié pour la prochaine partie.", rarity: "🔵 Rare",  weight: 20 },
  { text: "Peut refuser un swap de champion en champ select.",         rarity: "🔵 Rare",       weight: 20 },
  { text: "Devient shotcaller absolu pendant 10 minutes.",             rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut imposer un swap de lane.",                             rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut voler le bonus d'un autre joueur.",                   rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut bannir le champion d'un allié en champ select.",      rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut choisir son côté de carte (bleu/rouge).",              rarity: "🟣 Épique",     weight: 10 },
  { text: "Peut choisir son champion et sa lane pour la prochaine partie.", rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut annuler un malus.",                                    rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut annuler une décision d'équipe.",                      rarity: "🟠 Légendaire", weight: 5 },
  { text: "Peut imposer une composition d'équipe entière.",           rarity: "🟠 Légendaire", weight: 5 },
  { text: "Immunité totale aux malus pendant 2 parties.",              rarity: "🟠 Légendaire", weight: 5 },
];

const MALUS_POOL = [
  { text: "Doit dire 'bien joué' après chaque mort.",                rarity: "⚪ Commun",     weight: 35 },
  { text: "Doit annoncer chaque back.",                                rarity: "⚪ Commun",     weight: 35 },
  { text: "Ne peut pas engage pendant 5 minutes.",                     rarity: "⚪ Commun",     weight: 35 },
  { text: "Doit commencer la partie sans acheter de potions.",         rarity: "⚪ Commun",     weight: 35 },
  { text: "Doit écrire 'gg ez' dans le chat équipe après chaque mort.", rarity: "⚪ Commun",  weight: 35 },
  { text: "Interdiction de ping pendant 10 minutes.",                  rarity: "🔵 Rare",       weight: 20 },
  { text: "Doit suivre tous les calls d'équipe.",                     rarity: "🔵 Rare",       weight: 20 },
  { text: "Interdiction de prendre des objectifs neutres.",            rarity: "🔵 Rare",       weight: 20 },
  { text: "Doit jouer avec un build imposé par l'équipe.",            rarity: "🔵 Rare",       weight: 20 },
  { text: "Ne peut pas utiliser de trinket pendant 10 minutes.",       rarity: "🔵 Rare",       weight: 20 },
  { text: "Pas de Flash pendant 10 minutes.",                          rarity: "🟣 Épique",     weight: 10 },
  { text: "Pas de ward pendant 10 minutes.",                           rarity: "🟣 Épique",     weight: 10 },
  { text: "Donne son premier buff à un allié.",                        rarity: "🟣 Épique",     weight: 10 },
  { text: "Doit jouer le premier rôle disponible en champ select.",    rarity: "🟣 Épique",     weight: 10 },
  { text: "Ne peut pas communiquer par pings pendant toute la partie.", rarity: "🟣 Épique",   weight: 10 },
  { text: "Swap de lane imposé à 10 minutes.",                         rarity: "🟠 Légendaire", weight: 5  },
  { text: "Interdiction totale de ward.",                              rarity: "🟠 Légendaire", weight: 5  },
  { text: "Ne peut pas back pendant 10 minutes.",                      rarity: "🟠 Légendaire", weight: 5  },
  { text: "Doit jouer le champion le moins joué de sa lane ce patch.", rarity: "🟠 Légendaire", weight: 5  },
  { text: "Interdit de recall pendant les 15 premières minutes.",      rarity: "🟠 Légendaire", weight: 5  },
];

const CHAMPION_POOLS = {
  top: ["Aatrox","Camille","Cho'Gath","Darius","Fiora","Gangplank","Garen","Gnar","Gragas","Gwen","Illaoi","Irelia","Jax","Jayce","Kennen","Kled","Malphite","Mordekaiser","Nasus","Ornn","Poppy","Quinn","Renekton","Riven","Rumble","Sett","Shen","Singed","Sion","Swain","Teemo","Tryndamere","Urgot","Volibear","Wukong","Yorick","Zac"],
  jungle: ["Amumu","Bel'Veth","Brand","Briar","Diana","Ekko","Elise","Evelynn","Gragas","Graves","Hecarim","Ivern","Jarvan IV","Jax","Kha'Zix","Kindred","Lee Sin","Lillia","Master Yi","Nidalee","Nocturne","Nunu & Willump","Olaf","Rammus","Rek'Sai","Rengar","Sejuani","Shaco","Shyvana","Taliyah","Trundle","Udyr","Vi","Viego","Warwick","Wukong","Xin Zhao","Zac","Zed"],
  mid: ["Ahri","Akali","Akshan","Annie","Aurelion Sol","Azir","Cassiopeia","Corki","Diana","Ekko","Fizz","Galio","Hwei","Irelia","Kassadin","Katarina","LeBlanc","Lissandra","Lux","Malzahar","Naafiri","Neeko","Orianna","Qiyana","Ryze","Seraphine","Smolder","Sylas","Syndra","Taliyah","Talon","Twisted Fate","Veigar","Vel'Koz","Vex","Victor","Yasuo","Yone","Zed","Zoe"],
  adc: ["Aphelios","Ashe","Caitlyn","Draven","Ezreal","Jhin","Jinx","Kai'Sa","Kalista","Kog'Maw","Lucian","Miss Fortune","Nilah","Samira","Seraphine","Senna","Sivir","Smolder","Tristana","Twitch","Varus","Vayne","Xayah","Zeri","Ziggs"],
  support: ["Alistar","Bard","Blitzcrank","Brand","Braum","Janna","Karma","Leona","Lulu","Lux","Milio","Morgana","Nami","Nautilus","Pyke","Rakan","Rell","Renata Glasc","Seraphine","Senna","Sona","Soraka","Swain","Tahm Kench","Thresh","Vel'Koz","Xerath","Yuumi","Zilean","Zyra"],
};

const LANE_LABELS = { top:"Top", jungle:"Jungle", mid:"Mid", adc:"ADC", support:"Support" };
const LANE_ICONS  = { top:"🛡️", jungle:"🌿", mid:"⚡", adc:"🏹", support:"💊" };
const RARITY_MAP  = { "⚪ Commun":"commun","🔵 Rare":"rare","🟣 Épique":"epique","🟠 Légendaire":"legendaire" };
const BURST_COLORS = { bonus:"#22c55e", malus:"#ef4444", role:"#c9a84c", reveal:"#a78bfa" };
const ICONS = {
  role:  `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="none" stroke="#c9a84c" stroke-width="2"/><polygon points="32,10 52,21 52,43 32,54 12,43 12,21" fill="rgba(201,168,76,0.06)" stroke="rgba(201,168,76,0.3)" stroke-width="1"/><path d="M32 18 L38 28 L50 28 L41 35 L44 46 L32 39 L20 46 L23 35 L14 28 L26 28 Z" fill="#c9a84c" opacity="0.9"/></svg>`,
  bonus: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="26" stroke="#22c55e" stroke-width="1.5" opacity="0.4"/><path d="M32 10 L36 24 L50 24 L39 33 L43 47 L32 38 L21 47 L25 33 L14 24 L28 24 Z" fill="#22c55e" opacity="0.9"/><circle cx="32" cy="32" r="4" fill="#86efac"/></svg>`,
  malus: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="26" stroke="#ef4444" stroke-width="1.5" opacity="0.4"/><path d="M32 8 L56 52 L8 52 Z" fill="none" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/><path d="M32 20 L29 36 L35 36 Z" fill="#ef4444"/><circle cx="32" cy="42" r="3" fill="#ef4444"/></svg>`,
};

// ========================
//  UTILITAIRES
// ========================
function shuffleArray(arr) { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function weightedDraw(pool) { const t=pool.reduce((s,x)=>s+x.weight,0); let r=Math.random()*t; for(const i of pool){r-=i.weight;if(r<=0)return i;} return pool[pool.length-1]; }
function drawEffect(success) { const d=weightedDraw(success?BONUS_POOL:MALUS_POOL); return {type:success?"bonus":"malus",rarity:d.rarity,description:d.text}; }
function generateGameId() { const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)]; return s; }
function generatePlayerId() { return "p_"+Math.random().toString(36).slice(2,10); }
function showError(msg) { alert("⚠️ "+msg); }
function playersArray(obj) { if(!obj)return[]; return Object.entries(obj).map(([id,d])=>({id,...d})); }
function setVisible(id,v) { const el=document.getElementById(id); if(el)el.style.display=v?"block":"none"; }
function championImageUrl(name) { return `https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/${name.replace(/'/g,"").replace(/\s+/g,"").replace(/&/g,"").replace(/\./g,"")}.png`; }
function drawChampion(lane,used) { const p=(CHAMPION_POOLS[lane]||[]).filter(c=>!used.includes(c)); return p.length?p[Math.floor(Math.random()*p.length)]:null; }
function applyRarityColor(el,r) { if(!el||!r)return; const m={commun:"#aaa",rare:"#60a5fa",epique:"#c084fc",legendaire:"#f59e0b"}; el.style.color=m[RARITY_MAP[r]||"commun"]||"#aaa"; }
function hasOverlay() { return !!document.querySelector(".draw-overlay"); }
function removeOverlay() { document.querySelectorAll(".draw-overlay").forEach(o=>o.remove()); }

// ========================
//  NAVIGATION
// ========================
const VIEWS = ["home","lobby","roles","ingame","deliberation","reveal","verdict","effects"];
function showView(name) { VIEWS.forEach(v=>{const el=document.getElementById("view-"+v);if(el)el.style.display=v===name?"flex":"none";}); }

// ========================
//  ANIMATIONS
// ========================
function playBurst(color) {
  const w=document.createElement("div");
  w.style.cssText="position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;pointer-events:none;";
  const r1=document.createElement("div"); r1.className="burst-ring"; r1.style.cssText=`width:20px;height:20px;background:${color};box-shadow:0 0 40px ${color};`;
  const r2=document.createElement("div"); r2.className="burst-ring-2"; r2.style.cssText=`width:14px;height:14px;border:2px solid ${color};box-shadow:0 0 20px ${color};`;
  w.appendChild(r1); w.appendChild(r2); document.body.appendChild(w); setTimeout(()=>w.remove(),1200);
}

function showDrawOverlay({icon,title,titleColor,subtitle,body,tapLabel},onDismiss) {
  if(hasOverlay())return;
  const o=document.createElement("div"); o.className="draw-overlay";
  o.innerHTML=`<div class="draw-card-wrap"><div class="draw-card" ${body&&body.type?`data-type="${body.type}"`:""}><div class="draw-card-icon">${icon}</div><div class="draw-card-role" style="color:${titleColor||"#f0d080"};text-shadow:0 0 20px ${titleColor||"#c9a84c"}55">${title}</div>${subtitle?`<div style="font-size:.75rem;font-weight:700;letter-spacing:2px;color:${subtitle.color||"#aaa"};text-transform:uppercase">${subtitle.text}</div>`:""} ${body?`<div class="draw-card-objectif">${body.text}</div>`:""}<div class="draw-card-tap">${tapLabel||"Toucher pour continuer"}</div></div></div>`;
  document.body.appendChild(o);
  function dismiss(){o.style.animation="fadeOut 0.25s ease both";setTimeout(()=>{o.remove();if(onDismiss)onDismiss();},240);}
  o.addEventListener("pointerup",dismiss,{once:true});
}

function showRoleDraw(role,cb) { playBurst(BURST_COLORS.role); showDrawOverlay({icon:ICONS.role,title:role.nom,titleColor:"#f0d080",body:{text:role.objectif}},cb); }

function showChampionReveal(champion,cb) {
  if(!champion){if(cb)cb();return;}
  if(hasOverlay())return;
  playBurst("#60a5fa");
  const o=document.createElement("div"); o.className="draw-overlay";
  o.innerHTML=`<div style="perspective:1200px;display:flex;align-items:center;justify-content:center;width:100%"><div class="draw-card" style="width:320px;gap:1.2rem;animation:cardFlip 1.1s cubic-bezier(0.22,1,0.36,1) 0.1s both"><div style="font-size:1rem;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#93c5fd;animation:textReveal 0.4s ease 0.9s both">${LANE_ICONS[champion.lane]||""} ${LANE_LABELS[champion.lane]||""}</div><img src="${championImageUrl(champion.name)}" alt="${champion.name}" class="champion-draw-img" onerror="this.style.display='none'"/><div class="draw-card-role" style="font-size:1.5rem;color:#93c5fd;text-shadow:0 0 24px rgba(59,130,246,0.7);animation:textReveal 0.4s ease 1s both">${champion.name}</div><div style="font-size:.8rem;letter-spacing:3px;text-transform:uppercase;color:#8898b0;font-weight:600;animation:textReveal 0.4s ease 1.3s both">Toucher pour continuer</div></div></div>`;
  document.body.appendChild(o);
  function dismiss(){o.style.animation="fadeOut 0.25s ease both";setTimeout(()=>{o.remove();if(cb)cb();},240);}
  o.addEventListener("pointerup",dismiss,{once:true});
}

// Mapping rareté → fichiers assets
const RARITY_ASSETS = {
  commun:     { icone: "assets/iconeC.png",  carte: null },  // carte malus à venir
  rare:       { icone: "assets/iconeR.png",  carte: null },
  epique:     { icone: "assets/iconeE.png",  carte: null },
  legendaire: { icone: "assets/iconeL.png",  carte: null },
};
const BONUS_CARD_ASSETS = {
  commun:     "assets/cartebonusC.png",
  rare:       "assets/cartebonusR.png",
  epique:     "assets/cartebonusE.png",
  legendaire: "assets/cartebonusL.png",
};

function showEffectReveal(effect, cb) {
  if(!effect||!effect.description){if(cb)cb();return;}
  const isBonus = effect.type==="bonus";
  const rarKey  = RARITY_MAP[effect.rarity]||"commun";
  const icone   = RARITY_ASSETS[rarKey]?.icone;
  const carte   = isBonus ? BONUS_CARD_ASSETS[rarKey] : null; // malus cards à venir
  const rc      = {commun:"#aaa",rare:"#60a5fa",epique:"#c084fc",legendaire:"#f59e0b"};
  const color   = rc[rarKey];

  playBurst(isBonus?BURST_COLORS.bonus:BURST_COLORS.malus);

  if(hasOverlay())return;
  const o=document.createElement("div"); o.className="draw-overlay";

  const cardBg = carte
    ? `background-image:url('${carte}');background-size:cover;background-position:center;`
    : `background:${isBonus?"linear-gradient(160deg,#0a1a0a,#0d2b0d)":"linear-gradient(160deg,#1a0a0a,#2b0d0d)"};`;

  o.innerHTML=`
    <div class="draw-card-wrap">
      <div class="effect-card-custom" style="${cardBg}">
        <div class="effect-card-desc">${effect.description}</div>
        <div class="draw-card-tap">Toucher pour continuer</div>
      </div>
    </div>`;
  document.body.appendChild(o);
  function dismiss(){o.style.animation="fadeOut 0.25s ease both";setTimeout(()=>{o.remove();if(cb)cb();},240);}
  o.addEventListener("pointerup",dismiss,{once:true});
}

function renderBonusEvent(event) {
  if(!event||event.ts<=lastBonusTs)return;
  lastBonusTs=event.ts;
  const t=document.createElement("div"); t.className="bonus-toast";
  const c={steal:"#f59e0b",cancel:"#22c55e",immunity:"#a78bfa",info:"#60a5fa"};
  t.style.borderColor=c[event.type]||c.info; t.style.boxShadow=`0 0 20px ${c[event.type]||c.info}40`;
  t.textContent=event.message; document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add("bonus-toast--visible"));
  setTimeout(()=>{t.classList.remove("bonus-toast--visible");setTimeout(()=>t.remove(),400);},3500);
}

// ========================
//  FIREBASE
// ========================
function gameRef(id)         { return db.ref("games/"+id); }
function playerRef(gid,pid)  { return db.ref("games/"+gid+"/players/"+pid); }

function fbCreateGame(gid,hid) {
  return gameRef(gid).set({phase:"lobby",hostId:hid,votes:{},deliberationVotes:{},verdictVotes:{},replayVotes:{},previousEffects:{},revealIndex:0,championMode:false,randomLane:false,usedChampions:[],scores:{},immunity:{},usedBonus:{},bonusEvent:null,gameStartTime:null,players:{}});
}
function fbJoinGame(gid,pid,name,riotId) { return playerRef(gid,pid).set({name,riotId:riotId||null,puuid:null,role:null,success:null,effect:null,lane:null,champion:null}); }
function fbGameExists(gid)    { return gameRef(gid).once("value").then(s=>s.exists()); }
function fbSetPhase(gid,p)    { return gameRef(gid).update({phase:p}); }
function fbSetRole(gid,pid,r) { return playerRef(gid,pid).update({role:r}); }
function fbSetSuccess(gid,pid,v) { return playerRef(gid,pid).update({success:v}); }
function fbSetEffect(gid,pid,e)  { return playerRef(gid,pid).update({effect:e}); }
function fbSetLane(gid,pid,l)    { return playerRef(gid,pid).update({lane:l}); }
function fbSetChampion(gid,pid,c){ return playerRef(gid,pid).update({champion:c}); }
function fbSetChampionMode(gid,v){ return gameRef(gid).update({championMode:v}); }
function fbSetRandomLane(gid,v)  { return gameRef(gid).update({randomLane:v}); }
function fbVote(gid,pid)         { return db.ref("games/"+gid+"/votes/"+pid).set(true); }
function fbResetVotes(gid)       { return gameRef(gid).update({votes:{}}); }
function fbDeliberationVote(gid,vid,tid,r) { return db.ref("games/"+gid+"/deliberationVotes/"+vid+"/"+tid).set(r); }
function fbVerdictVote(gid,tid,vid,v) { return db.ref("games/"+gid+"/verdictVotes/"+tid+"/"+vid).set(v); }
function fbNextReveal(gid,i)     { return gameRef(gid).update({revealIndex:i}); }
function fbSetRevealOrder(gid,o) { return gameRef(gid).update({revealOrder:o}); }
function fbVoteReplay(gid,pid)   { return db.ref("games/"+gid+"/replayVotes/"+pid).set(true); }
function fbAddScore(gid,pid,pts) { return db.ref("games/"+gid+"/scores/"+pid).transaction(c=>(c||0)+pts); }
function fbSetImmunity(gid,pid,n){ return db.ref("games/"+gid+"/immunity/"+pid).set(n); }
function fbMarkBonusUsed(gid,pid){ return db.ref("games/"+gid+"/usedBonus/"+pid).set(true); }
function fbBonusEvent(gid,msg,type="info") { return gameRef(gid).update({bonusEvent:{message:msg,type,ts:Date.now()}}); }
function fbSavePreviousEffects(gid,players) { const p={}; players.forEach(x=>{if(x.effect)p[x.id]={name:x.name,effect:x.effect};}); return gameRef(gid).update({previousEffects:p}); }
function fbWatch(gid,cb) { const ref=gameRef(gid); ref.on("value",s=>{if(s.exists())cb(s.val());}); return ()=>ref.off("value"); }

async function fbStealBonus(gid,thiefId,victimId) {
  const snap=await gameRef(gid).once("value"); const g=snap.val();
  const thief=g.players[thiefId]; const victim=g.players[victimId];
  if(!victim||!victim.effect)return;
  await playerRef(gid,thiefId).update({effect:victim.effect});
  await playerRef(gid,victimId).update({effect:null});
  await fbMarkBonusUsed(gid,thiefId);
  await fbBonusEvent(gid,`🦊 ${thief.name} a volé l'effet de ${victim.name} !`,"steal");
}

// ========================
//  ATTRIBUTION RÔLES/CHAMPIONS
// ========================
function buildRole(role,players,pid) {
  const r={...role};
  if(r.nom==="Le Sosie"){const others=players.filter(o=>o.id!==pid); const t=others[Math.floor(Math.random()*others.length)]; if(t){r.objectif=`Imite le style de jeu de ${t.name} — même façon de jouer, même agressivité, même positioning. ${t.name} ne sait pas qu'il est ta cible.`;r.cible=t.name;}}
  return r;
}
function assignRoles(gid,players) { const s=shuffleArray(ROLES); return Promise.all(players.map((p,i)=>fbSetRole(gid,p.id,buildRole(s[i%s.length],players,p.id)))); }

async function assignChampionsAndRoles(gid,players,randomLane) {
  const used=[],usedLanes=[],allLanes=Object.keys(LANE_LABELS);
  await Promise.all(players.map(p=>{
    let lane=p.lane;
    if(randomLane){const avail=allLanes.filter(l=>!usedLanes.includes(l)); lane=avail.length?avail[Math.floor(Math.random()*avail.length)]:allLanes[Math.floor(Math.random()*allLanes.length)]; usedLanes.push(lane);}
    const champ=drawChampion(lane,used); if(champ)used.push(champ); const co=champ?{name:champ,lane}:null;
    return randomLane?playerRef(gid,p.id).update({lane,champion:co}):fbSetChampion(gid,p.id,co);
  }));
  await gameRef(gid).update({usedChampions:used});
  const s=shuffleArray(ROLES); await Promise.all(players.map((p,i)=>fbSetRole(gid,p.id,buildRole(s[i%s.length],players,p.id))));
}

// ========================
//  HELPERS VOTE
// ========================
function allVoted(v,p)      { return p.length>0&&p.every(x=>v[x.id]===true); }
function allDeliberationVoted(dv,p) { return p.length>0&&p.every(voter=>{const my=dv[voter.id]||{};return p.filter(x=>x.id!==voter.id).every(t=>my[t.id]);}); }
function allVerdictVoted(vv,p) { return p.length>0&&p.every(t=>Object.keys(vv[t.id]||{}).length>=p.length-1); }
function majority(tv) { if(!tv)return false; const v=Object.values(tv); return v.length>0&&v.filter(x=>x===true).length>v.length/2; }
function allReplayVoted(rv,p) { return p.length>0&&p.every(x=>rv[x.id]===true); }

// ========================
//  HOME
// ========================
document.getElementById("btn-create")?.addEventListener("click",async()=>{
  const name=document.getElementById("input-host-name").value.trim();
  const riotId=document.getElementById("input-host-riot").value.trim();
  if(!name)return showError("Saisis ton pseudo.");
  if(typeof db==="undefined")return showError("Firebase non initialisé.");
  const gid=generateGameId(),pid=generatePlayerId();
  Object.assign(state,{gameId:gid,playerId:pid,playerName:name,isHost:true,riotId:riotId||null});
  try{await fbCreateGame(gid,pid);await fbJoinGame(gid,pid,name,riotId);enterGame();}
  catch(e){showError("Erreur Firebase: "+(e.message||e));}
});

document.getElementById("btn-join")?.addEventListener("click",async()=>{
  const code=document.getElementById("input-code").value.trim().toUpperCase();
  const name=document.getElementById("input-name").value.trim();
  const riotId=document.getElementById("input-riot").value.trim();
  if(!code||code.length<4)return showError("Saisis un code valide.");
  if(!name)return showError("Saisis ton pseudo.");
  if(typeof db==="undefined")return showError("Firebase non initialisé.");
  try{
    if(!await fbGameExists(code))return showError("Partie introuvable.");
    Object.assign(state,{gameId:code,playerId:generatePlayerId(),playerName:name,isHost:false,riotId:riotId||null});
    await fbJoinGame(state.gameId,state.playerId,name,riotId);enterGame();
  }catch(e){showError("Erreur Firebase: "+(e.message||e));}
});

// ========================
//  ENTRÉE EN PARTIE
// ========================
function enterGame() {
  transitioning=false; currentPhase=null; overlayShownPhase=null; lastBonusTs=0;
  clearInterval(ingameTimer); ingameTimer=null;
  removeOverlay(); resetDom();
  document.getElementById("display-code").textContent=state.gameId;
  showView("lobby");
  if(unsubscribeGame)unsubscribeGame();
  unsubscribeGame=fbWatch(state.gameId,onGameUpdate);
}

function resetDom() {
  ["vote-container-ingame","vote-container-lobby","vote-container-roles",
   "deliberation-list","effects-actions","effects-others","vote-container-effects",
   "reveal-container","verdict-list","player-list"].forEach(id=>{
    const el=document.getElementById(id);if(el)el.innerHTML="";
  });
  const r=document.getElementById("ingame-recap");if(r){r.innerHTML="";r.style.display="none";}
  removeOverlay();
}

// ========================
//  ROUTEUR
// ========================
function onGameUpdate(game) {
  if(!game)return;
  const players=playersArray(game.players);
  const votes=game.votes||{},dVotes=game.deliberationVotes||{},vVotes=game.verdictVotes||{},rVotes=game.replayVotes||{};
  const prevEffects=game.previousEffects||{},revealIndex=game.revealIndex||0,revealOrder=game.revealOrder||null;
  const championMode=game.championMode||false,randomLane=game.randomLane||false;
  const scores=game.scores||{},immunity=game.immunity||{},usedBonus=game.usedBonus||{};
  const bonusEvent=game.bonusEvent||null,phase=game.phase;

  renderLeaderboard(players,scores);
  if(bonusEvent&&bonusEvent.ts)renderBonusEvent(bonusEvent);

  // ── GESTION OVERLAY ─────────────────────────────
  // Reset overlayShownPhase quand on repasse par lobby (entre deux parties)
  if(phase==="lobby"&&(overlayShownPhase==="roles"||overlayShownPhase==="effects")) {
    overlayShownPhase=null;
    removeOverlay();
  }

  if(phase!==currentPhase) {
    currentPhase=phase;

    if(phase==="roles"&&overlayShownPhase!=="roles") {
      const me=players.find(p=>p.id===state.playerId);
      if(me&&me.role){
        overlayShownPhase="roles";
        if(me.champion){showChampionReveal(me.champion,()=>showRoleDraw(me.role,()=>{showView("roles");renderRoles(players,votes);}));}
        else{showRoleDraw(me.role,()=>{showView("roles");renderRoles(players,votes);});}
        return;
      }
    }

    if(phase==="effects"&&overlayShownPhase!=="effects") {
      overlayShownPhase="effects";
      const me=players.find(p=>p.id===state.playerId);
      showEffectReveal(me&&me.effect?me.effect:null,()=>{
        gameRef(state.gameId).once("value").then(snap=>{
          if(!snap.exists())return;
          const g=snap.val();
          if(g.phase!=="effects"){onGameUpdate(g);return;}
          showView("effects");
          // Utiliser replayVotes FRAIS depuis Firebase (pas celui du snapshot précédent)
          renderEffects(playersArray(g.players),g.replayVotes||{},g.immunity||{},g.usedBonus||{});
        });
      });
      return;
    }
  }

  if(hasOverlay()&&phase!=="effects")return;

  switch(phase){
    case "lobby":        handleLobby(players,votes,prevEffects,championMode,randomLane);break;
    case "roles":        handleRoles(players,votes);break;
    case "in_game":      handleInGame(players,game);break;
    case "deliberation": handleDeliberation(players,dVotes);break;
    case "reveal":       handleReveal(players,revealIndex,revealOrder);break;
    case "verdict":      handleVerdict(players,vVotes);break;
    case "effects":      handleEffects(players,rVotes,immunity,usedBonus);break;
  }
}

// ========================
//  PHASE LOBBY
// ========================
function handleLobby(players,votes,prevEffects,championMode,randomLane) {
  showView("lobby");
  renderLobby(players,votes,prevEffects,championMode,randomLane);
  const allLanesOk=!championMode||randomLane||players.every(p=>p.lane);
  if(!allLanesOk)return;
  if(allVoted(votes,players)&&state.isHost&&!transitioning){
    transitioning=true;
    const fn=championMode?assignChampionsAndRoles(state.gameId,players,randomLane):assignRoles(state.gameId,players);
    fn.then(()=>fbResetVotes(state.gameId)).then(()=>fbSetPhase(state.gameId,"roles")).finally(()=>{transitioning=false;});
  }
}

function renderLobby(players,votes,prevEffects,championMode,randomLane) {
  const ul=document.getElementById("player-list");if(!ul)return;ul.innerHTML="";
  const takenLanes=players.filter(p=>p.id!==state.playerId&&p.lane).map(p=>p.lane);
  players.forEach(p=>{
    const li=document.createElement("li");li.className="lobby-player-item";const self=p.id===state.playerId;
    let ci="";if(championMode){if(randomLane)ci=`<span class="lobby-lane">🎲 Poste aléatoire</span>`;else if(p.lane)ci=`<span class="lobby-lane">${LANE_ICONS[p.lane]} ${LANE_LABELS[p.lane]}</span>`;else ci=`<span class="lobby-lane muted">— poste non choisi</span>`;}
    li.innerHTML=`<div class="lobby-player-main"><span class="lobby-ready">${votes[p.id]?"✅":"⏳"}</span><span class="lobby-name">${p.name}${self?" <span class=\'muted\'>(toi)</span>":""}</span>${ci}</div>`;
    if(championMode&&!randomLane&&self&&!p.lane){
      const sel=document.createElement("select");sel.className="lane-select";
      sel.innerHTML=`<option value="">— Choisis ton poste —</option>`+Object.entries(LANE_LABELS).map(([k,l])=>{const t=takenLanes.includes(k);return `<option value="${k}" ${t?"disabled":""}>${LANE_ICONS[k]} ${l}${t?" (pris)":""}</option>`;}).join("");
      sel.addEventListener("change",()=>{if(sel.value)fbSetLane(state.gameId,state.playerId,sel.value);});li.appendChild(sel);
    }
    ul.appendChild(li);
  });
  const hc=document.getElementById("host-champion-controls");
  if(hc){const launched=players.some(p=>p.role!=null);hc.style.display=state.isHost&&!launched?"block":"none";const cb=document.getElementById("cb-champion-mode");if(cb)cb.checked=championMode;const wr=document.getElementById("cb-random-lane-wrap");if(wr)wr.style.display=championMode?"flex":"none";const cbr=document.getElementById("cb-random-lane");if(cbr)cbr.checked=randomLane;}
  const prev=prevEffects[state.playerId];renderPreviousEffect(prev?prev.effect:null);
  const me=players.find(p=>p.id===state.playerId);
  if(championMode&&!randomLane&&(!me||!me.lane)){const c=document.getElementById("vote-container-lobby");if(c)c.innerHTML=`<p class="muted" style="text-align:center">Choisis ton poste pour continuer</p>`;}
  else renderVoteButton("lobby",votes,players);
}

function renderPreviousEffect(effect) {
  const c=document.getElementById("previous-effect-container");if(!c)return;
  if(!effect||!effect.description){c.style.display="none";return;}
  c.style.display="block";
  c.innerHTML=`<p class="previous-effect-label">Ton effet de la partie précédente :</p><div class="effect-card effect-card--small"><span class="effect-rarity">${effect.rarity||""}</span><p class="effect-desc">${effect.description}</p></div>`;
}

// ========================
//  PHASE ROLES
// ========================
function handleRoles(players,votes) {
  showView("roles");renderRoles(players,votes);
  if(allVoted(votes,players)&&state.isHost&&!transitioning){transitioning=true;fbResetVotes(state.gameId).then(()=>fbSetPhase(state.gameId,"in_game")).finally(()=>{transitioning=false;});}
}
function renderRoles(players,votes) {
  setVisible("player-role-panel",true);setVisible("host-roles-panel",false);
  const me=players.find(p=>p.id===state.playerId);
  const cb=document.getElementById("role-champion-block");
  if(cb){if(me&&me.champion){const{name,lane}=me.champion;cb.style.display="flex";cb.innerHTML=`<img src="${championImageUrl(name)}" alt="${name}" class="role-champ-img" onerror="this.style.display='none'"/><div class="role-champ-info"><span class="role-champ-name">${name}</span><span class="role-champ-lane">${LANE_ICONS[lane]||""} ${LANE_LABELS[lane]||lane}</span></div>`;}else cb.style.display="none";}
  document.getElementById("role-name").textContent=me?.role?.nom||"En attente…";
  document.getElementById("role-objective").textContent=me?.role?.objectif||"";
  renderVoteButton("roles",votes,players,"J'ai lu mon rôle");
}

// ========================
//  PHASE IN_GAME
// ========================
function handleInGame(players,game) {
  showView("ingame");
  const me=players.find(p=>p.id===state.playerId);
  const recap=document.getElementById("ingame-recap");
  if(recap&&me){recap.innerHTML="";if(me.champion){const img=document.createElement("img");img.src=championImageUrl(me.champion.name);img.alt=me.champion.name;img.className="ingame-recap-champ";img.onerror=()=>img.style.display="none";recap.appendChild(img);}const info=document.createElement("div");info.className="ingame-recap-info";if(me.champion)info.innerHTML+=`<span class="ingame-recap-champion">${LANE_ICONS[me.champion.lane]||""} ${me.champion.name}</span>`;if(me.role){info.innerHTML+=`<span class="ingame-recap-role">🎭 ${me.role.nom}</span>`;info.innerHTML+=`<span class="ingame-recap-obj">${me.role.objectif}</span>`;}recap.appendChild(info);recap.style.display="flex";}
  const start=game.gameStartTime||Date.now();
  if(!game.gameStartTime&&state.isHost)gameRef(state.gameId).update({gameStartTime:start});
  if(!ingameTimer){ingameTimer=setInterval(()=>{const e=Math.floor((Date.now()-start)/1000);const m=String(Math.floor(e/60)).padStart(2,"0");const s=String(e%60).padStart(2,"0");const el=document.getElementById("ingame-timer");if(el)el.textContent=`${m}:${s}`;},1000);}
  const container=document.getElementById("vote-container-ingame");
  if(container&&!container.querySelector("button,p")){
    if(state.isHost){const btn=document.createElement("button");btn.textContent="🏁 La partie est terminée";btn.addEventListener("click",async()=>{btn.disabled=true;btn.textContent="⏳ Récupération des stats…";await fetchAndApplyStats(players);});container.appendChild(btn);}
    else{const p=document.createElement("p");p.className="muted";p.textContent="En attente de l'hôte…";container.appendChild(p);}
  }
}

async function fetchAndApplyStats(players) {
  const btn=document.querySelector("#vote-container-ingame button");
  try{
    clearInterval(ingameTimer);ingameTimer=null;
    const withRiot=players.filter(p=>p.riotId&&p.riotId.includes("#"));
    if(!withRiot.length){await fbResetVotes(state.gameId);await fbSetPhase(state.gameId,"deliberation");return;}
    const anchor=withRiot[0];const[gn,tl]=anchor.riotId.split("#");
    let puuid=anchor.puuid;
    if(!puuid){puuid=await getPuuid(gn,tl,state.region);await playerRef(state.gameId,anchor.id).update({puuid});}
    const stats=await getLastMatchStats(puuid,state.region);
    if(!stats||!stats.length){showError("Stats indisponibles. Vote manuel.");await fbResetVotes(state.gameId);await fbSetPhase(state.gameId,"deliberation");return;}
    for(const p of withRiot){if(!p.puuid){try{const[a,b]=p.riotId.split("#");p.puuid=await getPuuid(a,b,state.region);await playerRef(state.gameId,p.id).update({puuid:p.puuid});}catch{console.warn("PUUID manquant",p.riotId);}}}
    await gameRef(state.gameId).update({matchStats:stats});
    const snap=await gameRef(state.gameId).once("value");const g=snap.val();
    const fresh=playersArray(g.players);const ms=g.matchStats||[];
    await Promise.all(fresh.map(async p=>{if(!p.role||!p.puuid)return;const a=checkObjectifAuto(p.role,ms,p.puuid);if(a!==null)await fbSetSuccess(state.gameId,p.id,a);}));
    await fbResetVotes(state.gameId);await fbSetPhase(state.gameId,"deliberation");
  }catch(err){
    console.error("Riot API:",err);
    if(btn){btn.disabled=false;btn.textContent="🏁 La partie est terminée";}
    showError("Erreur API Riot. Passage en vote manuel.");
    try{await fbResetVotes(state.gameId);await fbSetPhase(state.gameId,"deliberation");}catch(e){console.error(e);}
  }
}

// ========================
//  PHASE DÉLIBÉRATION
// ========================
function handleDeliberation(players,dVotes) {
  showView("deliberation");renderDeliberation(players,dVotes);
  if(allDeliberationVoted(dVotes,players)&&state.isHost&&!transitioning){
    transitioning=true;
    fbSetRevealOrder(state.gameId,players.map(p=>p.id)).then(()=>gameRef(state.gameId).update({revealIndex:0})).then(()=>fbSetPhase(state.gameId,"reveal")).finally(()=>{transitioning=false;});
  }
}

function renderDeliberation(players,dVotes) {
  const c=document.getElementById("deliberation-list");if(!c)return;
  const myVotes=dVotes[state.playerId]||{};
  const others=players.filter(p=>p.id!==state.playerId);
  // Sauvegarder les saisies en cours
  const pending={};others.forEach(t=>{const s=document.getElementById("dsel-"+t.id);if(s&&!s.disabled&&s.value)pending[t.id]=s.value;});
  c.innerHTML="";
  others.forEach(target=>{
    const voted=myVotes[target.id];
    const item=document.createElement("div");item.className="deliberation-item";
    const lbl=document.createElement("p");lbl.className="deliberation-name";lbl.textContent=target.name;
    const sel=document.createElement("select");sel.id="dsel-"+target.id;
    sel.innerHTML=`<option value="">— Choisir un rôle —</option>`+ROLES.map(r=>`<option value="${r.nom}">${r.nom}</option>`).join("");
    if(voted){sel.value=voted;sel.disabled=true;}else if(pending[target.id])sel.value=pending[target.id];
    const btn=document.createElement("button");btn.className="btn-confirm-vote";btn.textContent=voted?"✅ Voté":"Confirmer";if(voted)btn.disabled=true;
    btn.addEventListener("click",()=>{if(!sel.value)return showError("Choisis un rôle pour "+target.name);fbDeliberationVote(state.gameId,state.playerId,target.id,sel.value);sel.disabled=true;btn.disabled=true;btn.textContent="✅ Voté";});
    item.appendChild(lbl);item.appendChild(sel);item.appendChild(btn);c.appendChild(item);
  });
  const done=players.filter(v=>{const x=dVotes[v.id]||{};return players.filter(p=>p.id!==v.id).every(t=>x[t.id]);}).length;
  const counter=document.getElementById("deliberation-counter");if(counter)counter.textContent=`${done} / ${players.length} joueurs ont voté`;
}

// ========================
//  PHASE REVEAL
// ========================
function handleReveal(players,revealIndex,revealOrder) {
  showView("reveal");
  const ordered=revealOrder?revealOrder.map(id=>players.find(p=>p.id===id)).filter(Boolean):players;
  if(revealIndex>=ordered.length){if(state.isHost&&!transitioning){transitioning=true;fbSetPhase(state.gameId,"verdict").finally(()=>{transitioning=false;});}return;}
  const c=document.getElementById("reveal-container");if(!c)return;c.innerHTML="";
  const cur=ordered[revealIndex];if(!cur)return;
  const card=document.createElement("div");card.className="reveal-card";card.style.animation="cardRevealAnim 0.8s cubic-bezier(0.22,1,0.36,1) both";
  playBurst(BURST_COLORS.reveal);
  card.innerHTML=`<p class="reveal-turn">Révélation ${revealIndex+1} / ${ordered.length}</p><h3 class="reveal-name">${cur.name}</h3><p class="reveal-role-label">est…</p><div class="reveal-role-name">${cur.role?.nom||"?"}</div><p class="reveal-objectif">${cur.role?.objectif||""}</p>`;
  c.appendChild(card);
  if(state.isHost){const btn=document.createElement("button");const last=revealIndex>=ordered.length-1;btn.textContent=last?"→ Passer au verdict":"→ Joueur suivant";btn.addEventListener("click",async()=>{btn.disabled=true;await calculateRevealPoints(cur,players);await fbNextReveal(state.gameId,revealIndex+1);});c.appendChild(btn);}
  else{const w=document.createElement("p");w.className="muted";w.textContent="L'hôte contrôle le rythme…";c.appendChild(w);}
}

async function calculateRevealPoints(revealed,players) {
  if(!revealed?.role)return;
  const snap=await gameRef(state.gameId).once("value");const dv=snap.val().deliberationVotes||{};
  await Promise.all(players.filter(v=>v.id!==revealed.id).map(v=>{const voted=(dv[v.id]||{})[revealed.id];return voted===revealed.role.nom?fbAddScore(state.gameId,v.id,1):Promise.resolve();}));
}

// ========================
//  PHASE VERDICT
// ========================
function handleVerdict(players,vVotes) {
  showView("verdict");renderVerdict(players,vVotes);
  if(allVerdictVoted(vVotes,players)&&state.isHost&&!transitioning){transitioning=true;applyVerdictAndLaunchEffects(players,vVotes).finally(()=>{transitioning=false;});}
}

function renderVerdict(players,vVotes) {
  const c=document.getElementById("verdict-list");if(!c)return;c.innerHTML="";
  players.forEach(target=>{
    const tv=vVotes[target.id]||{};const myVote=tv[state.playerId];const self=target.id===state.playerId;
    const count=Object.keys(tv).length;const needed=players.length-1;const done=count>=needed;const result=done?majority(tv):null;
    const item=document.createElement("div");item.className="stat-vote-item";
    const badge=done?`<span class="badge ${result?"badge--success":"badge--fail"}">${result?"✔ Réussi":"✘ Raté"}</span>`:`<span class="badge badge--pending">${count}/${needed}</span>`;
    if(self)item.innerHTML=`<div class="stat-vote-name">${target.name} <span class="muted">(toi)</span></div><div>${badge}</div>`;
    else if(myVote!==undefined){const mi=myVote?'<span class="badge badge--success">✔</span>':'<span class="badge badge--fail">✘</span>';item.innerHTML=`<div class="stat-vote-name">${target.name}</div><div style="display:flex;gap:.4rem;align-items:center">${mi}${badge}</div>`;}
    else item.innerHTML=`<div class="stat-vote-name">${target.name}</div><div style="display:flex;gap:.4rem"><button class="btn-success" data-id="${target.id}">✔ Réussi</button><button class="btn-fail" data-id="${target.id}">✘ Raté</button></div>`;
    c.appendChild(item);
  });
  c.onclick=e=>{const btn=e.target.closest("button");if(!btn?.dataset.id)return;fbVerdictVote(state.gameId,btn.dataset.id,state.playerId,btn.classList.contains("btn-success"));};
  const done=players.filter(t=>Object.keys(vVotes[t.id]||{}).length>=players.length-1).length;
  const counter=document.getElementById("verdict-counter");if(counter)counter.textContent=`${done} / ${players.length} joueurs évalués`;
}

async function applyVerdictAndLaunchEffects(players,vVotes) {
  await Promise.all(players.map(p=>fbSetSuccess(state.gameId,p.id,majority(vVotes[p.id]||{}))));
  const snap=await gameRef(state.gameId).once("value");const g=snap.val();
  const fresh=playersArray(g.players);const imm=g.immunity||{};
  await Promise.all(fresh.map(p=>p.success===true?fbAddScore(state.gameId,p.id,2):Promise.resolve()));
  await Promise.all(fresh.map(p=>{if(p.success===true)return fbSetEffect(state.gameId,p.id,drawEffect(true));if((imm[p.id]||0)>0)return fbSetEffect(state.gameId,p.id,null);return fbSetEffect(state.gameId,p.id,drawEffect(false));}));
  await fbSetPhase(state.gameId,"effects");
}

// ========================
//  PHASE EFFECTS
// ========================
function handleEffects(players,rVotes,immunity,usedBonus) {
  showView("effects");
  // Forcer reset du bouton rejouer — évite les résidus entre parties
  const vc=document.getElementById("vote-container-effects");
  if(vc&&!rVotes[state.playerId]){
    const btn=vc.querySelector("button");
    if(btn&&btn.disabled)vc.innerHTML="";
  }
  renderEffects(players,rVotes,immunity,usedBonus);
  if(allReplayVoted(rVotes,players)&&state.isHost&&!transitioning){transitioning=true;restartGame(immunity).finally(()=>{transitioning=false;});}
}

function renderEffects(players,rVotes,immunity,usedBonus) {
  immunity=immunity||{};usedBonus=usedBonus||{};
  setVisible("host-effects-panel",false);setVisible("player-effect-panel",true);
  const me=players.find(p=>p.id===state.playerId);
  const myEffect=me?.effect||null;const hasUsed=!!usedBonus[state.playerId];const isImmune=(immunity[state.playerId]||0)>0;
  renderMyEffect(myEffect,isImmune);  const actEl=document.getElementById("effects-actions");
  if(actEl){actEl.innerHTML="";
    if(myEffect&&myEffect.type==="bonus"&&!hasUsed){const txt=myEffect.description||"";
      if(txt.includes("voler le bonus")){const others=players.filter(p=>p.id!==state.playerId&&p.effect);if(others.length){const lbl=document.createElement("p");lbl.className="muted";lbl.textContent="Choisis qui voler :";actEl.appendChild(lbl);others.forEach(t=>{const btn=document.createElement("button");btn.className="btn-bonus-action";btn.textContent=`🦊 Voler ${t.name} (${t.effect?.rarity||"?"})`;btn.addEventListener("click",()=>{btn.disabled=true;fbStealBonus(state.gameId,state.playerId,t.id);});actEl.appendChild(btn);});}}
      else if(txt.includes("annuler un malus")){const btn=document.createElement("button");btn.className="btn-bonus-action";btn.textContent="🛡️ Annuler mon prochain malus";btn.addEventListener("click",()=>{btn.disabled=true;fbSetImmunity(state.gameId,state.playerId,1);fbMarkBonusUsed(state.gameId,state.playerId);fbBonusEvent(state.gameId,`🛡️ ${me.name} est immunisé contre le prochain malus !`,"immunity");});actEl.appendChild(btn);}
      else if(txt.includes("Immunité totale")){const btn=document.createElement("button");btn.className="btn-bonus-action";btn.textContent="🛡️ Activer l'immunité (2 parties)";btn.addEventListener("click",()=>{btn.disabled=true;fbSetImmunity(state.gameId,state.playerId,2);fbMarkBonusUsed(state.gameId,state.playerId);fbBonusEvent(state.gameId,`🛡️ ${me.name} est immunisé pendant 2 parties !`,"immunity");});actEl.appendChild(btn);}
    }
    if(isImmune){const b=document.createElement("div");b.className="immunity-badge";b.textContent=`🛡️ Immunisé — ${immunity[state.playerId]} partie${immunity[state.playerId]>1?"s":""} restante${immunity[state.playerId]>1?"s":""}`;actEl.appendChild(b);}
  }
  const othersEl=document.getElementById("effects-others");
  if(othersEl){othersEl.innerHTML="";players.filter(p=>p.id!==state.playerId&&p.effect).forEach(p=>{const item=document.createElement("div");item.className="effect-other-item";item.innerHTML=`<span class="effect-other-name">${p.name}</span><span class="effect-other-type ${p.effect.type}">${p.effect.type==="bonus"?"✨":"💀"} ${p.effect.rarity}${(immunity[p.id]||0)>0?" 🛡️":""}</span>`;othersEl.appendChild(item);});}
  // Bouton rejouer — ne reconstruire que si nécessaire
  const c=document.getElementById("vote-container-effects");if(!c)return;
  const count=Object.keys(rVotes).length;const voted=rVotes[state.playerId];
  let countEl=c.querySelector(".vote-count");
  let btn=document.getElementById("btn-vote-effects");
  // Si le bouton existe mais est désactivé alors que le joueur n'a pas voté → vider et reconstruire
  if(btn&&btn.disabled&&!voted){c.innerHTML="";countEl=null;btn=null;}
  if(!countEl){
    c.innerHTML=`<p class="vote-count"></p><button id="btn-vote-effects">${voted?"✅ Rejouer":"✔ Rejouer"}</button>`;
    countEl=c.querySelector(".vote-count");
    btn=document.getElementById("btn-vote-effects");
    if(btn&&voted)btn.disabled=true;
    if(btn&&!voted)btn.addEventListener("click",()=>fbVoteReplay(state.gameId,state.playerId));
  }
  countEl.textContent=`${count} / ${players.length} prêt${count>1?"s":""}`;
  if(btn&&voted&&!btn.disabled){btn.disabled=true;btn.textContent="✅ Rejouer";}
}

function renderMyEffect(effect,isImmune) {
  const card=document.querySelector(".effect-card");const badge=document.getElementById("effect-type-badge");const name=document.getElementById("effect-name");const desc=document.getElementById("effect-description");
  if(effect?.description){card?.setAttribute("data-type",effect.type||"");if(badge){badge.textContent=effect.rarity||"";applyRarityColor(badge,effect.rarity);}if(name)name.textContent=effect.type==="bonus"?"✨ Objectif réussi !":"💀 Objectif raté…";if(desc)desc.textContent=effect.description;}
  else if(isImmune){card?.removeAttribute("data-type");if(badge)badge.textContent="🛡️";if(name)name.textContent="Immunisé !";if(desc)desc.textContent="Tu es protégé contre les malus cette partie.";}
  else{card?.removeAttribute("data-type");if(badge)badge.textContent="—";if(name)name.textContent="Aucun effet";if(desc)desc.textContent="";}
}

// ========================
//  RESTART
// ========================
async function restartGame(immunity={}) {
  transitioning=false;currentPhase=null;lastBonusTs=0;
  clearInterval(ingameTimer);ingameTimer=null;removeOverlay();resetDom();
  const snap=await gameRef(state.gameId).once("value");const g=snap.val();
  const fresh=playersArray(g.players);const imm=g.immunity||{};
  await fbSavePreviousEffects(state.gameId,fresh);
  const newImm={};Object.entries(imm).forEach(([pid,count])=>{if(count>1)newImm[pid]=count-1;});
  // Phase lobby EN PREMIER pour bloquer les overlays
  await gameRef(state.gameId).update({phase:"lobby",votes:{},deliberationVotes:{},verdictVotes:{},replayVotes:{},revealIndex:0,usedChampions:[],randomLane:false,usedBonus:{},bonusEvent:null,immunity:newImm,gameStartTime:null,matchStats:null});
  // Effacer les données joueurs APRÈS
  await Promise.all(fresh.map(p=>playerRef(state.gameId,p.id).update({role:null,success:null,effect:null,lane:null,champion:null})));
}

// ========================
//  LEADERBOARD
// ========================
function renderLeaderboard(players,scores) {
  const sb=document.getElementById("leaderboard-sidebar");const pan=document.getElementById("leaderboard-panel-inner");if(!players.length)return;
  const sorted=[...players].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0));const medals=["🥇","🥈","🥉"];
  const html=sorted.map((p,i)=>{const pts=scores[p.id]||0;const me=p.id===state.playerId;const rank=medals[i]||`${i+1}.`;return `<div class="lb-item${me?' lb-item--me':''}"><span class="lb-rank">${rank}</span><span class="lb-name">${p.name}${me?' <span class="lb-you">(toi)</span>':''}</span><span class="lb-pts">${pts} <span class="lb-pts-label">pts</span></span></div>`;}).join("");
  const content=`<div class="lb-title">🏆 Classement</div>${html}`;
  if(sb)sb.innerHTML=content;if(pan)pan.innerHTML=content;
}
function openLeaderboardPanel()  { document.getElementById("leaderboard-panel")?.classList.add("open"); }
function closeLeaderboardPanel() { document.getElementById("leaderboard-panel")?.classList.remove("open"); }

// ========================
//  VOTE BUTTON GÉNÉRIQUE
// ========================
function renderVoteButton(phase,votes,players,label) {
  const c=document.getElementById("vote-container-"+phase);if(!c)return;
  const count=Object.keys(votes).length;const voted=votes[state.playerId];
  c.innerHTML=`<p class="vote-count">${count} / ${players.length} prêt${count>1?"s":""}</p><button id="btn-vote-${phase}" ${voted?"disabled":""}>${voted?"✅ "+(label||"Prêt"):"✔ "+(label||"Je suis prêt")}</button>`;
  if(!voted)document.getElementById("btn-vote-"+phase)?.addEventListener("click",()=>fbVote(state.gameId,state.playerId));
}

// ========================
//  SIDEBAR
// ========================
function openSidebar() {
  document.getElementById("sidebar")?.classList.add("open");
  document.getElementById("sidebar-backdrop")?.classList.add("open");
}
function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebar-backdrop")?.classList.remove("open");
}

function sbGoTo(page) {
  // Cacher toutes les pages
  document.querySelectorAll(".sb-page").forEach(p => p.style.display = "none");
  // Afficher la page cible
  const target = document.getElementById("sb-page-" + page);
  if(target) target.style.display = "flex";
}

function buildSidebar() {
  const rc = r => ({commun:"#aaa",rare:"#60a5fa",epique:"#c084fc",legendaire:"#f59e0b"})[RARITY_MAP[r]||"commun"];

  const rolesEl = document.getElementById("sb-roles-content");
  if(rolesEl && typeof ROLES !== "undefined" && ROLES.length && !rolesEl.children.length) {
    rolesEl.innerHTML = ROLES.map(r =>
      `<div class="sb-item"><span class="sb-item-name">${r.nom}</span><span class="sb-item-desc">${r.objectif}</span></div>`
    ).join("");
  }

  const effectsEl = document.getElementById("sb-effects-content");
  if(effectsEl && typeof BONUS_POOL !== "undefined" && BONUS_POOL.length && !effectsEl.children.length) {
    let html = `<div class="sb-section-title">✨ Bonus (${BONUS_POOL.length})</div>`;
    html += BONUS_POOL.map(b =>
      `<div class="sb-item"><span class="sb-item-rarity" style="color:${rc(b.rarity)}">${b.rarity}</span><span class="sb-item-desc">${b.text}</span></div>`
    ).join("");
    html += `<div class="sb-section-title" style="margin-top:1rem">💀 Malus (${MALUS_POOL.length})</div>`;
    html += MALUS_POOL.map(m =>
      `<div class="sb-item"><span class="sb-item-rarity" style="color:${rc(m.rarity)}">${m.rarity}</span><span class="sb-item-desc">${m.text}</span></div>`
    ).join("");
    effectsEl.innerHTML = html;
  }
}

// Alias compatibilité
function openRulesPanel()  { openSidebar(); }
function closeRulesPanel() { closeSidebar(); }

// ========================
//  EVENT LISTENERS STATIQUES
// ========================
document.getElementById("btn-rules-home")?.addEventListener("click",openSidebar);
document.getElementById("btn-rules-float")?.addEventListener("click",openSidebar);
document.getElementById("btn-rules-close")?.addEventListener("click",closeSidebar);
document.getElementById("btn-sidebar-open")?.addEventListener("click",openSidebar);
document.getElementById("btn-sidebar-close")?.addEventListener("click",closeSidebar);
document.getElementById("sidebar-backdrop")?.addEventListener("click",closeSidebar);
document.getElementById("btn-lb-float")?.addEventListener("click",openLeaderboardPanel);
document.getElementById("leaderboard-panel")?.addEventListener("click",e=>{if(e.target===document.getElementById("leaderboard-panel"))closeLeaderboardPanel();});
document.getElementById("cb-champion-mode")?.addEventListener("change",e=>{if(!state.gameId)return;fbSetChampionMode(state.gameId,e.target.checked);if(!e.target.checked)fbSetRandomLane(state.gameId,false);});
document.getElementById("cb-random-lane")?.addEventListener("change",e=>{if(!state.gameId)return;fbSetRandomLane(state.gameId,e.target.checked);});

// ========================
//  FOND ANIMÉ CANVAS
// ========================
(function initBackground(){
  const canvas=document.getElementById("bg-canvas");if(!canvas)return;const ctx=canvas.getContext("2d");
  const C={teal:[0,210,255],gold:[201,168,76],purple:[160,40,255],blue:[60,120,255],white:[220,235,255]};
  function rgba(c,a){return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";}
  resize();window.addEventListener("resize",resize);
  const keys=Object.keys(C);
  class Particle{constructor(){this.reset(true);}reset(init){this.x=Math.random()*canvas.width;this.y=init?Math.random()*canvas.height:canvas.height+10;this.speed=Math.random()*0.4+0.1;this.size=Math.random()*2.5+0.5;this.alpha=Math.random()*0.5+0.05;this.drift=(Math.random()-0.5)*0.3;this.pulse=Math.random()*Math.PI*2;this.pulseSpeed=Math.random()*0.02+0.005;this.color=C[keys[Math.floor(Math.random()*keys.length)]];this.type=Math.floor(Math.random()*3);}update(){this.y-=this.speed;this.x+=this.drift;this.pulse+=this.pulseSpeed;if(this.y<-10)this.reset(false);}draw(){const a=this.alpha*(0.7+0.3*Math.sin(this.pulse));ctx.save();ctx.globalAlpha=a;ctx.fillStyle=rgba(this.color,1);ctx.strokeStyle=rgba(this.color,1);ctx.lineWidth=0.8;ctx.translate(this.x,this.y);const s=this.size;if(this.type===0){ctx.beginPath();ctx.arc(0,0,s,0,Math.PI*2);ctx.fill();}else if(this.type===1){ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s,s);ctx.lineTo(-s,s);ctx.closePath();ctx.stroke();}else{ctx.beginPath();ctx.moveTo(-s,0);ctx.lineTo(s,0);ctx.moveTo(0,-s);ctx.lineTo(0,s);ctx.stroke();}ctx.restore();}}
  class Rune{constructor(){this.reset(true);}reset(init){this.x=Math.random()*canvas.width;this.y=init?Math.random()*canvas.height:canvas.height+80;this.sx=(Math.random()-0.5)*0.2;this.sy=-(Math.random()*0.15+0.05);this.rs=(Math.random()-0.5)*0.005;this.size=Math.random()*18+10;this.maxA=Math.random()*0.12+0.04;this.rot=Math.random()*Math.PI*2;this.life=0;this.maxL=Math.random()*800+400;this.color=C[keys[Math.floor(Math.random()*keys.length)]];this.type=Math.floor(Math.random()*4);}update(){this.x+=this.sx;this.y+=this.sy;this.rot+=this.rs;this.life++;const t=this.life/this.maxL;this.alpha=t<0.15?(t/0.15)*this.maxA:t>0.85?((1-t)/0.15)*this.maxA:this.maxA;if(this.life>=this.maxL||this.y<-80)this.reset(false);}draw(){ctx.save();ctx.globalAlpha=this.alpha;ctx.strokeStyle=rgba(this.color,1);ctx.lineWidth=0.8;ctx.translate(this.x,this.y);ctx.rotate(this.rot);const s=this.size;if(this.type===0){ctx.beginPath();for(let i=0;i<6;i++){const a=(i*Math.PI)/3;i===0?ctx.moveTo(Math.cos(a)*s,Math.sin(a)*s):ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);}ctx.closePath();ctx.stroke();}else if(this.type===1){ctx.beginPath();for(let i=0;i<12;i++){const a=(i*Math.PI)/6,r=i%2===0?s:s*0.45;i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.stroke();}else if(this.type===2){for(const r of[s,s*0.65,s*0.3]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(-s,0);ctx.lineTo(s,0);ctx.moveTo(0,-s);ctx.lineTo(0,s);ctx.stroke();}else{ctx.beginPath();for(let i=0;i<5;i++){const a=(i*2*Math.PI)/5-Math.PI/2;i===0?ctx.moveTo(Math.cos(a)*s,Math.sin(a)*s):ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);}ctx.closePath();ctx.stroke();ctx.beginPath();for(let i=0;i<5;i++){const a=(i*2*Math.PI)/5-Math.PI/2,b=((i+2)*2*Math.PI)/5-Math.PI/2;ctx.moveTo(Math.cos(a)*s,Math.sin(a)*s);ctx.lineTo(Math.cos(b)*s,Math.sin(b)*s);}ctx.stroke();}ctx.restore();}}
  class ManaOrb{constructor(){this.reset();}reset(){this.x=Math.random()*canvas.width;this.y=Math.random()*canvas.height;this.r=Math.random()*3+1;this.sx=(Math.random()-0.5)*0.5;this.sy=(Math.random()-0.5)*0.5;this.alpha=Math.random()*0.4+0.05;this.pulse=Math.random()*Math.PI*2;this.ps=Math.random()*0.03+0.01;const pal=[C.teal,C.blue,C.purple];this.color=pal[Math.floor(Math.random()*pal.length)];}update(){this.x+=this.sx;this.y+=this.sy;this.pulse+=this.ps;if(this.x<-10||this.x>canvas.width+10||this.y<-10||this.y>canvas.height+10)this.reset();}draw(){const a=this.alpha*(0.7+0.3*Math.sin(this.pulse));ctx.save();ctx.globalAlpha=a;const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*5);g.addColorStop(0,rgba(this.color,0.9));g.addColorStop(0.3,rgba(this.color,0.4));g.addColorStop(1,rgba(this.color,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(this.x,this.y,this.r*5,0,Math.PI*2);ctx.fill();ctx.restore();}}
  function drawConnections(orbs){const md=120;for(let i=0;i<orbs.length;i++)for(let j=i+1;j<orbs.length;j++){const dx=orbs[i].x-orbs[j].x,dy=orbs[i].y-orbs[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<md){ctx.save();ctx.globalAlpha=(1-d/md)*0.08;ctx.strokeStyle=rgba(C.teal,1);ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(orbs[i].x,orbs[i].y);ctx.lineTo(orbs[j].x,orbs[j].y);ctx.stroke();ctx.restore();}}}
  const particles=Array.from({length:80},()=>new Particle());const runes=Array.from({length:12},()=>new Rune());const orbs=Array.from({length:40},()=>new ManaOrb());
  function draw(){const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);const bg=ctx.createLinearGradient(0,0,W*0.5,H);bg.addColorStop(0,"#060c1a");bg.addColorStop(0.4,"#050810");bg.addColorStop(0.7,"#040610");bg.addColorStop(1,"#070510");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);const gt=ctx.createRadialGradient(W*0.5,-H*0.1,0,W*0.5,-H*0.1,H*0.7);gt.addColorStop(0,"rgba(0,210,255,0.12)");gt.addColorStop(0.5,"rgba(0,150,200,0.06)");gt.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=gt;ctx.fillRect(0,0,W,H);const gg=ctx.createRadialGradient(-W*0.1,H*1.1,0,-W*0.1,H*1.1,H*0.7);gg.addColorStop(0,"rgba(201,168,76,0.14)");gg.addColorStop(0.5,"rgba(160,120,40,0.07)");gg.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=gg;ctx.fillRect(0,0,W,H);const gp=ctx.createRadialGradient(W*1.1,H*1.05,0,W*1.1,H*1.05,H*0.65);gp.addColorStop(0,"rgba(140,40,255,0.12)");gp.addColorStop(0.5,"rgba(100,20,200,0.06)");gp.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=gp;ctx.fillRect(0,0,W,H);const gv=ctx.createRadialGradient(W*0.5,H*0.5,H*0.2,W*0.5,H*0.5,H*0.85);gv.addColorStop(0,"rgba(0,0,0,0)");gv.addColorStop(1,"rgba(2,4,12,0.75)");ctx.fillStyle=gv;ctx.fillRect(0,0,W,H);orbs.forEach(o=>{o.update();o.draw();});drawConnections(orbs);runes.forEach(r=>{r.update();r.draw();});particles.forEach(p=>{p.update();p.draw();});requestAnimationFrame(draw);}
  draw();
})();

// ========================
//  INIT
// ========================
showView("home");
