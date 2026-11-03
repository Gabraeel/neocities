// ======================================================= //
// total_days_wasted_here: 11
// ======================================================= //

// --- 0. EXTRA SCRIPTS --- //
// O calendar.js e carregado aqui: assim cada pagina so precisa de <script src="js/script.js">
const calendarScript = document.createElement("script");
calendarScript.src = "js/calendar.js";
document.head.appendChild(calendarScript);

// --- 0.1 SPLASH SCREEN --- //
// Tela de start: aparece uma vez por visita (some ao clicar no orbe)
let splashSeen = false;
try { splashSeen = sessionStorage.getItem("splashSeen") === "1"; } catch (e) {}

if (!splashSeen) {
  const splash = document.createElement("div");
  splash.id = "splash-screen";
  splash.innerHTML = `
    <button id="splash-start" title="Start">
      <img src="images/icons/opera-menu.png" alt="">
      <span>start</span>
    </button>
  `;
  document.body.appendChild(splash);
  splash.querySelector("#splash-start").focus();

  splash.querySelector("#splash-start").addEventListener("click", function () {
    try { sessionStorage.setItem("splashSeen", "1"); } catch (e) {}
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 700);
  });
}

// --- 1. INITIALIZATION --- //
Promise.all([
  fetch("partials/menu.html").then(r => r.text()),
  fetch("partials/header.html").then(r => r.text()),
  fetch("partials/player.html").then(r => r.text())
])
  .then(([menuData, headerData, playerData]) => {
    document.getElementById("menu-container").innerHTML = menuData;
    document.getElementById("header-container").innerHTML = headerData;
    updateMenuHighlight();

    const playerContainer = document.getElementById("player-container");
    if (playerContainer) {
      playerContainer.innerHTML = playerData;
      initMusicPlayer();
      checkGifVisibility(window.location.pathname); // 🪄 Checks GIFs on hard-reload!
    }
  })
  .catch(err => console.error("Holy moly!! An error occurred while loading the components:", err));

document.addEventListener('DOMContentLoaded', updateDiaryButtons);

window.addEventListener('popstate', function () {
  loadMagicPage(window.location.pathname);
});

// --- 2. GLOBAL ASSETS --- //
const sparkleSound = new Audio("https://file.garden/ab1wwlFYy3CJESe8/sparkles.wav");
const chatSound = new Audio("https://file.garden/ab1wwlFYy3CJESe8/chat.wav");
const msnEmojis = ["images/icons/note_icon.png", "images/icons/gem_icon.png", "images/icons/pizza_icon.png", "images/icons/speaker.png"];
let currentMsnIndex = 0;

document.addEventListener("click", function (e) {

  // A. Navigation (menus)
  const navLink = e.target.closest('a.aero-nav-btn');
  if (navLink) {
    e.preventDefault();
    const url = navLink.getAttribute('href');
    window.history.pushState(null, '', url);
    loadMagicPage(url);
    return;
  }

  // B. Logo Sparkles
  const logo = e.target.closest('.interactive-logo') || (e.target.id === "main-logo" ? e.target : null);
  if (logo) {
    handleLogoClick(logo);
  }

  // C. PFP Balloon
  const balloon = e.target.closest("#music-balloon") || (e.target.id === "music-balloon" ? e.target : null);
  if (balloon) {
    handleBalloonClick(balloon);
  }

  // D. Lightbox Gallery
  if (e.target.classList.contains('gallery-thumb') || e.target.classList.contains('album-art') || e.target.id === 'lightbox' || e.target.id === 'lightbox-close') {
    handleLightboxClick(e.target);
  }

  // E. Diary Carousel
  if (e.target.id === 'diary-prev' || e.target.id === 'diary-next') {
    handleDiaryClick(e.target);
  }

  // F. TM Opera O Easter Egg
  const mascot = e.target.closest('#opera-mascot');
  if (mascot) {
    handleOperaClick(mascot);
  }
});

// --- TM OPERA O EASTER EGG --- //
const mascotContainer = document.createElement('div');
mascotContainer.className = 'mascot-container';
mascotContainer.innerHTML = `
  <img src="images/opera-chibi.gif" id="opera-mascot" alt="TM Opera O Mascot" title="Click for a laugh from the King!">
  <audio id="opera-laugh-1" src="https://file.garden/ab1wwlFYy3CJESe8/opera_laugh1.mp3"></audio>
  <audio id="opera-laugh-2" src="https://file.garden/ab1wwlFYy3CJESe8/opera_laugh2.mp3"></audio>
`;
document.body.appendChild(mascotContainer);

