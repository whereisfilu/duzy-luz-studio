# Duży Luz Studio — strona WWW

Strona `duzyluzstudio.pl`: prosty HTML + CSS + JavaScript, bez frameworków.
Hosting: Cloudflare Workers (pliki statyczne, ustawienia w `wrangler.jsonc`).

## Pliki
- `index.html` — struktura strony
- `style.css` — wygląd i wersja na telefon
- `script.js` — intro (REC → 4 uderzenia), licznik cen, odtwarzacz przed/po
- `assets/images/` — zdjęcia studia, logo, favicon, obrazek do udostępnień (`og.jpg`)
- `assets/audio/` — fragmenty numerów przed i po mixie (MP3)

## Odtwarzacz przed / po
Numery są zdefiniowane na liście `TRACKS` w `script.js`. Każdy ma dwa pliki
(`…-przed.mp3` i `…-po.mp3`), które muszą zaczynać się w tym samym momencie utworu.
Żeby dodać numer: wrzuć dwa pliki do `assets/audio/` i dopisz wiersz na liście `TRACKS`.
