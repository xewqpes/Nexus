'use strict';

const state = {
    data: { tournaments: [], teams: [] },
    players: [],
    tournaments: [],
    currentTier: 'all',
    currentPlayerId: 1
};

const PAGE = document.body.dataset.page || 'home';

function parseXML(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    if (doc.querySelector('parsererror')) {
        throw new Error('Ошибка парсинга XML');
    }

    const tournaments = Array.from(doc.querySelectorAll('tournaments > tournament')).map(n => ({
        id: n.getAttribute('id'),
        game: n.getAttribute('game'),
        name: n.querySelector('name').textContent,
        date: n.querySelector('date').textContent,
        prize: n.querySelector('prize').textContent,
        region: n.querySelector('region').textContent,
        status: n.querySelector('status').textContent
    }));

    const teams = Array.from(doc.querySelectorAll('teams > team')).map(n => ({
        id: n.getAttribute('id'),
        game: n.getAttribute('game'),
        name: n.querySelector('name').textContent,
        region: n.querySelector('region').textContent,
        winrate: parseInt(n.querySelector('winrate').textContent, 10),
        logo: n.querySelector('logo').textContent,
        players: Array.from(n.querySelectorAll('player')).map(p => ({
            role: p.getAttribute('role'),
            name: p.textContent
        }))
    }));

    return { tournaments, teams };
}

async function loadData() {
    try {
        const res = await fetch('data/data.xml');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        state.data = parseXML(text);
        initPage();
    } catch (err) {
        console.error('Ошибка загрузки XML:', err);
        showError();
    }
}

function showError() {
    const msg = 'Не удалось загрузить данные. Запустите сайт через локальный сервер (Live Server или python -m http.server).';
    document.querySelectorAll('[id$="Container"], [id$="Grid"]').forEach(c => {
        c.innerHTML = `<div class="empty-state">${msg}</div>`;
    });
}

function createTournamentCard(t) {
    const card = document.createElement('article');
    card.className = 'tournament-card';
    const gameLabel = 'LoL';
    const statusLabel = { live: 'Live', upcoming: 'Upcoming', finished: 'Finished' }[t.status] || t.status;

    card.innerHTML = `
        <div class="t-head">
            <span class="t-game">${gameLabel}</span>
            <span class="t-status ${t.status}">${statusLabel}</span>
        </div>
        <h3 class="t-name">${escapeHtml(t.name)}</h3>
        <div class="t-meta">
            <div class="t-meta-row"><span>Даты</span><span>${escapeHtml(t.date)}</span></div>
            <div class="t-meta-row"><span>Регион</span><span>${escapeHtml(t.region)}</span></div>
        </div>
        <div class="t-prize">
            <span>Призовой фонд</span>
            <strong>${escapeHtml(t.prize)}</strong>
        </div>
    `;
    return card;
}

function createLeaderRow(t, rank) {
    const row = document.createElement('div');
    row.className = 'leader-row';
    const gameLabel = 'LoL';
    const rankStr = String(rank).padStart(2, '0');

    row.innerHTML = `
        <span class="rank">${rankStr}</span>
        <span class="lr-logo">${escapeHtml(t.logo)}</span>
        <div class="lr-info">
            <span class="lr-name">${escapeHtml(t.name)}</span>
            <span class="lr-region">${escapeHtml(t.region)}</span>
        </div>
        <div class="lr-wr">
            <strong>${t.winrate}%</strong>
            Winrate
        </div>
        <span class="lr-game">${gameLabel}</span>
    `;
    return row;
}

function rerenderHome() {
    const cont = document.getElementById('tournamentsContainer');
    if (cont) {
        cont.innerHTML = '';
        state.data.tournaments.slice(0, 6).forEach(t => cont.appendChild(createTournamentCard(t)));
    }

    const tcont = document.getElementById('teamsContainer');
    if (tcont) {
        tcont.innerHTML = '';
        state.data.teams.slice().sort((a, b) => b.winrate - a.winrate).slice(0, 6)
            .forEach((t, i) => tcont.appendChild(createLeaderRow(t, i + 1)));
    }
}

