const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBpAS7TdyBVQi1TIlKdt2cCJrVSC4X0Y0elDcUhY9g4rV0K9SaIowsn57yWeZJBYV_uVUatTUSUYA2/pub?gid=1436133630&single=true&output=csv';

async function loadPlayerProfile() {
    // 1. Zjistíme jméno hráče z URL (např. ?name=Béďa)
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

        // Projdeme řádky žebříčku
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
                
                // Zde si zkontroluj čísla sloupců podle své tabulky:
                // cols[6] = hrad, cols[7] = hrdina, cols[8] = mapa, cols[9] = body
                const playerCastle = cols[6] || '-';
                const playerHero = cols[7] || '-';
                const playerMap = cols[8] || '-';
                
                const rawPoints = cols[9] || cols[7] || '0';
                const points = parseInt(rawPoints.replace(/\D/g, '')) || 0;

                playerData = { name, wins, top3, games, losses, winrate, points, playerCastle, playerHero, playerMap };
                break;
            }
        }

        if (!playerData) {
            document.getElementById('player-details-body').innerHTML = `<tr><td colspan="2" style="color: #ef4444;">Hráč "${playerName}" nebyl v tabulce nalezen.</td></tr>`;
            return;
        }

        // 2. Naplníme horní karty a texty
        document.getElementById('player-wins').innerText = playerData.wins;
        document.getElementById('player-top3').innerText = playerData.top3;
        document.getElementById('player-games').innerText = playerData.games;
        document.getElementById('player-points').innerText = playerData.points + ' b';

        const castleEl = document.getElementById('player-castle');
        const castleIconEl = document.getElementById('player-castle-icon');
        const heroEl = document.getElementById('player-hero');
        const heroIconEl = document.getElementById('player-hero-icon');
        const mapEl = document.getElementById('player-map');

        if (castleEl) castleEl.innerText = playerData.playerCastle;
        if (heroEl) heroEl.innerText = playerData.playerHero;
        if (mapEl) mapEl.innerText = playerData.playerMap;

        // Slovník pro obrázky hradů
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

        if (castleIconEl && playerData.playerCastle !== '-') {
            const castleKey = playerData.playerCastle.toLowerCase().trim();
            if (castleImages[castleKey]) {
                castleIconEl.src = castleImages[castleKey];
                castleIconEl.style.display = 'inline-block';
            } else {
                castleIconEl.style.display = 'none';
            }
        }

        // Slovník pro hrdiny
        const heroImages = {
            'rupert': 'images/heroes/rupert.png',
            'xi': 'images/heroes/xi.png',
            'solmyr': 'images/heroes/solmyr.png'
        };

        if (heroIconEl && playerData.playerHero !== '-') {
            const heroKey = playerData.playerHero.toLowerCase().trim();
            if (heroImages[heroKey]) {
                heroIconEl.src = heroImages[heroKey];
                heroIconEl.style.display = 'block';
            } else {
                heroIconEl.style.display = 'none';
            }
        }

        // 3. Vypíšeme detailní tabulku dole
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

        // 4. Vykreslení koláčového grafu úspěšnosti
        const ctx = document.getElementById('playerWinChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Výhry (1. místo)', 'TOP 3 umístění', 'Prohry'],
                datasets: [{
                    data: [playerData.wins, playerData.top3, playerData.losses],
                    backgroundColor: [
                        '#10b981', // Zelená pro výhry
                        '#3b82f6', // Modrá pro top 3
                        '#ef4444'  // Červená pro prohry
                    ],
                    borderWidth: 1,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            font: {
                                size: 12
                            }
                        }
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
