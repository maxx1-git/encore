/* Encore — cart logic */
(() => {
  const STORAGE_KEY = "encore_cart_v1";

  window.CATALOG = {
    duck: {
      name: "Roasted Duck Breast",
      price: 38,
      cat: "Main course",
      img: "img/hero.jpg",
    },

    chicken: {
      name: "Herb Grilled Chicken",
      price: 24,
      cat: "Main course",
      img: "img/dish-1.jpg",
    },

    salmon: {
      name: "Citrus Atlantic Salmon",
      price: 28,
      cat: "Main course",
      img: "img/dish-2.jpg",
    },

    beet: {
      name: "Roasted Beet & Quinoa",
      price: 18,
      cat: "Bowls",
      img: "img/dish-3.jpg",
    },

    beef: {
      name: "Beef Tenderloin",
      price: 42,
      cat: "Main course",
      img: "img/dish-4.jpg",
    },

    ravioli: {
      name: "Sage Butter Ravioli",
      price: 22,
      cat: "Pasta",
      img: "img/dish-5.jpg",
    },

    fondant: {
      name: "Dark Chocolate Fondant",
      price: 14,
      cat: "Dessert",
      img: "img/dish-6.jpg",
    },
  };

  window.Cart = {
    read() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    },

    write(state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      this.refreshBadge();

      window.dispatchEvent(
        new CustomEvent("cart:change")
      );
    },

    add(id, qty = 1) {
      const state = this.read();

      state[id] = (state[id] || 0) + qty;

      this.write(state);

      const item = CATALOG[id];

      toast(`Added · ${item ? item.name : "Item"}`);
    },

    setQty(id, qty) {
      const state = this.read();

      if (qty <= 0) {
        delete state[id];
      } else {
        state[id] = qty;
      }

      this.write(state);
    },

    remove(id) {
      const state = this.read();

      delete state[id];

      this.write(state);
    },

    clear() {
      this.write({});
    },

    count() {
      return Object.values(this.read()).reduce((a, b) => a + b, 0);
    },

    refreshBadge() {
      document.querySelectorAll("[data-cart-count]").forEach((el) => {
        el.textContent = this.count();
      });
    },
  };

  // --- Add to cart ---
  function initAddButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");

      if (!btn) return;

      e.preventDefault();

      Cart.add(btn.dataset.add);
    });
  }

  // --- Cart page ---
  function initCartPage() {
    const list = document.querySelector("[data-cart-list]");

    if (!list) return;

    const itemsRoot = list.querySelector("[data-cart-items]");
    const emptyEl = list.querySelector("[data-cart-empty]");
    const summary = document.querySelector("[data-cart-summary]");

    if (!itemsRoot) return;

    const templateItem = itemsRoot.querySelector(".cart-item");

    const templateHTML = templateItem
      ? templateItem.outerHTML
      : "";

    function ensureItemNode(id) {
      let node = itemsRoot.querySelector(
        `[data-cart-item="${id}"]`
      );

      if (node || !templateHTML) return node;

      const meta = CATALOG[id];

      if (!meta) return null;

      const wrap = document.createElement("div");

      wrap.innerHTML = templateHTML.trim();

      node = wrap.firstElementChild;

      node.setAttribute("data-cart-item", id);

      node.querySelector("h4").textContent = meta.name;

      node.querySelector(".cart-item__meta").textContent =
        `${meta.cat} · $${meta.price} each`;

      const img = node.querySelector("img");

      img.src = meta.img;
      img.alt = meta.name;

      node.querySelectorAll(
        "[data-dec],[data-inc],[data-rm],[data-qty],[data-line-total]"
      ).forEach((el) => {
        if (el.hasAttribute("data-dec")) {
          el.setAttribute("data-dec", id);
        }

        if (el.hasAttribute("data-inc")) {
          el.setAttribute("data-inc", id);
        }

        if (el.hasAttribute("data-rm")) {
          el.setAttribute("data-rm", id);
        }

        if (el.hasAttribute("data-qty")) {
          el.setAttribute("data-qty", id);
        }

        if (el.hasAttribute("data-line-total")) {
          el.setAttribute("data-line-total", id);
        }
      });

      itemsRoot.appendChild(node);

      return node;
    }

    function sync() {
      const state = Cart.read();

      const ids = Object.keys(state);

      const isEmpty = ids.length === 0;

      if (emptyEl) {
        emptyEl.hidden = !isEmpty;
      }

      itemsRoot.hidden = isEmpty;

      if (summary) {
        summary.style.display = isEmpty ? "none" : "";
      }

      ids.forEach(ensureItemNode);

      let subtotal = 0;

      itemsRoot
        .querySelectorAll("[data-cart-item]")
        .forEach((node) => {
          const id = node.dataset.cartItem;

          const qty = state[id] || 0;

          if (qty <= 0) {
            node.remove();
            return;
          }

          const price = CATALOG[id]?.price ?? 0;

          const line = price * qty;

          subtotal += line;

          const qtyEl = node.querySelector(
            `[data-qty="${id}"]`
          );

          const totalEl = node.querySelector(
            `[data-line-total="${id}"]`
          );

          if (qtyEl) {
            qtyEl.textContent = qty;
          }

          if (totalEl) {
            totalEl.textContent = `$${line}`;
          }
        });

      if (summary && !isEmpty) {
        const delivery = subtotal >= 50 ? 0 : 6;

        const total = subtotal + delivery;

        const set = (selector, value) => {
          const el = summary.querySelector(selector);

          if (el) {
            el.textContent = value;
          }
        };

        set("[data-sum-subtotal]", `$${subtotal}`);

        set(
          "[data-sum-delivery]",
          delivery === 0
            ? "Complimentary"
            : `$${delivery}`
        );

        set("[data-sum-total]", `$${total}`);
      }
    }

    list.addEventListener("click", (e) => {
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      const rm = e.target.closest("[data-rm]");

      const state = Cart.read();

      if (inc) {
        Cart.setQty(
          inc.dataset.inc,
          (state[inc.dataset.inc] || 0) + 1
        );
      }

      if (dec) {
        Cart.setQty(
          dec.dataset.dec,
          (state[dec.dataset.dec] || 0) - 1
        );
      }

      if (rm) {
        Cart.remove(rm.dataset.rm);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-clear]")) {
        Cart.clear();
      }

      if (e.target.closest("[data-checkout]")) {
        toast("Checkout coming soon · order saved");
      }
    });

    window.addEventListener("cart:change", sync);

    sync();
  }

  document.addEventListener("DOMContentLoaded", () => {
    Cart.refreshBadge();
    initAddButtons();
    initCartPage();
  });
})();