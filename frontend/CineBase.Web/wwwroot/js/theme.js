/**
 * Cinema67 Theme Manager
 *
 * - Follows system preference by default
 * - User override persists in sessionStorage
 * - Exposes window.Cinema67Theme for compatibility
 */

(function () {
  var THEME_KEY = 'cb_color_theme';
  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getSystemTheme() {
    return mediaQuery.matches ? 'dark' : 'light';
  }

  function getUserOverride() {
    return sessionStorage.getItem(THEME_KEY);
  }

  function setUserOverride(value) {
    sessionStorage.setItem(THEME_KEY, value);
  }

  function clearUserOverride() {
    sessionStorage.removeItem(THEME_KEY);
  }

  function getEffectiveTheme() {
    var override = getUserOverride();
    if (override === 'light' || override === 'dark') return override;
    return getSystemTheme();
  }

  function applyTheme(value) {
    document.documentElement.classList.toggle('dark', value === 'dark');
  }

  var themeApi = {
    STORAGE_KEY: THEME_KEY,
    get: function () {
      return getEffectiveTheme();
    },
    set: function (value) {
      setUserOverride(value);
      applyTheme(value);
    },
    resetToSystem: function () {
      clearUserOverride();
      applyTheme(getSystemTheme());
    },
    toggle: function () {
      this.set(getEffectiveTheme() === 'dark' ? 'light' : 'dark');
      this._updateToggleIcons();
    },
    init: function () {
      applyTheme(getEffectiveTheme());
      this._updateToggleIcons();
    },
    _updateToggleIcons: function () {
      var isDark = getEffectiveTheme() === 'dark';
      document.querySelectorAll('.theme-toggle-icon-moon').forEach(function (el) {
        el.style.display = isDark ? 'none' : '';
      });
      document.querySelectorAll('.theme-toggle-icon-sun').forEach(function (el) {
        el.style.display = isDark ? '' : 'none';
      });
      document.querySelectorAll('.theme-toggle-label').forEach(function (el) {
        el.textContent = isDark ? 'Tema chiaro' : 'Tema scuro';
      });
    }
  };

  // Listen for system theme changes
  mediaQuery.addEventListener('change', function () {
    if (!getUserOverride()) {
      applyTheme(getSystemTheme());
      themeApi._updateToggleIcons();
    }
  });

  themeApi.init();

  window.Cinema67Theme = themeApi;
  window.CineBaseTheme = themeApi;
  window.CineAuraTheme = themeApi;
})();
