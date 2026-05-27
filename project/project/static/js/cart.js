/* =============================================================
   Encore — Cart Page
   Responsibilities: qty/remove/clear/checkout interactions via AJAX.
   All cart state, prices, and HTML are rendered by Django.
   This file only handles UI behavior after page load.
   ============================================================= */

(() => {
  "use strict";

  /* -----------------------------------------------------------
     CONFIGURATION
     Django templates should render data attributes on the
     cart container to provide endpoint URLs:

       <div data-cart-list
            data-url-update="/cart/update/"
            data-url-remove="/cart/remove/"
            data-url-clear="/cart/clear/"
            data-url-checkout="/checkout/">
       </div>

     Each action reloads the cart section from the server response
     or does a full page reload — keeping Django as the source of truth.
  ----------------------------------------------------------- */

  /* -----------------------------------------------------------
     CSRF helper
     Reads the CSRF token from Django's cookie so AJAX POST/DELETE
     requests pass the CSRF check.
  ----------------------------------------------------------- */
  function getCsrfToken() {
    const name = "csrftoken";
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === name) return decodeURIComponent(value);
    }
    return "";
  }

  /* -----------------------------------------------------------
     AJAX helper
     Thin wrapper around fetch for Django AJAX endpoints.
     All cart endpoints should return:
       { success: bool, message: string, cart_count: number, redirect?: string }
     or a full HTML fragment if using Django's render_to_string.
  ----------------------------------------------------------- */
  async function djangoPost(url, body = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRFToken": getCsrfToken(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /* -----------------------------------------------------------
     CART ITEM INTERACTIONS
     Handles: quantity increment/decrement, remove, clear, checkout.
     All triggered via data attributes set by Django templates.

     Expected data attributes:
       [data-inc="<item-id>"]    — increase quantity
       [data-dec="<item-id>"]    — decrease quantity
       [data-rm="<item-id>"]     — remove item
       [data-clear]              — clear entire cart
       [data-checkout]           — proceed to checkout
  ----------------------------------------------------------- */
  function initCartPage() {
    const list = document.querySelector("[data-cart-list]");
    if (!list) return;

    /* Endpoint URLs from data attributes (set by Django template) */
    const urls = {
      update:   list.dataset.urlUpdate   || "",
      remove:   list.dataset.urlRemove   || "",
      clear:    list.dataset.urlClear    || "",
      checkout: list.dataset.urlCheckout || "",
    };

    /* ---- Quantity / Remove / Clear / Checkout ---- */
    document.addEventListener("click", async (e) => {

      /* Increase quantity */
      const inc = e.target.closest("[data-inc]");
      if (inc) {
        await updateQty(inc.dataset.inc, 1, urls.update);
        return;
      }

      /* Decrease quantity */
      const dec = e.target.closest("[data-dec]");
      if (dec) {
        await updateQty(dec.dataset.dec, -1, urls.update);
        return;
      }

      /* Remove item */
      const rm = e.target.closest("[data-rm]");
      if (rm) {
        await removeItem(rm.dataset.rm, urls.remove);
        return;
      }

      /* Clear cart */
      if (e.target.closest("[data-clear]")) {
        await clearCart(urls.clear);
        return;
      }

      /* Checkout */
      if (e.target.closest("[data-checkout]")) {
        handleCheckout(urls.checkout);
        return;
      }
    });
  }

  /* ---- Action handlers ---- */

  async function updateQty(itemId, delta, url) {
    if (!url) { reloadPage(); return; }

    setCartLoading(true);
    try {
      const data = await djangoPost(url, { item_id: itemId, delta });

      if (data.success) {
        if (typeof data.cart_count === "number") {
          window.updateCartBadge?.(data.cart_count);
        }
        /* Reload the cart section to reflect Django's updated state */
        reloadPage();
      } else {
        window.notify(data.message || "Could not update quantity.", "error");
        setCartLoading(false);
      }
    } catch (err) {
      console.error("[Encore] Update qty failed:", err);
      window.notify("Connection error. Please try again.", "error");
      setCartLoading(false);
    }
  }

  async function removeItem(itemId, url) {
    if (!url) { reloadPage(); return; }

    /* Optimistic UI: fade the item out while request is in flight */
    const itemEl = document.querySelector(`[data-cart-item="${itemId}"]`);
    if (itemEl) {
      itemEl.style.transition = "opacity .25s, transform .25s";
      itemEl.style.opacity = "0";
      itemEl.style.transform = "translateX(8px)";
    }

    try {
      const data = await djangoPost(url, { item_id: itemId });

      if (data.success) {
        window.notify(data.message || "Item removed.", "info");
        if (typeof data.cart_count === "number") {
          window.updateCartBadge?.(data.cart_count);
        }
        reloadPage();
      } else {
        /* Restore item if request failed */
        if (itemEl) { itemEl.style.opacity = ""; itemEl.style.transform = ""; }
        window.notify(data.message || "Could not remove item.", "error");
      }
    } catch (err) {
      if (itemEl) { itemEl.style.opacity = ""; itemEl.style.transform = ""; }
      console.error("[Encore] Remove item failed:", err);
      window.notify("Connection error. Please try again.", "error");
    }
  }

  async function clearCart(url) {
    if (!url) { reloadPage(); return; }

    setCartLoading(true);
    try {
      const data = await djangoPost(url);

      if (data.success) {
        window.notify("Order cleared.", "info");
        window.updateCartBadge?.(0);
        reloadPage();
      } else {
        window.notify(data.message || "Could not clear cart.", "error");
        setCartLoading(false);
      }
    } catch (err) {
      console.error("[Encore] Clear cart failed:", err);
      window.notify("Connection error. Please try again.", "error");
      setCartLoading(false);
    }
  }

  function handleCheckout(url) {
    if (url) {
      window.location.href = url;
    } else {
      /* Placeholder until checkout is implemented */
      window.notify("Checkout coming soon — your order is saved.", "info");
    }
  }

  /* -----------------------------------------------------------
     UTILITIES
  ----------------------------------------------------------- */

  /* Full page reload — simplest way to keep Django as source of truth */
  function reloadPage() {
    window.location.reload();
  }

  /* Visual loading overlay on the cart section */
  function setCartLoading(active) {
    const list = document.querySelector("[data-cart-list]");
    if (!list) return;
    list.style.opacity = active ? "0.5" : "";
    list.style.pointerEvents = active ? "none" : "";
    list.style.transition = "opacity .2s";
  }

  /* -----------------------------------------------------------
     INIT
  ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initCartPage();
  });
})();