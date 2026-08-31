// Odkaz na publikovanou Google Tabulku (CSV)
const PVP_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?output=csv';

// Historičtí šampioni
const SEASON_WINNERS = {
    "Honza": "👑 S1"
};

let currentMode = 'pvp';
let globalPvpData = [];
let globalPveData = [];

// Tvoje původní adresy na obrázky draků z ImgBB
function getLeague(points) {
    if (points >= 1000) {
        return { 
            name: 'LEGENDÁRNÍ LIGA', 
            image: 'https://i.ibb.co/0yQv8Zp/blue-dragon.png' 
        };
    } else {
        return { 
            name: 'DRAČÍ MAGIE', 
            image: 'https://i.ibb.co/L5B7h1N/pink-dragon.png'
        };
    }
}

async function fetchData() {
    try {
        const response = await fetch(PVP_SHEET_URL);
        const data = await response.text();
        parseCSV(data);
    } catch (error) {
        console.error('Chyba při načítání dat:', error);
        document.getElementById('leaderboard-body').innerHTML = `
            <tr>
                <td colspan="8" style="color: #ef4444; text-align: center; padding: 20px;">
                    ⚠️ Nepodařilo se načíst CSV data. Zkontroluj připojení.
                </td>
            </tr>
        `;
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    globalPvpData = [];
    let totalGamesCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Rozdělení CSV řádku
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));

        // Hledáme sloupec, ve kterém je jméno hráče (přeskočíme datumy a záhlaví)
        let nameIndex = -1;
        for (let c = 0; c < cols.length; c++) {
            const val = cols[c];
            if (val && !val.toLowerCase().includes('hráč') && !val.toLowerCase().includes('jméno') && !/^\d{1,2}\.\d{1,2}\.\d{4}/.test(val)) {
                nameIndex = c;
                break;
            }
        }

        if (nameIndex === -1) continue;

        const name = cols[nameIndex];
        
        // Ignorovat neplatné řádky nebo JS artefakty
        if (!name || name.includes('function') || name.length > 25) continue;

        // Načtení číselných statistik
        const wins = parseInt(cols[nameIndex + 1]) || 0;
        const top3 = parseInt(cols[nameIndex + 2]) || 0;
        const games = parseInt(cols[nameIndex + 3]) || 0;
        const losses = parseInt(cols[nameIndex + 4]) || 0;

        totalGamesCount += games;

        const winrate = games > 0 ? Math.round((wins / games) * 100) + ' %' : '0 %';
        const points = (wins * 100) + (top3 * 30);
        const league = getLeague(points);

        globalPvpData.push({
            name, wins, top3, games, losses, winrate, points, league
        });
    }

    // Řazení podle výher a bodů
    globalPvpData.sort((a, b) => b.wins - a.wins || b.points - a.points);

    if (globalPvpData.length > 0) {
        document.getElementById('top-player').textContent = globalPvpData[0].name;
    } else {
        document.getElementById('top-player').textContent = '-';
    }

    document.getElementById('total-games').textContent = totalGamesCount;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    const players = currentMode === 'pvp' ? globalPvpData : globalPveData;

    if (players.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Žádní hráči k zobrazení.</td></tr>`;
        return;
    }

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

        const winnerBadge = SEASON_WINNERS[p.name] 
            ? `<span style="margin-left: 6px; filter: drop-shadow(0 0 4px rgba(241,196,15,0.8));" title="Vítěz Sezóny 1">${SEASON_WINNERS[p.name]}</span>` 
            : '';

        const tr = document.createElement('tr');

        if (currentMode === 'pvp') {
            tr.innerHTML = `
                <td class="${rankClass}">${medal}</td>
                <td>
                    <a href="player.html?name=${encodeURIComponent(p.name)}" class="player-link">
                        <strong>${p.name}</strong> ${winnerBadge}
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
                <td><strong>${p.name}</strong> ${winnerBadge}</td>
                <td>${p.map || '-'}</td>
                <td><strong>${p.score || 0}</strong></td>
                <td class="league-cell">
                    <img src="${p.league.image}" class="league-image" alt="${p.league.name}">
                    <div>${p.league.name}</div>
                    <small>⭐ ${p.score || 0} bodů</small>
                </td>
            `;
        }

        tbody.appendChild(tr);
    });
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('btn-pvp').classList.toggle('active', mode === 'pvp');
    document.getElementById('btn-pve').classList.toggle('active', mode === 'pve');
    renderTable();
}

document.addEventListener('DOMContentLoaded', fetchData);
