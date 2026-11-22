// Urish qoidalari va kombinatsiyalar.
(function (root) {
  const Cards = typeof module !== 'undefined' && module.exports ? require('./cards.js') : root.BuraCards;

  // Hujumchi tashlagan kartalar to'g'rimi: 1-4 ta, hammasi bir mastda.
  function isValidLead(cards) {
    if (!cards || cards.length < 1 || cards.length > 4) return false;
    return cards.every((c) => c.suit === cards[0].suit);
  }

  // d karta a kartani uradimi?
  function cardBeats(d, a, trumpSuit) {
    if (d.suit === a.suit) return Cards.strength(d) > Cards.strength(a);
    return d.suit === trumpSuit && a.suit !== trumpSuit;
  }

  function permutations(arr) {
    if (arr.length <= 1) return [arr];
    const out = [];
    arr.forEach((x, i) => {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permutations(rest)) out.push([x].concat(p));
    });
    return out;
  }

  // Himoyachi hamma hujum kartalarini uradimi (har bir kartaga bittadan javob).
  function defenseBeats(lead, defense, trumpSuit) {
    if (lead.length !== defense.length) return false;
    return permutations(defense).some((perm) => perm.every((d, i) => cardBeats(d, lead[i], trumpSuit)));
  }

  // Yurishni kim oladi: 'defender' yoki 'attacker'.
  function trickWinner(lead, defense, trumpSuit) {
    return defenseBeats(lead, defense, trumpSuit) ? 'defender' : 'attacker';
  }

  // Qo'ldagi kombinatsiya: 'bura' (4 tuz), 'moskva' (3 tuz) yoki null.
  function detectCombo(hand) {
    const aces = hand.filter((c) => c.rank === 'A').length;
    if (aces >= 4) return 'bura';
    if (aces === 3) return 'moskva';
    return null;
  }

  const api = { isValidLead, cardBeats, defenseBeats, trickWinner, detectCombo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BuraRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
