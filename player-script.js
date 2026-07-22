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
        // Stáhneme hlavní tabulku i detaily současně
        const [response, detailsResponse] = await Promise.all([
            fetch(CSV_URL),
            fetch(DETAILS_CSV_URL).catch(() => null)
        ]);

        if (!response.ok) throw new Error('Nelze načíst data z tabulky');

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);
        const delimiter = text.includes(';') ? ';' : ',';

        let playerData = null;

        // Projdeme řádky hlavního žebříčku
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

        // Zpracování detailů (Oblíbený hrad, Hrdina, Mapa) ze záložky "Detaily"
        let playerCastle = '-';
        let playerHero = '-';
        let playerMap = '-';

        if (detailsResponse && detailsResponse.ok) {
            const detailsText = await detailsResponse.text();
            const detailLines = detailsText.trim().split(/\r?\n/);
            const detailDelimiter = detailsText.includes(';') ? ';' : ',';

            for (let j = 0; j < detailLines.length; j++) {
                const dCols = detailLines[j].split(detailDelimiter).map(c => c.replace(/^"|"$/g,'').trim());
                if (!dCols[0]) continue;

                // Přeskočíme hlavičku v detailech
                if (['HRÁČ', 'Hráč', 'Jméno', 'NAME', 'Jméno hráče'].includes(dCols[0])) continue;

                if (dCols[0].toLowerCase() === playerName.toLowerCase()) {
                    playerCastle = dCols[1] || '-';
                    playerHero = dCols[2] || '-';
                    playerMap = dCols[3] || '-';
                    break;
                }
            }
        }

        // 2. Naplníme karty hodnotami (základní statistiky)
        document.getElementById('player-wins').innerText = playerData.wins;
        document.getElementById('player-top3').innerText = playerData.top3;
        document.getElementById('player-games').innerText = playerData.games;
        document.getElementById('player-points').innerText = playerData.points + ' b';

        // Naplníme nové detaily (hrad, hrdina, mapa) do HTML elementů
        const castleEl = document.getElementById('player-castle');
        const heroEl = document.getElementById('player-hero');
        const mapEl = document.getElementById('player-map');
        const castleImgEl = document.getElementById('player-castle-img');

        if (castleEl) castleEl.innerText = playerCastle;
        if (heroEl) heroEl.innerText = playerHero;
        if (mapEl) mapEl.innerText = playerMap;

        // Dynamické načtení obrázku hradu podle názvu v tabulce
        if (castleImgEl) {
            if (playerCastle && playerCastle !== '-') {
                // Převede např. "Necropole" na "necropole.png" ve složce images/
                const fileName = playerCastle.toLowerCase().trim();
                castleImgEl.src = `images/${fileName}.png`;
                castleImgEl.style.display = 'block';

                // Pokud obrázek fyzicky ve složce nebude, skryje ho, aby tam nebyl rozbitý křížek
                castleImgEl.onerror = function() {
                    this.style.display = 'none';
                };
            } else {
                castleImgEl.style.display = 'none';
            }
        }

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
