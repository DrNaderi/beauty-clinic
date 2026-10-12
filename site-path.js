/**
 * GitHub Pages path helper (client-side only).
 *
 * Project sites are served at https://<user>.github.io/<repo>/ — not at the domain root.
 * Use site-relative paths (about/, ./style.css) plus <base> from site-base.js, never root-absolute /style.css.
 *
 * Repo root also needs an empty .nojekyll file so Jekyll does not skip static assets.
 * Paths are case-sensitive on GitHub Pages (script.js ≠ Script.js).
 */
(function () {
  var REPO_NAME = "beauty-clinic";
  var PAGE_FOLDERS = /^(about|gallery|reserve|service)$/i;

  window.getSiteBasePath = function () {
    if (location.hostname.endsWith("github.io")) {
      var seg = location.pathname.replace(/^\//, "").split("/")[0];
      if (seg && !PAGE_FOLDERS.test(seg)) {
        return "/" + seg + "/";
      }
      if (!seg) {
        return "/" + REPO_NAME + "/";
      }
    }
    return "/";
  };
})();