function checkGifVisibility(url) {
  const gifs = document.querySelectorAll('.dynamic-gif');
  if (url.endsWith('index.html') || url.endsWith('/') || url === '') {
    gifs.forEach(g => g.style.display = 'flex');
  } else {
    gifs.forEach(g => g.style.display = 'none');
  }
}

// --- 3. ANIMATED CUSTOM CURSOR --- //
const magicCursor = document.createElement('img');
magicCursor.id = 'magic-cursor';
magicCursor.src = 'images/cursors/normal.gif';
document.body.appendChild(magicCursor);

// AJUSTES DO RASTRO DO CURSOR (mexa aqui!)
const CURSOR_TRAIL = {
  enabled: true,   // false = sem rastro (mais leve)
  rainbow: false,  // true = brilho arco-iris (bonito, mas PESADO: cada ponto usa filter)
  interval: 50     // milissegundos entre os pontos (maior = mais leve)
};

let rainbowHue = 0;
let lastTrailTime = 0;
let isOperaLaughing = false;

document.addEventListener('mouseleave', () => {
  magicCursor.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  magicCursor.style.opacity = '1';
});

let cursorTicking = false;
let currentMouseX = 0;
let currentMouseY = 0;
let currentTarget = null;

document.addEventListener('mousemove', (e) => {
  if (window.innerWidth <= 850) return;

  currentMouseX = e.clientX;
  currentMouseY = e.clientY;
  currentTarget = e.target;

  if (!cursorTicking) {
    window.requestAnimationFrame(updateMagicCursor);
    cursorTicking = true;
  }
});

function updateMagicCursor() {
  // cada janela rola por dentro: em cima da barra de rolagem dela, usa o cursor normal
  let isOverScrollbar = false;
  const scroller = currentTarget && currentTarget.closest ? currentTarget.closest('.window-body') : null;

  if (scroller && scroller.scrollHeight > scroller.clientHeight) {
    const rect = scroller.getBoundingClientRect();
    if (currentMouseX >= rect.right - 14 && currentMouseX <= rect.right) {
      isOverScrollbar = true;
    }
  }

  if (isOverScrollbar) {
    magicCursor.style.opacity = '0';
    if (!document.body.classList.contains('native-cursor-active')) {
      document.body.classList.add('native-cursor-active');
    }
    cursorTicking = false;
    return;
  } else {
    magicCursor.style.opacity = '1';
    if (document.body.classList.contains('native-cursor-active')) {
      document.body.classList.remove('native-cursor-active');
    }
  }

  magicCursor.style.left = currentMouseX + 'px';
  magicCursor.style.top = currentMouseY + 'px';

  const now = Date.now();
  if (CURSOR_TRAIL.enabled && now - lastTrailTime > CURSOR_TRAIL.interval) {
    lastTrailTime = now;

    const trail = document.createElement('img');
    trail.classList.add('cursor-trail');
    trail.src = magicCursor.src;
    trail.style.left = currentMouseX + 'px';
    trail.style.top = currentMouseY + 'px';
    if (CURSOR_TRAIL.rainbow) {
      trail.style.filter = `drop-shadow(0 0 5px hsl(${rainbowHue}, 100%, 60%)) hue-rotate(${rainbowHue}deg)`;
      rainbowHue = (rainbowHue + 15) % 360;
    }

    document.body.appendChild(trail);

    setTimeout(() => {
      if (trail.parentNode) trail.remove();
    }, 500);
  }

  if (currentTarget) {
    if (currentTarget.closest('button:disabled, .diary-arrow:disabled')) {
      if (magicCursor.getAttribute('src') !== 'images/cursors/block.gif') magicCursor.src = 'images/cursors/block.gif';
    }
    else if (currentTarget.closest('a, button, .interactive-logo, .gallery-thumb, .status-balloon, .album-art, #progress-container, #opera-mascot, .title-bar-controls button, .lightbox-close')) {
      if (magicCursor.getAttribute('src') !== 'images/cursors/click.gif') magicCursor.src = 'images/cursors/click.gif';
    }
    else if (currentTarget.closest('p, h1, h2, h3, h4, h5, h6, span, .window-title, .title-bar-text, .diary-caption')) {
      if (magicCursor.getAttribute('src') !== 'images/cursors/text.gif') magicCursor.src = 'images/cursors/text.gif';
    }
    else {
      if (magicCursor.getAttribute('src') !== 'images/cursors/normal.gif') magicCursor.src = 'images/cursors/normal.gif';
    }
  }

  cursorTicking = false;
}