function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

function initObserver() {
    const opts = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                io.unobserve(entry.target);
            }
        });
    }, opts);

    document.querySelectorAll('section').forEach(s => io.observe(s));
}

function initPage() {
    rerenderHome();
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadXML(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML parse error');
    return doc;
}

function parsePlayersXML(doc) {
    return Array.from(doc.querySelectorAll('player')).map(p => ({
        id: parseInt(p.getAttribute('id'), 10),
        name: p.querySelector('name').textContent,
        rank: p.querySelector('rank').textContent,
        lp: parseInt(p.querySelector('lp').textContent, 10),
        winrate: parseInt(p.querySelector('winrate').textContent, 10),
        games: parseInt(p.querySelector('games').textContent, 10),
        mainChampion: p.querySelector('mainChampion').textContent,
        role: p.querySelector('role').textContent,
        server: p.querySelector('server').textContent,
        stats: {
            kda: parseFloat(p.querySelector('stats kda').textContent),
            csPerMin: parseFloat(p.querySelector('stats csPerMin').textContent),
            vision: parseInt(p.querySelector('stats vision').textContent, 10),
            damage: parseInt(p.querySelector('stats damage').textContent, 10)
        },
        champions: Array.from(p.querySelectorAll('champions champion')).map(c => ({
            name: c.getAttribute('name'),
            games: parseInt(c.getAttribute('games'), 10),
            winrate: parseInt(c.getAttribute('winrate'), 10)
        })),
        matches: Array.from(p.querySelectorAll('matches match')).map(m => ({
            champion: m.getAttribute('champion'),
            result: m.getAttribute('result'),
            kda: m.getAttribute('kda'),
            cs: m.getAttribute('cs'),
            duration: m.getAttribute('duration')
        }))
    }));
}

function buildRadarSVG(player) {
    const cx = 140, cy = 140, r = 100;
    const params = [
        { label: 'KDA', value: Math.min(player.stats.kda / 10, 1) },
        { label: 'CS/M', value: Math.min(player.stats.csPerMin / 12, 1) },
        { label: 'Vision', value: player.stats.vision / 100 },
        { label: 'Damage', value: player.stats.damage / 100 },
        { label: 'WR%', value: player.winrate / 100 }
    ];
    const n = params.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    function toXY(idx, radius) {
        const angle = startAngle + idx * angleStep;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    }

    let gridLines = '';
    [0.25, 0.5, 0.75, 1].forEach(level => {
        const pts = params.map((_, i) => {
            const p = toXY(i, r * level);
            return `${p.x},${p.y}`;
        }).join(' ');
        gridLines += `<polygon points="${pts}" fill="none" stroke="rgba(144,221,240,0.12)" stroke-width="1"/>`;
    });

    let axes = '';
    params.forEach((_, i) => {
        const p = toXY(i, r);
        axes += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="rgba(144,221,240,0.15)" stroke-width="1"/>`;
    });

    const dataPoints = params.map((param, i) => {
        const p = toXY(i, r * param.value);
        return `${p.x},${p.y}`;
    }).join(' ');

    let labels = '';
    params.forEach((param, i) => {
        const p = toXY(i, r + 22);
        labels += `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle"
            font-family="'Space Mono',monospace" font-size="9" fill="rgba(240,237,238,0.5)"
            letter-spacing="0.08em">${param.label}</text>`;
    });

    return `<svg class="radar-svg" viewBox="0 0 280 280" role="img" aria-label="Пентагональная диаграмма статистики ${escapeHtml(player.name)}">
        <title>Статистика ${escapeHtml(player.name)}</title>
        ${gridLines}
        ${axes}
        <polygon points="${dataPoints}"
            fill="rgba(144,221,240,0.18)"
            stroke="#90DDF0"
            stroke-width="1.5"
            stroke-linejoin="round"/>
        ${labels}
    </svg>`;
}

function renderLeaderboard(players) {
    const tierFilter = state.currentTier;
    const filtered = tierFilter === 'all'
        ? players
        : players.filter(p => p.rank.toLowerCase() === tierFilter);

    const sorted = filtered.slice().sort((a, b) => b.lp - a.lp);

    const podiumEl = document.getElementById('podiumContainer');
    if (podiumEl) {
        podiumEl.innerHTML = '';
        const top3 = sorted.slice(0, 3);
        const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
        const rankMap = top3.length >= 3 ? [2, 1, 3] : [1, 2, 3];

        podiumOrder.forEach((player, idx) => {
            if (!player) return;
            const realRank = rankMap[idx];
            const card = document.createElement('article');
            card.className = `podium-card rank-${realRank}`;
            card.dataset.playerId = player.id;
            card.innerHTML = `
                <div class="podium-rank-num">${String(realRank).padStart(2, '0')}</div>
                <div class="podium-avatar" aria-hidden="true">${escapeHtml(player.name.slice(0, 2).toUpperCase())}</div>
                <div class="podium-name">${escapeHtml(player.name)}</div>
                <div class="podium-role">${escapeHtml(player.role)}</div>
                <span class="podium-rank-badge">${escapeHtml(player.rank)}</span>
                <div class="podium-lp">${player.lp.toLocaleString('ru')}<span>LP</span></div>
            `;
            podiumEl.appendChild(card);
        });
        podiumEl.classList.add('fade-in');
    }

    const tableEl = document.getElementById('leaderboardTable');
    if (!tableEl) return;
    tableEl.innerHTML = '';

    if (!sorted.length) {
        tableEl.innerHTML = '<div class="empty-state">Нет данных для выбранного фильтра</div>';
        return;
    }

    sorted.forEach((player, idx) => {
        const row = document.createElement('div');
        row.className = 'lb-row reveal' + (idx < 3 ? ' top-3' : '');
        row.setAttribute('role', 'listitem');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-label', `${idx + 1}. ${player.name}`);
        row.dataset.playerId = player.id;
        const tierClass = player.rank.toLowerCase().replace(' ', '');
        row.innerHTML = `
            <span class="row-rank">${String(idx + 1).padStart(2, '0')}</span>
            <div class="row-player">
                <div class="row-avatar" aria-hidden="true">${escapeHtml(player.name.slice(0, 2).toUpperCase())}</div>
                <div>
                    <div class="row-name">${escapeHtml(player.name)}</div>
                    <div class="row-role">${escapeHtml(player.role)}</div>
                </div>
            </div>
            <span class="row-tier ${tierClass}">${escapeHtml(player.rank)}</span>
            <span class="row-lp">${player.lp.toLocaleString('ru')}</span>
            <span class="row-wr">${player.winrate}%</span>
            <span class="row-games">${player.games}</span>
            <span class="row-server">${escapeHtml(player.server)}</span>
        `;
        tableEl.appendChild(row);
    });
    setTimeout(initRevealObserver, 50);
}

function renderPlayer(player) {
    const section = document.getElementById('playerSection');
    if (!section) return;

    const champRows = player.champions.map(c => `
        <div class="champion-row">
            <span class="champ-name">${escapeHtml(c.name)}</span>
            <span class="champ-games">${c.games} игр</span>
            <span class="champ-wr">${c.winrate}%</span>
        </div>
    `).join('');

    const matchRows = player.matches.map(m => `
        <tr class="${m.result === 'win' ? 'win-row' : 'loss-row'}">
            <td class="td-champion">${escapeHtml(m.champion)}</td>
            <td><span class="result-badge">${m.result === 'win' ? 'Победа' : 'Пор.'}</span></td>
            <td class="td-kda">${escapeHtml(m.kda)}</td>
            <td class="td-cs">${escapeHtml(m.cs)} CS</td>
            <td class="td-duration">${escapeHtml(m.duration)}</td>
        </tr>
    `).join('');

    section.innerHTML = `
        <header class="player-header">
            <div class="player-avatar" aria-hidden="true">${escapeHtml(player.name.slice(0, 2).toUpperCase())}</div>
            <div class="player-meta">
                <h1 class="player-name">${escapeHtml(player.name)}</h1>
                <div class="player-badges">
                    <span class="badge badge-rank">${escapeHtml(player.rank)}</span>
                    <span class="badge badge-role">${escapeHtml(player.role)}</span>
                    <span class="badge badge-server">${escapeHtml(player.server)}</span>
                </div>
            </div>
            <div class="player-lp-block">
                <div class="lp-num">${player.lp.toLocaleString('ru')}</div>
                <div class="lp-label">League Points</div>
            </div>
        </header>

        <div class="player-main-grid">
            <div>
                <div class="player-stats-grid">
                    <article class="stat-card stat-highlight">
                        <div class="stat-num">${player.winrate}%</div>
                        <div class="stat-label">Winrate</div>
                    </article>
                    <article class="stat-card">
                        <div class="stat-num">${player.stats.kda}</div>
                        <div class="stat-label">KDA</div>
                    </article>
                    <article class="stat-card">
                        <div class="stat-num">${player.stats.csPerMin}</div>
                        <div class="stat-label">CS / мин</div>
                    </article>
                    <article class="stat-card">
                        <div class="stat-num">${player.games}</div>
                        <div class="stat-label">Игр сыграно</div>
                    </article>
                </div>

                <div class="champions-section">
                    <h3>Топ чемпионы</h3>
                    ${champRows}
                </div>
            </div>

            <aside class="radar-card" aria-label="Диаграмма статистики">
                <h3>Статистика</h3>
                ${buildRadarSVG(player)}
                <ul class="radar-labels-list" aria-hidden="true">
                    <li class="radar-label-item"><span class="dot"></span><span>KDA</span></li>
                    <li class="radar-label-item"><span class="dot"></span><span>CS / мин</span></li>
                    <li class="radar-label-item"><span class="dot"></span><span>Vision</span></li>
                    <li class="radar-label-item"><span class="dot"></span><span>Damage</span></li>
                    <li class="radar-label-item"><span class="dot"></span><span>WR%</span></li>
                </ul>
            </aside>
        </div>

        <section class="match-history" aria-label="История матчей">
            <h2>История матчей</h2>
            <table class="history-table">
                <thead>
                    <tr>
                        <th scope="col">Чемпион</th>
                        <th scope="col">Результат</th>
                        <th scope="col">KDA</th>
                        <th scope="col">CS</th>
                        <th scope="col">Время</th>
                    </tr>
                </thead>
                <tbody>
                    ${matchRows}
                </tbody>
            </table>
        </section>
    `;

    section.querySelectorAll('section').forEach(s => s.classList.add('fade-in'));
}

function populatePlayerSelect(players) {
    const sel = document.getElementById('playerSelect');
    if (!sel) return;
    sel.innerHTML = '';
    players.slice().sort((a, b) => b.lp - a.lp).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} — ${p.rank} ${p.lp.toLocaleString('ru')} LP`;
        if (p.id === state.currentPlayerId) opt.selected = true;
        sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
        state.currentPlayerId = parseInt(sel.value, 10);
        const player = state.players.find(p => p.id === state.currentPlayerId);
        if (player) renderPlayer(player);
    });
}

async function loadPlayers() {
    try {
        const doc = await loadXML('data/players.xml');
        state.players = parsePlayersXML(doc);
        if (PAGE === 'leaderboard') {
            renderLeaderboard(state.players);
        } else if (PAGE === 'player') {
            const urlId = parseInt(new URLSearchParams(window.location.search).get('id'), 10) || 1;
            state.currentPlayerId = urlId;
            populatePlayerSelect(state.players);
            const player = state.players.find(p => p.id === urlId) || state.players[0];
            if (player) renderPlayer(player);
        }
    } catch (err) {
        console.error('Ошибка загрузки players.xml:', err);
    }
}

function initTabFilters(selector, stateKey, dataKey, rerenderFn) {
    document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state[stateKey] = btn.dataset[dataKey];
            rerenderFn();
        });
    });
}

