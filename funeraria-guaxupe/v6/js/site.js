(function () {
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  // Cabeçalho ganha borda depois que a página sai do topo
  var header = document.querySelector(".header");
  var sentinel = document.querySelector("[data-top-sentinel]");
  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  // Menu no celular
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("menu");
  if (menuBtn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // Abas das unidades (padrão WAI-ARIA tabs, ativação automática)
  var tablist = document.querySelector("[role=tablist]");
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role=tab]"));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    // Chips de cidade abrem a unidade correspondente
    document.querySelectorAll("[data-unit-link]").forEach(function (a) {
      a.addEventListener("click", function () {
        var tab = document.getElementById("tab-" + a.getAttribute("data-unit-link"));
        if (tab) select(tab, false);
      });
    });
  }

  // WhatsApp: escolha da cidade antes de abrir a conversa
  var waBtn = document.querySelector("[data-wa-toggle]");
  var waPanel = document.getElementById("wa-panel");
  if (waBtn && waPanel) {
    var setWa = function (open) {
      waPanel.hidden = !open;
      waBtn.setAttribute("aria-expanded", String(open));
      if (open) waPanel.querySelector("a").focus();
    };
    waBtn.addEventListener("click", function () { setWa(waPanel.hidden); });
    document.querySelectorAll("[data-wa-open]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); setWa(true); });
    });
    waPanel.querySelector(".wa__close").addEventListener("click", function () { setWa(false); waBtn.focus(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !waPanel.hidden) { setWa(false); waBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!waPanel.hidden && !e.target.closest(".wa")) setWa(false);
    });
  }

  // Revelação ao entrar na tela
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
