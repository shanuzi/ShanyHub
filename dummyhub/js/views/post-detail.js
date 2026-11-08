
window.DummyHub = window.DummyHub || {};
DummyHub.views = DummyHub.views || {};

(function () {
  "use strict";

  const { addComment, getPostById, getPostComments, getUserById } = DummyHub.api;
  const { createInitialState, getState, updateSlice } = DummyHub.state;
  const { emptyMarkup, errorMarkup, escapeHTML, fullName, loadingMarkup, validateComment } = DummyHub.utils;
  const { notFoundMarkup } = DummyHub.views.notFound;

  function mount(params) {
    const isLoggedIn = Boolean(getState().auth.accessToken);
    const commentFormMarkup = isLoggedIn ? `
      <form id="comment-form" class="panel" hidden novalidate>
        <div class="field">
          <label for="comment-body">Add a comment</label>
          <textarea id="comment-body" name="body" rows="3"></textarea>
          <p id="comment-error" class="field-error" role="alert"></p>
        </div>
        <button id="comment-button" type="submit">Post comment</button>
      </form>` : '<p class="panel"><a href="#/login">Log in</a> to join the conversation.</p>';
    document.getElementById("app").innerHTML = `
    <section class="detail-view">
      <p><a href="#/community">&larr; Back to the community</a></p>
      <h1>Post</h1>
      <div id="post-content"></div>
      ${commentFormMarkup}
    </section>`;
    const commentForm = document.getElementById("comment-form");
    if (commentForm) {
      commentForm.addEventListener("submit", handleCommentSubmit);
    }
    document.getElementById("post-content").addEventListener("click", handleClick);
    loadPost(params.id);
  }
  function render() {
    const { status, commentStatus, commentError } = getState().postDetail;
    document.getElementById("post-content").innerHTML = buildPostMarkup();
    const commentForm = document.getElementById("comment-form");
    if (commentForm) {
      const isSending = commentStatus === "sending";
      commentForm.hidden = status !== "success";
      document.getElementById("comment-error").textContent = commentError;
      document.getElementById("comment-button").disabled = isSending;
      document.getElementById("comment-button").textContent = isSending ? "Posting…" : "Post comment";
    }
  }
  function handleClick(event) {
    const actionElement = event.target.closest("[data-action]");
    if (actionElement && actionElement.dataset.action === "retry") {
      loadPost(getState().route.params.id);
    }
  }
  async function handleCommentSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const text = form.elements.body.value;
    const errorMessage = validateComment(text);
    if (errorMessage) {
      updateSlice("postDetail", { commentError: errorMessage });
      return;
    }
    const { post } = getState().postDetail;
    const { user } = getState().auth;
    updateSlice("postDetail", { commentStatus: "sending", commentError: "" });
    try {
      const newComment = await addComment({ body: text.trim(), postId: post.id, userId: user.id });
      const { comments } = getState().postDetail;
      updateSlice("postDetail", { comments: [...comments, newComment], commentStatus: "idle" });
      form.reset();
    } catch (error) {
      updateSlice("postDetail", { commentStatus: "idle", commentError: error.message });
    }
  }
  async function loadAuthorOfPost(postPromise) {
    const post = await postPromise;
    return getUserById(post.userId);
  }
  async function loadPost(id) {
    const freshDetail = createInitialState().postDetail;
    updateSlice("postDetail", { ...freshDetail, status: "loading" });
    try {
      const postPromise = getPostById(id);
      const [post, commentsResponse, author] = await Promise.all([
        postPromise,
        getPostComments(id),
        loadAuthorOfPost(postPromise)
      ]);
      const { comments } = commentsResponse;
      updateSlice("postDetail", { status: "success", post, comments, author });
    } catch (error) {
      const isNotFound = error.status === 404;
      updateSlice("postDetail", { status: "error", error: error.message, notFound: isNotFound });
    }
  }
  function buildPostMarkup() {
    const { status, post, comments, author, error, notFound } = getState().postDetail;
    if (status === "idle" || status === "loading") {
      return loadingMarkup("Loading post…");
    }
    if (notFound) {
      return notFoundMarkup("We could not find that post.");
    }
    if (status === "error") {
      return errorMarkup(error);
    }
    const tagsMarkup = post.tags.map((tagName) => `<span class="tag">#${escapeHTML(tagName)}</span>`).join("");
    return `
    <article class="panel">
      <h2>${escapeHTML(post.title)}</h2>
      ${renderAuthorLine(author)}
      <p>${escapeHTML(post.body)}</p>
      <div class="chip-list">${tagsMarkup}</div>
      <p class="muted">${post.reactions.likes} likes &middot; ${post.reactions.dislikes} dislikes &middot; ${post.views} views</p>
    </article>
    <section class="panel">
      <h2>Comments (${comments.length})</h2>
      ${renderComments(comments)}
    </section>`;
  }
  function renderAuthorLine(author) {
    return `
    <p class="author-line">
      <img class="avatar" src="${escapeHTML(author.image)}" alt="${escapeHTML(fullName(author))}">
      <span>By <a href="#/people/${escapeHTML(author.id)}">${escapeHTML(fullName(author))}</a></span>
    </p>`;
  }
  function renderComments(comments) {
    if (comments.length === 0) {
      return emptyMarkup("No comments yet. Be the first!");
    }
    return `<ul class="plain-list">${comments.map((comment) => renderCommentItem(comment)).join("")}</ul>`;
  }
  function renderCommentItem(comment) {
    const commenter = comment.user || {};
    const displayName = commenter.fullName || commenter.username || "Unknown";
    return `
    <li class="comment">
      <p class="comment-author">${escapeHTML(displayName)}</p>
      <p>${escapeHTML(comment.body)}</p>
    </li>`;
  }

  DummyHub.views.postDetail = { mount, render };
})();