function initRevealObserver() {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

(function injectRevealStyle() {
    if (document.getElementById('reveal-style')) return;
    const s = document.createElement('style');
    s.id = 'reveal-style';
    s.textContent = '.reveal{opacity:0;transform:translateY(28px);transition:opacity 0.55s cubic-bezier(0.16,1,0.3,1),transform 0.55s cubic-bezier(0.16,1,0.3,1)}.reveal.revealed{opacity:1;transform:translateY(0)}';
    document.head.appendChild(s);
}());

function parseTournamentsXML(doc) {
    const t = (el, s) => el.querySelector(s).textContent;
    return [...doc.querySelectorAll('tournament')].map(el => ({
        id: el.getAttribute('id'),
        name: t(el, 'name'), status: t(el, 'status'), prize: +t(el, 'prize'),
        currency: t(el, 'currency'), dateStart: t(el, 'dateStart'), dateEnd: t(el, 'dateEnd'),
        participants: +t(el, 'participants'), format: t(el, 'format'), rank: t(el, 'rank'),
        server: t(el, 'server'), region: t(el, 'region'), description: t(el, 'description')
    }));
}

async function loadTournaments() {
    try {
        const doc = await loadXML('data/tournaments.xml');
        state.tournaments = parseTournamentsXML(doc);
        renderTournamentsList(state.tournaments);
        initTournamentFilters();
        initCreateTournamentModal();
    } catch (err) {
        const grid = document.getElementById('tournamentsGrid');
        if (grid) grid.innerHTML = '<div class="empty-state">Не удалось загрузить данные. Запустите через локальный сервер.</div>';
        console.error('Ошибка загрузки tournaments.xml:', err);
    }
}

function applyTournamentFilters() {
    const region  = (document.querySelector('[data-filter="region"]')  || {}).value || 'all';
    const tstatus = (document.querySelector('[data-filter="tstatus"]') || {}).value || 'all';
    const format  = (document.querySelector('[data-filter="format"]')  || {}).value || 'all';

    const filtered = state.tournaments.filter(t => {
        if (region  !== 'all' && t.region !== region)     return false;
        if (tstatus !== 'all' && t.status !== tstatus)    return false;
        if (format  !== 'all' && !t.format.startsWith(format)) return false;
        return true;
    });

    renderTournamentsList(filtered);
}

function initTournamentFilters() {
    document.querySelectorAll('[data-filter]').forEach(sel => {
        sel.addEventListener('change', applyTournamentFilters);
    });
}

function createTournamentRow(t) {
    const statusLabels = { live: 'Live', open: 'Открыта запись', soon: 'Скоро', finished: 'Завершён' };
    const statusLabel  = statusLabels[t.status] || t.status;

    const prizeStr = t.prize
        ? t.prize.toLocaleString('ru') + ' ' + (t.currency || 'Br')
        : '—';

    const dateStr = formatTournamentDate(t.dateStart, t.dateEnd);

    const row = document.createElement('article');
    row.className = 'tournament-row reveal';
    row.setAttribute('role', 'listitem');
    row.innerHTML = `
        <span class="t-status-dot ${escapeHtml(t.status)}" title="${escapeHtml(statusLabel)}" aria-label="${escapeHtml(statusLabel)}"></span>
        <div class="t-row-info">
            <div class="t-row-title">${escapeHtml(t.name)}</div>
            <div class="t-row-meta">${escapeHtml(t.format)} &middot; ${escapeHtml(t.rank)} &middot; ${dateStr}</div>
        </div>
        <div class="t-row-prize">
            <span class="prize-val">${escapeHtml(prizeStr)}</span>
            <span class="prize-label">призовой фонд</span>
        </div>
        <span class="t-row-badge">${escapeHtml(t.region)}</span>
    `;
    return row;
}

function formatTournamentDate(start, end) {
    try {
        const opts = { day: 'numeric', month: 'short' };
        return new Date(start).toLocaleDateString('ru-RU', opts) + ' — ' + new Date(end).toLocaleDateString('ru-RU', opts);
    } catch (_) { return start + ' — ' + end; }
}

function renderTournamentsList(list) {
    const grid  = document.getElementById('tournamentsGrid');
    const count = document.getElementById('listCount');
    if (!grid) return;

    if (count) count.textContent = list.length + ' турниров';
    grid.innerHTML = '';

    if (!list.length) {
        grid.innerHTML = '<div class="empty-state">Нет турниров для выбранных фильтров</div>';
        return;
    }

    list.forEach(t => grid.appendChild(createTournamentRow(t)));
    setTimeout(initRevealObserver, 50);
}

function initCreateTournamentModal() {
    const overlay = document.getElementById('createModal');
    const openBtn = document.getElementById('openCreateModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModal');
    const form = document.getElementById('createTournamentForm');
    if (!overlay || !openBtn) return;

    const open  = () => overlay.classList.add('open');
    const close = () => overlay.classList.remove('open');

    openBtn.addEventListener('click', open);
    if (closeBtn)  closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form));
            if (!data.name || !data.dateStart || !data.dateEnd) {
                alert('Заполните обязательные поля: название и даты.');
                return;
            }
            submitNewTournament(data);
        });
    }
}

