(function () {
  if (document.querySelector("base[data-site-root]")) return;
  if (typeof window.getSiteBasePath !== "function") return;

  var base = window.getSiteBasePath();
  window.SITE_BASE_PATH = base;

  var el = document.createElement("base");
  el.href = base;
  el.setAttribute("data-site-root", "");

  var script = document.currentScript;
  if (script && script.parentNode) {
    script.parentNode.insertBefore(el, script.nextSibling);
  } else {
    document.head.insertBefore(el, document.head.firstChild);
  }
})();
