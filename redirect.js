(function () {
  if (typeof window.getSiteBasePath !== "function") return;

  window.__redirectTo = function (path) {
    var target = window.getSiteBasePath() + String(path).replace(/^\//, "");
    location.replace(target);
  };
})();
