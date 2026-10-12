(function () {
  if (document.querySelector("base[data-site-root]")) return;

  var base = "/";
  if (location.hostname.endsWith("github.io")) {
    var seg = location.pathname.replace(/^\//, "").split("/")[0];
    if (seg && !/^(about|gallery|reserve|service)$/i.test(seg)) {
      base = "/" + seg + "/";
    }
  }

  window.SITE_BASE_PATH = base;
  var el = document.createElement("base");
  el.href = base;
  el.setAttribute("data-site-root", "");
  document.head.appendChild(el);
})();
