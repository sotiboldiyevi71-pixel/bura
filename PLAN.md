# BURA — Loyiha rejasi

## Maqsad
Brauzerda o'ynaladigan Bura karta o'yini. Keyin PWA orqali Play Market'ga chiqariladi.

## Texnologiyalar
- HTML + CSS + JavaScript (framework yo'q, build kerak emas)
- GitHub Pages (hosting)
- Firebase Realtime Database (onlayn xonalar, bepul tarif)
- Botlar: brauzerda
- Tillar: o'zbekcha / ruscha (o'yin boshida tanlanadi)

## Papka tuzilmasi
```
bura/
  index.html
  css/style.css
  js/
    cards.js        # kolodа, ochkolar
    rules.js        # urish qoidalari, kombinatsiyalar
    game.js         # o'yin holati, raundlar, hisob
    bot.js          # bot mantiqi
    ui.js           # stol, animatsiya
    i18n.js         # uz / ru matnlar
    online.js       # Firebase, xonalar, nik, taklif
  assets/
  manifest.json     # PWA (keyinroq)
  RULES.md
  PLAN.md
```

## Bosqichlar
1. Qoidalar va reja (shu fayllar) — qoidalarni tasdiqlash
2. Mantiq: kartalar, taqsimlash, kozir, urish, hisob (testlar bilan)
3. Botlar bilan o'ynash + stol dizayni -> GitHub Pages'ga chiqarish
4. Til tanlash (uz/ru), 1v1, 2v2, 4 kishi rejimlari
5. Onlayn xona: nik kiritish, xona kodi/havola, nik bo'yicha sherikni chaqirish, bo'sh joyga bot
6. Sayqallash: tovush, mobil moslik, qayta ulanish
7. PWA va Play Market

## Muhim
- Dizayn va kartalar o'zimizniki bo'ladi (boshqa o'yinning rasmlari ishlatilmaydi).
- Haqiqiy pul bilan o'ynash yo'q.
