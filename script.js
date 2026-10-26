// ======================================================= //
// total_days_wasted_here: 67
// ======================================================= //


// ======================================================= //
// 1. INITIALIZATION
// ======================================================= //

const COMPONENTS = {
  header: "header.html",
  menu: "menu.html",
  player: "player.html"
};

async function loadComponent(containerId, file, onLoaded = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const response = await fetch(file);

    if (!response.ok) {
      throw new Error(`Failed to load ${file}: ${response.status}`);
    }

    container.innerHTML = await response.text();

    if (onLoaded) onLoaded();
  } catch (err) {
    console.error(`Component loading error (${file}):`, err);
  }
}

function isHomePage(url = window.location.pathname) {
  const path = new URL(url, window.location.origin).pathname;
  return path === "/" || path.endsWith("/index.html");
}

async function initializeComponents() {
  loadComponent("header-container", COMPONENTS.header);
  loadComponent("menu-container", COMPONENTS.menu);

  loadComponent("player-container", COMPONENTS.player, () => {
    initMusicPlayer();
  });

  syncOperaMascot(window.location.pathname);
}

function initializeSite() {
  updateDiaryButtons();
  initializeComponents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSite, { once: true });
} else {
  initializeSite();
}

window.addEventListener("popstate", () => {
  loadMagicPage(window.location.pathname);
});


// ======================================================= //
// 2. GLOBAL ASSETS
// ======================================================= //

const sparkleSound = new Audio(
  "https://file.garden/ab1wwlFYy3CJESe8/sparkles.wav"
);

const chatSound = new Audio(
  "https://file.garden/ab1wwlFYy3CJESe8/chat.wav"
);

sparkleSound.preload = "none";
chatSound.preload = "none";

const msnEmojis = [
  "images/icons/note_icon.png",
  "images/icons/gem_icon.png",
  "images/icons/pizza_icon.png",
  "images/icons/speaker.png"
];

let currentMsnIndex = 0;


// ======================================================= //
// 3. GLOBAL CLICK DELEGATION
// ======================================================= //

document.addEventListener("click", (e) => {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;

  // Navigation
  const navLink = target.closest("a.aero-nav-btn");

  if (navLink) {
    e.preventDefault();

    const url = navLink.getAttribute("href");
    if (!url) return;

    window.history.pushState(null, "", url);
    loadMagicPage(url);
    return;
  }

  // Logo
  const logo =
    target.closest(".interactive-logo") ||
    (target.id === "main-logo" ? target : null);

  if (logo) {
    handleLogoClick(logo);
  }

  // PFP balloon
  const balloon =
    target.closest("#music-balloon") ||
    (target.id === "music-balloon" ? target : null);

  if (balloon) {
    handleBalloonClick(balloon);
  }

  // Lightbox
  if (
    target.classList.contains("gallery-thumb") ||
    target.classList.contains("album-art") ||
    target.id === "lightbox" ||
    target.id === "lightbox-close"
  ) {
    handleLightboxClick(target);
  }

  // Diary
  if (
    target.id === "diary-prev" ||
    target.id === "diary-next"
  ) {
    handleDiaryClick(target);
  }

  // Opera easter egg
  const mascot = target.closest("#opera-mascot");

  if (mascot) {
    handleOperaClick(mascot);
  }
});


// ======================================================= //
// 4. OPERA O EASTER EGG
// ======================================================= //

let mascotContainer = null;
let isOperaLaughing = false;

