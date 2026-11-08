
window.DummyHub = window.DummyHub || {};

(function () {
  "use strict";

  const { getState, setState } = DummyHub.state;
  const views = DummyHub.views;

  const routes = [
    { pattern: "/login", name: "login", access: "guest", view: views.login },
    { pattern: "/", name: "dashboard", access: "member", view: views.dashboard },
    { pattern: "/shop", name: "shop", access: "public", view: views.shop },
    { pattern: "/shop/:id", name: "shop", access: "public", view: views.productDetail },
    { pattern: "/cart", name: "cart", access: "member", view: views.cart },
    { pattern: "/recipes", name: "recipes", access: "public", view: views.recipes },
    { pattern: "/recipes/:id", name: "recipes", access: "public", view: views.recipeDetail },
    { pattern: "/community", name: "community", access: "public", view: views.community },
    { pattern: "/community/:id", name: "community", access: "public", view: views.postDetail },
    { pattern: "/people", name: "people", access: "public", view: views.people },
    { pattern: "/people/:id", name: "people", access: "public", view: views.userProfile },
    { pattern: "/tasks", name: "tasks", access: "member", view: views.tasks }
  ];
  let currentView = null;
  function startRouter() {
    window.addEventListener("hashchange", handleRouteChange);
    handleRouteChange();
  }
  function renderCurrentView() {
    if (currentView) {
      currentView.render();
    }
  }
  function getPathFromHash() {
    const path = window.location.hash.slice(1);
    return path === "" ? "/" : path;
  }
  function matchPattern(pattern, path) {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    const params = {};
    const isMatch = patternParts.every((patternPart, index) => {
      if (patternPart.startsWith(":")) {
        params[patternPart.slice(1)] = pathParts[index];
        return true;
      }
      return patternPart === pathParts[index];
    });
    return isMatch ? params : null;
  }
  function findMatchingRoute(path) {
    for (const route of routes) {
      const params = matchPattern(route.pattern, path);
      if (params) {
        return { route, params };
      }
    }
    return null;
  }
  function handleRouteChange() {
    const path = getPathFromHash();
    const match = findMatchingRoute(path);
    if (!match) {
      showView("not-found", views.notFound, {});
      return;
    }
    const { route, params } = match;
    const isLoggedIn = Boolean(getState().auth.accessToken);
    if (route.access === "member" && !isLoggedIn) {
      setState({ redirectPath: path });
      window.location.replace("#/login");
      return;
    }
    if (route.access === "guest" && isLoggedIn) {
      window.location.replace("#/");
      return;
    }
    showView(route.name, route.view, params);
  }
  function showView(name, view, params) {
    currentView = view;
    view.mount(params);
    setState({ route: { name, params } });
    window.scrollTo(0, 0);
    document.getElementsByTagName("main")[0].focus({ preventScroll: true });
  }

  DummyHub.router = {
    startRouter,
    renderCurrentView,
  };
})();
