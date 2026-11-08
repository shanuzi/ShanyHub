
window.DummyHub = window.DummyHub || {};

(function () {
  "use strict";

  const { createInitialState, getState, setState } = DummyHub.state;
  const { API_BASE_URL, LOGIN_EXPIRY_MINUTES, SESSION_STORAGE_KEY } = DummyHub.utils;

  function buildQuery(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([name, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(name, value);
      }
    });
    const queryText = searchParams.toString();
    return queryText ? `?${queryText}` : "";
  }
  function addDelay(url, delayMs) {
    if (delayMs <= 0) {
      return url;
    }
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}delay=${delayMs}`;
  }
  function normalizeCategory(category) {
    if (typeof category === "string") {
      return { slug: category, name: category };
    }
    return category;
  }
  function normalizeTag(tag) {
    if (typeof tag === "string") {
      return tag;
    }
    return tag.slug;
  }
  async function request(path, { method = "GET", body, auth = false } = {}) {
    const { accessToken } = getState().auth;
    const { delayMs } = getState().settings;
    const headers = { "Content-Type": "application/json" };
    if (auth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const prefix = auth ? "/auth" : "";
    const url = addDelay(`${API_BASE_URL}${prefix}${path}`, delayMs);
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function login(username, password) {
    return request("/auth/login", {
      method: "POST",
      body: { username, password, expiresInMins: LOGIN_EXPIRY_MINUTES }
    });
  }
  function getCurrentUser() {
    return request("/me", { auth: true });
  }
  function getProducts(options = {}) {
    return request(`/products${buildQuery(options)}`);
  }
  function searchProducts(searchText, options = {}) {
    return request(`/products/search${buildQuery({ q: searchText, ...options })}`);
  }
  async function getProductCategories() {
    const categories = await request("/products/categories");
    return categories.map(normalizeCategory);
  }
  function getProductsByCategory(slug, options = {}) {
    return request(`/products/category/${encodeURIComponent(slug)}${buildQuery(options)}`);
  }
  function getProductById(id) {
    return request(`/products/${id}`);
  }
  function getCartsByUser(userId) {
    return request(`/carts/user/${userId}`);
  }
  function getMyCarts(userId) {
    return request(`/carts/user/${userId}`, { auth: true });
  }
  function addCart(userId, products) {
    return request("/carts/add", { method: "POST", body: { userId, products } });
  }
  function getRecipes(options = {}) {
    return request(`/recipes${buildQuery(options)}`);
  }
  function searchRecipes(searchText, options = {}) {
    return request(`/recipes/search${buildQuery({ q: searchText, ...options })}`);
  }
  function getRecipeTags() {
    return request("/recipes/tags");
  }
  function getRecipesByTag(tag, options = {}) {
    return request(`/recipes/tag/${encodeURIComponent(tag)}${buildQuery(options)}`);
  }
  function getRecipesByMealType(mealType, options = {}) {
    return request(`/recipes/meal-type/${encodeURIComponent(mealType)}${buildQuery(options)}`);
  }
  function getRecipeById(id) {
    return request(`/recipes/${id}`);
  }
  function getUsers(options = {}) {
    return request(`/users${buildQuery(options)}`);
  }
  function searchUsers(searchText, options = {}) {
    return request(`/users/search${buildQuery({ q: searchText, ...options })}`);
  }
  function filterUsers(key, value, options = {}) {
    return request(`/users/filter${buildQuery({ key, value, ...options })}`);
  }
  function getUserById(id) {
    return request(`/users/${id}`);
  }
  function getUserPosts(userId) {
    return request(`/users/${userId}/posts`);
  }
  function getUserTodos(userId) {
    return request(`/users/${userId}/todos`);
  }
  function getUserCarts(userId) {
    return request(`/users/${userId}/carts`);
  }
  function getMyTodos(userId) {
    return request(`/users/${userId}/todos`, { auth: true });
  }
  function getMyPosts(userId) {
    return request(`/users/${userId}/posts`, { auth: true });
  }
  function getPosts(options = {}) {
    return request(`/posts${buildQuery(options)}`);
  }
  function searchPosts(searchText, options = {}) {
    return request(`/posts/search${buildQuery({ q: searchText, ...options })}`);
  }
  async function getPostTags() {
    const tags = await request("/posts/tag-list");
    return tags.map(normalizeTag);
  }
  function getPostsByTag(tag, options = {}) {
    return request(`/posts/tag/${encodeURIComponent(tag)}${buildQuery(options)}`);
  }
  function getPostById(id) {
    return request(`/posts/${id}`);
  }
  function getPostComments(postId) {
    return request(`/posts/${postId}/comments`);
  }
  function addComment({ body, postId, userId }) {
    return request("/comments/add", { method: "POST", body: { body, postId, userId } });
  }
  function addTodo({ todo, completed, userId }) {
    return request("/todos/add", { method: "POST", body: { todo, completed, userId } });
  }
  function updateTodo(todoId, completed) {
    return request(`/todos/${todoId}`, { method: "PUT", body: { completed } });
  }
  function deleteTodo(todoId) {
    return request(`/todos/${todoId}`, { method: "DELETE" });
  }
  function getRandomQuote() {
    return request("/quotes/random", { auth: true });
  }

  function saveSession(accessToken, refreshToken) {
    const sessionText = JSON.stringify({ accessToken, refreshToken });
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionText);
  }
  function loadSavedSession() {
    const sessionText = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionText) {
      return null;
    }
    try {
      return JSON.parse(sessionText);
    } catch (error) {
      console.error("The saved session could not be read:", error.message);
      return null;
    }
  }
  async function confirmSession() {
    const currentUser = await getCurrentUser();
    const { auth } = getState();
    setState({ auth: { ...auth, user: currentUser } });
  }
  async function signIn(username, password) {
    const loginData = await login(username, password);
    const { accessToken, refreshToken, ...user } = loginData;
    setState({ auth: { user, accessToken, refreshToken } });
    saveSession(accessToken, refreshToken);
    try {
      await confirmSession();
    } catch (error) {
      clearSession();
      throw error;
    }
  }
  async function restoreSession() {
    const savedSession = loadSavedSession();
    if (!savedSession) {
      return;
    }
    setState({
      auth: {
        user: null,
        accessToken: savedSession.accessToken,
        refreshToken: savedSession.refreshToken
      }
    });
    try {
      await confirmSession();
    } catch (error) {
      console.error("The saved session is no longer valid:", error.message);
      clearSession();
    }
  }
  function clearSession() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    const freshState = createInitialState();
    setState({
      auth: freshState.auth,
      cart: [],
      checkout: freshState.checkout,
      dashboard: freshState.dashboard,
      tasks: freshState.tasks
    });
  }
  function logout() {
    window.location.replace("#/login");
    clearSession();
  }

  DummyHub.api = {
    getProducts,
    searchProducts,
    getProductCategories,
    getProductsByCategory,
    getProductById,
    getCartsByUser,
    getMyCarts,
    addCart,
    getRecipes,
    searchRecipes,
    getRecipeTags,
    getRecipesByTag,
    getRecipesByMealType,
    getRecipeById,
    getUsers,
    searchUsers,
    filterUsers,
    getUserById,
    getUserPosts,
    getUserTodos,
    getUserCarts,
    getMyTodos,
    getMyPosts,
    getPosts,
    searchPosts,
    getPostTags,
    getPostsByTag,
    getPostById,
    getPostComments,
    addComment,
    addTodo,
    updateTodo,
    deleteTodo,
    getRandomQuote,
    signIn,
    restoreSession,
    logout,
  };
})();
