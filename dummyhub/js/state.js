
window.DummyHub = window.DummyHub || {};

(function () {
  "use strict";

  function createSessionSlices() {
    return {
      auth: { user: null, accessToken: null, refreshToken: null },
      route: { name: "", params: {} },
      redirectPath: "",
      settings: { delayMs: 0 },
      login: { status: "idle", formError: "", usernameError: "", passwordError: "" }
    };
  }
  function createShoppingSlices() {
    return {
      cart: [],
      checkout: { status: "idle", receipt: null, error: "" },
      cartHistory: { status: "idle", items: [], error: "" },
      shop: {
        status: "idle",
        items: [],
        total: 0,
        page: 1,
        q: "",
        category: "",
        sortBy: "",
        order: "asc",
        inStockOnly: false,
        categories: [],
        error: ""
      },
      productDetail: {
        status: "idle",
        product: null,
        error: "",
        notFound: false,
        selectedImageIndex: 0,
        quantity: 1,
        cartMessage: "",
        cartMessageIsError: false
      }
    };
  }
  function createRecipeSlices() {
    return {
      recipes: {
        status: "idle",
        items: [],
        error: "",
        q: "",
        tag: "",
        mealType: "",
        sortBy: "",
        order: "asc",
        difficulty: "",
        maxMinutes: 0,
        tags: []
      },
      recipeDetail: { status: "idle", recipe: null, error: "", notFound: false, servings: 1 }
    };
  }
  function createCommunitySlices() {
    return {
      community: {
        status: "idle",
        items: [],
        total: 0,
        error: "",
        q: "",
        tag: "",
        tags: [],
        isLoadingMore: false,
        loadMoreError: ""
      },
      postDetail: {
        status: "idle",
        post: null,
        comments: [],
        author: null,
        error: "",
        notFound: false,
        commentStatus: "idle",
        commentError: ""
      }
    };
  }
  function createPeopleSlices() {
    return {
      people: {
        status: "idle",
        items: [],
        total: 0,
        page: 1,
        q: "",
        role: "",
        sortBy: "",
        order: "asc",
        error: ""
      },
      userProfile: {
        status: "idle",
        user: null,
        posts: [],
        todos: [],
        carts: [],
        error: "",
        notFound: false
      }
    };
  }
  function createPersonalSlices() {
    return {
      dashboard: {
        status: "idle",
        error: "",
        quote: null,
        quoteStatus: "idle",
        quoteError: "",
        carts: [],
        todos: [],
        posts: []
      },
      tasks: {
        status: "idle",
        items: [],
        filter: "all",
        error: "",
        actionError: "",
        addError: "",
        isAdding: false
      }
    };
  }
  function createInitialState() {
    return {
      ...createSessionSlices(),
      ...createShoppingSlices(),
      ...createRecipeSlices(),
      ...createCommunitySlices(),
      ...createPeopleSlices(),
      ...createPersonalSlices()
    };
  }
  let state = createInitialState();
  let renderCallback = null;
  function getState() {
    return state;
  }
  function setRenderCallback(callback) {
    renderCallback = callback;
  }
  function setState(patch) {
    state = { ...state, ...patch };
    if (renderCallback) {
      renderCallback();
    }
  }
  function updateSlice(sliceName, patch) {
    const updatedSlice = { ...state[sliceName], ...patch };
    setState({ [sliceName]: updatedSlice });
  }

  DummyHub.state = {
    createInitialState,
    getState,
    setRenderCallback,
    setState,
    updateSlice,
  };
})();
