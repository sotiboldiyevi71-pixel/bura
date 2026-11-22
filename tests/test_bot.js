// Ishga tushirish: node tests/test_bot.js
// Botlar o'zaro to'liq o'yinlar o'ynaydi, har bir yurish qoidaga mos bo'lishi shart (aks holda xato chiqadi).
const assert = require('assert');
const Game = require('../js/game.js');
const Bot = require('../js/bot.js');

let buraCount = 0;
for (const mode of ['1v1', '2v2', 'ffa']) {
  for (let i = 0; i < 150; i++) {
    const g = Game.createGame(mode);
    let rounds = 0;
    while (!g.over && rounds++ < 300) {
      let guard = 0;
      while (!g.round.over) {
        assert.ok(guard++ < 1000, 'cheksiz tsikl');
        const res = Bot.move(g, Game.currentSeat(g));
        if (res.kind === 'bura') buraCount++;
      }
      if (g.round.result.type === 'normal') {
        const total = g.round.result.teamPoints.reduce((a, b) => a + b, 0);
        assert.strictEqual(total, 120);
      }
      if (!g.over) Game.nextRound(g);
    }
    assert.ok(g.over, 'o\'yin tugashi kerak');
  }
}
console.log('Bot testlari o\'tdi (bura e\'lonlari: ' + buraCount + ')');
