# DummyHub

A small single-page app built with plain HTML, CSS, and JavaScript on top of the
[DummyJSON](https://dummyjson.com) API. No build step, no modules, no server.

## Run it

Double-click `index.html`. It needs an internet connection for the API calls.
Test account: `emilys` / `emilyspass`.

## Structure

```
dummyhub/
├── index.html        app shell only: header, nav, <main id="app">, footer
├── css/styles.css
└── js/
    ├── main.js       bootstrap: header, restore session, start router
    ├── router.js     route table, hash handling, guards, 404
    ├── api.js        request() wrapper, one function per endpoint, session helpers
    ├── state.js      single state object, getState(), setState(), updateSlice()
    ├── utils.js      constants, escapeHTML, formatters, validators, shared markup helpers
    └── views/        one file per page (login, dashboard, shop, product-detail, cart, ...)
```

## How the files talk to each other

The scripts are classic `<script>` tags, not ES modules, because modules are
blocked when a page is opened from `file://`.

- Every file wraps its code in an IIFE, so helper names stay private to that file.
- Every file shares one global object, `window.DummyHub`, and publishes what
  other files need on it, for example `DummyHub.state = { getState, setState }`.
- A file reads what it needs at the top, for example
  `const { getState } = DummyHub.state;`.
- Views publish `{ mount, render }` on `DummyHub.views`; the router reads them.

## Script order matters

A file can only use files loaded before it. The order in `index.html` is:

```
state -> utils -> api -> views (not-found, login, dashboard, shop, cart,
product-detail, ...) -> router -> main
```

- `utils.js` needs nothing; `api.js` needs `state` and `utils`.
- `cart.js` comes before `product-detail.js` (it publishes the cart actions).
- `not-found.js` comes before the views that call `notFoundMarkup()`.
- If the console says `Cannot destructure ... of undefined`, a script tag is
  in the wrong place.

## Adding a new page

1. Create `js/views/my-page.js` with `mount()` and `render()`, and publish
   `DummyHub.views.myPage = { mount, render };`.
2. Add its `<script>` tag in `index.html`, before `router.js`.
3. Add a row to the `routes` table in `router.js`.
