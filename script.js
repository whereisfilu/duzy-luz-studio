const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const year = document.querySelector('#year');

if (year) year.textContent = new Date().getFullYear();

const desktopHeader = window.matchMedia('(min-width: 981px)');

const syncHeaderState = () => {
  header?.classList.toggle('scrolled', desktopHeader.matches && window.scrollY > 24);
};

syncHeaderState();
window.addEventListener('scroll', syncHeaderState, { passive: true });
desktopHeader.addEventListener?.('change', syncHeaderState);

menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

nav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.13 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// BEFORE / AFTER PLAYER
// Gdy będziemy mieli pliki audio, wrzuć je do assets/audio jako:
// before.mp3 i after.mp3. Następnie zmień audioReady na true.
const audioReady = false;
const player = document.querySelector('.ab-player');
const beforeAudio = document.querySelector('#audio-before');
const afterAudio = document.querySelector('#audio-after');
const playButton = document.querySelector('.play-button');
const choices = [...document.querySelectorAll('.ab-choice')];

if (audioReady && player && beforeAudio && afterAudio && playButton) {
  beforeAudio.src = 'assets/audio/before.mp3';
  afterAudio.src = 'assets/audio/after.mp3';
  playButton.disabled = false;
  player.dataset.audioReady = 'true';

  let activeAudio = beforeAudio;

  playButton.addEventListener('click', async () => {
    if (activeAudio.paused) {
      await activeAudio.play();
      playButton.textContent = '❚❚';
      playButton.setAttribute('aria-label', 'Pauza');
    } else {
      activeAudio.pause();
      playButton.textContent = '▶';
      playButton.setAttribute('aria-label', 'Odtwórz');
    }
  });

  choices.forEach(choice => choice.addEventListener('click', async () => {
    const next = choice.dataset.version === 'after' ? afterAudio : beforeAudio;
    if (next === activeAudio) return;

    const time = activeAudio.currentTime;
    const wasPlaying = !activeAudio.paused;
    activeAudio.pause();
    next.currentTime = Math.min(time, Number.isFinite(next.duration) ? next.duration : time);
    activeAudio = next;

    choices.forEach(c => c.classList.toggle('active', c === choice));
    if (wasPlaying) await activeAudio.play();
  }));
} else {
  choices.forEach(choice => choice.addEventListener('click', () => {
    choices.forEach(c => c.classList.toggle('active', c === choice));
  }));
}
