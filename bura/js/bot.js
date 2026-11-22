// Bot mantiqi: oddiy, lekin to'g'ri o'ynaydi.
(function (root) {
  const isNode = typeof module !== 'undefined' && module.exports;
  const Cards = isNode ? require('./cards.js') : root.BuraCards;
  const Rules = isNode ? require('./rules.js') : root.BuraRules;
  const Game = isNode ? require('./game.js') : root.BuraGame;

  // Kartani "sarflash narxi": ochkosi baland va kozir bo'lsa qimmat.
  function cost(c, trump) {
    return Cards.POINTS[c.rank] + (c.suit === trump ? 20 : 0) + Cards.strength(c) * 0.1;
  }

  function sumCost(cards, trump) {
    return cards.reduce((s, c) => s + cost(c, trump), 0);
  }

  function combinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const out = [];
    arr.forEach((x, i) => {
      for (const rest of combinations(arr.slice(i + 1), k - 1)) out.push([x].concat(rest));
    });
    return out;
  }

  function chooseLead(game, seat) {
    const r = game.round;
    const hand = r.hands[seat];
    const trump = r.trumpSuit;

    // Kozir bo'lmagan mastda 2 ta va undan ko'p yuqori karta (tuz/10) bo'lsa, birga tashlaydi.
    const bySuit = {};
    hand.forEach((c) => (bySuit[c.suit] = bySuit[c.suit] || []).push(c));
    for (const suit of Object.keys(bySuit)) {
      if (suit === trump) continue;
      const strong = bySuit[suit].filter((c) => Cards.POINTS[c.rank] >= 10);
      if (strong.length >= 2 && Math.random() < 0.6) return strong.map((c) => c.id);
    }

    // Aks holda eng arzon kartani tashlaydi.
    const sorted = hand.slice().sort((a, b) => cost(a, trump) - cost(b, trump));
    return [sorted[0].id];
  }

  function chooseResponse(game, seat) {
    const r = game.round;
    const hand = r.hands[seat];
    const trump = r.trumpSuit;
    const t = r.trick;
    const k = t.plays[0].cards.length;
    const partnerWinning = t.topSeat !== seat && Game.teamOf(game, t.topSeat) === Game.teamOf(game, seat) && game.teams.some((tm) => tm.length > 1);

    let trickPoints = 0;
    for (const p of t.plays) trickPoints += Cards.points(p.cards);

    if (!partnerWinning) {
      let best = null;
      let bestCost = Infinity;
      for (const combo of combinations(hand, k)) {
        if (Rules.defenseBeats(t.top, combo, trump)) {
          const c = sumCost(combo, trump);
          if (c < bestCost) {
            bestCost = c;
            best = combo;
          }
        }
      }
      // Yutishga arziydigan bo'lsa urib oladi.
      if (best && (trickPoints >= 6 || bestCost <= 12)) return best.map((c) => c.id);
    }

    // Urolmasa yoki arzimasa, eng arzon kartalarni tashlaydi.
    return hand
      .slice()
      .sort((a, b) => cost(a, trump) - cost(b, trump))
      .slice(0, k)
      .map((c) => c.id);
  }

  // Botning to'liq yurishi: Bura bo'lsa e'lon qiladi, aks holda karta tashlaydi.
  function move(game, seat) {
    const r = game.round;
    if (Rules.detectCombo(r.hands[seat]) === 'bura') {
      return { kind: 'bura', result: Game.declareBura(game, seat) };
    }
    const event = r.trick
      ? Game.playResponse(game, seat, chooseResponse(game, seat))
      : Game.playLead(game, seat, chooseLead(game, seat));
    return { kind: 'move', event };
  }

  const api = { chooseLead, chooseResponse, move };
  if (isNode) module.exports = api;
  else root.BuraBot = api;
})(typeof window !== 'undefined' ? window : globalThis);
