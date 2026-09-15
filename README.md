# Duży Luz Studio — strona WWW

Pierwsza działająca wersja strony `duzyluzstudio.pl`.

## Pliki
- `index.html` — struktura strony
- `style.css` — cały wygląd i responsywność
- `script.js` — menu, animacje i przygotowanie playera A/B
- `assets/images/` — zoptymalizowane zdjęcia i logo
- `assets/audio/` — tu później dodamy `before.mp3` i `after.mp3`

## Jak wrzucić na GitHub
W repozytorium `duzy-luz-studio` wybierz **uploading an existing file**, przeciągnij całą zawartość tego folderu i zatwierdź commit.

Ważne: pliki `index.html`, `style.css` i `script.js` mają leżeć w głównym katalogu repo, nie w dodatkowym folderze `duzy-luz-studio/duzy-luz-studio`.

## Audio Before / After
Po otrzymaniu audio:
1. dodaj `assets/audio/before.mp3`
2. dodaj `assets/audio/after.mp3`
3. w `script.js` zmień:

```js
const audioReady = false;
```

na:

```js
const audioReady = true;
```

Player będzie przełączał obie wersje w tym samym momencie utworu.
