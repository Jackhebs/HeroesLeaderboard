const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';
const DETAILS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=2022466520&single=true&output=csv';
async function loadPlayerProfile() {
    // 1. Zjistíme jméno hráče z URL (např. ?name=Honza)
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get('name');

    if (!playerName) {
        document.getElementById('player-name').innerText = 'Hráč nenalezen';
        document.getElementById('player-details-body').innerHTML = `<tr><td colspan="2" style="color: #ef4444;">V URL adrese chybí jméno hráče.</td></tr>`;
        return;
    }

    document.getElementById('player-name').innerText = playerName;

    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Nelze načíst data z tabulky');

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);
        const delimiter = text.includes(';') ? ';' : ',';

        let playerData = null;

        // Projdeme řádky a najdeme shodného hráče
        for (let i = 0; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.replace(/^"|"$/g,'').trim());
            
            if (!cols[0]) continue;
            const name = cols[0];

            // Přeskočíme hlavičku tabulky
            if (['HRÁČ', 'Hráč', 'Jméno', 'NAME', '#'].includes(name)) continue;

            if (name.toLowerCase() === playerName.toLowerCase()) {
                const wins = parseInt(cols[1]) || 0;
                const top3 = parseInt(cols[2]) || 0;
                const games = parseInt(cols[3]) || 0;
                const losses = parseInt(cols[4]) || 0;
                let winrate = cols[5] || '0%';
                const rawPoints = cols[7] || '0';
                const points = parseInt(rawPoints.replace(/\D/g, '')) || 0;

                playerData = { name, wins, top3, games, losses, winrate, points };
                break;
            }
        }

        if (!playerData) {
            document.getElementById('player-details-body').innerHTML = `<tr><td colspan="2" style="color: #ef4444;">Hráč "${playerName}" nebyl v tabulce nalezen.</td></tr>`;
            return;
        }

        // 2. Naplníme karty hodnotami
        document.getElementById('player-wins').innerText = playerData.wins;
        document.getElementById('player-top3').innerText = playerData.top3;
        document.getElementById('player-games').innerText = playerData.games;
        document.getElementById('player-points').innerText = playerData.points + ' b';

        // 3. Vypíšeme detailní tabulku
        const tbody = document.getElementById('player-details-body');
        tbody.innerHTML = `
            <tr>
                <td><strong>Celkový počet zápasů</strong></td>
                <td>${playerData.games}</td>
            </tr>
            <tr>
                <td><strong>Výhry (1. místo)</strong></td>
                <td>${playerData.wins}</td>
            </tr>
            <tr>
                <td><strong>Umístění v TOP 3 (Bedna)</strong></td>
                <td>${playerData.top3}</td>
            </tr>
            <tr>
                <td><strong>Prohry</strong></td>
                <td>${playerData.losses}</td>
            </tr>
            <tr>
                <td><strong>Úspěšnost (Winrate)</strong></td>
                <td>${playerData.winrate}</td>
            </tr>
            <tr>
                <td><strong>Celkové body v lize</strong></td>
                <td>${playerData.points}</td>
            </tr>
        `;

    } catch (err) {
        console.error('Chyba při načítání profilu:', err);
        document.getElementById('player-details-body').innerHTML = `<tr><td colspan="2" style="color: #ef4444;">Chyba při stahování dat.</td></tr>`;
    }
}

loadPlayerProfile();
