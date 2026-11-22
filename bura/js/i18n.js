// Tillar: o'zbekcha va ruscha.
(function (root) {
  const T = {
    uz: {
      nick: 'Ismingiz',
      nickPlaceholder: 'Ism kiriting',
      m1v1: '1 vs 1 (botga qarshi)',
      m2v2: '2 vs 2 (sherik bot bilan)',
      mffa: '4 kishi (hamma o\'zi uchun)',
      online: 'Onlayn (tez orada)',
      you: 'Siz',
      bot: 'Bot',
      partner: 'Sherik',
      opp: 'Raqib',
      pickLead: 'Sizning yurishingiz: bir mastdan 1–4 ta karta tanlang',
      pickN: 'Javob uchun {n} ta karta tanlang',
      thinking: '{name} o\'ylayapti...',
      play: 'Tashlash',
      bura: 'BURA!',
      moskva: 'MOSKVA!',
      trump: 'Kozir',
      round: 'Raund',
      penalty: 'Jarima',
      roundOver: 'Raund tugadi',
      colTeam: 'Tomon',
      colPoints: 'Ochko',
      colAdded: 'Ketdi',
      colTotal: 'Jami',
      next: 'Keyingi raund',
      again: 'Yana o\'ynash',
      menu: 'Menyu',
      win: 'G\'alaba!',
      lose: 'Siz yutqazdingiz',
      loserIs: 'Yutqazdi: {name}',
      draw: 'Durang! Keyingi raundda jarima x{m}',
      buraDeclared: '{name} BURA e\'lon qildi!',
      moskvaDeclared: '{name}: MOSKVA!',
      wasWinner: 'Raund yutildi',
    },
    ru: {
      nick: 'Ваше имя',
      nickPlaceholder: 'Введите имя',
      m1v1: '1 на 1 (против бота)',
      m2v2: '2 на 2 (с ботом-партнёром)',
      mffa: '4 игрока (каждый за себя)',
      online: 'Онлайн (скоро)',
      you: 'Вы',
      bot: 'Бот',
      partner: 'Партнёр',
      opp: 'Соперник',
      pickLead: 'Ваш ход: выберите 1–4 карты одной масти',
      pickN: 'Выберите {n} карт для ответа',
      thinking: '{name} думает...',
      play: 'Походить',
      bura: 'БУРА!',
      moskva: 'МОСКВА!',
      trump: 'Козырь',
      round: 'Раунд',
      penalty: 'Штраф',
      roundOver: 'Раунд окончен',
      colTeam: 'Сторона',
      colPoints: 'Очки',
      colAdded: 'Штраф',
      colTotal: 'Всего',
      next: 'Следующий раунд',
      again: 'Играть ещё',
      menu: 'Меню',
      win: 'Победа!',
      lose: 'Вы проиграли',
      loserIs: 'Проиграл: {name}',
      draw: 'Ничья! В следующем раунде штраф x{m}',
      buraDeclared: '{name} объявил БУРУ!',
      moskvaDeclared: '{name}: МОСКВА!',
      wasWinner: 'Раунд выигран',
    },
  };

  let lang = 'uz';

  function setLang(l) {
    if (T[l]) lang = l;
    try { localStorage.setItem('bura_lang', lang); } catch (e) {}
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }

  function getLang() {
    return lang;
  }

  function t(key, params) {
    let s = (T[lang] && T[lang][key]) || T.uz[key] || key;
    if (params) for (const k of Object.keys(params)) s = s.split('{' + k + '}').join(params[k]);
    return s;
  }

  function init() {
    try {
      const saved = localStorage.getItem('bura_lang');
      if (saved && T[saved]) lang = saved;
    } catch (e) {}
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }

  const api = { t, setLang, getLang, init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BuraI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
