
let scores = {};

document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.includes('admin')) {
    fetch("resultats.json")
      .then((response) => {
        if (!response.ok) throw new Error("Erreur de chargement des scores");
        return response.json();
      })
      .then((data) => {
        scores = data;
        renderResults();
        renderRanking();
        renderFinales();
        renderFinalScores();
      })
      .catch((error) => {
        console.error("Erreur:", error);
        scores = {}; // fallback
        renderResults();
        renderRanking();
        renderFinales();
        renderFinalScores();
      });
  } else {
    scores = {}; // scores vides par défaut dans admin
  }
});

function saveScores(scores) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scores, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "resultats.json");
  dlAnchorElem.click();
}

function loadScores() {
  return scores;
}


const players = ["Clément", "André", "Michaël", "Guillaume", "Mica", "Yohan"];

document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.includes('admin')) {
    renderResults();
    renderRanking();
    renderFinales();
    renderFinalScores();
  }
});



;
}

function submitMatch(id, p1, p2) {
  const sets = [];
  for (let i = 1; i <= 3; i++) {
    const s1 = parseInt(document.getElementById(id + `_set${i}p1`).value, 10);
    const s2 = parseInt(document.getElementById(id + `_set${i}p2`).value, 10);
    if (!isNaN(s1) && !isNaN(s2)) sets.push([s1, s2]);
  }

  const p1Wins = sets.filter(s => s[0] > s[1]).length;
  const p2Wins = sets.filter(s => s[0] < s[1]).length;

  if (p1Wins < 2 && p2Wins < 2) {
    alert("Aucun joueur n'a encore gagné 2 sets !");
    return;
  }

  const scores = loadScores();
  scores[id] = { p1, p2, sets };
  saveScores(scores);
  alert("Score enregistré !");
}

function resetTournament() {
  if (confirm("Confirmer la réinitialisation de tous les scores ?")) {
    localStorage.removeItem("tennis_scores");
    location.reload();
  }
}

function getAllMatches() {
  const scores = loadScores();
  return Object.entries(scores).map(([_, val]) => val);
}

function determineWinner(match) {
  let w1 = 0, w2 = 0;
  for (const [s1, s2] of match.sets) {
    if (s1 > s2) w1++;
    else if (s2 > s1) w2++;
  }
  return w1 === 2 ? match.p1 : w2 === 2 ? match.p2 : null;
}

function renderResults() {
  const table = document.getElementById("resultsTable");
  const matches = getAllMatches();
  table.innerHTML = "<tr><th>Joueur 1</th><th>Joueur 2</th><th>Sets</th></tr>";
  matches.forEach(m => {
    const score = m.sets.map(s => s.join('-')).join(', ');
    table.innerHTML += `<tr><td>${m.p1}</td><td>${m.p2}</td><td>${score}</td></tr>`;
  });
}

function renderRanking() {
  const stats = {};
  const matchStats = {};
  players.forEach(p => {
    stats[p] = { points: 0, played: 0 };
    matchStats[p] = { sets: [0, 0], jeux: [0, 0] };
  });

  getAllMatches().forEach(m => {
    const winner = determineWinner(m);
    if (!winner) return;
    const loser = winner === m.p1 ? m.p2 : m.p1;
    stats[winner].points += 3;
    stats[winner].played++;
    stats[loser].played++;

    m.sets.forEach(([s1, s2]) => {
      matchStats[m.p1].sets[1]++;
      matchStats[m.p2].sets[1]++;
      matchStats[m.p1].jeux[0] += s1;
      matchStats[m.p2].jeux[0] += s2;
      matchStats[m.p1].jeux[1] += s1 + s2;
      matchStats[m.p2].jeux[1] += s1 + s2;
      if (s1 > s2) matchStats[m.p1].sets[0]++;
      else matchStats[m.p2].sets[0]++;
    });
  });

  const enhanced = Object.entries(stats).map(([player, stat]) => {
    const sets = matchStats[player].sets;
    const jeux = matchStats[player].jeux;
    const setsPct = sets[1] ? sets[0] / sets[1] : 0;
    const jeuxPct = jeux[1] ? jeux[0] / jeux[1] : 0;
    return [player, stat, sets, setsPct, jeux, jeuxPct];
  });

  enhanced.sort((a, b) => {
    if (b[1].points !== a[1].points) return b[1].points - a[1].points;
    if (b[3] !== a[3]) return b[3] - a[3]; // % sets
    if (b[5] !== a[5]) return b[5] - a[5]; // % jeux
    return 0;
  });

  const table = document.getElementById("rankingTable");
  table.innerHTML = `
    <tr>
      <th>Joueur</th>
      <th>Points</th>
      <th>Matchs joués</th>
      <th>Sets gagnés / joués</th>
      <th>% Sets</th>
      <th>Jeux gagnés / joués</th>
      <th>% Jeux</th>
    </tr>`;
  enhanced.forEach(([player, stat, sets, setsPct, jeux, jeuxPct]) => {
    table.innerHTML += `<tr>
      <td>${player}</td>
      <td>${stat.points}</td>
      <td>${stat.played}</td>
      <td>${sets[0]} / ${sets[1]}</td>
      <td>${(setsPct * 100).toFixed(1)}%</td>
      <td>${jeux[0]} / ${jeux[1]}</td>
      <td>${(jeuxPct * 100).toFixed(1)}%</td>
    </tr>`;
  });
}

function renderFinales() {
  const stats = {};
  players.forEach(p => stats[p] = { points: 0 });

  getAllMatches().forEach(m => {
    const winner = determineWinner(m);
    if (!winner) return;
    stats[winner].points += 3;
  });

  const sorted = Object.entries(stats).sort((a, b) => b[1].points - a[1].points).map(e => e[0]);
  const [f1, f2, p1, p2] = sorted;
  document.getElementById("finaleLabel").textContent = `Finale : ${f1} vs ${f2}`;
  document.getElementById("petiteFinaleLabel").textContent = `Petite Finale : ${p1} vs ${p2}`;
}

function renderFinalScores() {
  // Placeholder future extension
}