/* =============================================================
   Encore — Base UI Layer
   Responsibilities: nav, scroll reveal, notification system
   ============================================================= */

(() => {
  "use strict";

  /* -----------------------------------------------------------
     NOTIFICATION SYSTEM
     -----------------------------------------------------------
     Public API (attached to window for cross-module access):

       window.notify(message, type, options)

       type    : "success" | "error" | "info" | "cart"  (default: "info")
       options : { duration: 3500, subtitle: "" }

     Examples:
       window.notify("Added to cart", "cart")
       window.notify("Something went wrong", "error")
       window.notify("Order confirmed!", "success", { subtitle: "Check your email" })
  ----------------------------------------------------------- */

  const NotificationSystem = (() => {
    let container = null;
    let idCounter = 0;

    const ICONS = {
      success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.25" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4.5 8l2.5 2.5 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      error: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.25" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
      cart: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 2h1.5l1.8 7.2a1 1 0 001 .8H12a1 1 0 001-.76L14 6H4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="6.5" cy="13" r="1" fill="currentColor"/>
        <circle cx="11.5" cy="13" r="1" fill="currentColor"/>
      </svg>`,
      info: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.25" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 7.5v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    };

    function ensureContainer() {
      if (container) return container;
      container = document.createElement("div");
      container.className = "nc-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-label", "Notifications");
      document.body.appendChild(container);
      return container;
    }

    function dismiss(card, progressBar) {
      clearTimeout(card._autoTimer);
      if (progressBar) clearInterval(progressBar._ticker);
      card.classList.add("nc-card--out");
      card.addEventListener("animationend", () => card.remove(), { once: true });
    }

    function show(message, type = "info", options = {}) {
      const { duration = 3500, subtitle = "" } = options;
      const c = ensureContainer();
      const id = ++idCounter;
      const icon = ICONS[type] || ICONS.info;

      const card = document.createElement("div");
      card.className = `nc-card nc-card--${type} nc-card--in`;
      card.setAttribute("role", "status");
      card.dataset.ncId = id;

      card.innerHTML = `
        <div class="nc-icon" aria-hidden="true">${icon}</div>
        <div class="nc-body">
          <span class="nc-msg">${message}</span>
          ${subtitle ? `<span class="nc-sub">${subtitle}</span>` : ""}
        </div>
        <button class="nc-close" aria-label="Dismiss notification">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="nc-progress" aria-hidden="true"><div class="nc-progress-bar"></div></div>
      `;

      c.appendChild(card);

      /* Progress bar animation */
      const bar = card.querySelector(".nc-progress-bar");
      let elapsed = 0;
      const tick = 30;
      bar._ticker = setInterval(() => {
        elapsed += tick;
        bar.style.transform = `scaleX(${1 - elapsed / duration})`;
        if (elapsed >= duration) clearInterval(bar._ticker);
      }, tick);

      /* Auto dismiss */
      card._autoTimer = setTimeout(() => dismiss(card, bar), duration);

      /* Manual close */
      card.querySelector(".nc-close").addEventListener("click", () => dismiss(card, bar));

      /* Pause on hover */
      card.addEventListener("mouseenter", () => {
        clearTimeout(card._autoTimer);
        clearInterval(bar._ticker);
      });
      card.addEventListener("mouseleave", () => {
        const remaining = duration - elapsed;
        if (remaining > 0) {
          bar._ticker = setInterval(() => {
            elapsed += tick;
            bar.style.transform = `scaleX(${1 - elapsed / duration})`;
            if (elapsed >= duration) clearInterval(bar._ticker);
          }, tick);
          card._autoTimer = setTimeout(() => dismiss(card, bar), remaining);
        }
      });

      return id;
    }

    function injectStyles() {
      if (document.getElementById("nc-styles")) return;
      const style = document.createElement("style");
      style.id = "nc-styles";
      style.textContent = `
        .nc-container {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          display: flex;
          flex-direction: column-reverse;
          gap: 10px;
          pointer-events: none;
          max-width: min(380px, calc(100vw - 40px));
        }

        .nc-card {
          pointer-events: all;
          display: grid;
          grid-template-columns: 32px 1fr 20px;
          align-items: start;
          gap: 0 10px;
          padding: 14px 14px 18px;
          border-radius: 14px;
          background: color-mix(in oklab, var(--paper, #faf6ef) 92%, transparent);
          border: 1px solid var(--line, #e3d9c8);
          box-shadow:
            0 4px 6px -1px rgba(22,19,17,.06),
            0 20px 40px -12px rgba(22,19,17,.14),
            inset 0 1px 0 rgba(255,255,255,.7);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          overflow: hidden;
          position: relative;
          will-change: transform, opacity;
          cursor: default;
          user-select: none;
        }

        .nc-card--in {
          animation: nc-slide-in .38s cubic-bezier(.22,.61,.36,1) both;
        }
        .nc-card--out {
          animation: nc-slide-out .28s cubic-bezier(.55,0,1,.45) both;
        }

        @keyframes nc-slide-in {
          from { opacity: 0; transform: translateY(12px) scale(.94); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes nc-slide-out {
          from { opacity: 1; transform: translateY(0) scale(1); max-height: 120px; margin-bottom: 0; }
          to   { opacity: 0; transform: translateY(6px) scale(.96); max-height: 0; margin-bottom: -10px; }
        }

        /* Type accent strips */
        .nc-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 14px 14px 0 0;
        }
        .nc-card--success::before { background: #4a9268; }
        .nc-card--error::before   { background: var(--ember, #c2502b); }
        .nc-card--cart::before    { background: var(--gold, #b8924a); }
        .nc-card--info::before    { background: var(--muted, #8a8079); }

        .nc-icon {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: var(--cream, #ece4d6);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .nc-card--success .nc-icon { background: #eaf4ee; color: #4a9268; }
        .nc-card--error   .nc-icon { background: #fdf0ec; color: var(--ember, #c2502b); }
        .nc-card--cart    .nc-icon { background: #faf4e8; color: var(--gold, #b8924a); }
        .nc-card--info    .nc-icon { background: var(--cream, #ece4d6); color: var(--muted, #8a8079); }

        .nc-body {
          display: flex; flex-direction: column; gap: 2px;
          padding-top: 6px;
          min-width: 0;
        }
        .nc-msg {
          font-family: var(--font-body, "Inter", sans-serif);
          font-size: 13.5px;
          font-weight: 500;
          color: var(--ink, #161311);
          line-height: 1.4;
        }
        .nc-sub {
          font-family: var(--font-body, "Inter", sans-serif);
          font-size: 12px;
          color: var(--muted, #8a8079);
          line-height: 1.4;
        }

        .nc-close {
          width: 20px; height: 20px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--muted, #8a8079);
          background: none; border: none;
          cursor: pointer;
          padding: 0;
          margin-top: 5px;
          transition: background .15s, color .15s;
          flex-shrink: 0;
        }
        .nc-close:hover { background: var(--cream, #ece4d6); color: var(--ink, #161311); }

        .nc-progress {
          grid-column: 1 / -1;
          height: 2px;
          background: var(--line, #e3d9c8);
          border-radius: 999px;
          margin-top: 10px;
          overflow: hidden;
        }
        .nc-progress-bar {
          height: 100%;
          width: 100%;
          transform-origin: left;
          transform: scaleX(1);
          border-radius: 999px;
          transition: transform 30ms linear;
        }
        .nc-card--success .nc-progress-bar { background: #4a9268; }
        .nc-card--error   .nc-progress-bar { background: var(--ember, #c2502b); }
        .nc-card--cart    .nc-progress-bar { background: var(--gold, #b8924a); }
        .nc-card--info    .nc-progress-bar { background: var(--muted, #8a8079); }

        @media (max-width: 480px) {
          .nc-container {
            bottom: 16px;
            right: 16px;
            left: 16px;
            max-width: none;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return { show, injectStyles };
  })();

  /* Expose globally */
  window.notify = function (message, type = "info", options = {}) {
    return NotificationSystem.show(message, type, options);
  };

  /* Legacy compat — old code called window.toast(msg) */
  window.toast = function (msg) {
    NotificationSystem.show(msg, "info");
  };

  /* -----------------------------------------------------------
     NAV
  ----------------------------------------------------------- */
  function initNav() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    const burger = nav.querySelector(".nav__burger");
    burger?.addEventListener("click", () => nav.classList.toggle("menu-open"));

    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -----------------------------------------------------------
     SCROLL REVEAL
  ----------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal:not(.is-in)");

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }



  /* -----------------------------------------------------------
     INIT
  ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    NotificationSystem.injectStyles();
    initNav();
    initReveal();
  });
})();