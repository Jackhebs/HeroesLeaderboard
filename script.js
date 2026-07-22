const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';

// Funkce, která vrátí HTML s GIFem monstra podle počtu BODŮ
function getLeagueBadgeByPoints(points) {
    // 1. Nejvyšší rank: 400 a více bodů
    if (points >= 400) {
        return '<img src="images/Creature_Archangel.gif" class="league-icon" title="Liga Archandělů (400+ b.)" alt="Archanděl">';
    } 
    // 2. 300 až 399 bodů
    else if (points >= 300) {
        return '<img src="images/Creature_Faerie_Dragon.gif" class="league-icon" title="Pohádková dračí liga (300+ b.)" alt="Pohádkový drak">';
    }
    // 3. 200 až 299 bodů
    else if (points >= 200) {
        return '<img src="images/Creature_Royal_Griffin.gif" class="league-icon" title="Grifí liga (200+ b.)" alt="Grif">';
    } 
    // 4. 100 až 199 bodů
    else if (points >= 100) {
        return '<img src="images/Creature_Pikeman.gif" class="league-icon" title="Kopijnická liga (100+ b.)" alt="Kopijník">';
    } 
    // 5. Méně než 100 bodů nebo záporné body
    else {
        return '<img src="images/Creature_Peasant.gif" class="league-icon" title="Sedlákova liga (<100 b.)" alt="Sedlák">';
    }
}

async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');

    try {
        const response = await fetch(CSV_URL);

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

            // NAČTENÍ BODŮ ze 7. sloupce (index 6)
            const points = parseInt(cols[6]) || 0;

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
            tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    Žádní hráči v tabulce.
                </td>
            </tr>
            `;
            return;
        }

        players.sort((a,b) => b.wins - a.wins);

        players.forEach((p, index) => {
            let rankClass = '';
            let medal = `${index+1}.`;

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

            // Získání GIFu na základě bodů
            const badgeHtml = getLeagueBadgeByPoints(p.points);

            const tr = document.createElement('tr');

            tr.innerHTML = `
            <td class="${rankClass}">
                ${medal}
            </td>
            <td>
                <strong>${p.name}</strong>
            </td>
            <td>
                ${badgeHtml}
            </td>
            <td>
                ${p.wins}
            </td>
            <td>
                ${p.top3}
            </td>
            <td>
                ${p.games}
            </td>
            <td>
                ${p.losses}
            </td>
            <td>
                <span class="badge-winrate">
                    ${p.winrate}
                </span>
            </td>
            `;

            tbody.appendChild(tr);
        });

        document.getElementById('top-player').innerText = players[0].name;

        // Správný výpočet celkového počtu zápasů
        const totalGames = Math.max(...players.map(p => p.games));
        document.getElementById('total-games').innerText = totalGames;

    } catch(err) {
        console.error('Chyba načítání:', err);

        tbody.innerHTML = `
        <tr>
            <td colspan="8" style="color:#ef4444;">
                Chyba při načítání CSV dat.
            </td>
        </tr>
        `;
    }
}

loadLeaderboard();
