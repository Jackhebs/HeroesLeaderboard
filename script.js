const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';

// Výběr ikony podle bodů (přesně podle tvého vzorce v Google Sheets)
function getLeagueBadgeByPoints(points) {
    const pts = Number(points) || 0;

    if (pts >= 3000) {
        return '<img src="images/Creature_Azure_Dragon.gif" class="league-icon glow-gold" title="🐉 Legendární liga (3000+ b.)" alt="Legendární drak">';
    } 
    else if (pts >= 2500) {
        return '<img src="images/Creature_Archangel.gif" class="league-icon glow-gold" title="🪽 Archandělská liga (2500+ b.)" alt="Archanděl">';
    } 
    else if (pts >= 2000) {
        return '<img src="images/Creature_Faerie_Dragon.gif" class="league-icon glow-purple" title="✨ Dračí magie (2000+ b.)" alt="Kouzelný drak">';
    }
    else if (pts >= 1500) {
        return '<img src="images/Creature_Troll.gif" class="league-icon glow-silver" title="🪓 Monstrózní liga (1500+ b.)" alt="Troll">';
    }
    else if (pts >= 1000) {
        return '<img src="images/Creature_Royal_Griffin.gif" class="league-icon glow-blue" title="🦅 Královská liga (1000+ b.)" alt="Grif">';
    } 
    else if (pts >= 500) {
        return '<img src="images/Creature_Pikeman.gif" class="league-icon glow-silver" title="🛡️ Strážcova liga (500+ b.)" alt="Kopijník">';
    } 
    else {
        return '<img src="images/Creature_Peasant.gif" class="league-icon glow-peasant" title="🥔 Sedlákova liga (<500 b.)" alt="Sedlák">';
    }
}

async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');

    try {
        const response = await fetch(CSV_URL);

        if (!response.ok) {
            throw new Error('Nelze načíst data ze serveru');
        }

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);

        tbody.innerHTML = '';
        let players = [];
        let totalGamesFromSheet = null;
        const delimiter = text.includes(';') ? ';' : ',';

        for (let i = 0; i < lines.length; i++) {
            const cols = lines[i]
                .split(delimiter)
                .map(c => c.replace(/^"|"$/g, '').trim());

            if (!cols[0]) continue;

            const name = cols[0];

            // Přeskočení hlavičky tabulky
            if (['HRÁČ', 'Hráč', 'Jméno', 'NAME', '#'].includes(name)) {
                continue;
            }

            const wins = parseInt(cols[1]) || 0;
            const top3 = parseInt(cols[2]) || 0;
            const games = parseInt(cols[3]) || 0;
            const losses = parseInt(cols[4]) || 0;

            let winrate = cols[5] || '0 %';

            if (!winrate.includes('%')) {
                const num = parseFloat(winrate.replace(',', '.'));
                winrate = isNaN(num)
                    ? '0 %'
                    : (num <= 1 && num > 0 ? Math.round(num * 100) : Math.round(num)) + ' %';
            }

            // NAČTENÍ BODŮ ze sloupce G (index 6)
            // DŮLEŽITÉ: Vyčištění mezer (z "2 500" na "2500"), teček i čárek
            const rawPoints = cols[6] ? cols[6].replace(/\s+/g, '').replace(/\./g, '').replace(',', '.') : '0';
            const points = parseInt(rawPoints) || 0;

            // Pokus o přečtení celkového počtu zápasů ze sloupce J (index 9) v 1. řádku s daty
            if (totalGamesFromSheet === null && cols[9]) {
                const parsedTotal = parseInt(cols[9].replace(/\s+/g, ''));
                if (!isNaN(parsedTotal) && parsedTotal > 0) {
                    totalGamesFromSheet = parsedTotal;
                }
            }

            players.push({
                name,
                wins,
                top3,
                games,
                losses,
                winrate,
                points
            });
        }

        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Žádní hráči v tabulce.</td></tr>';
            return;
        }

        // Řazení podle výher
        players.sort((a, b) => b.wins - a.wins);

        // Vykreslení hráčů do tabulky
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

            const badgeHtml = getLeagueBadgeByPoints(p.points);

            const tr = document.createElement('tr');

            tr.innerHTML = `
            <td class="${rankClass}">${medal}</td>
            <td><strong>${p.name}</strong></td>
            <td>${p.wins}</td>
            <td>${p.top3}</td>
            <td>${p.games}</td>
            <td>${p.losses}</td>
            <td><span class="badge-winrate">${p.winrate}</span></td>
            <td>${badgeHtml}</td>
            `;

            tbody.appendChild(tr);
        });

        // 1. Nastavení krále
        document.getElementById('top-player').innerText = players[0].name;

        // 2. Nastavení celkového počtu odehraných zápasů (pokud je v buňce J2, vezme ji; jinak vezme reálnou hodnotu)
        const finalTotalGames = totalGamesFromSheet !== null 
            ? totalGamesFromSheet 
            : Math.max(...players.map(p => p.games));

        document.getElementById('total-games').innerText = finalTotalGames;

    } catch (err) {
        console.error('Chyba načítání:', err);
        tbody.innerHTML = '<tr><td colspan="8" style="color:#ef4444;">Chyba při načítání CSV dat.</td></tr>';
    }
}

loadLeaderboard();