// --- 4. LOGO INTERACTIONS --- //
function handleLogoClick(logo) {
  sparkleSound.currentTime = 0;
  sparkleSound.play().catch(err => console.log("The browser silenced the magic!", err));

  const particleCount = 3;
  const container = logo.parentElement;

  const colors = [
    "hue-rotate(170deg) brightness(1.2) drop-shadow(0 0 6px rgba(0, 200, 255, 0.8))",
    "brightness(2) grayscale(1) drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))",
    "hue-rotate(260deg) brightness(1.2) drop-shadow(0 0 6px rgba(200, 0, 255, 0.8))",
    "hue-rotate(80deg) brightness(1.2) drop-shadow(0 0 6px rgba(0, 255, 100, 0.8))"
  ];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("glitter-particle");

    particle.style.filter = colors[Math.floor(Math.random() * colors.length)];

    container.appendChild(particle);

    const randomX = logo.offsetLeft + (Math.random() * logo.offsetWidth);

    const randomY = logo.offsetTop + (logo.offsetHeight * 0.8) + (Math.random() * 40) - 50;

    particle.style.left = randomX + "px";
    particle.style.top = randomY + "px";
    particle.style.animationDuration = 1 + Math.random() * 1 + "s";

    setTimeout(() => particle.remove(), 3000);
  }
}

function handleBalloonClick(balloon) {
  chatSound.currentTime = 0;
  chatSound.play().catch(err => console.log("Browser silenced the balloon!", err));

  const emojiImg = document.getElementById("emoji-img");
  currentMsnIndex = (currentMsnIndex + 1) % msnEmojis.length;

  if (emojiImg) emojiImg.src = msnEmojis[currentMsnIndex];

  if (balloon) {
    balloon.style.transform = "scale(0.85)";
    setTimeout(() => (balloon.style.transform = ""), 150);
  }
}

function handleLightboxClick(target) {
  let lightbox = document.getElementById('lightbox');
  let lightboxImg = document.getElementById('lightbox-img');
  let lightboxCaption = document.getElementById('lightbox-caption');

  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox-overlay';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button id="lightbox-close" class="lightbox-close">✖</button>
        <img id="lightbox-img" src="" alt="Full size">
        <p id="lightbox-caption" class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);

    lightboxImg = document.getElementById('lightbox-img');
    lightboxCaption = document.getElementById('lightbox-caption');
  }

  if (target.classList.contains('gallery-thumb') || target.classList.contains('album-art')) {
    const fullSrc = target.getAttribute('data-full') || target.src;
    const author = target.getAttribute('data-author') || 'by Unknown';

    if (lightboxImg) lightboxImg.src = fullSrc;
    if (lightboxCaption) lightboxCaption.textContent = author;
    lightbox.classList.add('active');
    return;
  }

  if (target.id === 'lightbox' || target.id === 'lightbox-close') {
    lightbox.classList.remove('active');
  }
}

function handleDiaryClick(target) {
  const pages = Array.from(document.querySelectorAll('.diary-page'));
  if (pages.length === 0 || target.disabled) return;

  let currentIndex = pages.findIndex(page => page.classList.contains('active'));
  pages[currentIndex].classList.remove('active');

  if (target.id === 'diary-prev' && currentIndex < pages.length - 1) {
    currentIndex++;
  } else if (target.id === 'diary-next' && currentIndex > 0) {
    currentIndex--;
  }

  pages[currentIndex].classList.add('active');
  updateDiaryButtons();
}

