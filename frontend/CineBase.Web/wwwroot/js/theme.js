/**
 * Cinema67 Theme Manager
 *
 * - Exposes window.Cinema67Theme for compatibility
 */

(function () {
  var THEME_KEY = 'cb_color_theme';

  var themeApi = {
    STORAGE_KEY: THEME_KEY,
    get: function () {
      return localStorage.getItem(THEME_KEY) || 'light';
    },
    set: function (value) {
      localStorage.setItem(THEME_KEY, value);
      document.documentElement.classList.toggle('dark', value === 'dark');
    },
    toggle: function () {
      this.set(this.get() === 'dark' ? 'light' : 'dark');
      this._updateToggleIcons();
    },
    init: function () {
      var saved = this.get();
      this.set(saved);
      this._updateToggleIcons();
    },
    _updateToggleIcons: function () {
      var isDark = this.get() === 'dark';
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

  themeApi.init();

  window.Cinema67Theme = themeApi;
  window.CineBaseTheme = themeApi;
  window.CineAuraTheme = themeApi;
})();
