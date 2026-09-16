const STORAGE_KEY = "bookmarks";

const form = document.getElementById("bookmark-form");
const urlInput = document.getElementById("url");
const titleInput = document.getElementById("title");
const formMessage = document.getElementById("form-message");
const list = document.getElementById("bookmark-list");
const count = document.getElementById("count");
const emptyState = document.getElementById("empty-state");
const storageWarning = document.getElementById("storage-warning");
const searchBox = document.getElementById("search-box");
const searchInput = document.getElementById("search");

let bookmarks = loadBookmarks();

// Read saved bookmarks. Returns an empty list if nothing is saved or storage is blocked.
function loadBookmarks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    // Skip anything broken, so one bad entry can't stop the list from showing
    return saved.filter((bookmark) =>
      bookmark &&
      typeof bookmark.id === "string" &&
      typeof bookmark.title === "string" &&
      typeof bookmark.url === "string" &&
      normalizeUrl(bookmark.url) === bookmark.url
    );
  } catch (e) {
    return [];
  }
}

function saveBookmarks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    storageWarning.hidden = true;
  } catch (e) {
    storageWarning.hidden = false;
  }
}

// Turns "example.com" into "https://example.com".
// Returns null for anything that isn't a normal web link (e.g. "javascript:...").
function normalizeUrl(input) {
  let text = input.trim();
  if (!text) return null;
  if (!/^[a-z][a-z\d+.-]*:/i.test(text)) {
    text = "https://" + text;
  }

  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.href;
  } catch (e) {
    return null;
  }
}

function showError(message) {
  formMessage.textContent = message;
  urlInput.setAttribute("aria-invalid", "true");
  urlInput.focus();
}

function clearError() {
  formMessage.textContent = "";
  urlInput.removeAttribute("aria-invalid");
}

function render() {
  list.replaceChildren();

  // Only show bookmarks whose title contains the search text (ignoring upper/lower case)
  const query = searchInput.value.trim();
  const visible = query
    ? bookmarks.filter((bookmark) => bookmark.title.toLowerCase().includes(query.toLowerCase()))
    : bookmarks;

  for (const bookmark of visible) {
    const hostname = new URL(bookmark.url).hostname.replace(/^www\./, "");

    const item = document.createElement("li");
    item.className = "bookmark card";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = bookmark.title.charAt(0);

    const info = document.createElement("div");
    info.className = "bookmark-info";

    // Use textContent (not innerHTML) so titles can't inject HTML into the page
    const link = document.createElement("a");
    link.className = "bookmark-link";
    link.href = bookmark.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = bookmark.title;

    const urlText = document.createElement("span");
    urlText.className = "bookmark-url";
    urlText.textContent = hostname;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", `Delete ${bookmark.title}`);
    deleteBtn.addEventListener("click", () => deleteBookmark(bookmark.id));

    info.append(link, urlText);
    item.append(badge, info, deleteBtn);
    list.append(item);
  }

  count.textContent = query ? `${visible.length} of ${bookmarks.length}` : bookmarks.length;

  // No point searching an empty list
  searchBox.hidden = bookmarks.length === 0;

  if (bookmarks.length === 0) {
    emptyState.textContent = "No bookmarks yet. Add your first one above.";
  } else if (visible.length === 0) {
    emptyState.textContent = `No bookmarks match "${query}".`;
  }
  emptyState.hidden = visible.length > 0;
}

function addBookmark(event) {
  event.preventDefault();
  clearError();

  const url = normalizeUrl(urlInput.value);
  if (!url) {
    showError("Please enter a valid web address, like example.com.");
    return;
  }

  if (bookmarks.some((bookmark) => bookmark.url === url)) {
    showError("You've already saved this link.");
    return;
  }

  const title = titleInput.value.trim() || new URL(url).hostname.replace(/^www\./, "");

  // Newest bookmarks go at the top
  bookmarks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    url,
    title,
  });

  saveBookmarks();
  // Clear the search so the new bookmark is visible
  searchInput.value = "";
  render();
  form.reset();
  urlInput.focus();
}

function deleteBookmark(id) {
  bookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
  saveBookmarks();
  render();
}

// Keep the list in sync if the app is open in another tab
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    bookmarks = loadBookmarks();
    render();
  }
});

form.addEventListener("submit", addBookmark);
urlInput.addEventListener("input", clearError);

// Filter the list as the user types
searchInput.addEventListener("input", render);

// Escape clears the search
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && searchInput.value) {
    searchInput.value = "";
    render();
  }
});

render();

// Dark mode toggle
const themeToggle = document.querySelector(".theme-toggle");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function isDark() {
  const theme = document.documentElement.dataset.theme;
  return theme ? theme === "dark" : systemDark.matches;
}

function updateThemeButton() {
  themeToggle.textContent = isDark() ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-pressed", isDark());
}

themeToggle.addEventListener("click", () => {
  const theme = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {}
  updateThemeButton();
});

// Update the icon if the computer switches light/dark while the page is open
systemDark.addEventListener("change", updateThemeButton);
updateThemeButton();