function handleOperaClick(mascot) {
  if (isOperaLaughing) return;

  isOperaLaughing = true;

  const randomLaugh = Math.floor(Math.random() * 2) + 1;
  const audio = document.getElementById('opera-laugh-' + randomLaugh);

  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }

  mascot.style.transform = "scale(1.05) translateY(-15px) rotate(5deg)";
  setTimeout(() => {
    mascot.style.transform = "";
  }, 300);

  setTimeout(() => {
    isOperaLaughing = false;
  }, 3000);
}

// --- 5. PAGES UPDATE --- //
function loadMagicPage(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Page not found!!");
      return response.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // troca a coluna do centro inteira (todas as janelas dela), nao so a primeira
      const newContent = doc.querySelector('.col-center') || doc.querySelector('.content-center');
      const currentContent = document.querySelector('.col-center') || document.querySelector('.content-center');
      if (newContent && currentContent) {
        currentContent.innerHTML = newContent.innerHTML;
      }

      // titulo e icone da aba acompanham a pagina nova
      if (doc.title) document.title = doc.title;
      const newIcon = doc.querySelector('link[rel="icon"]');
      const curIcon = document.querySelector('link[rel="icon"]');
      if (newIcon && curIcon) curIcon.setAttribute('href', newIcon.getAttribute('href'));

      checkGifVisibility(url);

      const newSidebar = doc.querySelector('.sidebar-right');
      let currentSidebar = document.querySelector('.sidebar-right');
      const mainBody = document.querySelector('.main-body');

      if (newSidebar) {
        if (currentSidebar) {
          currentSidebar.innerHTML = newSidebar.innerHTML;
          currentSidebar.style.display = "";   // volta ao display do CSS (flex), nao "block"
        } else {
          currentSidebar = document.createElement('aside');
          currentSidebar.className = 'sidebar-right col';
          currentSidebar.innerHTML = newSidebar.innerHTML;
          if (mainBody) mainBody.appendChild(currentSidebar);
        }
        if (mainBody) mainBody.classList.remove('two-columns');

      } else {
        if (currentSidebar) {
          currentSidebar.innerHTML = "";
          currentSidebar.style.display = "none";
        }
        if (mainBody) mainBody.classList.add('two-columns');
      }

      updateDiaryButtons();
      updateMenuHighlight();
      // o conteudo novo entra sem recarregar a pagina, entao o calendario precisa ser remontado
      if (typeof window.initDiaryCalendar === "function") window.initDiaryCalendar();
    })
    .catch(err => console.error("ERROR! GLITCH:", err));
}

