(function () {
  "use strict";

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
    return null;
  }

  /* Sheet menu */

  var burger = document.querySelector("[data-burger]");
  var sheet = document.querySelector("[data-sheet]");

  function setSheet(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.querySelector(".sr").textContent = open ? "Fechar menu" : "Menu";
    sheet.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      var first = sheet.querySelector("a");
      if (first) first.focus();
    }
  }

  if (burger && sheet) {
    burger.addEventListener("click", function () {
      setSheet(burger.getAttribute("aria-expanded") !== "true");
    });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("a")) setSheet(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) {
        setSheet(false);
        burger.focus();
      }
    });
  }

  /* Privacy toast: only stores that it was read */

  var toast = document.querySelector("[data-toast]");
  if (toast) {
    if (store("pax-v3-toast") !== "ok") toast.hidden = false;
    toast.querySelector("[data-toast-close]").addEventListener("click", function () {
      store("pax-v3-toast", "ok");
      toast.hidden = true;
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Motion: GSAP only when available and the visitor has not asked for less motion.
     Without it, every element is already visible in its final state. */

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function start() {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    document.documentElement.classList.add("js-motion");

    /* Hero entrance */
    gsap.from("[data-hero-item]", {
      y: 36,
      opacity: 0,
      filter: "blur(8px)",
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.09,
      clearProps: "filter"
    });
    gsap.from(".hero .pill", {
      scale: 0.4,
      opacity: 0,
      duration: 1.2,
      ease: "expo.out",
      delay: 0.35,
      stagger: 0.12
    });

    /* Panorama grows into place as it scrolls in */
    gsap.fromTo("[data-panorama]", { scale: 0.92, y: 40 }, {
      scale: 1,
      y: 0,
      ease: "none",
      scrollTrigger: { trigger: "[data-panorama]", start: "top bottom", end: "center center", scrub: 0.6 }
    });

    /* Manifesto: words light up as you read */
    var scrub = document.querySelector("[data-scrub]");
    if (scrub) {
      var words = scrub.textContent.trim().split(/\s+/);
      scrub.setAttribute("aria-label", scrub.textContent.trim());
      scrub.innerHTML = words.map(function (w) {
        return '<span class="w" aria-hidden="true">' + w + "</span>";
      }).join(" ");
      gsap.fromTo(scrub.querySelectorAll(".w"), { opacity: 0.14 }, {
        opacity: 1,
        stagger: 0.05,
        ease: "none",
        scrollTrigger: { trigger: scrub, start: "top 80%", end: "bottom 45%", scrub: true }
      });
    }

    /* Tiles rise in batches */
    gsap.set("[data-tile]", { y: 48, opacity: 0 });
    window.ScrollTrigger.batch("[data-tile]", {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.08 });
      }
    });

    /* Journey: track fills and steps light up */
    var steps = document.querySelector("[data-steps]");
    if (steps) {
      gsap.to("[data-track]", {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: steps, start: "top 60%", end: "bottom 60%", scrub: true }
      });
      steps.querySelectorAll(".step").forEach(function (step) {
        window.ScrollTrigger.create({
          trigger: step,
          start: "top 62%",
          onEnter: function () { step.classList.add("is-on"); },
          onLeaveBack: function () { step.classList.remove("is-on"); }
        });
      });
    }
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