function syncOperaMascot(url = window.location.pathname) {
  const shouldExist = isHomePage(url);

  if (!shouldExist) {
    if (mascotContainer) {
      mascotContainer.remove();
      mascotContainer = null;
    }

    return;
  }

  if (mascotContainer) return;

  mascotContainer = document.createElement("div");
  mascotContainer.className = "mascot-container";

  mascotContainer.innerHTML = `
    <img
      src="images/opera-chibi.gif"
      id="opera-mascot"
      alt="TM Opera O Mascot"
      title="Click for a laugh from the King!"
    >

    <audio
      id="opera-laugh-1"
      src="https://file.garden/ab1wwlFYy3CJESe8/opera_laugh1.mp3"
      preload="none"
    ></audio>

    <audio
      id="opera-laugh-2"
      src="https://file.garden/ab1wwlFYy3CJESe8/opera_laugh2.mp3"
      preload="none"
    ></audio>
  `;

  document.body.appendChild(mascotContainer);
}

function checkGifVisibility(url) {
  const gifs = document.querySelectorAll(".dynamic-gif");
  const home = isHomePage(url);

  gifs.forEach(gif => {
    gif.style.display = home ? "flex" : "none";
  });

  syncOperaMascot(url);
}


// ======================================================= //
// 5. ANIMATED CUSTOM CURSOR
// ======================================================= //

const magicCursor = document.createElement("img");

magicCursor.id = "magic-cursor";
magicCursor.src = "images/cursors/normal.gif";
magicCursor.alt = "";
magicCursor.setAttribute("aria-hidden", "true");

document.body.appendChild(magicCursor);

let rainbowHue = 0;
let lastTrailTime = 0;

let cursorTicking = false;

let currentMouseX = 0;
let currentMouseY = 0;
let currentTarget = null;

let cachedContainerRect = null;
let cachedChangelogRect = null;
let cursorRectsDirty = true;


// Reusable trail pool.
// Instead of constantly creating/removing <img> elements,
// we reuse these eight nodes.

const TRAIL_POOL_SIZE = 8;
const trailPool = [];
let trailPoolIndex = 0;

for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
  const trail = document.createElement("img");

  trail.className = "cursor-trail";
  trail.src = magicCursor.src;
  trail.alt = "";
  trail.setAttribute("aria-hidden", "true");
  trail.style.opacity = "0";

  document.body.appendChild(trail);

  trailPool.push(trail);
}


function refreshCursorRects() {
  const container = document.querySelector(".container");
  const changelogList =
    document.querySelector(".changelog-list");

  cachedContainerRect = container
    ? container.getBoundingClientRect()
    : null;

  cachedChangelogRect = changelogList
    ? changelogList.getBoundingClientRect()
    : null;

  cursorRectsDirty = false;
}


function markCursorRectsDirty() {
  cursorRectsDirty = true;
}

window.addEventListener(
  "resize",
  markCursorRectsDirty,
  { passive: true }
);


document.addEventListener("mouseleave", () => {
  magicCursor.style.opacity = "0";
});

document.addEventListener("mouseenter", () => {
  magicCursor.style.opacity = "1";
});


document.addEventListener("mousemove", (e) => {
  if (window.innerWidth <= 850) return;

  currentMouseX = e.clientX;
  currentMouseY = e.clientY;
  currentTarget = e.target;

  if (!cursorTicking) {
    window.requestAnimationFrame(updateMagicCursor);
    cursorTicking = true;
  }
});


function isMouseOverScrollbar(rect, rightPadding) {
  if (!rect) return false;

  return (
    currentMouseX >= rect.right - rightPadding &&
    currentMouseX <= rect.right &&
    currentMouseY >= rect.top &&
    currentMouseY <= rect.bottom
  );
}


function getCursorType(target) {
  if (!target || !(target instanceof Element)) {
    return "images/cursors/normal.gif";
  }

  if (
    target.closest(
      "button:disabled, .diary-arrow:disabled"
    )
  ) {
    return "images/cursors/block.gif";
  }

  if (
    target.closest(
      "a, button, .interactive-logo, .gallery-thumb, " +
      ".status-balloon, .album-art, #progress-container, " +
      "#opera-mascot, .title-bar-controls button, .lightbox-close"
    )
  ) {
    return "images/cursors/click.gif";
  }

  if (
    target.closest(
      "p, h1, h2, h3, h4, h5, h6, span, " +
      ".window-title, .title-bar-text, .diary-caption"
    )
  ) {
    return "images/cursors/text.gif";
  }

  return "images/cursors/normal.gif";
}


