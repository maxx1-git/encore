/* =============================================================
   Encore — Shop Page
   Responsibilities: category filters, add-to-cart AJAX
   ============================================================= */

(() => {
  "use strict";

  /* -----------------------------------------------------------
     CATEGORY FILTERS
     Toggles visibility of [data-cat] sections.
     Pure DOM/UI — no data logic.
  ----------------------------------------------------------- */
  function initShopFilters() {
    const filters = document.querySelector("[data-filters]");
    const shop = document.querySelector("[data-shop]");
    if (!filters || !shop) return;

    filters.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-filter]");
      if (!button) return;

      const active = button.dataset.filter;

      /* Update active pill */
      filters.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("is-active", btn === button);
      });

      /* Show / hide sections */
      shop.querySelectorAll("[data-cat]").forEach((section) => {
        const visible = active === "all" || section.dataset.cat === active;
        section.hidden = !visible;
      });
    });
  }

  /* -----------------------------------------------------------
     ADD TO CART — AJAX
     Expects buttons with:
       class="add-to-cart-btn"
       data-url="/cart/add/<id>/"   (Django URL rendered by template)

     Django view should return JSON:
       { success: true,  message: "Added · Dish Name", cart_count: 3 }
       { success: false, message: "Could not add item." }

     Uses event delegation so dynamically injected buttons also work.
  ----------------------------------------------------------- */
  function initAddToCart() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;

      const url = btn.dataset.url;
      if (!url) return;

      /* Loading state */
      setButtonLoading(btn, true);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
          window.notify(data.message || "Added to cart", "cart");

          /* Update cart badge if Django returns updated count */
          if (typeof data.cart_count === "number") {
            window.updateCartBadge?.(data.cart_count);
          }
        } else {
          window.notify(data.message || "Could not add item.", "error");
        }
      } catch (err) {
        console.error("[Encore] Add to cart failed:", err);
        window.notify("Connection error. Please try again.", "error");
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  /* -----------------------------------------------------------
     BUTTON LOADING STATE
     Swaps button text with a spinner, restores on completion.
  ----------------------------------------------------------- */
  function setButtonLoading(btn, loading) {
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `
        <span class="btn-spinner" aria-hidden="true"></span>
        <span>Adding…</span>
      `;
      injectSpinnerStyles();
    } else {
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
        delete btn.dataset.originalText;
      }
    }
  }

  function injectSpinnerStyles() {
    if (document.getElementById("encore-spinner-styles")) return;
    const style = document.createElement("style");
    style.id = "encore-spinner-styles";
    style.textContent = `
      .btn-spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 1.5px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: encore-spin .6s linear infinite;
        opacity: .7;
        vertical-align: middle;
      }
      @keyframes encore-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /* -----------------------------------------------------------
     INIT
  ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initShopFilters();
    initAddToCart();
  });
})();