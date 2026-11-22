// Ishga tushirish: node tests/test_rules.js
const assert = require('assert');
const Cards = require('../js/cards.js');
const Rules = require('../js/rules.js');

const c = (rank, suit) => ({ rank, suit, id: rank + suit });

// Kolodа
const deck = Cards.createDeck();
assert.strictEqual(deck.length, 36);
assert.strictEqual(Cards.points(deck), 120);

// Kozir tayyorlash
const s = Cards.newStock();
assert.strictEqual(s.stock.length, 36);
assert.strictEqual(s.trumpSuit, s.trumpCard.suit);
assert.strictEqual(s.stock[1], s.trumpCard);
assert.strictEqual(s.stock[0], s.hiddenCard);

// Taqsimlash: 4 kishi x 4 karta, qolgan 20
const hands = Cards.deal(s.stock, 4);
assert.strictEqual(hands.length, 4);
hands.forEach((h) => assert.strictEqual(h.length, 4));
assert.strictEqual(s.stock.length, 20);

// Oxirgi olinadigan kartalar: avval kozir, keyin yopiq
const rest = Cards.draw(s.stock, 20);
assert.strictEqual(rest[18], s.trumpCard);
assert.strictEqual(rest[19], s.hiddenCard);

// Urish
assert.ok(Rules.cardBeats(c('A', 'H'), c('K', 'H'), 'S'));
assert.ok(!Rules.cardBeats(c('K', 'H'), c('A', 'H'), 'S'));
assert.ok(Rules.cardBeats(c('6', 'S'), c('A', 'H'), 'S')); // kozir urdi
assert.ok(!Rules.cardBeats(c('A', 'D'), c('6', 'H'), 'S')); // boshqa mast urmaydi
assert.ok(!Rules.cardBeats(c('7', 'S'), c('6', 'S'), 'S') === false);

// Ko'p kartali hujum
const lead = [c('K', 'H'), c('Q', 'H')];
assert.strictEqual(Rules.trickWinner(lead, [c('A', 'H'), c('10', 'H')], 'S'), 'defender');
assert.strictEqual(Rules.trickWinner(lead, [c('A', 'H'), c('7', 'H')], 'S'), 'attacker');
assert.strictEqual(Rules.trickWinner(lead, [c('6', 'S'), c('7', 'S')], 'S'), 'defender');
assert.strictEqual(Rules.trickWinner(lead, [c('A', 'H')], 'S'), 'attacker'); // soni boshqa

// Hujum to'g'riligi
assert.ok(Rules.isValidLead([c('K', 'H'), c('Q', 'H')]));
assert.ok(!Rules.isValidLead([c('K', 'H'), c('Q', 'D')]));
assert.ok(!Rules.isValidLead([]));

// Kombinatsiyalar
assert.strictEqual(Rules.detectCombo([c('A', 'H'), c('A', 'S'), c('A', 'D'), c('A', 'C')]), 'bura');
assert.strictEqual(Rules.detectCombo([c('A', 'H'), c('A', 'S'), c('A', 'D'), c('6', 'C')]), 'moskva');
assert.strictEqual(Rules.detectCombo([c('A', 'H'), c('A', 'S'), c('7', 'D'), c('6', 'C')]), null);

console.log('Hamma testlar o\'tdi');
