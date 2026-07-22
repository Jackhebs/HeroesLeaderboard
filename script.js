const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';

// Funkce pro výběr ikony podle BODŮ (včetně Azure Dragona a Trolla)
function getLeagueBadgeByPoints(points) {
    const pts = Number(points) || 0;

    // 1. Nejvyšší liga: 500+ bodů (Azure Dragon / Azurový drak)
    if (pts >= 500) {
        return '<img src="images/Creature_Azure_Dragon.gif" class="league-icon glow-gold" title="Azurová liga (500+ b.)" alt="Azurový drak">';
    }
    // 2. 400 - 499 bodů (Archanděl)
    else if (pts >= 400) {
        return '<img src="images/Creature_Archangel.gif" class="league-icon glow-gold" title="Liga Archandělů (400+ b.)" alt="Archanděl">';
    } 
    // 3. 300 - 399 bodů (Faerie Dragon)
    else if (pts >= 300) {
        return '<img src="images/Creature_Faerie_Dragon.gif" class="league-icon glow-purple" title="Pohádková dračí liga (300+ b.)" alt="Pohádkový drak">';
    }
    // 4. 200 - 299 bodů (Royal Griffin)
    else if (pts >= 200) {
        return '<img src="images/Creature_Royal_Griffin.gif" class="league-icon glow-blue" title="Grifí liga (200+ b.)" alt="Grif">';
    } 
    // 5. 150 - 199 bodů (Troll)
    else if (pts >= 150) {
        return '<img src="images/Creature_Troll.gif" class="league-icon glow-silver" title="Trolí liga (150+ b.)" alt="Troll">';
    }
    // 6. 100 - 149 bodů (Pikeman)
    else if (pts >= 100) {
        return '<img src="images/Creature_Pikeman.gif" class="league-icon glow-silver" title="Kopijnická liga (100+ b.)" alt="Kopijník">';
    } 
    // 7. Pod 100 bodů (Peasant)
    else {
        return '<img src="images/Creature_Peasant.gif" class="league-icon glow-peasant" title="Sedlákova liga (<100 b.)" alt="Sedlák">';
    }
}

async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');

    try {
        const response = await fetch(CSV_URL);

        if (!response.ok) {
            throw new Error('Chyba při stahování tabulky. Status: ' + response.status);
        }

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);

        if (lines.length < 2) {
            throw new Error('Tabulka je prázdná nebo nemá žádné řádky s daty.');
        }

        tbody.innerHTML = '';
        
        // Detekce oddělovače (středník nebo čárka)
        const delimiter = text.includes(';') ? ';' : ',';

        // 1. Načtení hlavičky a nalezení pozic jednotlivých sloupců
        const headerCols = lines[0].split(delimiter).map(c => c.replace(/^"|"$/g, '').trim().toUpperCase());
        
        const idxName = headerCols.findIndex(c => c.includes('HRÁČ') || c.includes('JMÉNO') || c.includes('NAME'));
        const idxWins = headerCols.findIndex(c => c.includes('VÝHRY') || c.includes('1ST') || c.includes('WIN'));
        const idxTop3 = headerCols.findIndex(c => c.includes('BEDNA') || c.includes('TOP 3') || c.includes('TOP3'));
        const idxGames = headerCols.findIndex(c => c.includes('ZÁPASY') || c.includes('HRY') || c.includes('GAMES'));
        const idxLosses = headerCols.findIndex(c => c.includes('PROHRY') || c.includes('LOSS'));
        const idxWinrate = headerCols.findIndex(c => c.includes('WINRATE') || c.includes('%'));
        const idxPoints = headerCols.findIndex(c => c.includes('BOD') || c.includes('POINT') || c.includes('PTS'));

        let players = [];

        // 2. Zpracování řádků s hráči
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());

            // Pokud je řádek prázdný, přeskočíme ho
            if (!cols || cols.length === 0 || !cols[idxName !== -1 ? idxName : 0]) continue;

            const name = cols[idxName !== -1 ? idxName : 0];
            const wins = parseInt(cols[idxWins !== -1 ? idxWins : 1]) || 0;
            const top3 = parseInt(cols[idxTop3 !== -1 ? idxTop3 : 2]) || 0;
            const games = parseInt(cols[idxGames !== -1 ? idxGames : 3]) || 0;
            const losses = parseInt(cols[idxLosses !== -1 ? idxLosses : 4]) || 0;

            let rawWinrate = idxWinrate !== -1 && cols[idxWinrate] ? cols[idxWinrate] : '0 %';
            if (!rawWinrate.includes('%')) {
                const num = parseFloat(rawWinrate.replace(',', '.'));
                rawWinrate = isNaN(num) ? '0 %' : (num <= 1 && num > 0 ? Math.round(num * 100) : Math.round(num)) + ' %';
            }

            // Výpočet bodů
            const rawPoints = idxPoints !== -1 && cols[idxPoints] ? cols[idxPoints] : '0';
            const cleanPoints = rawPoints.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
            const points = parseInt(cleanPoints) || 0;

            players.push({ name, wins, top3, games, losses, winrate: rawWinrate, points });
        }

        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">V tabulce nebyli nalezeni žádní hráči.</td></tr>';
            return;
        }

        // Seřazení hráčů podle výher
        players.sort((a, b) => b.wins - a.wins);

        // Vykreslení do HTML
        players.forEach((p, index) => {
            let rankClass = '';
            let medal = `${index + 1}.`;

            if (index === 0) { rankClass = 'rank-1'; medal = '🥇 1.'; }
            else if (index === 1) { rankClass = 'rank-2'; medal = '🥈 2.'; }
            else if (index === 2) { rankClass = 'rank-3'; medal = '🥉 3.'; }

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

        // Aktualizace horních karet
        document.getElementById('top-player').innerText = players[0].name;
        const totalGames = players.reduce((sum, p) => sum + p.games, 0);
        document.getElementById('total-games').innerText = totalGames;

    } catch (err) {
        console.error('Chyba načítání:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="color:#ef4444; font-weight:bold; text-align:center;">
                    Chyba při načítání CSV dat. Podívej se do konzole (F12).
                </td>
            </tr>
        `;
    }
}

loadLeaderboard();
