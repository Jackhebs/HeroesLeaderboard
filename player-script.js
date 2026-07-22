const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';
// Zde si případně uprav gid= na číslo tvé záložky "Zápisy zápasů", pokud ho máš jiné než u hlavního žebříčku
const MATCHES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=0&single=true&output=csv'; 

async function loadPlayerProfile() {
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get('name');

    if (!playerName) {
        document.getElementById('player-name').innerText = 'Hráč nenalezen';
        document.getElementById('player-details-body').innerHTML = `<tr><td colspan="2" style="color: #ef4444;">V URL adrese chybí jméno hráče.</td></tr>`;
        return;
    }

    document.getElementById('player-name').innerText = playerName;

    try {
        const [response, matchesResponse] = await Promise.all([
            fetch(CSV_URL),
            fetch(MATCHES_CSV_URL).catch(() => null)
        ]);

        if (!response.ok) throw new Error('Nelze načíst hlavní data');

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);
        const delimiter = text.includes(';') ? ';' : ',';

        let playerData = null;

        // 1. Zjistíme základní statistiky z hlavního žebříčku
        for (let i = 0; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.replace(/^"|"$/g,'').trim());
            if (!cols[0]) continue;
            const name = cols[0];

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

        // 2. Automatický výpočet oblíbeného hradu, hrdiny a mapy ze záložky "Zápisy zápasů"
        let castleCounts = {};
        let heroCounts = {};
        let mapCounts = {};

        if (matchesResponse && matchesResponse.ok) {
            const matchesText = await matchesResponse.text();
            const matchLines = matchesText.trim().split(/\r?\n/);
            const matchDelimiter = matchesText.includes(';') ? ';' : ',';

            for (let j = 0; j < matchLines.length; j++) {
                const mCols = matchLines[j].split(matchDelimiter).map(c => c.replace(/^"|"$/g,'').trim());
                if (!mCols[0]) continue;
                if (['Datum Zápasu', 'Datum'].includes(mCols[0])) continue; // Přeskočit hlavičku

            // Struktura zápisů: Sloupec B (index 1) = Hráč 1, Sloupec C (index 2) = Hrad 1, atd.
            // Procházíme dvojice (hráč + hrad) napříč řádkem zápasu
                for (let colIdx = 1; colIdx < mCols.length - 1; colIdx += 2) {
                    const hracVTabulce = mCols[colIdx];
                    const hradVTabulce = mCols[colIdx + 1];

                    if (hracVTabulce && hracVTabulce.toLowerCase() === playerName.toLowerCase()) {
                        if (hradVTabulce && hradVTabulce !== '-') {
                            castleCounts[hradVTabulce] = (castleCounts[hradVTabulce] || 0) + 1;
                        }
                    }
                }

                // Mapa je obvykle na konci řádku (např. sloupec L, což odpovídá indexu 11 nebo poslednímu sloupci)
                const mapa = mCols[mCols.length - 1]; 
                // Zde ověřujeme, jestli se hráč vůbec zúčastnil tohoto zápasu, než mu započítáme mapu
                let hracBylVZapisu = false;
                for (let colIdx = 1; colIdx < mCols.length - 1; colIdx += 2) {
                    if (mCols[colIdx] && mCols[colIdx].toLowerCase() === playerName.toLowerCase()) {
                        hracBylVZapisu = true;
                        break;
                    }
                }
                if (hracBylVZapisu && mapa && mapa !== '-') {
                    mapCounts[mapa] = (mapCounts[mapa] || 0) + 1;
                }
            }
        }

        // Funkce pro nalezení nejčastější položky v objektu
        function getMostFrequent(obj) {
            let maxKey = '-';
            let maxVal = -1;
            for (let key in obj) {
                if (obj[key] > maxVal) {
                    maxVal = obj[key];
                    maxKey = key;
                }
            }
            return maxKey;
        }

        const playerCastle = getMostFrequent(castleCounts);
        const playerHero = '-'; // Pokud budeš chtít doplnit hrdiny do zápisů, dá se to rozšířit stejným způsobem
        const playerMap = getMostFrequent(mapCounts);

        // 3. Naplnění UI
        document.getElementById('player-wins').innerText = playerData.wins;
        document.getElementById('player-top3').innerText = playerData.top3;
        document.getElementById('player-games').innerText = playerData.games;
        document.getElementById('player-points').innerText = playerData.points + ' b';

        const castleEl = document.getElementById('player-castle');
        const heroEl = document.getElementById('player-hero');
        const mapEl = document.getElementById('player-map');
        const castleImgEl = document.getElementById('player-castle-img');

        if (castleEl) castleEl.innerText = playerCastle;
        if (heroEl) heroEl.innerText = playerHero;
        if (mapEl) mapEl.innerText = playerMap;

        // Dynamický obrázek hradu
        if (castleImgEl) {
            if (playerCastle && playerCastle !== '-') {
                const fileName = playerCastle.toLowerCase().trim();
                castleImgEl.src = `images/${fileName}.png`;
                castleImgEl.style.display = 'block';
                castleImgEl.onerror = function() {
                    this.style.display = 'none';
                };
            } else {
                castleImgEl.style.display = 'none';
            }
        }

        // 4. Tabulka podrobností
        const tbody = document.getElementById('player-details-body');
        tbody.innerHTML = `
            <tr><td><strong>Celkový počet zápasů</strong></td><td>${playerData.games}</td></tr>
            <tr><td><strong>Výhry (1. místo)</strong></td><td>${playerData.wins}</td></tr>
            <tr><td><strong>Umístění v TOP 3 (Bedna)</strong></td><td>${playerData.top3}</td></tr>
            <tr><td><strong>Prohry</strong></td><td>${playerData.losses}</td></tr>
            <tr><td><strong>Úspěšnost (Winrate)</strong></td><td>${playerData.winrate}</td></tr>
            <tr><td><strong>Celkové body v lize</strong></td><td>${playerData.points}</td></tr>
            <tr><td><strong>Nejčastější hrad</strong></td><td>${playerCastle}</td></tr>
            <tr><td><strong>Nejčastější mapa</strong></td><td>${playerMap}</td></tr>
        `;

    } catch (err) {
        console.error('Chyba při načítání profilu:', err);
        document.getElementById('player-details-body').innerHTML = `<tr><td colspan="2" style="color: #ef4444;">Chyba při stahování dat.</td></tr>`;
    }
}

loadPlayerProfile();
