// Interfeys: menyu, stol, kartalarni tanlash, raund natijalari.
(function () {
  'use strict';

  const Cards = window.BuraCards;
  const Rules = window.BuraRules;
  const Game = window.BuraGame;
  const Bot = window.BuraBot;
  const I = window.BuraI18n;

  const SUIT = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  let game = null;
  let mode = '1v1';
  let selected = new Set();
  let busy = false; // yurish natijasi ko'rsatilayotgan paytda true
  let lastTrick = null;
  let token = 0; // eski taymerlarni bekor qilish uchun
  let nick = '';
  let toastTimer = null;

  function save(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function load(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  // ---------- Nomlar ----------
  function seatName(seat) {
    if (seat === 0) return nick || I.t('you');
    if (mode === '1v1') return I.t('bot');
    if (mode === '2v2') return seat === 2 ? I.t('partner') : I.t('opp') + ' ' + (seat === 1 ? 1 : 2);
    return I.t('bot') + ' ' + seat;
  }
  function teamName(i) {
    return game.teams[i].map(seatName).join(' + ');
  }
  function posOf(seat) {
    if (game.seats === 2) return seat === 0 ? 'bottom' : 'top';
    return ['bottom', 'left', 'top', 'right'][seat];
  }

  // ---------- Karta HTML ----------
  function cardHtml(c, cls) {
    const red = c.suit === 'H' || c.suit === 'D';
    const trump = game && game.round && c.suit === game.round.trumpSuit;
    return (
      '<div class="card ' + (red ? 'red ' : '') + (trump ? 'trump ' : '') + (cls || '') + '" data-id="' + c.id + '">' +
      '<span class="r">' + c.rank + '</span><span class="s">' + SUIT[c.suit] + '</span><span class="big">' + SUIT[c.suit] + '</span></div>'
    );
  }
  function backHtml(cls) {
    return '<div class="card back ' + (cls || '') + '"></div>';
  }

  // ---------- Chizish ----------
  function renderHud() {
    const r = game.round;
    const red = r.trumpSuit === 'H' || r.trumpSuit === 'D';
    $('hudRound').textContent = I.t('round') + ' ' + game.roundNo;
    $('hudTrump').innerHTML = I.t('trump') + ': <b class="' + (red ? 'red' : '') + '">' + SUIT[r.trumpSuit] + '</b>';
    $('hudScore').innerHTML =
      I.t('penalty') + ': ' +
      game.teams.map((t, i) => esc(teamName(i)) + ' <b>' + game.penalties[i] + '</b>').join(' · ') +
      ' / ' + game.target +
      (game.multiplier > 1 ? ' <span class="mult">x' + game.multiplier + '</span>' : '');
  }

  function renderSeats() {
    ['top', 'left', 'right'].forEach((p) => ($('seat-' + p).innerHTML = ''));
    const cur = Game.currentSeat(game);
    for (let s = 1; s < game.seats; s++) {
      let backs = '';
      for (let i = 0; i < game.round.hands[s].length; i++) backs += backHtml('mini');
      const turn = cur === s && !game.round.over && !busy;
      $('seat-' + posOf(s)).innerHTML =
        '<div class="name ' + (turn ? 'turn' : '') + '">' + esc(seatName(s)) + '</div><div class="backs">' + backs + '</div>';
    }
  }

  function renderDeck() {
    const r = game.round;
    const n = r.stock.length;
    let h = '';
    if (n >= 2) h += '<div class="trumpcard">' + cardHtml(r.trumpCard) + '</div>';
    if (n >= 1) h += backHtml('deckback');
    h += '<div class="count">' + n + '</div>';
    $('deck').innerHTML = h;
  }

  function renderTrick() {
    const plays = lastTrick ? lastTrick.plays : game.round.trick ? game.round.trick.plays : [];
    const winner = lastTrick ? lastTrick.winner : null;
    $('trick').innerHTML = plays
      .map((p) => '<div class="slot ' + posOf(p.seat) + (winner === p.seat ? ' won' : '') + '">' + p.cards.map((c) => cardHtml(c)).join('') + '</div>')
      .join('');
  }

  function renderHand() {
    const hand = game.round.hands[0].slice().sort((a, b) =>
      a.suit === b.suit ? Cards.strength(a) - Cards.strength(b) : Cards.SUITS.indexOf(a.suit) - Cards.SUITS.indexOf(b.suit)
    );
    $('hand').innerHTML = hand.map((c) => cardHtml(c, selected.has(c.id) ? 'sel' : '')).join('');
  }

  function isHumanTurn() {
    return !!game && !busy && !game.round.over && Game.currentSeat(game) === 0;
  }

  function needCount() {
    const t = game.round.trick;
    return t ? t.plays[0].cards.length : 0;
  }

  function canPlay() {
    if (!isHumanTurn()) return false;
    return game.round.trick ? selected.size === needCount() : selected.size >= 1;
  }

  function renderStatus() {
    const r = game.round;
    const cur = Game.currentSeat(game);
    let txt = '';
    if (!r.over && !busy) {
      if (cur === 0) txt = r.trick ? I.t('pickN', { n: needCount() }) : I.t('pickLead');
      else txt = I.t('thinking', { name: seatName(cur) });
    }
    $('status').textContent = txt;
    const combo = Rules.detectCombo(r.hands[0]);
    const locked = busy || r.over;
    $('buraBtn').classList.toggle('hidden', combo !== 'bura' || locked);
    $('moskvaBtn').classList.toggle('hidden', combo !== 'moskva' || locked || r.moskva.includes(0));
    $('playBtn').disabled = !canPlay();
  }

  function renderAll() {
    renderHud();
    renderSeats();
    renderDeck();
    renderTrick();
    renderHand();
    renderStatus();
  }

  // ---------- Xabarlar va modal ----------
  function toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
  }
  function showModal(html) {
    $('modalBox').innerHTML = html;
    $('modal').classList.remove('hidden');
  }
  function hideModal() {
    $('modal').classList.add('hidden');
  }

  // ---------- O'yin oqimi ----------
  function startGame(m) {
    mode = m;
    token++;
    game = Game.createGame(m);
    selected = new Set();
    busy = false;
    lastTrick = null;
    hideModal();
    $('menu').classList.add('hidden');
    $('game').classList.remove('hidden');
    loop();
  }

  function loop() {
    renderAll();
    if (game.round.over) return;
    if (Game.currentSeat(game) !== 0) {
      const tk = token;
      setTimeout(() => botTurn(tk), 700 + Math.random() * 500);
    }
  }

  function botTurn(tk) {
    if (tk !== token || !game || game.round.over || busy) return;
    const seat = Game.currentSeat(game);
    if (seat === 0) return;
    let res;
    try {
      res = Bot.move(game, seat);
    } catch (e) {
      console.error(e);
      return;
    }
    if (res.kind === 'bura') {
      toast(I.t('buraDeclared', { name: seatName(seat) }));
      endRound();
      return;
    }
    afterMove(res.event);
  }

  function afterMove(ev) {
    if (ev.type === 'trick') {
      lastTrick = ev;
      busy = true;
      renderAll();
      const tk = token;
      setTimeout(() => {
        if (tk !== token) return;
        lastTrick = null;
        busy = false;
        if (ev.roundOver) endRound();
        else loop();
      }, 1500);
    } else {
      loop();
    }
  }

  function onCardClick(id) {
    if (!isHumanTurn()) return;
    const r = game.round;
    if (selected.has(id)) {
      selected.delete(id);
    } else if (!r.trick) {
      // Hujum: faqat bir mastdagi kartalar
      const hand = r.hands[0];
      const clicked = hand.find((c) => c.id === id);
      const firstId = selected.values().next().value;
      const first = firstId ? hand.find((c) => c.id === firstId) : null;
      if (first && first.suit !== clicked.suit) selected.clear();
      selected.add(id);
    } else {
      if (selected.size >= needCount()) selected.clear();
      selected.add(id);
    }
    renderHand();
    renderStatus();
  }

  function playSelected() {
    if (!canPlay()) return;
    const ids = Array.from(selected);
    try {
      const ev = game.round.trick ? Game.playResponse(game, 0, ids) : Game.playLead(game, 0, ids);
      selected.clear();
      afterMove(ev);
    } catch (e) {
      toast(e.message);
    }
  }

  function declareBura() {
    if (busy || game.round.over) return;
    try {
      Game.declareBura(game, 0);
      selected.clear();
      toast(I.t('buraDeclared', { name: seatName(0) }));
      endRound();
    } catch (e) {
      toast(e.message);
    }
  }

  function declareMoskva() {
    if (busy || game.round.over) return;
    try {
      const ev = Game.declareMoskva(game, 0);
      const aces = ev.aces.map((c) => c.rank + SUIT[c.suit]).join(' ');
      toast(I.t('moskvaDeclared', { name: seatName(0) }) + '  ' + aces);
      renderStatus();
    } catch (e) {
      toast(e.message);
    }
  }

  function endRound() {
    renderAll();
    const res = game.round.result;
    const myTeam = Game.teamOf(game, 0);
    let html = '<h2>' + I.t('roundOver') + '</h2>';
    if (res.type === 'bura') html += '<p class="big">' + I.t('buraDeclared', { name: esc(seatName(res.seat)) }) + '</p>';
    else if (res.draw) html += '<p class="big">' + I.t('draw', { m: game.multiplier }) + '</p>';

    html += '<table><tr><th>' + I.t('colTeam') + '</th><th>' + I.t('colPoints') + '</th><th>' + I.t('colAdded') + '</th><th>' + I.t('colTotal') + '</th></tr>';
    game.teams.forEach((t, i) => {
      const pts = res.teamPoints ? res.teamPoints[i] : '–';
      html += '<tr class="' + (i === myTeam ? 'me' : '') + '"><td>' + esc(teamName(i)) + '</td><td>' + pts + '</td><td>+' + res.penalties[i] + '</td><td>' + game.penalties[i] + ' / ' + game.target + '</td></tr>';
    });
    html += '</table>';

    if (game.over) {
      const lost = game.loserTeam === myTeam;
      html += '<p class="big">' + (lost ? I.t('lose') : I.t('win')) + '</p>';
      if (!lost && game.teams.length > 2) html += '<p>' + I.t('loserIs', { name: esc(teamName(game.loserTeam)) }) + '</p>';
      html += '<div class="row"><button id="mAgain" class="primary">' + I.t('again') + '</button><button id="mMenu">' + I.t('menu') + '</button></div>';
    } else {
      html += '<div class="row"><button id="mNext" class="primary">' + I.t('next') + '</button></div>';
    }
    showModal(html);

    const again = $('mAgain');
    if (again) again.onclick = () => startGame(mode);
    const menu = $('mMenu');
    if (menu) menu.onclick = toMenu;
    const next = $('mNext');
    if (next) next.onclick = () => {
      hideModal();
      selected.clear();
      Game.nextRound(game);
      loop();
    };
  }

  function toMenu() {
    token++;
    hideModal();
    $('game').classList.add('hidden');
    $('menu').classList.remove('hidden');
  }

  // ---------- Til va menyu ----------
  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = I.t(el.dataset.i18n)));
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = I.t(el.dataset.i18nPh)));
    document.querySelectorAll('.lang').forEach((b) => b.classList.toggle('on', b.dataset.lang === I.getLang()));
    if (game && !$('game').classList.contains('hidden')) renderAll();
  }

  function init() {
    I.init();
    nick = load('bura_nick') || '';
    $('nick').value = nick;
    applyLang();

    document.querySelectorAll('.lang').forEach((b) =>
      b.addEventListener('click', () => {
        I.setLang(b.dataset.lang);
        applyLang();
      })
    );
    $('nick').addEventListener('input', () => {
      nick = $('nick').value.trim();
      save('bura_nick', nick);
    });
    document.querySelectorAll('.mode[data-mode]').forEach((b) => b.addEventListener('click', () => startGame(b.dataset.mode)));

    $('hand').addEventListener('click', (e) => {
      const el = e.target.closest('.card');
      if (el) onCardClick(el.dataset.id);
    });
    $('playBtn').addEventListener('click', playSelected);
    $('buraBtn').addEventListener('click', declareBura);
    $('moskvaBtn').addEventListener('click', declareMoskva);
    $('menuBtn').addEventListener('click', toMenu);
  }

  init();
})();
