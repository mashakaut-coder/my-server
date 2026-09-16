const STORAGE_KEY = "bookmarks";

const form = document.getElementById("bookmark-form");
const urlInput = document.getElementById("url");
const titleInput = document.getElementById("title");
const categorySelect = document.getElementById("category");
const groupsContainer = document.getElementById("bookmark-groups");
const count = document.getElementById("bookmark-count");
const emptyMessage = document.getElementById("empty-message");
const storageWarning = document.getElementById("storage-warning");
const searchBox = document.getElementById("search-box");
const searchInput = document.getElementById("search");

// All saved bookmarks, newest first. The search only changes what's shown, not this list.
let bookmarks = [];

// Only normal web links: blocks things like "javascript:..." that the URL field would accept
function isWebUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
}

// Read saved bookmarks. Returns an empty list if nothing is saved,
// the saved data is broken, or the browser blocks storage.
function loadBookmarks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    // Skip any entry that's missing something, so one bad entry can't break the list
    return saved.filter((bookmark) =>
      bookmark &&
      typeof bookmark.title === "string" &&
      typeof bookmark.category === "string" &&
      bookmark.category !== "" &&
      typeof bookmark.url === "string" &&
      isWebUrl(bookmark.url)
    );
  } catch (e) {
    return [];
  }
}

// Returns true if saving worked
function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    return true;
  } catch (e) {
    return false;
  }
}

// Turns a saved category value like "study" into its label, like "Study"
function categoryLabel(value) {
  const option = [...categorySelect.options].find((option) => option.value === value);
  return option && option.value ? option.textContent : value;
}

// Groups bookmarks by category, in the same order as the dropdown.
// Categories that aren't in the dropdown go at the end.
function groupByCategory(bookmarks) {
  const order = [...categorySelect.options].map((option) => option.value).filter(Boolean);
  const groups = new Map();

  for (const bookmark of bookmarks) {
    if (!groups.has(bookmark.category)) groups.set(bookmark.category, []);
    groups.get(bookmark.category).push(bookmark);
  }

  const position = (category) => {
    const index = order.indexOf(category);
    return index === -1 ? order.length : index;
  };

  return [...groups.entries()].sort((a, b) => position(a[0]) - position(b[0]));
}

function siteName(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

// True if the search text appears in the title, site name, or category (ignoring upper/lower case)
function matchesSearch(bookmark, query) {
  const text = [bookmark.title, siteName(bookmark.url), categoryLabel(bookmark.category)]
    .join(" ")
    .toLowerCase();
  return text.includes(query.toLowerCase());
}

function createBookmarkItem(bookmark) {
  const item = document.createElement("li");
  item.className = "bookmark";

  // textContent (not innerHTML) so a title can't add HTML to the page
  const link = document.createElement("a");
  link.className = "bookmark-title";
  link.href = bookmark.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = bookmark.title;

  const site = document.createElement("span");
  site.className = "bookmark-site";
  site.textContent = siteName(bookmark.url);

  item.append(link, site);
  return item;
}

function renderBookmarks() {
  groupsContainer.replaceChildren();

  const query = searchInput.value.trim();
  const visible = query ? bookmarks.filter((bookmark) => matchesSearch(bookmark, query)) : bookmarks;

  // Groups with no matching bookmarks aren't shown at all
  for (const [category, categoryBookmarks] of groupByCategory(visible)) {
    const group = document.createElement("section");
    group.className = "category-group";

    const heading = document.createElement("h3");
    heading.className = "category-heading";
    const name = document.createElement("span");
    name.textContent = categoryLabel(category);
    const groupCount = document.createElement("span");
    groupCount.className = "count";
    groupCount.textContent = categoryBookmarks.length;
    heading.append(name, groupCount);

    const list = document.createElement("ul");
    list.className = "bookmark-list";
    // Bookmarks are stored newest first, so each group keeps that order
    for (const bookmark of categoryBookmarks) {
      list.append(createBookmarkItem(bookmark));
    }

    group.append(heading, list);
    groupsContainer.append(group);
  }

  // While searching, the total shows how many match, like "2 of 7"
  count.textContent = query ? `${visible.length} of ${bookmarks.length}` : bookmarks.length;

  // No point showing a search bar with nothing to search
  searchBox.hidden = bookmarks.length === 0;

  if (bookmarks.length === 0) {
    emptyMessage.textContent = "No bookmarks yet. Add your first one above.";
  } else if (visible.length === 0) {
    emptyMessage.textContent = `No bookmarks match "${query}".`;
  }
  emptyMessage.hidden = visible.length > 0;
}

form.addEventListener("submit", (event) => {
  // Stay on the page instead of reloading it
  event.preventDefault();

  const url = urlInput.value.trim();
  if (!isWebUrl(url)) {
    urlInput.setCustomValidity("Please enter a web address that starts with http:// or https://");
    urlInput.reportValidity();
    return;
  }

  // Load the latest list first, in case another tab added bookmarks
  bookmarks = loadBookmarks();

  // Newest bookmarks go at the top
  bookmarks.unshift({
    url,
    title: titleInput.value.trim(),
    category: categorySelect.value,
    createdAt: new Date().toISOString(),
  });

  const saved = saveBookmarks(bookmarks);
  storageWarning.hidden = saved;

  // Clear the search so the new bookmark is visible
  searchInput.value = "";
  renderBookmarks();
  form.reset();
  urlInput.focus();
});

// Clear the custom URL message as soon as the user edits the field
urlInput.addEventListener("input", () => urlInput.setCustomValidity(""));

// Filter the list as the user types
searchInput.addEventListener("input", renderBookmarks);

// Escape clears the search
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && searchInput.value) {
    searchInput.value = "";
    renderBookmarks();
  }
});

// Show saved bookmarks when the page loads (including after a refresh)
bookmarks = loadBookmarks();
renderBookmarks();
