
window.DummyHub = window.DummyHub || {};
DummyHub.views = DummyHub.views || {};

(function () {
  "use strict";

  const { signIn } = DummyHub.api;
  const { getState, setState, updateSlice } = DummyHub.state;
  const { validatePassword, validateUsername } = DummyHub.utils;

  function mount() {
    document.getElementById("app").innerHTML = `
    <section class="panel narrow">
      <h1>Log in</h1>
      <p class="muted">Test account: emilys / emilyspass</p>
      <form id="login-form" novalidate>
        <div class="field" data-field="username">
          <label for="username">Username</label>
          <input id="username" name="username" type="text" autocomplete="username">
          <p class="field-error" role="alert"></p>
        </div>
        <div class="field" data-field="password">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password">
          <p class="field-error" role="alert"></p>
        </div>
        <p id="login-error" class="form-error" role="alert"></p>
        <button id="login-button" type="submit">Log in</button>
      </form>
    </section>`;
    document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);
    updateSlice("login", { status: "idle", formError: "", usernameError: "", passwordError: "" });
  }
  function render() {
    const { status, formError, usernameError, passwordError } = getState().login;
    const errorByField = { username: usernameError, password: passwordError };
    document.querySelectorAll("[data-field]").forEach((fieldElement) => {
      const message = errorByField[fieldElement.dataset.field];
      fieldElement.querySelector(".field-error").textContent = message;
      fieldElement.classList.toggle("has-error", message !== "");
    });
    document.getElementById("login-error").textContent = formError;
    const isLoading = status === "loading";
    const loginButton = document.getElementById("login-button");
    loginButton.disabled = isLoading;
    loginButton.classList.toggle("is-loading", isLoading);
    loginButton.textContent = isLoading ? "Logging in…" : "Log in";
  }
  async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    if (usernameError || passwordError) {
      updateSlice("login", { status: "idle", formError: "", usernameError, passwordError });
      return;
    }
    updateSlice("login", { status: "loading", formError: "", usernameError: "", passwordError: "" });
    try {
      await signIn(username, password);
      updateSlice("login", { status: "success" });
      goToSavedDestination();
    } catch (error) {
      form.elements.password.value = "";
      updateSlice("login", { status: "error", formError: error.message });
    }
  }
  function goToSavedDestination() {
    const { redirectPath } = getState();
    const destination = redirectPath || "/";
    setState({ redirectPath: "" });
    window.location.replace(`#${destination}`);
  }

  DummyHub.views.login = { mount, render };
})();
