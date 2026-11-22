// Ishga tushirish: node tests/test_game.js
const assert = require('assert');
const Cards = require('../js/cards.js');
const Game = require('../js/game.js');

const c = (rank, suit) => ({ rank, suit, id: rank + suit });

// Jarima jadvali
assert.strictEqual(Game.penaltyForPoints(0), 6);
assert.strictEqual(Game.penaltyForPoints(20), 4);
assert.strictEqual(Game.penaltyForPoints(30), 4);
assert.strictEqual(Game.penaltyForPoints(31), 2);
assert.strictEqual(Game.penaltyForPoints(55), 2);

// Tasodifiy to'g'ri o'ynash
function randomLead(hand, maxN) {
  const bySuit = {};
  hand.forEach((x) => (bySuit[x.suit] = bySuit[x.suit] || []).push(x));
  const suits = Object.keys(bySuit);
  const group = Cards.shuffle(bySuit[suits[Math.floor(Math.random() * suits.length)]]);
  const n = 1 + Math.floor(Math.random() * Math.min(group.length, maxN));
  return group.slice(0, n).map((x) => x.id);
}

function playRound(game) {
  const r = game.round;
  let lastEv = null;
  let guard = 0;
  while (!r.over) {
    assert.ok(guard++ < 500, 'cheksiz tsikl');
    const att = r.attacker;
    const ids = randomLead(r.hands[att], r.hands[att].length);
    Game.playLead(game, att, ids);
    for (let k = 1; k < game.seats; k++) {
      const seat = Game.currentSeat(game);
      const resp = Cards.shuffle(r.hands[seat]).slice(0, ids.length).map((x) => x.id);
      lastEv = Game.playResponse(game, seat, resp);
    }
  }
  return lastEv;
}

for (const mode of ['1v1', '2v2', 'ffa']) {
  for (let i = 0; i < 100; i++) {
    const g = Game.createGame(mode);
    let rounds = 0;
    while (!g.over && rounds++ < 200) {
      playRound(g);
      const res = g.round.result;
      if (res.type === 'normal') {
        const total = res.teamPoints.reduce((a, b) => a + b, 0);
        assert.strictEqual(total, 120, 'jami ochko 120 bo\'lishi kerak');
      }
      if (!g.over) Game.nextRound(g);
    }
    assert.ok(g.over, 'o\'yin tugashi kerak');
    assert.ok(Math.max(...g.penalties) >= 12);
  }
}

// Bura: 4 ta tuz -> raqibga 6 ochko
{
  const g = Game.createGame('1v1');
  g.round.hands[0] = [c('A', 'H'), c('A', 'S'), c('A', 'D'), c('A', 'C')];
  const res = Game.declareBura(g, 0);
  assert.deepStrictEqual(g.penalties, [0, 6]);
  assert.ok(g.round.over);
  assert.strictEqual(res.type, 'bura');
}

// Bura yolg'on e'lon qilinmaydi
{
  const g = Game.createGame('1v1');
  g.round.hands[0] = [c('A', 'H'), c('A', 'S'), c('A', 'D'), c('7', 'C')];
  assert.throws(() => Game.declareBura(g, 0));
}

// Moskva: hech narsa bermaydi, raund davom etadi
{
  const g = Game.createGame('1v1');
  g.round.hands[0] = [c('A', 'H'), c('A', 'S'), c('A', 'D'), c('7', 'C')];
  Game.declareMoskva(g, 0);
  assert.deepStrictEqual(g.penalties, [0, 0]);
  assert.ok(!g.round.over);
}

// Navbat tekshiruvi
{
  const g = Game.createGame('1v1');
  const other = (g.round.attacker + 1) % 2;
  assert.throws(() => Game.playLead(g, other, [g.round.hands[other][0].id]));
}

// Durang (60-60): jarima yo'q, keyingi raund jarimasi 2 barobar
{
  const mk = (list) => list.map(([r, s]) => c(r, s));
  const g = Game.createGame('1v1');
  g.round.hands = [[], []];
  g.round.stock = [];
  g.round.taken = [
    mk([['A', 'H'], ['A', 'S'], ['10', 'H'], ['10', 'S'], ['K', 'H'], ['K', 'S'], ['K', 'D'], ['Q', 'H'], ['Q', 'S']]),
    mk([['A', 'D'], ['A', 'C'], ['10', 'D'], ['10', 'C'], ['K', 'C'], ['Q', 'D'], ['Q', 'C'], ['J', 'H'], ['J', 'S'], ['J', 'D'], ['J', 'C']]),
  ];
  assert.strictEqual(Cards.points(g.round.taken[0]), 60);
  assert.strictEqual(Cards.points(g.round.taken[1]), 60);
  const res = Game.finishRound(g);
  assert.ok(res.draw);
  assert.deepStrictEqual(g.penalties, [0, 0]);
  assert.strictEqual(g.multiplier, 2);

  // Keyingi raund: 0 ochko olgan yutqazadi -> 6 x 2 = 12 jarima
  Game.nextRound(g);
  g.round.hands = [[], []];
  g.round.stock = [];
  g.round.taken = [mk([['A', 'H'], ['A', 'S'], ['A', 'D'], ['A', 'C'], ['10', 'H'], ['10', 'S'], ['10', 'D'], ['10', 'C'], ['K', 'H'], ['K', 'S'], ['K', 'D'], ['K', 'C']]), []];
  const res2 = Game.finishRound(g);
  assert.deepStrictEqual(res2.penalties, [0, 12]);
  assert.ok(g.over);
  assert.strictEqual(g.loserTeam, 1);
  assert.strictEqual(g.multiplier, 1);
}

// 61+ yutadi, boshqasi ochkosiga qarab jarima oladi (31 dan kam -> 4)
{
  const mk = (list) => list.map(([r, s]) => c(r, s));
  const g = Game.createGame('1v1');
  g.round.hands = [[], []];
  g.round.stock = [];
  g.round.taken = [
    mk([['A', 'H'], ['A', 'S'], ['A', 'D'], ['A', 'C'], ['10', 'H'], ['10', 'S'], ['10', 'D'], ['10', 'C'], ['K', 'H'], ['K', 'S']]), // 92
    mk([['K', 'D'], ['Q', 'D'], ['J', 'D']]), // 9
  ];
  const res = Game.finishRound(g);
  assert.deepStrictEqual(res.winners, [0]);
  assert.deepStrictEqual(res.penalties, [0, 4]);
}

console.log('Hamma o\'yin testlari o\'tdi');
