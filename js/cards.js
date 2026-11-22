// Kartalar: kolodа, ochkolar, kozir, taqsimlash.
(function (root) {
  const SUITS = ['S', 'H', 'D', 'C']; // pika, chirva, qarg'a (bubi), qora (trefa)
  // Kuch tartibi: indeks qancha katta bo'lsa, shuncha kuchli.
  const RANKS = ['6', '7', '8', '9', 'J', 'Q', 'K', '10', 'A'];
  const POINTS = { '6': 0, '7': 0, '8': 0, '9': 0, J: 2, Q: 3, K: 4, '10': 10, A: 11 };

  function card(rank, suit) {
    return { rank, suit, id: rank + suit };
  }

  function createDeck() {
    const deck = [];
    for (const s of SUITS) for (const r of RANKS) deck.push(card(r, s));
    return deck;
  }

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function strength(c) {
    return RANKS.indexOf(c.rank);
  }

  function points(cards) {
    return cards.reduce((sum, c) => sum + POINTS[c.rank], 0);
  }

  // Kolodа massivining oxiridan olinadi (pop).
  // stock[0] = eng pastdagi yopiq karta, stock[1] = kozir karta.
  function newStock(rng) {
    const stock = shuffle(createDeck(), rng);
    return {
      stock,
      hiddenCard: stock[0],
      trumpCard: stock[1],
      trumpSuit: stock[1].suit,
    };
  }

  function draw(stock, n) {
    const out = [];
    while (out.length < n && stock.length > 0) out.push(stock.pop());
    return out;
  }

  // Har kimga 4 tadan, bittadan emas, to'rttadan beriladi.
  function deal(stock, playerCount, handSize) {
    handSize = handSize || 4;
    const hands = [];
    for (let p = 0; p < playerCount; p++) hands.push(draw(stock, handSize));
    return hands;
  }

  const api = { SUITS, RANKS, POINTS, createDeck, shuffle, strength, points, newStock, draw, deal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BuraCards = api;
})(typeof window !== 'undefined' ? window : globalThis);