function updateMagicCursor() {
  if (cursorRectsDirty) {
    refreshCursorRects();
  }

  const isOverScrollbar =
    isMouseOverScrollbar(cachedContainerRect, 25) ||
    isMouseOverScrollbar(cachedChangelogRect, 15);

  if (isOverScrollbar) {
    magicCursor.style.opacity = "0";
    document.body.classList.add("native-cursor-active");

    cursorTicking = false;
    return;
  }

  magicCursor.style.opacity = "1";
  document.body.classList.remove("native-cursor-active");

  magicCursor.style.left = `${currentMouseX}px`;
  magicCursor.style.top = `${currentMouseY}px`;


  // Cursor trail
  const now = performance.now();

  if (now - lastTrailTime > 35) {
    lastTrailTime = now;

    const trail = trailPool[trailPoolIndex];

    trailPoolIndex =
      (trailPoolIndex + 1) % TRAIL_POOL_SIZE;

    trail.src = magicCursor.src;

    trail.style.left =
      `${currentMouseX}px`;

    trail.style.top =
      `${currentMouseY}px`;

    trail.style.filter =
      `drop-shadow(0 0 5px hsl(${rainbowHue}, 100%, 60%)) ` +
      `hue-rotate(${rainbowHue}deg)`;

    rainbowHue =
      (rainbowHue + 15) % 360;


    if (trail._fadeAnimation) {
      trail._fadeAnimation.cancel();
    }

    trail.style.opacity = "1";

    if (typeof trail.animate === "function") {
      trail._fadeAnimation = trail.animate(
        [
          { opacity: 1 },
          { opacity: 0 }
        ],
        {
          duration: 500,
          easing: "linear",
          fill: "forwards"
        }
      );
    } else {
      setTimeout(() => {
        trail.style.opacity = "0";
      }, 500);
    }
  }


  // Cursor type
  const nextCursor =
    getCursorType(currentTarget);

  const nextCursorURL =
    new URL(
      nextCursor,
      window.location.href
    ).href;

  if (magicCursor.src !== nextCursorURL) {
    magicCursor.src = nextCursor;
  }

  cursorTicking = false;
}


// ======================================================= //
// 6. LOGO INTERACTIONS
// ======================================================= //

function handleLogoClick(logo) {
  sparkleSound.currentTime = 0;

  sparkleSound
    .play()
    .catch(err =>
      console.log(
        "The browser silenced the magic!",
        err
      )
    );

  const particleCount = 3;
  const container = logo.parentElement;

  if (!container) return;

  const colors = [
    "hue-rotate(170deg) brightness(1.2) drop-shadow(0 0 6px rgba(0, 200, 255, 0.8))",
    "brightness(2) grayscale(1) drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))",
    "hue-rotate(260deg) brightness(1.2) drop-shadow(0 0 6px rgba(200, 0, 255, 0.8))",
    "hue-rotate(80deg) brightness(1.2) drop-shadow(0 0 6px rgba(0, 255, 100, 0.8))"
  ];

  for (let i = 0; i < particleCount; i++) {
    const particle =
      document.createElement("div");

    particle.classList.add(
      "glitter-particle"
    );

    particle.style.filter =
      colors[
        Math.floor(
          Math.random() * colors.length
        )
      ];

    container.appendChild(particle);

    const randomX =
      logo.offsetLeft +
      Math.random() * logo.offsetWidth;

    const randomY =
      logo.offsetTop +
      logo.offsetHeight * 0.8 +
      Math.random() * 40 -
      50;

    particle.style.left =
      `${randomX}px`;

    particle.style.top =
      `${randomY}px`;

    particle.style.animationDuration =
      `${1 + Math.random()}s`;

    setTimeout(
      () => particle.remove(),
      3000
    );
  }
}


