(function () {
  function siteBase() {
    var base = "/";
    if (location.hostname.endsWith("github.io")) {
      var seg = location.pathname.replace(/^\//, "").split("/")[0];
      if (seg && !/^(about|gallery|reserve|service)$/i.test(seg)) {
        base = "/" + seg + "/";
      }
    }
    return base;
  }
  window.__redirectTo = function (path) {
    location.replace(siteBase() + path.replace(/^\//, ""));
  };
})();
