
window.DummyHub = window.DummyHub || {};
DummyHub.views = DummyHub.views || {};

(function () {
  "use strict";

  const { escapeHTML } = DummyHub.utils;

  function notFoundMarkup(message) {
    return `
    <div class="panel not-found">
      <p>${escapeHTML(message)}</p>
      <p><a href="#/">Back to the dashboard</a></p>
    </div>`;
  }
  function mount() {
    document.getElementById("app").innerHTML = `
    <section>
      <h1>Page not found</h1>
      ${notFoundMarkup("That page does not exist.")}
    </section>`;
  }
  function render() {
  }

  DummyHub.views.notFound = { mount, render, notFoundMarkup };
})();