// Marca no menu a pagina em que voce esta
function updateMenuHighlight() {
  const here = window.location.pathname.replace(/\/$/, "/index.html");
  document.querySelectorAll(".sidebar-left a.aero-nav-btn").forEach(link => {
    const target = new URL(link.getAttribute("href"), document.baseURI).pathname;
    if (target === here) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function updateDiaryButtons() {
  const pages = document.querySelectorAll('.diary-page');
  const prevBtn = document.getElementById('diary-prev');
  const nextBtn = document.getElementById('diary-next');

  if (pages.length === 0 || !prevBtn || !nextBtn) return;

  let currentIndex = Array.from(pages).findIndex(page => page.classList.contains('active'));

  nextBtn.disabled = (currentIndex === 0);
  prevBtn.disabled = (currentIndex === pages.length - 1);
}

// --- 6. MUSIC PLAYER --- //
function initMusicPlayer() {
  const music = document.getElementById("bg-music");
  if (!music) return;

  const playBtn = document.getElementById("play-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const songTitle = document.getElementById("song-title");
  const artistName = document.getElementById("artist-name");
  const albumCover = document.getElementById("album-cover");

  // Botão e Janela de Volume
  const trayVolumeBtn = document.getElementById("tray-volume-btn");
  const volumePopup = document.getElementById("volume-popup");
  const volumeContainer = document.getElementById("volume-container");
  const volumeFill = document.getElementById("volume-fill");

  const playIconSrc = "images/icons/button_play.png";
  const pauseIconSrc = "images/icons/button_pause.png";

  const playlist = [
    { title: "Venturing into the Pyramid", artist: "Oliver Buckland", cover: "images/covers/cover7.jpg", coverAuthor: "Cover by Joel G", src: "https://file.garden/ab1wwlFYy3CJESe8/venturing-into-the-pyramid.mp3" },
    { title: "Popipo (8bit)", artist: "robozukin", cover: "images/covers/cover6.jpg", coverAuthor: "Cover by Ver1am", src: "https://file.garden/ab1wwlFYy3CJESe8/popipo_8bit.mp3" },
    { title: "Dark and Snowy", artist: "PixReturns", cover: "images/covers/cover5.jpg", coverAuthor: "Cover by TheInvertedVoice", src: "https://file.garden/ab1wwlFYy3CJESe8/dark_and_snowy.mp3" },
    { title: "Dog [Synthwave]", artist: "C418 - Minecraft", cover: "images/covers/cover4.jpg", coverAuthor: "Cover by JLucher", src: "https://file.garden/ab1wwlFYy3CJESe8/dog_synthwave.mp3" },
    { title: "Aria Math [Synthwave]", artist: "C418 - Minecraft", cover: "images/covers/cover1.png", coverAuthor: "Cover by C418", src: "https://file.garden/ab1wwlFYy3CJESe8/aria_math_synthwave.mp3" },
    { title: "Battle [Houseki no Kuni]", artist: "Yoshiaki Fujisawa", cover: "images/covers/cover2.jpg", coverAuthor: "Cover by Haruko Ichikawa", src: "https://file.garden/ab1wwlFYy3CJESe8/battle.mp3" },
    { title: "Cinnabar [Houseki no Kuni]", artist: "Yoshiaki Fujisawa", cover: "images/covers/cover3.jpg", coverAuthor: "Cover by mattRlive", src: "https://file.garden/ab1wwlFYy3CJESe8/shinsha.mp3" }
  ];

  let songIndex = 0;
  let isPlaying = false;

  function loadSong(song) {
    songTitle.textContent = song.title;
    artistName.textContent = song.artist;
    albumCover.src = song.cover;
    music.src = song.src;
    albumCover.setAttribute('data-author', song.coverAuthor);
    albumCover.setAttribute('data-full', song.cover);
  }

  loadSong(playlist[songIndex]);
  music.volume = 1;

  let playPromise = music.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      isPlaying = true;
      playBtn.src = pauseIconSrc;
    }).catch(() => {
      playBtn.src = playIconSrc;
    });
  }

  playBtn.addEventListener("click", () => {
    if (isPlaying) { music.pause(); playBtn.src = playIconSrc; }
    else { music.play(); playBtn.src = pauseIconSrc; }
    isPlaying = !isPlaying;
  });

  prevBtn.addEventListener("click", () => {
    songIndex = (songIndex - 1 + playlist.length) % playlist.length;
    loadSong(playlist[songIndex]);
    if (isPlaying) { music.play(); playBtn.src = pauseIconSrc; }
  });

  nextBtn.addEventListener("click", () => {
    songIndex = (songIndex + 1) % playlist.length;
    loadSong(playlist[songIndex]);
    if (isPlaying) { music.play(); playBtn.src = pauseIconSrc; }
  });

  // 🪄 LOGICA DO POP-UP (Abre e fecha ao clicar fora!)
  if (trayVolumeBtn && volumePopup) {
    trayVolumeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      volumePopup.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!volumePopup.contains(e.target) && !trayVolumeBtn.contains(e.target)) {
        volumePopup.classList.remove("active");
      }
    });
  }

  // 🪄 MAGIA DO ARRASTO VERTICAL
  function setupVerticalDraggableSlider(container, fill, onDrag) {
    if (!container || !fill) return;
    let isDragging = false;

    const updateVisuals = (e) => {
      const rect = container.getBoundingClientRect();
      // O Eixo Y inverte! Altura 0 é no bottom da tela.
      let offsetY = rect.bottom - e.clientY;
      offsetY = Math.max(0, Math.min(offsetY, rect.height));
      const percentage = offsetY / rect.height;

      fill.style.height = `${percentage * 100}%`;
      if (onDrag) onDrag(percentage);
    };

    container.addEventListener('mousedown', (e) => { isDragging = true; updateVisuals(e); });
    document.addEventListener('mousemove', (e) => { if (isDragging) updateVisuals(e); });
    document.addEventListener('mouseup', () => { isDragging = false; });
  }

  setupVerticalDraggableSlider(volumeContainer, volumeFill, (percentage) => {
    music.volume = percentage;
  });

  music.addEventListener("ended", () => nextBtn.click());
}