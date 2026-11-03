/* ============================================================
   js/calendar.js — calendário do diário

   Como funciona
   - Procura uma <div id="aero-calendar"> na página e monta nela
     um calendário do mês atual, com o dia de hoje destacado.
   - Lê a data de cada .diary-page pelo <h3> ("Date: September 27, 2026")
     ou por data-date="2026-09-27". Dias com entrada ficam marcados.
   - Clicar num dia com entrada abre aquela página do diário.
   - Usar as setas do diário move a seleção do calendário.
   - data-note="texto" na .diary-page mostra uma notinha sob o calendário.

   Este arquivo é carregado pelo script.js. Como o site troca o
   conteúdo das páginas sem recarregar, o script.js chama
   initDiaryCalendar() de novo a cada troca de página.
   ============================================================ */
(function () {
  "use strict";

  var MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  var DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  /* estado do calendário que está na tela agora */
  var S = {
    root: null,
    el: {},
    pages: [],
    pageDates: [],
    entries: {},     /* "2026-8-27" -> [índices das páginas daquele dia] */
    today: new Date(),
    todayKey: "",
    viewY: 0,
    viewM: 0,
    selectedKey: null,
    focusKey: null,
    observer: null
  };

  /* ---------- datas ---------- */
  function keyOf(d) {
    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  }

  function longDate(d) {
    return d.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
  }

  function parsePageDate(page) {
    var iso = page.getAttribute("data-date");
    if (iso) {
      var a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
      if (a) return new Date(+a[1], +a[2] - 1, +a[3]);
    }
    var h = page.querySelector("h3");
    if (!h) return null;
    var m = /([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(h.textContent.replace(/\s+/g, " "));
    if (!m) return null;
    var prefix = m[1].slice(0, 3).toLowerCase();
    for (var i = 0; i < 12; i++) {
      if (MONTHS[i].slice(0, 3).toLowerCase() === prefix) {
        return new Date(+m[3], i, +m[2]);
      }
    }
    return null;
  }

  /* ---------- páginas do diário ---------- */
  function readPages() {
    S.pages = Array.prototype.slice.call(document.querySelectorAll(".diary-page"));
    S.pageDates = S.pages.map(parsePageDate);
    S.entries = {};
    S.pageDates.forEach(function (d, i) {
      if (!d) return;
      var k = keyOf(d);
      (S.entries[k] = S.entries[k] || []).push(i);
    });
  }

  function activeIndex() {
    for (var i = 0; i < S.pages.length; i++) {
      if (S.pages[i].classList.contains("active")) return i;
    }
    return -1;
  }

  /* o script.js guarda a página aberta só na classe "active",
     então basta trocar a classe e atualizar as setas */
  function goToPage(target) {
    S.pages.forEach(function (p, i) { p.classList.toggle("active", i === target); });
    if (typeof window.updateDiaryButtons === "function") window.updateDiaryButtons();
  }

  function syncFromActive(jumpView) {
    var idx = activeIndex();
    var d = idx >= 0 ? S.pageDates[idx] : null;
    S.selectedKey = d ? keyOf(d) : null;
    if (d && jumpView) { S.viewY = d.getFullYear(); S.viewM = d.getMonth(); }
    render();
  }

  /* ---------- desenho ---------- */
  function buildSkeleton(root) {
    root.innerHTML =
      '<div class="cal-head">' +
        '<button type="button" class="cal-nav" data-nav="-12" title="Previous year" aria-label="Previous year">&laquo;</button>' +
        '<button type="button" class="cal-nav" data-nav="-1" title="Previous month" aria-label="Previous month">&lsaquo;</button>' +
        '<div class="cal-title" aria-live="polite"></div>' +
        '<button type="button" class="cal-nav" data-nav="1" title="Next month" aria-label="Next month">&rsaquo;</button>' +
        '<button type="button" class="cal-nav" data-nav="12" title="Next year" aria-label="Next year">&raquo;</button>' +
      "</div>" +
      '<div class="cal-grid"></div>' +
      '<div class="cal-foot">' +
        '<span class="cal-today-text"></span>' +
        '<button type="button" class="cal-today-btn">Today</button>' +
      "</div>" +
      '<div class="cal-legend"><i class="cal-dot"></i> diary entry</div>' +
      '<div class="cal-note" hidden></div>';

    root.addEventListener("click", onClick);
  }

  function render() {
    var el = S.el;
    if (!S.root || !el.grid) return;

    el.title.textContent = MONTHS[S.viewM] + " " + S.viewY;

    var frag = document.createDocumentFragment();
    DOW.forEach(function (n) {
      var s = document.createElement("div");
      s.className = "cal-dow";
      s.textContent = n;
      frag.appendChild(s);
    });

    var startDow = new Date(S.viewY, S.viewM, 1).getDay();
    for (var i = 0; i < 42; i++) {
      var d = new Date(S.viewY, S.viewM, 1 - startDow + i);
      var k = keyOf(d);
      var has = !!S.entries[k];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cal-day";
      b.textContent = d.getDate();
      b.setAttribute("data-key", k);
      b.setAttribute("aria-label", longDate(d) + (has ? " - diary entry" : ""));
      if (d.getMonth() !== S.viewM) b.classList.add("cal-out");
      if (has) b.classList.add("cal-has-entry"); else b.disabled = true;
      if (k === S.todayKey) { b.classList.add("cal-today"); b.setAttribute("aria-current", "date"); }
      if (k === S.selectedKey) { b.classList.add("cal-selected"); b.setAttribute("aria-pressed", "true"); }
      frag.appendChild(b);
    }
    el.grid.textContent = "";
    el.grid.appendChild(frag);

    el.todayText.textContent = S.today.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric"
    });

    var idx = activeIndex();
    var note = idx >= 0 ? S.pages[idx].getAttribute("data-note") : "";
    if (note) { el.note.textContent = "\uD83D\uDCD6 " + note; el.note.hidden = false; }
    else { el.note.textContent = ""; el.note.hidden = true; }

    if (S.focusKey) {
      var f = el.grid.querySelector('[data-key="' + S.focusKey + '"]');
      if (f) f.focus();
      S.focusKey = null;
    }
  }

  /* ---------- cliques ---------- */
  function onClick(e) {
    var nav = e.target.closest("[data-nav]");
    if (nav) {
      var v = new Date(S.viewY, S.viewM + parseInt(nav.getAttribute("data-nav"), 10), 1);
      S.viewY = v.getFullYear();
      S.viewM = v.getMonth();
      render();
      return;
    }

    if (e.target.closest(".cal-today-btn")) {
      S.viewY = S.today.getFullYear();
      S.viewM = S.today.getMonth();
      render();
      return;
    }

    var day = e.target.closest(".cal-has-entry");
    if (!day) return;
    var key = day.getAttribute("data-key");
    var list = S.entries[key];
    if (!list) return;

    /* dois textos no mesmo dia: clicar de novo alterna entre eles */
    var target = list[0];
    var at = list.indexOf(activeIndex());
    if (at >= 0) target = list[(at + 1) % list.length];

    S.focusKey = key;
    goToPage(target);
    syncFromActive(false);
  }

  /* ---------- virada do dia automática ---------- */
  function checkDay() {
    var now = new Date();
    var k = keyOf(now);
    if (k === S.todayKey) return;
    var viewingCurrent = S.viewY === S.today.getFullYear() && S.viewM === S.today.getMonth();
    S.today = now;
    S.todayKey = k;
    if (viewingCurrent) { S.viewY = now.getFullYear(); S.viewM = now.getMonth(); }
    if (S.root && document.body.contains(S.root)) render();
  }

  /* ---------- inicialização (pode ser chamada várias vezes) ---------- */
  function init() {
    if (S.observer) { S.observer.disconnect(); S.observer = null; }

    var root = document.getElementById("aero-calendar");
    S.root = root;
    if (!root) return;

    try {
      root.classList.add("cal");
      var wb = root.closest(".window-body");
      if (wb) wb.classList.add("cal-body");

      S.today = new Date();
      S.todayKey = keyOf(S.today);
      S.viewY = S.today.getFullYear();
      S.viewM = S.today.getMonth();

      readPages();

      if (root.getAttribute("data-ready") !== "1") {
        buildSkeleton(root);
        root.setAttribute("data-ready", "1");
      }
      S.el = {
        title: root.querySelector(".cal-title"),
        grid: root.querySelector(".cal-grid"),
        todayText: root.querySelector(".cal-today-text"),
        note: root.querySelector(".cal-note")
      };

      if (window.MutationObserver) {
        S.observer = new MutationObserver(function () { syncFromActive(true); });
        S.pages.forEach(function (p) {
          S.observer.observe(p, { attributes: true, attributeFilter: ["class"] });
        });
      }

      syncFromActive(false);
    } catch (err) {
      root.textContent = "Calendar error: " + err.message;
    }
  }

  window.initDiaryCalendar = init;

  setInterval(checkDay, 30000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) checkDay();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
