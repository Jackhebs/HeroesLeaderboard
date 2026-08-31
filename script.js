// Odkazy na Google Sheets CSV (uprav podle svých URL, pokud máš jiné)
const PVP_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ/pub?output=csv'; 

// Seznam historických šampionů (Jméno hráče : Text odznaku)
const SEASON_WINNERS = {
    "Honza": "👑 S1" // Honza má trvalý odznak Šampiona Sezóny 1
};

let currentMode = 'pvp';
let globalPvpData = [];
let globalPveData = [];

// Určení ligy a draků podle bodů
function getLeague(points) {
    if (points >= 1000) {
        return { 
            name: 'LEGENDÁRNÍ LIGA', 
            image: 'https://i.ibb.co/0yQv8Zp/blue-dragon.png' // Uprav dle svých obrázků
        };
    } else {
        return { 
            name: 'DRAČÍ MAGIE', 
            image: 'https://i.ibb.co/L5B7h1N/pink-dragon.png'
        };
    }
}

// Načtení dat z Google Sheets
async function fetchData() {
    try {
        const response = await fetch(PVP_SHEET_URL);
        const data = await response.text();
        parseCSV(data);
    } catch (error) {
        console.error('Chyba při načítání dat:', error);
        document.getElementById('leaderboard-body').innerHTML = `
            <tr><td colspan="8" style="color: #ef4444; text-align: center;">Chyba při načítání dat z tabulky.</td></tr>
        `;
    }
}

// Zpracování CSV dat
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    globalPvpData = [];
    let totalGamesCount = 0;

    // Přeskočíme záhlaví (index 0)
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        if (cols.length < 5 || !cols[0]) continue;

        const name = cols[0];
        const wins = parseInt(cols[1]) || 0;
        const top3 = parseInt(cols[2]) || 0;
        const games = parseInt(cols[3]) || 0;
        const losses = parseInt(cols[4]) || 0;

        totalGamesCount += games;

        // Výpočet Winrate
        const winrate = games > 0 ? Math.round((wins / games) * 100) + ' %' : '0 %';
        
        // Výpočet bodů pro ligu (např. výhra = 100b, top3 = 30b)
        const points = (wins * 100) + (top3 * 30);
        const league = getLeague(points);

        globalPvpData.push({
            name, wins, top3, games, losses, winrate, points, league
        });
    }

    // Seřazení podle výher (případně bodů)
    globalPvpData.sort((a, b) => b.wins - a.wins || b.points - a.points);

    // Aktualizace horních karet
    if (globalPvpData.length > 0) {
        document.getElementById('top-player').textContent = globalPvpData[0].name;
    }
    document.getElementById('total-games').textContent = totalGamesCount;

    // Vykreslení tabulky
    renderTable();
}

// Vykreslení tabulky na základě aktuálního režimu
function renderTable() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    const players = currentMode === 'pvp' ? globalPvpData : globalPveData;

    if (players.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Žádná data k zobrazení.</td></tr>`;
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

        // Kontrola, zda má hráč historický odznak šampiona
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

// Přepínání mezi PvP a PvE
function switchMode(mode) {
    currentMode = mode;
    document.getElementById('btn-pvp').classList.toggle('active', mode === 'pvp');
    document.getElementById('btn-pve').classList.toggle('active', mode === 'pve');
    renderTable();
}

// Spuštění načítání po načtení stránky
document.addEventListener('DOMContentLoaded', fetchData);