function submitNewTournament(data) {
    const newT = {
        id:           String(Date.now()),
        name:         data.name,
        status:       'open',
        prize:        parseInt(data.prize, 10) || 0,
        currency:     'Br',
        dateStart:    data.dateStart,
        dateEnd:      data.dateEnd,
        participants: parseInt(data.participants, 10) || 16,
        format:       data.format || 'Single Elimination',
        rank:         data.rank || 'All',
        server:       data.server || 'EUW',
        region:       data.region || 'EU',
        description:  data.description || ''
    };

    state.tournaments.unshift(newT);
    renderTournamentsList(state.tournaments);

    const body = document.getElementById('modalBody');
    if (body) {
        body.innerHTML = `
            <div class="create-success">
                <div class="success-icon">&#10003;</div>
                <h3>Турнир создан!</h3>
                <p>«${escapeHtml(newT.name)}» добавлен в каталог.<br>
                   Регистрация участников открыта.</p>
            </div>`;
        setTimeout(() => {
            document.getElementById('createModal').classList.remove('open');
            setTimeout(() => {
                body.innerHTML = document.getElementById('createTournamentForm')
                    ? body.innerHTML
                    : '<form class="form-grid" id="createTournamentForm"></form>';
            }, 400);
        }, 2200);
    }
}

document.addEventListener('click', e => {
    const el = e.target.closest('[data-player-id]');
    if (el) window.location.href = `player.html?id=${el.dataset.playerId}`;
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const el = e.target.closest('[data-player-id]');
    if (el) window.location.href = `player.html?id=${el.dataset.playerId}`;
});

function init() {
    initSmoothScroll();
    initObserver();

    if (PAGE === 'leaderboard' || PAGE === 'player') {
        loadPlayers();
        if (PAGE === 'leaderboard') {
            initTabFilters('.lb-filters .filter-tab', 'currentTier', 'tier', () => renderLeaderboard(state.players));
        }
    } else if (PAGE === 'tournaments') {
        loadTournaments();
    } else {
        loadData();
    }

    if (document.body.classList.contains('dark')) {
        setTimeout(initRevealObserver, 200);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
