const PVP_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';
const PVE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=107765162&single=true&output=csv';

let currentMode = 'pvp'; // Výchozí režim

function getLeague(points) {
    if (points >= 1500) {
        return {
            name: "🐉 Legendární liga",
            image: "images/Creature_Azure_Dragon.gif"
        };
    }
    if (points >= 800) {
        return {
            name: "🪽 Archandělská liga",
            image: "images/Creature_Archangel.gif"
        };
    }
    if (points >= 500) {
        return {
            name: "✨ Dračí magie",
            image: "images/Creature_Faerie_Dragon.gif"
        };
    }
    if (points >= 300) {
        return {
            name: "🦅 Královská liga",
            image: "images/Creature_Royal_Griffin.gif"
        };
    }
    if (points >= 200) {
        return {
            name: "🪓 Monstrózní liga",
            image: "images/Creature_Troll.gif"
        };
    }
    if (points >= 100) {
        return {
            name: "🛡️ Strážcova liga",
            image: "images/Creature_Pikeman.gif"
        };
    }
    return {
        name: "🥔 Sedlákova liga",
        image: "images/Creature_Peasant.gif"
    };
}

async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    const theadRow = document.querySelector('table thead tr');
    const activeUrl = currentMode === 'pvp' ? PVP_CSV_URL : PVE_CSV_URL;

    // Dynamická změna hlavičky tabulky podle režimu
    if (currentMode === 'pvp') {
        theadRow.innerHTML = `
            <th>#</th>
            <th>Hráč</th>
            <th>Výhry (1st)</th>
            <th>Bedna (TOP 3)</th>
            <th>Zápasy</th>
            <th>Prohry</th>
            <th>Winrate</th>
            <th>Liga</th>
        `;
    } else {
        theadRow.innerHTML = `
            <th>#</th>
            <th>Hráč</th>
            <th>Mapa</th>
            <th>Score</th>
            <th>Liga</th>
        `;
    }

    try {
        const response = await fetch(activeUrl);

        if (!response.ok) {
            throw new Error('Nelze načíst data');
        }

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);
        tbody.innerHTML = '';

        let players = [];
        const delimiter = text.includes(';') ? ';' : ',';

        for (let i = 0; i < lines.length; i++) {
            const cols = lines[i]
                .split(delimiter)
                .map(c => c.replace(/^"|"$/g,'').trim());

            if (!cols[0]) continue;

            const name = cols[0];

            if ([
                'HRÁČ',
                'Hráč',
                'Jméno',
                'NAME',
                '#'
            ].includes(name)) {
                continue;
            }

            if (currentMode === 'pvp') {
                const wins = parseInt(cols[1]) || 0;
                const top3 = parseInt(cols[2]) || 0;
                const games = parseInt(cols[3]) || 0;
                const losses = parseInt(cols[4]) || 0;

                let winrate = cols[5] || '0 %';
                if (!winrate.includes('%')) {
                    const num = parseFloat(winrate.replace(',', '.'));
                    winrate = isNaN(num) ? '0 %' : (num <= 1 && num > 0 ? Math.round(num * 100) : Math.round(num)) + ' %';
                }

                const rawPoints = cols[7] || '0';
                const points = parseInt(rawPoints.replace(/\D/g, '')) || 0;
                const league = getLeague(points);

                players.push({
                    name,
                    wins,
                    top3,
                    games,
                    losses,
                    winrate,
                    points,
                    league
                });
            } else {
                // Singleplayer režim (Mapa = sloupec D / index 3, Score = sloupec E / index 4)
                const map = cols[3] || '-';
                const rawScore = cols[4] || '0';
                const score = parseInt(rawScore.replace(/\D/g, '')) || 0;
                const league = getLeague(score);

                players.push({
                    name,
                    map,
                    score,
                    points: score, // pro řazení
                    league
                });
            }
        }

        if (players.length === 0) {
            const colspanVal = currentMode === 'pvp' ? 8 : 5;
            tbody.innerHTML = `
                <tr>
                <td colspan="${colspanVal}">
                Žádní hráči v tabulce.
                </td>
                </tr>
            `;
            document.getElementById('top-player').innerText = '-';
            document.getElementById('total-games').innerText = '0';
            return;
        }

        players.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            if (currentMode === 'pvp') {
                return b.wins - a.wins;
            }
            return 0;
        });

        players.forEach((p, index) => {
            let rankClass = '';
            let medal = `${index + 1}.`;

            if (index === 0) {
                rankClass = 'rank-1';
                medal = '🥇 1.';
            } else if (index === 1) {
                rankClass = 'rank-2';
                medal = '🥈 2.';
            } else if (index === 2) {
                rankClass = 'rank-3';
                medal = '🥉 3.';
            }

            const tr = document.createElement('tr');

            if (currentMode === 'pvp') {
                tr.innerHTML = `
                    <td class="${rankClass}">${medal}</td>
                    <td>
                        <a href="player.html?name=${encodeURIComponent(p.name)}" class="player-link">
                            <strong>${p.name}</strong>
                        </a>
                    </td>
                    <td>${p.wins}</td>
                    <td>${p.top3}</td>
                    <td>${p.games}</td>
                    <td>${p.losses}</td>
                    <td>
                        <span class="badge-winrate">${p.winrate}</span>
                    </td>
                    <td class="league-cell">
                        <img src="${p.league.image}" class="league-image" alt="${p.league.name}">
                        <div>${p.league.name}</div>
                        <small>⭐ ${p.points} bodů</small>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td class="${rankClass}">${medal}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.map}</td>
                    <td><strong>${p.score}</strong></td>
                    <td class="league-cell">
                        <img src="${p.league.image}" class="league-image" alt="${p.league.name}">
                        <div>${p.league.name}</div>
                        <small>⭐ ${p.score} bodů</small>
                    </td>
                `;
            }

            tbody.appendChild(tr);
        });

        document.getElementById('top-player').innerText = players[0].name;

        if (currentMode === 'pvp') {
            const totalGames = players.reduce((sum, p) => sum + p.wins, 0);
            document.getElementById('total-games').innerText = totalGames;
        } else {
            document.getElementById('total-games').innerText = players.length;
        }

    } catch (err) {
        console.error('Chyba načítání:', err);
        const colspanVal = currentMode === 'pvp' ? 8 : 5;
        tbody.innerHTML = `
            <tr>
            <td colspan="${colspanVal}" style="color:#ef4444;">
            Chyba při načítání CSV dat.
            </td>
            </tr>
        `;
    }
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('btn-pvp').classList.remove('active');
    document.getElementById('btn-pve').classList.remove('active');

    if (mode === 'pvp') {
        document.getElementById('btn-pvp').classList.add('active');
    } else {
        document.getElementById('btn-pve').classList.add('active');
    }

    loadLeaderboard();
}

loadLeaderboard();
