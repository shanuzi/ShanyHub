
window.DummyHub = window.DummyHub || {};

(function () {
  "use strict";

  const API_BASE_URL = "https://dummyjson.com";
  const LOGIN_EXPIRY_MINUTES = 30;
  const SESSION_STORAGE_KEY = "dummyhub-session";
  const PRODUCTS_PER_PAGE = 12;
  const PRODUCT_CARD_FIELDS = "title,price,discountPercentage,rating,stock,thumbnail,category";
  const DEFAULT_MINIMUM_ORDER = 1;
  const POSTS_PER_PAGE = 10;
  const POST_EXCERPT_LENGTH = 140;
  const PEOPLE_PER_PAGE = 20;
  const PEOPLE_CARD_FIELDS = "firstName,lastName,age,image,role,company";
  const RECIPE_CARD_FIELDS = "name,image,difficulty,cuisine,rating,caloriesPerServing,prepTimeMinutes,cookTimeMinutes,mealType,tags";
  const MIN_SERVINGS = 1;
  const MAX_SERVINGS = 24;
  const ALL_ITEMS_LIMIT = 0;
  const SEARCH_DEBOUNCE_MS = 300;
  const PERCENT_BASE = 100;
  const MAX_STAR_COUNT = 5;

  const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
  const TASK_TEXT_PATTERN = /^.{3,120}$/;
  const HAS_VISIBLE_CHARACTER_PATTERN = /\S/;
  const COMMENT_LENGTH_PATTERN = /^[\s\S]{1,280}$/;
  const MIN_PASSWORD_LENGTH = 6;
  function escapeHTML(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
  }
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}…`;
  }
  function joinNonEmpty(separator, ...parts) {
    return parts.filter(Boolean).join(separator);
  }
  function fullName(person) {
    return joinNonEmpty(" ", person.firstName, person.lastName);
  }
  function formatPrice(amount) {
    return `$${Number(amount).toFixed(2)}`;
  }
  function getDiscountedPrice(price, discountPercentage) {
    const discountAmount = price * (discountPercentage / PERCENT_BASE);
    return price - discountAmount;
  }
  function calculateCartTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountedTotal = cart.reduce((sum, item) => {
      const discountedPrice = getDiscountedPrice(item.price, item.discountPercentage);
      return sum + discountedPrice * item.quantity;
    }, 0);
    return {
      subtotal,
      discountAmount: subtotal - discountedTotal,
      grandTotal: discountedTotal
    };
  }
  function getTotalPages(totalItems, itemsPerPage) {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }
  function starsText(rating) {
    const filledStars = Math.min(Math.round(rating), MAX_STAR_COUNT);
    const emptyStars = MAX_STAR_COUNT - filledStars;
    return "★".repeat(filledStars) + "☆".repeat(emptyStars);
  }
  function formatRating(rating) {
    return `${starsText(rating)} ${Number(rating).toFixed(1)}`;
  }
  function debounce(callback, waitMilliseconds) {
    let timerId = null;
    return function debouncedFunction(...args) {
      clearTimeout(timerId);
      timerId = setTimeout(() => callback(...args), waitMilliseconds);
    };
  }
  function validateUsername(username) {
    if (!USERNAME_PATTERN.test(username)) {
      return "Username must be 3 to 20 letters, numbers, or underscores.";
    }
    return "";
  }
  function validatePassword(password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return "";
  }
  function validateComment(text) {
    if (!HAS_VISIBLE_CHARACTER_PATTERN.test(text)) {
      return "Write something before posting.";
    }
    if (!COMMENT_LENGTH_PATTERN.test(text.trim())) {
      return "A comment can have at most 280 characters.";
    }
    return "";
  }
  function validateTaskText(text) {
    if (!TASK_TEXT_PATTERN.test(text.trim())) {
      return "A task needs between 3 and 120 characters.";
    }
    return "";
  }

  function loadingMarkup(message = "Loading…") {
    return `
    <div class="state-message is-loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <p>${escapeHTML(message)}</p>
    </div>`;
  }
  function errorMarkup(message) {
    return `
    <div class="state-message is-error" role="alert">
      <p>Something went wrong: ${escapeHTML(message)}</p>
      <button type="button" data-action="retry">Retry</button>
    </div>`;
  }
  function emptyMarkup(message) {
    return `
    <div class="state-message is-empty">
      <p>${escapeHTML(message)}</p>
    </div>`;
  }
  function optionsMarkup(options, selectedValue) {
    return options.map((option) => {
      const selectedAttribute = option.value === selectedValue ? "selected" : "";
      return `<option value="${escapeHTML(option.value)}" ${selectedAttribute}>${escapeHTML(option.label)}</option>`;
    }).join("");
  }
  function paginationMarkup(page, totalPages) {
    const previousDisabled = page <= 1 ? "disabled" : "";
    const nextDisabled = page >= totalPages ? "disabled" : "";
    return `
    <nav class="pagination" aria-label="Pagination">
      <button type="button" data-action="previous-page" ${previousDisabled}>Previous</button>
      <span>Page ${page} of ${totalPages}</span>
      <button type="button" data-action="next-page" ${nextDisabled}>Next</button>
    </nav>`;
  }

  DummyHub.utils = {
    API_BASE_URL,
    LOGIN_EXPIRY_MINUTES,
    SESSION_STORAGE_KEY,
    PRODUCTS_PER_PAGE,
    PRODUCT_CARD_FIELDS,
    DEFAULT_MINIMUM_ORDER,
    POSTS_PER_PAGE,
    POST_EXCERPT_LENGTH,
    PEOPLE_PER_PAGE,
    PEOPLE_CARD_FIELDS,
    RECIPE_CARD_FIELDS,
    MIN_SERVINGS,
    MAX_SERVINGS,
    ALL_ITEMS_LIMIT,
    SEARCH_DEBOUNCE_MS,
    escapeHTML,
    truncateText,
    joinNonEmpty,
    fullName,
    formatPrice,
    getDiscountedPrice,
    calculateCartTotals,
    getTotalPages,
    starsText,
    formatRating,
    debounce,
    validateUsername,
    validatePassword,
    validateComment,
    validateTaskText,
    loadingMarkup,
    errorMarkup,
    emptyMarkup,
    optionsMarkup,
    paginationMarkup,
  };
})();
