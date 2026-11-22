// O'yin holati: raundlar, yurishlar, to'ldirish, jarima hisobi.
(function (root) {
  const isNode = typeof module !== 'undefined' && module.exports;
  const Cards = isNode ? require('./cards.js') : root.BuraCards;
  const Rules = isNode ? require('./rules.js') : root.BuraRules;

  const BURA_PENALTY = 6;
  const DEFAULT_TARGET = 12;

  function teamsFor(mode) {
    if (mode === '1v1') return [[0], [1]];
    if (mode === '2v2') return [[0, 2], [1, 3]]; // sherik qarshisida
    if (mode === 'ffa') return [[0], [1], [2], [3]];
    throw new Error('Noma\'lum rejim: ' + mode);
  }

  // Raund oxirida yutqazgan tomonning olgan ochkosiga qarab jarima.
  function penaltyForPoints(points) {
    if (points === 0) return 6;
    if (points < 31) return 4;
    return 2;
  }

  function teamOf(game, seat) {
    return game.teams.findIndex((t) => t.includes(seat));
  }

  function createGame(mode, opts) {
    opts = opts || {};
    const teams = teamsFor(mode);
    const game = {
      mode,
      seats: mode === '1v1' ? 2 : 4,
      teams,
      penalties: teams.map(() => 0),
      multiplier: 1,
      target: opts.target || DEFAULT_TARGET,
      rng: opts.rng,
      deferRefill: !!opts.deferRefill,
      // Birinchi raundda 0-o'rindagi (odam) hujumchi bo'lishi uchun
      dealer: opts.dealer !== undefined ? opts.dealer : mode === '1v1' ? 1 : 3,
      roundNo: 0,
      over: false,
      loserTeam: null,
      round: null,
    };
    startRound(game);
    return game;
  }

  function startRound(game) {
    const s = Cards.newStock(game.rng);
    const hands = Cards.deal(s.stock, game.seats, 4);
    game.roundNo += 1;
    game.round = {
      stock: s.stock,
      trumpCard: s.trumpCard,
      trumpSuit: s.trumpSuit,
      hiddenCard: s.hiddenCard,
      hands,
      taken: hands.map(() => []),
      attacker: (game.dealer + 1) % game.seats,
      trick: null, // { lead, plays: [{seat, cards}], top, topSeat }
      moskva: [],
      over: false,
      result: null,
    };
    return game.round;
  }

  function takeFromHand(hand, ids) {
    const picked = [];
    for (const id of ids) {
      const i = hand.findIndex((c) => c.id === id);
      if (i < 0 || picked.some((p) => p.id === id)) throw new Error('Kartada xato: ' + id);
      picked.push(hand[i]);
    }
    return picked;
  }

  function removeFromHand(hand, cards) {
    for (const c of cards) hand.splice(hand.findIndex((h) => h.id === c.id), 1);
  }

  // Navbati kelgan o'yinchi (hujumchi yoki javob beruvchi).
  function currentSeat(game) {
    const r = game.round;
    if (!r.trick) return r.attacker;
    return (r.attacker + r.trick.plays.length) % game.seats;
  }

  function playLead(game, seat, ids) {
    const r = game.round;
    if (r.over) throw new Error('Raund tugagan');
    if (r.trick) throw new Error('Yurish allaqachon boshlangan');
    if (seat !== r.attacker) throw new Error('Hozir sizning navbatingiz emas');
    const cards = takeFromHand(r.hands[seat], ids);
    if (!Rules.isValidLead(cards)) throw new Error('Hujum noto\'g\'ri: 1-4 ta karta, bir mastda');
    const minHand = Math.min(...r.hands.map((h) => h.length));
    if (cards.length > minHand) throw new Error('Boshqa o\'yinchida shuncha karta yo\'q');
    removeFromHand(r.hands[seat], cards);
    r.trick = { plays: [{ seat, cards }], top: cards, topSeat: seat };
    return { type: 'lead', seat, cards };
  }

  function playResponse(game, seat, ids) {
    const r = game.round;
    if (r.over) throw new Error('Raund tugagan');
    if (!r.trick) throw new Error('Avval hujum bo\'lishi kerak');
    if (seat !== currentSeat(game)) throw new Error('Hozir sizning navbatingiz emas');
    const lead = r.trick.plays[0].cards;
    if (ids.length !== lead.length) throw new Error('Hujumchi ' + lead.length + ' ta karta tashladi');
    const cards = takeFromHand(r.hands[seat], ids);
    removeFromHand(r.hands[seat], cards);
    r.trick.plays.push({ seat, cards });
    // Hozirgi eng kuchli kombinatsiyani urgan bo'lsa, u yangi "top".
    if (Rules.defenseBeats(r.trick.top, cards, r.trumpSuit)) {
      r.trick.top = cards;
      r.trick.topSeat = seat;
    }
    if (r.trick.plays.length < game.seats) return { type: 'response', seat, cards, done: false };
    return resolveTrick(game);
  }

  function refill(game) {
    const r = game.round;
    // Navbat bilan bittadan, hamma 4 taga yetguncha yoki kolodа tugaguncha.
    let progress = true;
    while (r.stock.length > 0 && progress) {
      progress = false;
      for (let k = 0; k < game.seats && r.stock.length > 0; k++) {
        const seat = (r.attacker + k) % game.seats;
        if (r.hands[seat].length < 4) {
          r.hands[seat].push(r.stock.pop());
          progress = true;
        }
      }
    }
  }

  function resolveTrick(game) {
    const r = game.round;
    const winner = r.trick.topSeat;
    const all = [];
    for (const p of r.trick.plays) all.push(...p.cards);
    r.taken[winner].push(...all);
    const trick = r.trick;
    r.trick = null;
    r.attacker = winner;
    // Interfeys animatsiya uchun to'ldirishni keyinga qoldirishi mumkin (Game.refill ni o'zi chaqiradi).
    if (!game.deferRefill) refill(game);
    const roundOver = r.hands.every((h) => h.length === 0) && r.stock.length === 0;
    const ev = { type: 'trick', winner, plays: trick.plays, done: true, roundOver };
    if (roundOver) ev.score = finishRound(game);
    return ev;
  }

  function seatPoints(game) {
    return game.round.taken.map((t) => Cards.points(t));
  }

  function teamPoints(game) {
    const sp = seatPoints(game);
    return game.teams.map((t) => t.reduce((s, seat) => s + sp[seat], 0));
  }

  // Raund oxiri: jarima hisoblanadi.
  function finishRound(game) {
    const r = game.round;
    const tp = teamPoints(game);
    let winners;
    const max = Math.max(...tp);
    if (game.teams.length === 2) {
      winners = tp[0] > 60 ? [0] : tp[1] > 60 ? [1] : [];
    } else {
      // [?] 4 kishi hamma o'zi uchun: eng ko'p ochko olgan yutadi, bo'lsa tenglik durang.
      const top = tp.filter((p) => p === max).length;
      winners = top === 1 ? [tp.indexOf(max)] : [];
    }
    const result = { type: 'normal', teamPoints: tp, winners, draw: winners.length === 0, penalties: game.teams.map(() => 0), multiplier: game.multiplier };
    if (result.draw) {
      game.multiplier *= 2; // [?] ketma-ket durangda yana 2 barobar
    } else {
      game.teams.forEach((_, i) => {
        if (!winners.includes(i)) result.penalties[i] = penaltyForPoints(tp[i]) * game.multiplier;
      });
      game.multiplier = 1;
    }
    applyPenalties(game, result);
    return result;
  }

  function applyPenalties(game, result) {
    const r = game.round;
    r.over = true;
    r.result = result;
    result.penalties.forEach((p, i) => (game.penalties[i] += p));
    const worst = Math.max(...game.penalties);
    if (worst >= game.target) {
      game.over = true;
      game.loserTeam = game.penalties.indexOf(worst); // 12 ga yetgan yutqazadi
    }
  }

  // Bura: qo'lda 4 ta tuz. Raund zudlik bilan tugaydi, boshqa tomonlarga 6 ochko ketadi.
  function declareBura(game, seat) {
    const r = game.round;
    if (r.over) throw new Error('Raund tugagan');
    if (Rules.detectCombo(r.hands[seat]) !== 'bura') throw new Error('Sizda 4 ta tuz yo\'q');
    const team = teamOf(game, seat);
    const result = { type: 'bura', seat, team, penalties: game.teams.map((_, i) => (i === team ? 0 : BURA_PENALTY * game.multiplier)), multiplier: game.multiplier };
    game.multiplier = 1;
    applyPenalties(game, result);
    return result;
  }

  // Moskva: 3 ta tuz, hohlagan payt e'lon qilinadi, hech narsa bermaydi.
  function declareMoskva(game, seat) {
    const r = game.round;
    const combo = Rules.detectCombo(r.hands[seat]);
    if (combo !== 'moskva' && combo !== 'bura') throw new Error('Sizda 3 ta tuz yo\'q');
    if (!r.moskva.includes(seat)) r.moskva.push(seat);
    return { type: 'moskva', seat, aces: r.hands[seat].filter((c) => c.rank === 'A') };
  }

  function nextRound(game) {
    if (game.over) throw new Error('O\'yin tugagan');
    if (!game.round.over) throw new Error('Raund hali tugamagan');
    game.dealer = (game.dealer + 1) % game.seats;
    return startRound(game);
  }

  const api = { refill, finishRound, createGame, startRound, nextRound, playLead, playResponse, declareBura, declareMoskva, currentSeat, teamOf, teamPoints, penaltyForPoints, BURA_PENALTY };
  if (isNode) module.exports = api;
  else root.BuraGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