// ======================================================= //
// 7. PFP BALLOON
// ======================================================= //

function handleBalloonClick(balloon) {
  chatSound.currentTime = 0;

  chatSound
    .play()
    .catch(err =>
      console.log(
        "Browser silenced the balloon!",
        err
      )
    );

  const emojiImg =
    document.getElementById("emoji-img");

  currentMsnIndex =
    (currentMsnIndex + 1) %
    msnEmojis.length;

  if (emojiImg) {
    emojiImg.src =
      msnEmojis[currentMsnIndex];
  }

  if (balloon) {
    balloon.style.transform =
      "scale(0.85)";

    setTimeout(() => {
      balloon.style.transform = "";
    }, 150);
  }
}


// ======================================================= //
// 8. LIGHTBOX GALLERY
// ======================================================= //

let lightbox = null;
let lightboxImg = null;
let lightboxCaption = null;


function createLightbox() {
  if (lightbox) return;

  lightbox =
    document.createElement("div");

  lightbox.id = "lightbox";
  lightbox.className =
    "lightbox-overlay";

  lightbox.innerHTML = `
    <div class="lightbox-content">
      <button
        id="lightbox-close"
        class="lightbox-close"
      >✖</button>

      <img
        id="lightbox-img"
        src=""
        alt="Full size"
      >

      <p
        id="lightbox-caption"
        class="lightbox-caption"
      ></p>
    </div>
  `;

  document.body.appendChild(lightbox);

  lightboxImg =
    document.getElementById(
      "lightbox-img"
    );

  lightboxCaption =
    document.getElementById(
      "lightbox-caption"
    );
}


function handleLightboxClick(target) {
  if (
    target.classList.contains("gallery-thumb") ||
    target.classList.contains("album-art")
  ) {
    if (!lightbox) {
      createLightbox();
    }

    const fullSrc =
      target.getAttribute("data-full") ||
      target.src;

    const author =
      target.getAttribute("data-author") ||
      "by Unknown";

    lightboxImg.src = fullSrc;
    lightboxCaption.textContent =
      author;

    lightbox.classList.add("active");

    return;
  }

  if (
    target.id === "lightbox" ||
    target.id === "lightbox-close"
  ) {
    if (lightbox) {
      lightbox.classList.remove(
        "active"
      );
    }
  }
}


// ======================================================= //
// 9. DIARY CAROUSEL
// ======================================================= //

function handleDiaryClick(target) {
  const pages =
    document.querySelectorAll(
      ".diary-page"
    );

  if (
    pages.length === 0 ||
    target.disabled
  ) {
    return;
  }

  let currentIndex =
    Array.from(pages).findIndex(
      page =>
        page.classList.contains("active")
    );

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  pages[currentIndex]
    .classList.remove("active");


  if (
    target.id === "diary-prev" &&
    currentIndex < pages.length - 1
  ) {
    currentIndex++;
  } else if (
    target.id === "diary-next" &&
    currentIndex > 0
  ) {
    currentIndex--;
  }

  pages[currentIndex]
    .classList.add("active");

  updateDiaryButtons();
}


function updateDiaryButtons() {
  const pages =
    document.querySelectorAll(
      ".diary-page"
    );

  const prevBtn =
    document.getElementById(
      "diary-prev"
    );

  const nextBtn =
    document.getElementById(
      "diary-next"
    );

  if (
    pages.length === 0 ||
    !prevBtn ||
    !nextBtn
  ) {
    return;
  }

  let currentIndex =
    Array.from(pages).findIndex(
      page =>
        page.classList.contains("active")
    );

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  nextBtn.disabled =
    currentIndex === 0;

  prevBtn.disabled =
    currentIndex === pages.length - 1;
}


