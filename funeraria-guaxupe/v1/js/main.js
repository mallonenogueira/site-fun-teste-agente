(function () {
  "use strict";

  var WHATSAPP_NUMBER = "551936571645";
  var CONSENT_KEY = "pax-consent";

  /* Storage can be blocked (private mode, strict settings); the site must work without it. */
  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {
      /* Choice still applies for this visit. */
    }
  }

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

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") === "true" && !event.target.closest(".site-header")) {
        setMenu(false);
      }
    });
  }

  /* Google Maps embed: only after consent, because it can set third-party cookies. */

  var mapsAllowed = readConsent() === "all";

  function loadMaps() {
    document.querySelectorAll("[data-map-src]").forEach(function (box) {
      if (box.querySelector("iframe")) return;
      var iframe = document.createElement("iframe");
      iframe.src = box.getAttribute("data-map-src");
      iframe.title = box.getAttribute("data-map-title") || "Mapa";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.setAttribute("allowfullscreen", "");
      var placeholder = box.querySelector(".unit-map__placeholder");
      if (placeholder) placeholder.hidden = true;
      box.appendChild(iframe);
    });
  }

  document.querySelectorAll("[data-load-map]").forEach(function (button) {
    button.addEventListener("click", function () {
      mapsAllowed = true;
      writeConsent("all");
      hideBanner();
      loadMaps();
    });
  });

  /* Cookie banner (LGPD) */

  var banner = document.getElementById("cookie-banner");

  function syncBannerOffset() {
    if (!banner || banner.hidden) return;
    document.body.style.setProperty("--cookie-h", banner.offsetHeight + "px");
  }

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    document.body.classList.add("has-cookie-banner");
    syncBannerOffset();
  }

  function hideBanner() {
    if (!banner) return;
    banner.hidden = true;
    document.body.classList.remove("has-cookie-banner");
  }

  if (banner) {
    banner.querySelectorAll("[data-cookies]").forEach(function (button) {
      button.addEventListener("click", function () {
        var choice = button.getAttribute("data-cookies");
        writeConsent(choice);
        hideBanner();
        if (choice === "all") {
          mapsAllowed = true;
          loadMaps();
        }
      });
    });

    window.addEventListener("resize", syncBannerOffset);

    if (!readConsent()) showBanner();
  }

  document.querySelectorAll("[data-open-cookies]").forEach(function (button) {
    button.addEventListener("click", function () {
      showBanner();
      var first = banner && banner.querySelector("button");
      if (first) first.focus();
    });
  });

  if (mapsAllowed) loadMaps();

  /* Contact form: composes a WhatsApp message. Nothing is sent to or stored by this site. */

  var form = document.getElementById("contact-form");

  if (form) {
    var nameInput = form.querySelector("#f-nome");
    var nameError = form.querySelector("#f-nome-erro");

    nameInput.addEventListener("input", function () {
      if (nameInput.value.trim()) {
        nameInput.removeAttribute("aria-invalid");
        nameError.hidden = true;
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = nameInput.value.trim();
      if (!name) {
        nameInput.setAttribute("aria-invalid", "true");
        nameError.hidden = false;
        nameInput.focus();
        return;
      }

      var city = form.querySelector("#f-cidade").value.trim();
      var subject = form.querySelector("#f-assunto").value;
      var message = form.querySelector("#f-msg").value.trim();

      var lines = ["Olá, meu nome é " + name + "."];
      if (city) lines.push("Cidade: " + city + ".");
      lines.push("Assunto: " + subject + ".");
      if (message) lines.push(message);

      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
  }

  /* Current year in footer */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
