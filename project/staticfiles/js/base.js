/* Encore — base interactions */
(() => {
  // --- Toast ---
  let toastTimer;

  window.toast = function (msg) {
    let el = document.querySelector(".toast");

    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.innerHTML = `
        <span class="dot"></span>
        <span class="msg"></span>
      `;
      document.body.appendChild(el);
    }

    el.querySelector(".msg").textContent = msg;

    el.classList.add("is-show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      el.classList.remove("is-show");
    }, 2200);
  };

  // --- Nav ---
  function initNav() {
    const nav = document.querySelector(".nav");

    if (!nav) return;

    const burger = nav.querySelector(".nav__burger");

    burger?.addEventListener("click", () => {
      nav.classList.toggle("menu-open");
    });

    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });
  }

  // --- Reveal on scroll ---
  function initReveal() {
    const els = document.querySelectorAll(".reveal:not(.is-in)");

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
    });

    els.forEach((el) => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initReveal();
  });
})();