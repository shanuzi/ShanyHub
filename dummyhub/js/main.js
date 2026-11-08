
window.DummyHub = window.DummyHub || {};

(function () {
  "use strict";

  const { logout, restoreSession } = DummyHub.api;
  const { renderCurrentView, startRouter } = DummyHub.router;
  const { getState, setRenderCallback, setState } = DummyHub.state;
  const { escapeHTML, fullName } = DummyHub.utils;

  function mountHeader() {
    const userArea = document.getElementById("user-area");
    userArea.addEventListener("click", handleUserAreaClick);
  }
  function handleUserAreaClick(event) {
    const actionElement = event.target.closest("[data-action]");
    if (actionElement && actionElement.dataset.action === "logout") {
      logout();
    }
  }
  function renderHeader() {
    const { route, cart, auth } = getState();
    highlightActiveLink(route.name);
    updateCartBadge(cart);
    updateUserArea(auth.user);
  }
  function highlightActiveLink(routeName) {
    const navLinks = Array.from(document.getElementsByClassName("nav-link"));
    navLinks.forEach((link) => {
      const isActive = link.dataset.route === routeName;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }
  function updateCartBadge(cart) {
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const badge = document.getElementById("cart-badge");
    badge.textContent = totalQuantity;
    badge.classList.toggle("is-empty", totalQuantity === 0);
  }
  function updateUserArea(user) {
    const userArea = document.getElementById("user-area");
    if (!user) {
      userArea.innerHTML = '<a href="#/login">Log in</a>';
      return;
    }
    userArea.innerHTML = `
    <img class="avatar" src="${escapeHTML(user.image)}" alt="${escapeHTML(fullName(user))}">
    <span>${escapeHTML(fullName(user))}</span>
    <button type="button" class="secondary-button" data-action="logout">Log out</button>`;
  }

  function renderApp() {
    renderHeader();
    renderCurrentView();
  }
  function readDelayFromAddress() {
    const addressParams = new URLSearchParams(window.location.search);
    const delayMs = Number(addressParams.get("delay"));
    if (delayMs > 0) {
      setState({ settings: { delayMs } });
    }
  }
  async function startApp() {
    readDelayFromAddress();
    setRenderCallback(renderApp);
    mountHeader();
    await restoreSession();
    startRouter();
  }

  startApp();
})();
