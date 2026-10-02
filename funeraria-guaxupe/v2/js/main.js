(function () {
  "use strict";

  var WHATSAPP = "551936571645";
  var TZ = "America/Sao_Paulo";

  /* Storage can be blocked; every feature must work without it. */
  function load(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function save(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* this visit only */ }
  }

  var root = document.documentElement;

  /* Clock and time-aware message */

  var clockEls = document.querySelectorAll("[data-clock]");
  var liveMsg = document.querySelector("[data-live-message]");
  var timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
  var hourFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hour12: false, timeZone: TZ });

  function tick() {
    var now = new Date();
    var time = timeFmt.format(now);
    var hour = Number(hourFmt.format(now));

    clockEls.forEach(function (el) { el.textContent = time; });

    if (liveMsg) {
      var night = hour >= 19 || hour < 6;
      liveMsg.innerHTML = night
        ? "Agora são <strong>" + time + "</strong>. Enquanto a cidade descansa, nossa equipe está acordada para atender sua família."
        : "Agora são <strong>" + time + "</strong> em Guaxupé. Nossa equipe está de plantão para orientar sua família em cada etapa.";
    }
  }

  tick();
  setInterval(tick, 30000);

  /* Theme: automatic by the hour, or the visitor's choice */

  var themeBtn = document.querySelector("[data-theme-toggle]");
  var themeLabel = document.querySelector("[data-theme-label]");

  function syncThemeButton() {
    if (!themeBtn) return;
    var night = root.getAttribute("data-theme") === "night";
    themeBtn.setAttribute("aria-pressed", String(night));
    if (themeLabel) themeLabel.textContent = night ? "Usar tema diurno" : "Usar tema noturno";
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "night" ? "day" : "night";
      root.setAttribute("data-theme", next);
      save("pax-theme", next);
      syncThemeButton();
    });
  }

  syncThemeButton();

  /* Mobile menu */

  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("menu");

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".visually-hidden").textContent = open ? "Fechar menu" : "Abrir menu";
    nav.classList.toggle("is-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") === "true" && !e.target.closest(".site-header")) setMenu(false);
    });
  }

  /* Guide checklist: progress saved on this device only */

  var guide = document.querySelector("[data-guide]");

  if (guide) {
    var boxes = guide.querySelectorAll("input[type=checkbox]");
    var fill = document.querySelector("[data-guide-fill]");
    var count = document.querySelector("[data-guide-count]");
    var saved = {};
    try { saved = JSON.parse(load("pax-guide") || "{}"); } catch (e) { saved = {}; }

    function updateGuide() {
      var done = 0;
      var state = {};
      boxes.forEach(function (b) {
        state[b.dataset.step] = b.checked;
        if (b.checked) done++;
      });
      if (fill) fill.style.transform = "scaleX(" + done / boxes.length + ")";
      if (count) count.textContent = done + " de " + boxes.length + " passos";
      save("pax-guide", JSON.stringify(state));
    }

    boxes.forEach(function (b) {
      b.checked = !!saved[b.dataset.step];
      b.addEventListener("change", updateGuide);
    });

    updateGuide();
  }

  var printBtn = document.querySelector("[data-print]");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  /* Family planner */

  var familyList = document.querySelector("[data-family]");

  if (familyList) {
    var MAX_PEOPLE = 11;
    var MAX_PETS = 3;
    var members = [];
    var nextId = 1;

    var personSelect = document.getElementById("add-person");
    var petSelect = document.getElementById("add-pet");
    var countPeople = document.querySelector("[data-count-people]");
    var countPets = document.querySelector("[data-count-pets]");
    var msg = document.querySelector("[data-family-msg]");
    var total = document.querySelector("[data-total]");
    var transfer = document.querySelector("[data-transfer]");
    var carencia = document.querySelector("[data-term-carencia]");
    var taxa = document.querySelector("[data-term-taxa]");
    var cta = document.querySelector("[data-plan-cta]");

    function countOf(kind) {
      return members.filter(function (m) { return m.kind === kind; }).length;
    }

    function say(text) {
      msg.textContent = text;
      msg.hidden = !text;
    }

    function chip(member, isNew) {
      var li = document.createElement("li");
      li.className = "chip" + (member.kind === "pet" ? " chip--pet" : "") + (isNew ? " is-new" : "");
      li.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#i-' + (member.kind === "pet" ? "paw-print" : "user") + '"/></svg>' +
        "<span></span>" +
        '<button type="button"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg><span class="visually-hidden"></span></button>';
      li.querySelector("span").textContent = member.label;
      li.querySelector("button .visually-hidden").textContent = "Remover " + member.label;
      li.querySelector("button").addEventListener("click", function () {
        members = members.filter(function (m) { return m.id !== member.id; });
        say("");
        render();
        var focusTarget = member.kind === "pet" ? petSelect : personSelect;
        if (focusTarget) focusTarget.focus();
      });
      return li;
    }

    var lastAdded = null;

    function render() {
      familyList.querySelectorAll(".chip:not(.chip--fixed)").forEach(function (el) { el.remove(); });
      members.forEach(function (m) { familyList.appendChild(chip(m, m.id === lastAdded)); });
      lastAdded = null;

      var people = countOf("person");
      var pets = countOf("pet");
      countPeople.textContent = people + " de " + MAX_PEOPLE + " dependentes";
      countPets.textContent = pets + " de " + MAX_PETS + " pets";

      var humans = people + 1;
      var parts = [humans + (humans === 1 ? " pessoa" : " pessoas")];
      if (pets) parts.push(pets + (pets === 1 ? " pet" : " pets"));
      total.textContent = parts.join(" e ");

      var isTransfer = transfer.checked;
      carencia.textContent = isTransfer ? "Sem carência" : "90 dias";
      taxa.textContent = isTransfer ? "Sem taxa" : "Consulte nossos atendentes";
      carencia.classList.toggle("is-good", isTransfer);
      taxa.classList.toggle("is-good", isTransfer);

      var lines = ["Olá! Quero conhecer o Plano Familiar Pax.", "Titular: eu."];
      var personLabels = members.filter(function (m) { return m.kind === "person"; }).map(function (m) { return m.label; });
      var petLabels = members.filter(function (m) { return m.kind === "pet"; }).map(function (m) { return m.label; });
      if (personLabels.length) lines.push("Dependentes (" + personLabels.length + "): " + personLabels.join(", ") + ".");
      if (petLabels.length) lines.push("Pets (" + petLabels.length + "): " + petLabels.join(", ") + ".");
      if (isTransfer) lines.push("Já tenho plano em outra empresa e quero fazer a transferência.");
      cta.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
    }

    function add(kind) {
      var max = kind === "pet" ? MAX_PETS : MAX_PEOPLE;
      if (countOf(kind) >= max) {
        say(kind === "pet" ? "O plano inclui até 3 pets." : "O plano inclui até 11 dependentes. Para mais pessoas, consulte nossos atendentes.");
        return;
      }
      var select = kind === "pet" ? petSelect : personSelect;
      var member = { id: nextId++, kind: kind, label: select.value };
      members.push(member);
      lastAdded = member.id;
      say("");
      render();
    }

    document.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () { add(btn.getAttribute("data-add")); });
    });

    transfer.addEventListener("change", render);
    render();
  }

  /* Units: tabs + map pins */

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".unit-tabs [role=tab]"));

  function selectUnit(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    document.querySelectorAll(".pin").forEach(function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-pin") === tab.dataset.unit);
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectUnit(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectUnit(next, true);
      }
    });
  });

  if (tabs.length) selectUnit(tabs[0], false);

  /* Privacy card: only necessary storage, so it informs rather than asks */

  var card = document.getElementById("cookie-card");

  if (card) {
    if (load("pax-privacy") !== "ok") card.hidden = false;
    card.querySelector("[data-cookie-ok]").addEventListener("click", function () {
      save("pax-privacy", "ok");
      card.hidden = true;
    });
  }

  document.querySelectorAll("[data-open-cookies]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!card) return;
      card.hidden = false;
      card.querySelector("button").focus();
    });
  });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
