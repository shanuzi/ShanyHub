
window.DummyHub = window.DummyHub || {};
DummyHub.views = DummyHub.views || {};

(function () {
  "use strict";

  const { getMyCarts, getMyPosts, getMyTodos, getRandomQuote } = DummyHub.api;
  const { getState, updateSlice } = DummyHub.state;
  const { errorMarkup, escapeHTML, formatPrice, loadingMarkup } = DummyHub.utils;

  function mount() {
    document.getElementById("app").innerHTML = `
    <section class="dashboard-view">
      <h1>Dashboard</h1>
      <div id="dashboard-content"></div>
    </section>`;
    document.getElementById("dashboard-content").addEventListener("click", handleClick);
    loadDashboard();
  }
  function render() {
    document.getElementById("dashboard-content").innerHTML = buildDashboardMarkup();
  }
  function handleClick(event) {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) {
      return;
    }
    const { action } = actionElement.dataset;
    if (action === "retry") {
      loadDashboard();
    }
    if (action === "new-quote") {
      loadNewQuote();
    }
  }
  async function loadDashboard() {
    const { user } = getState().auth;
    updateSlice("dashboard", { status: "loading", error: "" });
    try {
      const [quote, cartsResponse, todosResponse, postsResponse] = await Promise.all([
        getRandomQuote(),
        getMyCarts(user.id),
        getMyTodos(user.id),
        getMyPosts(user.id)
      ]);
      const { carts } = cartsResponse;
      const { todos } = todosResponse;
      const { posts } = postsResponse;
      updateSlice("dashboard", { status: "success", quote, carts, todos, posts });
    } catch (error) {
      updateSlice("dashboard", { status: "error", error: error.message });
    }
  }
  async function loadNewQuote() {
    updateSlice("dashboard", { quoteStatus: "loading", quoteError: "" });
    try {
      const quote = await getRandomQuote();
      updateSlice("dashboard", { quote, quoteStatus: "success" });
    } catch (error) {
      updateSlice("dashboard", { quoteStatus: "error", quoteError: error.message });
    }
  }
  function buildDashboardMarkup() {
    const { status, error, carts, todos, posts } = getState().dashboard;
    if (status === "idle" || status === "loading") {
      return loadingMarkup("Loading your dashboard…");
    }
    if (status === "error") {
      return errorMarkup(error);
    }
    const totalSpent = carts.reduce((sum, cart) => sum + cart.discountedTotal, 0);
    const completedCount = todos.reduce((count, todo) => todo.completed ? count + 1 : count, 0);
    const pendingCount = todos.length - completedCount;
    const { user } = getState().auth;
    const firstName = user ? user.firstName : "";
    return `
    <p>Welcome back, ${escapeHTML(firstName)}.</p>
    <div class="summary-grid">
      ${renderSummaryCard("Past carts", carts.length, `${formatPrice(totalSpent)} after discounts`)}
      ${renderSummaryCard("Tasks done", completedCount, `${pendingCount} still pending`)}
      ${renderSummaryCard("Posts written", posts.length, "in the community")}
    </div>
    ${buildQuoteMarkup()}`;
  }
  function renderSummaryCard(title, mainNumber, detailText) {
    return `
    <article class="summary-card">
      <h2>${escapeHTML(title)}</h2>
      <p class="big-number">${mainNumber}</p>
      <p class="muted">${escapeHTML(detailText)}</p>
    </article>`;
  }
  function buildQuoteMarkup() {
    const { quote, quoteStatus, quoteError } = getState().dashboard;
    const isLoading = quoteStatus === "loading";
    const quoteText = quote ? escapeHTML(quote.quote) : "";
    const quoteAuthor = quote ? escapeHTML(quote.author) : "";
    const errorText = quoteError ? `<p class="form-error">${escapeHTML(quoteError)}</p>` : "";
    return `
    <section class="panel">
      <h2>Quote of the moment</h2>
      <blockquote>
        <p>${quoteText}</p>
        <footer>${quoteAuthor}</footer>
      </blockquote>
      ${errorText}
      <button type="button" data-action="new-quote" ${isLoading ? "disabled" : ""}>
        ${isLoading ? "Loading…" : "New quote"}
      </button>
    </section>`;
  }

  DummyHub.views.dashboard = { mount, render };
})();
