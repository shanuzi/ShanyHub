
window.DummyHub = window.DummyHub || {};
DummyHub.views = DummyHub.views || {};

(function () {
  "use strict";

  const { addCart, getCartsByUser } = DummyHub.api;
  const { getState, setState, updateSlice } = DummyHub.state;
  const { DEFAULT_MINIMUM_ORDER, calculateCartTotals, emptyMarkup, errorMarkup, escapeHTML, formatPrice, loadingMarkup } = DummyHub.utils;

  function addProductToCart(product, quantity) {
    const { cart } = getState();
    const existingItem = cart.find((item) => item.id === product.id);
    const quantityAlreadyInCart = existingItem ? existingItem.quantity : 0;
    const minimumOrder = product.minimumOrderQuantity || DEFAULT_MINIMUM_ORDER;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return "Please enter a whole number of 1 or more.";
    }
    if (!existingItem && quantity < minimumOrder) {
      return `The minimum order for this product is ${minimumOrder}.`;
    }
    if (quantityAlreadyInCart + quantity > product.stock) {
      return `Only ${product.stock} in stock (${quantityAlreadyInCart} already in your cart).`;
    }
    if (existingItem) {
      const updatedCart = cart.map((item) => {
        if (item.id !== product.id) {
          return item;
        }
        return { ...item, quantity: item.quantity + quantity };
      });
      setState({ cart: updatedCart });
      return "";
    }
    const newItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      discountPercentage: product.discountPercentage,
      thumbnail: product.thumbnail,
      stock: product.stock,
      quantity
    };
    setState({ cart: [...cart, newItem] });
    return "";
  }
  function changeCartQuantity(productId, change) {
    const { cart } = getState();
    const updatedCart = cart.map((item) => {
      if (item.id !== productId) {
        return item;
      }
      const newQuantity = item.quantity + change;
      if (newQuantity < 1 || newQuantity > item.stock) {
        return item;
      }
      return { ...item, quantity: newQuantity };
    });
    setState({ cart: updatedCart });
  }
  function removeFromCart(productId) {
    const { cart } = getState();
    const updatedCart = cart.filter((item) => item.id !== productId);
    setState({ cart: updatedCart });
  }

  function mount() {
    document.getElementById("app").innerHTML = `
    <section class="cart-view">
      <h1>Your cart</h1>
      <div id="cart-content"></div>
      <h2>Past orders</h2>
      <div id="past-carts"></div>
    </section>`;
    document.querySelector(".cart-view").addEventListener("click", handleClick);
    updateSlice("checkout", { status: "idle", receipt: null, error: "" });
    loadPastCarts();
  }
  function render() {
    document.getElementById("cart-content").innerHTML = buildCartMarkup();
    document.getElementById("past-carts").innerHTML = buildPastCartsMarkup();
  }
  function handleClick(event) {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) {
      return;
    }
    const { action, id } = actionElement.dataset;
    const productId = Number(id);
    if (action === "increase") {
      changeCartQuantity(productId, 1);
    }
    if (action === "decrease") {
      changeCartQuantity(productId, -1);
    }
    if (action === "remove") {
      removeFromCart(productId);
    }
    if (action === "checkout") {
      checkout();
    }
    if (action === "retry") {
      loadPastCarts();
    }
  }
  async function checkout() {
    const { cart, auth } = getState();
    updateSlice("checkout", { status: "loading", error: "" });
    const products = cart.map((item) => ({ id: item.id, quantity: item.quantity }));
    try {
      const receipt = await addCart(auth.user.id, products);
      setState({ cart: [], checkout: { status: "success", receipt, error: "" } });
    } catch (error) {
      updateSlice("checkout", { status: "error", error: error.message });
    }
  }
  async function loadPastCarts() {
    const { user } = getState().auth;
    updateSlice("cartHistory", { status: "loading", error: "" });
    try {
      const { carts } = await getCartsByUser(user.id);
      updateSlice("cartHistory", { status: "success", items: carts });
    } catch (error) {
      updateSlice("cartHistory", { status: "error", error: error.message });
    }
  }
  function buildCartMarkup() {
    const { cart } = getState();
    const { status, receipt, error } = getState().checkout;
    if (receipt) {
      return renderReceipt(receipt);
    }
    if (cart.length === 0) {
      return `${emptyMarkup("Your cart is empty.")}<p><a href="#/shop">Browse the shop</a></p>`;
    }
    const { subtotal, discountAmount, grandTotal } = calculateCartTotals(cart);
    const isCheckingOut = status === "loading";
    const errorText = error ? `<p class="form-error" role="alert">${escapeHTML(error)}</p>` : "";
    return `
    <ul class="plain-list">${cart.map((item) => renderCartLine(item)).join("")}</ul>
    <div class="totals">
      <p>Subtotal: ${formatPrice(subtotal)}</p>
      <p>Discount: -${formatPrice(discountAmount)}</p>
      <p class="price">Total: ${formatPrice(grandTotal)}</p>
      ${errorText}
      <button type="button" data-action="checkout" ${isCheckingOut ? "disabled" : ""}>
        ${isCheckingOut ? "Placing order…" : "Checkout"}
      </button>
    </div>`;
  }
  function renderCartLine(item) {
    const id = escapeHTML(item.id);
    const title = escapeHTML(item.title);
    return `
    <li class="cart-line">
      <img src="${escapeHTML(item.thumbnail)}" alt="${title}">
      <div class="cart-line-title">
        <strong>${title}</strong><br>
        <span class="muted">${formatPrice(item.price)} each</span>
      </div>
      <div class="quantity-controls">
        <button type="button" class="secondary-button" data-action="decrease" data-id="${id}" aria-label="Fewer ${title}" ${item.quantity <= 1 ? "disabled" : ""}>-</button>
        <span>${item.quantity}</span>
        <button type="button" class="secondary-button" data-action="increase" data-id="${id}" aria-label="More ${title}" ${item.quantity >= item.stock ? "disabled" : ""}>+</button>
      </div>
      <span>${formatPrice(item.price * item.quantity)}</span>
      <button type="button" class="danger-button" data-action="remove" data-id="${id}" aria-label="Remove ${title}">Remove</button>
    </li>`;
  }
  function renderReceipt(receipt) {
    const rowsMarkup = receipt.products.map((product) => {
      return `
        <tr>
          <td>${escapeHTML(product.title)}</td>
          <td>${product.quantity}</td>
          <td>${formatPrice(product.total)}</td>
          <td>${formatPrice(product.discountedPrice)}</td>
        </tr>`;
    }).join("");
    return `
    <article class="panel">
      <h2>Order receipt</h2>
      <p>Thank you! Your order number is ${escapeHTML(receipt.id)}.</p>
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Product</th><th>Quantity</th><th>Total</th><th>After discount</th></tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
      </div>
      <p>Total: ${formatPrice(receipt.total)}</p>
      <p class="price">You pay: ${formatPrice(receipt.discountedTotal)}</p>
      <a href="#/shop">Continue shopping</a>
    </article>`;
  }
  function buildPastCartsMarkup() {
    const { status, items, error } = getState().cartHistory;
    if (status === "idle" || status === "loading") {
      return loadingMarkup("Loading past orders…");
    }
    if (status === "error") {
      return errorMarkup(error);
    }
    if (items.length === 0) {
      return emptyMarkup("You have no past orders yet.");
    }
    return `<ul class="plain-list">${items.map((cart) => renderPastCart(cart)).join("")}</ul>`;
  }
  function renderPastCart(cart) {
    const productsMarkup = cart.products.map((product) => `<li>${escapeHTML(product.title)} &times; ${product.quantity}</li>`).join("");
    return `
    <li class="panel">
      <strong>Cart ${escapeHTML(cart.id)}</strong>
      <span class="muted">${cart.totalQuantity} items, ${formatPrice(cart.discountedTotal)}</span>
      <ul>${productsMarkup}</ul>
    </li>`;
  }

  DummyHub.cartActions = { addProductToCart, changeCartQuantity, removeFromCart };
  DummyHub.views.cart = { mount, render };
})();
