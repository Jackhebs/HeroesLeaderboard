const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';
const DETAILS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=2022466520&single=true&output=csv';

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
        const [response, detailsResponse] = await Promise.all([
            fetch(CSV_URL),
            fetch(DETAILS_CSV_URL).catch(() => null)
        ]);

        if (!response.ok) throw new Error('Nelze načíst data z tabulky');

        const text = await response.text();
        const lines = text.trim().split(/\r?\n/);
        const delimiter = text.includes(';') ? ';' : ',';

        let playerData = null;

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

        // Zpracování detailů ze záložky Detaily (podle tvého obrázku: sloupec 1=Hrad, 2=Hrdina, 3=Mapa)
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

                if (['HRÁČ', 'Hráč', 'Jméno', 'NAME', 'Jméno hráče'].includes(dCols[0])) continue;

                if (dCols[0].toLowerCase() === playerName.toLowerCase()) {
                    playerCastle = dCols[1] || '-';
                    playerHero = dCols[2] || '-';
                    playerMap = dCols[3] || '-';
                    break;
                }
            }
        }

        document.getElementById('player-wins').innerText = playerData.wins;
        document.getElementById('player-top3').innerText = playerData.top3;
        document.getElementById('player-games').innerText = playerData.games;
        document.getElementById('player-points').innerText = playerData.points + ' b';

        const castleEl = document.getElementById('player-castle');
        const castleIconEl = document.getElementById('player-castle-icon');
        const heroEl = document.getElementById('player-hero');
        const heroIconEl = document.getElementById('player-hero-icon');
        const mapEl = document.getElementById('player-map');

        if (castleEl) castleEl.innerText = playerCastle;
        if (heroEl) heroEl.innerText = playerHero;
        if (mapEl) mapEl.innerText = playerMap;

        const castleImages = {
            'castle': 'images/castle.png',
            'rampart': 'images/rampart.png',
            'tower': 'images/tower.png',
            'inferno': 'images/inferno.gif',
            'necropolis': 'images/necropolis.png',
            'necropole': 'images/necropolis.png',
            'dungeon': 'images/dungeon.png',
            'stronghold': 'images/stronghold.png',
            'fortress': 'images/fortress.png',
            'conflux': 'images/conflux.png',
            'cove': 'images/cove.png',
            'factory': 'images/factory.png'
        };

        if (castleIconEl && playerCastle !== '-') {
            const castleKey = playerCastle.toLowerCase().trim();
            if (castleImages[castleKey]) {
                castleIconEl.src = castleImages[castleKey];
                castleIconEl.style.display = 'inline-block';
            } else {
                castleIconEl.style.display = 'none';
            }
        }

        const heroImages = {
            'rupert': 'images/heroes/rupert.png',
            'xi': 'images/heroes/xi.png',
            'solmyr': 'images/heroes/solmyr.png'
        };

        if (heroIconEl && playerHero !== '-') {
            const heroKey = playerHero.toLowerCase().trim();
            if (heroImages[heroKey]) {
                heroIconEl.src = heroImages[heroKey];
                heroIconEl.style.display = 'block';
            } else {
                heroIconEl.style.display = 'none';
            }
        }

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

        const ctx = document.getElementById('playerWinChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Výhry (1. místo)', 'TOP 3 umístění', 'Prohry'],
                datasets: [{
                    data: [playerData.wins, playerData.top3, playerData.losses],
                    backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
                    borderWidth: 1,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#cbd5e1', font: { size: 12 } }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Chyba při načítání profilu:', err);
        document.getElementById('player-details-body').innerHTML = `<tr><td colspan="2" style="color: #ef4444;">Chyba při stahování dat.</td></tr>`;
    }
}

loadPlayerProfile();