// ======================================================= //
// 10. OPERA O INTERACTION
// ======================================================= //

function handleOperaClick(mascot) {
  if (isOperaLaughing) return;

  isOperaLaughing = true;

  const randomLaugh =
    Math.floor(Math.random() * 2) + 1;

  const audio =
    document.getElementById(
      `opera-laugh-${randomLaugh}`
    );

  if (audio) {
    audio.currentTime = 0;

    audio
      .play()
      .catch(() => {});
  }

  mascot.style.transform =
    "scale(1.05) translateY(-15px) rotate(5deg)";

  setTimeout(() => {
    mascot.style.transform = "";
  }, 300);

  setTimeout(() => {
    isOperaLaughing = false;
  }, 3000);
}


// ======================================================= //
// 11. SPA PAGE NAVIGATION
// ======================================================= //

let navigationRequestId = 0;


async function loadMagicPage(url) {
  const requestId =
    ++navigationRequestId;

  try {
    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Page not found: ${response.status}`
      );
    }

    const html =
      await response.text();

    if (
      requestId !==
      navigationRequestId
    ) {
      return;
    }

    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        html,
        "text/html"
      );

    const newContent =
      doc.querySelector(
        ".content-center"
      );

    const currentContent =
      document.querySelector(
        ".content-center"
      );

    if (
      newContent &&
      currentContent
    ) {
      currentContent.innerHTML =
        newContent.innerHTML;
    }


    const newSidebar =
      doc.querySelector(
        ".sidebar-right"
      );

    let currentSidebar =
      document.querySelector(
        ".sidebar-right"
      );

    const mainBody =
      document.querySelector(
        ".main-body"
      );


    if (newSidebar) {
      if (currentSidebar) {
        currentSidebar.innerHTML =
          newSidebar.innerHTML;

        currentSidebar.style.display =
          "block";
      } else {
        currentSidebar =
          document.createElement(
            "aside"
          );

        currentSidebar.className =
          "sidebar-right";

        currentSidebar.innerHTML =
          newSidebar.innerHTML;

        if (mainBody) {
          mainBody.appendChild(
            currentSidebar
          );
        }
      }

      if (mainBody) {
        mainBody.classList.remove(
          "two-columns"
        );
      }

    } else {
      if (currentSidebar) {
        currentSidebar.innerHTML =
          "";

        currentSidebar.style.display =
          "none";
      }

      if (mainBody) {
        mainBody.classList.add(
          "two-columns"
        );
      }
    }


    checkGifVisibility(url);
    syncOperaMascot(url);

    // The page content changed,
    // so cached cursor geometry is invalid.
    markCursorRectsDirty();

    updateDiaryButtons();

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });

  } catch (err) {
    console.error(
      "ERROR! GLITCH:",
      err
    );
  }
}


// ======================================================= //
// 12. MUSIC PLAYER
// ======================================================= //

function initMusicPlayer() {
  const music =
    document.getElementById(
      "bg-music"
    );

  if (!music) return;

  const playBtn =
    document.getElementById(
      "play-btn"
    );

  const prevBtn =
    document.getElementById(
      "prev-btn"
    );

  const nextBtn =
    document.getElementById(
      "next-btn"
    );

  const songTitle =
    document.getElementById(
      "song-title"
    );

  const artistName =
    document.getElementById(
      "artist-name"
    );

  const albumCover =
    document.getElementById(
      "album-cover"
    );

  const trayVolumeBtn =
    document.getElementById(
      "tray-volume-btn"
    );

  const volumePopup =
    document.getElementById(
      "volume-popup"
    );

  const volumeContainer =
    document.getElementById(
      "volume-container"
    );

  const volumeFill =
    document.getElementById(
      "volume-fill"
    );

  if (
    !playBtn ||
    !prevBtn ||
    !nextBtn
  ) {
    return;
  }


  const playIconSrc =
    "images/icons/button_play.png";

  const pauseIconSrc =
    "images/icons/button_pause.png";


  const playlist = [
    {
      title: "Venturing into the Pyramid",
      artist: "Oliver Buckland",
      cover: "images/covers/cover7.jpg",
      coverAuthor: "Cover by Joel G",
      src: "https://file.garden/ab1wwlFYy3CJESe8/venturing-into-the-pyramid.mp3"
    },

    {
      title: "Popipo (8bit)",
      artist: "robozukin",
      cover: "images/covers/cover6.jpg",
      coverAuthor: "Cover by Ver1am",
      src: "https://file.garden/ab1wwlFYy3CJESe8/popipo_8bit.mp3"
    },

    {
      title: "Dark and Snowy",
      artist: "PixReturns",
      cover: "images/covers/cover5.jpg",
      coverAuthor: "Cover by TheInvertedVoice",
      src: "https://file.garden/ab1wwlFYy3CJESe8/dark_and_snowy.mp3"
    },

    {
      title: "Dog [Synthwave]",
      artist: "C418 - Minecraft",
      cover: "images/covers/cover4.jpg",
      coverAuthor: "Cover by JLucher",
      src: "https://file.garden/ab1wwlFYy3CJESe8/dog_synthwave.mp3"
    },

    {
      title: "Aria Math [Synthwave]",
      artist: "C418 - Minecraft",
      cover: "images/covers/cover1.png",
      coverAuthor: "Cover by C418",
      src: "https://file.garden/ab1wwlFYy3CJESe8/aria_math_synthwave.mp3"
    },

    {
      title: "Battle [Houseki no Kuni]",
      artist: "Yoshiaki Fujisawa",
      cover: "images/covers/cover2.jpg",
      coverAuthor: "Cover by Haruko Ichikawa",
      src: "https://file.garden/ab1wwlFYy3CJESe8/battle.mp3"
    },

    {
      title: "Cinnabar [Houseki no Kuni]",
      artist: "Yoshiaki Fujisawa",
      cover: "images/covers/cover3.jpg",
      coverAuthor: "Cover by mattRlive",
      src: "https://file.garden/ab1wwlFYy3CJESe8/shinsha.mp3"
    }
  ];


  let songIndex = 0;
  let isPlaying = false;
  let loadedSongIndex = -1;


  // Critical optimization:
  // the MP3 is not downloaded when the page opens.

  music.preload = "none";
  music.volume = 1;


  function updateSongInfo(song) {
    if (songTitle) {
      songTitle.textContent =
        song.title;
    }

    if (artistName) {
      artistName.textContent =
        song.artist;
    }

    if (albumCover) {
      albumCover.src =
        song.cover;

      albumCover.setAttribute(
        "data-author",
        song.coverAuthor
      );

      albumCover.setAttribute(
        "data-full",
        song.cover
      );
    }
  }


  function loadSong(
    song,
    index = songIndex
  ) {
    updateSongInfo(song);

    if (
      loadedSongIndex ===
      index
    ) {
      return;
    }

    music.src = song.src;
    loadedSongIndex = index;
  }


  function ensureCurrentSongLoaded() {
    if (
      loadedSongIndex !==
      songIndex
    ) {
      loadSong(
        playlist[songIndex],
        songIndex
      );
    }
  }


  function playCurrentSong() {
    ensureCurrentSongLoaded();

    const promise =
      music.play();

    if (promise !== undefined) {
      promise
        .then(() => {
          isPlaying = true;
          playBtn.src =
            pauseIconSrc;
        })
        .catch(() => {
          isPlaying = false;
          playBtn.src =
            playIconSrc;
        });
    }
  }


  function pauseCurrentSong() {
    music.pause();

    isPlaying = false;

    playBtn.src =
      playIconSrc;
  }


  // Show cover/title without loading MP3.
  updateSongInfo(
    playlist[songIndex]
  );

  playBtn.src =
    playIconSrc;


  playBtn.addEventListener(
    "click",
    () => {
      if (isPlaying) {
        pauseCurrentSong();
      } else {
        playCurrentSong();
      }
    }
  );


  prevBtn.addEventListener(
    "click",
    () => {
      songIndex =
        (songIndex - 1 + playlist.length) %
        playlist.length;

      updateSongInfo(
        playlist[songIndex]
      );

      if (isPlaying) {
        loadedSongIndex = -1;
        playCurrentSong();
      }
    }
  );


  nextBtn.addEventListener(
    "click",
    () => {
      songIndex =
        (songIndex + 1) %
        playlist.length;

      updateSongInfo(
        playlist[songIndex]
      );

      if (isPlaying) {
        loadedSongIndex = -1;
        playCurrentSong();
      }
    }
  );


  music.addEventListener(
    "play",
    () => {
      isPlaying = true;
      playBtn.src =
        pauseIconSrc;
    }
  );


  music.addEventListener(
    "pause",
    () => {
      isPlaying = false;
      playBtn.src =
        playIconSrc;
    }
  );


  // Volume popup

  if (
    trayVolumeBtn &&
    volumePopup
  ) {
    trayVolumeBtn.addEventListener(
      "click",
      e => {
        e.stopPropagation();

        volumePopup.classList.toggle(
          "active"
        );
      }
    );

    document.addEventListener(
      "click",
      e => {
        if (
          !volumePopup.contains(
            e.target
          ) &&
          !trayVolumeBtn.contains(
            e.target
          )
        ) {
          volumePopup.classList.remove(
            "active"
          );
        }
      }
    );
  }


  setupVerticalDraggableSlider(
    volumeContainer,
    volumeFill,
    percentage => {
      music.volume =
        percentage;
    }
  );


  music.addEventListener(
    "ended",
    () => {
      nextBtn.click();
    }
  );
}


// ======================================================= //
// 13. VERTICAL VOLUME SLIDER
// ======================================================= //

function setupVerticalDraggableSlider(
  container,
  fill,
  onDrag
) {
  if (!container || !fill) {
    return;
  }

  let isDragging = false;
  let sliderRect = null;

  let pendingPointerEvent = null;
  let animationFrame = null;


  function updateVisuals(e) {
    if (!sliderRect) {
      sliderRect =
        container.getBoundingClientRect();
    }

    let offsetY =
      sliderRect.bottom -
      e.clientY;

    offsetY =
      Math.max(
        0,
        Math.min(
          offsetY,
          sliderRect.height
        )
      );

    const percentage =
      sliderRect.height > 0
        ? offsetY / sliderRect.height
        : 0;

    fill.style.height =
      `${percentage * 100}%`;

    if (onDrag) {
      onDrag(percentage);
    }
  }


  function processPointer() {
    animationFrame = null;

    if (
      !isDragging ||
      !pendingPointerEvent
    ) {
      return;
    }

    updateVisuals(
      pendingPointerEvent
    );

    pendingPointerEvent = null;
  }


  function queuePointerUpdate(e) {
    pendingPointerEvent = e;

    if (!animationFrame) {
      animationFrame =
        requestAnimationFrame(
          processPointer
        );
    }
  }


  container.addEventListener(
    "mousedown",
    e => {
      isDragging = true;

      sliderRect =
        container.getBoundingClientRect();

      updateVisuals(e);
    }
  );


  document.addEventListener(
    "mousemove",
    e => {
      if (isDragging) {
        queuePointerUpdate(e);
      }
    }
  );


  document.addEventListener(
    "mouseup",
    () => {
      isDragging = false;
      sliderRect = null;
      pendingPointerEvent = null;
    }
  );


  window.addEventListener(
    "resize",
    () => {
      if (isDragging) {
        sliderRect =
          container.getBoundingClientRect();
      }
    },
    { passive: true }
  );
}