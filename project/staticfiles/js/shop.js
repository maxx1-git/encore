/* Encore — shop filters */
(() => {
  function initShopFilters() {
    const filters = document.querySelector("[data-filters]");
    const shop = document.querySelector("[data-shop]");

    if (!filters || !shop) return;

    filters.addEventListener("click", (e) => {
      const button = e.target.closest(
        "button[data-filter]"
      );

      if (!button) return;

      const active = button.dataset.filter;

      filters.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle(
          "is-active",
          btn === button
        );
      });

      shop.querySelectorAll("[data-cat]").forEach((section) => {
        section.hidden = !(
          active === "all" ||
          section.dataset.cat === active
        );
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initShopFilters();
  });
})();