const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';

function getLeagueBadgeByPoints(points) {
    const pts = Number(points) || 0;

    if (pts >= 3000) {
        return '<img src="images/Creature_Azure_Dragon.gif" class="league-icon glow-azure" title="🐉 Legendární liga (3000+ b.)" alt="Legendární drak">';
    } 
    else if (pts >= 2500) {
        return '<img src="images/Creature_Archangel.gif" class="league-icon glow-gold" title="🪽 Archandělská liga (2500+ b.)" alt="Archanděl">';
    } 
    else if (pts >= 2000) {
        return '<img src="images/Creature_Faerie_Dragon.gif" class="league-icon glow-purple" title="✨ Dračí magie (2000+ b.)" alt="Kouzelný drak">';
    }
    else if (pts >= 1500) {
        return '<img src="images/Creature_Troll.gif" class="league-icon glow-red" title="🪓 Monstrózní liga (1500+ b.)" alt="Troll">';
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
        const response = await fetch(CSV_URL + '&_t=' + new Date().getTime()); // Zabránění mezipaměti

        if (!response.ok) {
            throw new Error('Nelze načíst data ze serveru');
        }

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);

        tbody.innerHTML = '';
        let players = [];
        const delimiter = text.includes(';') ? ';' : ',';

        // 1. Zjištění indexů sloupců z hlavičky
        const headerCols = lines[0].split(delimiter).map(c => c.replace(/^"|"$/g, '').trim().toUpperCase());
        
        let idxName = headerCols.findIndex(c => c.includes('HRÁČ') || c.includes('JMÉNO') || c.includes('NAME'));
        let idxWins = headerCols.findIndex(c => c.includes('VÝHRY') || c.includes('1ST'));
        let idxTop3 = headerCols.findIndex(c => c.includes('BEDNA') || c.includes('TOP 3'));
        let idxGames = headerCols.findIndex(c => c.includes('ZÁPASY') || c.includes('HRY'));
        let idxLosses = headerCols.findIndex(c => c.includes('PROHRY') || c.includes('LOSS'));
        let idxWinrate = headerCols.findIndex(c => c.includes('WINRATE') || c.includes('%'));
        let idxPoints = headerCols.findIndex(c => c.includes('BOD') || c.includes('PTS'));

        // Fallbacky, pokud hlavička neodpovídá přesně
        if (idxName === -1) idxName = 0;
        if (idxWins === -1) idxWins = 1;
        if (idxTop3 === -1) idxTop3 = 2;
        if (idxGames === -1) idxGames = 3;
        if (idxLosses === -1) idxLosses = 4;
        if (idxWinrate === -1) idxWinrate = 5;
        if (idxPoints === -1) idxPoints = 6; // Sloupec G

        let totalGamesFromHeader = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());

            if (!cols[idxName]) continue;

            const name = cols[idxName];

            // Pokud řádek obsahuje "CELKEM ZÁPASŮ" nebo podobný souhrn
            if (name.toUpperCase().includes('CELKEM') || name.toUpperCase().includes('TOTAL')) {
                const foundNum = cols.map(c => parseInt(c.replace(/\D/g, ''))).find(n => !isNaN(n) && n > 0);
                if (foundNum) totalGamesFromHeader = foundNum;
                continue;
            }

            const wins = parseInt(cols[idxWins]) || 0;
            const top3 = parseInt(cols[idxTop3]) || 0;
            const games = parseInt(cols[idxGames]) || 0;
            const losses = parseInt(cols[idxLosses]) || 0;

            let winrate = cols[idxWinrate] || '0 %';
            if (!winrate.includes('%')) {
                const num = parseFloat(winrate.replace(',', '.'));
                winrate = isNaN(num) ? '0 %' : (num <= 1 && num > 0 ? Math.round(num * 100) : Math.round(num)) + ' %';
            }

            // Očištění BODŮ ode všech nečíselných znaků (kromě číslic)
            const rawPoints = cols[idxPoints] || '0';
            const cleanPoints = rawPoints.replace(/\D/g, ''); // Vymaže mezery, tečky, text
            const points = parseInt(cleanPoints) || 0;

            players.push({ name, wins, top3, games, losses, winrate, points });
        }

        console.log('Načtení hráči a jejich body:', players); // Zkontroluj v F12 -> Console

        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Žádní hráči v tabulce.</td></tr>';
            return;
        }

        // Řazení podle výher
        players.sort((a, b) => b.wins - a.wins);

        // Vykreslení
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

        // 1. Nastavení krále
        document.getElementById('top-player').innerText = players[0].name;

        // 2. Nastavení celkového počtu odehraných zápasů
        // Pokud skript nenašel samostatný řádek s celkovými zápasy, spočítá unikátní součet výher + remíz/proher skupiny
        const calculatedTotalGames = totalGamesFromHeader > 0 
            ? totalGamesFromHeader 
            : Math.max(...players.map(p => p.wins)); // Případně upravíme podle toho, co napíše konzole

        document.getElementById('total-games').innerText = calculatedTotalGames;

    } catch (err) {
        console.error('Chyba načítání:', err);
        tbody.innerHTML = '<tr><td colspan="8" style="color:#ef4444;">Chyba při načítání CSV dat. Podívej se do F12 (Console).</td></tr>';
    }
}

loadLeaderboard();
