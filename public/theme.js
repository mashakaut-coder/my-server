// Dark mode toggle button, shared by every page.
// Each page also has a tiny script in its <head> that applies the saved
// theme before the page draws, so it doesn't flash light first.

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

if (themeToggle) {
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
}
