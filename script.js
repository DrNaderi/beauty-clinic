function normalizeKey(str) {
  return str
    .replace(/\.[^.]+$/, "")
    .replace(/\s+\d+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function captionFromPath(path) {
  const name = path.split("/").pop() || path;
  return normalizeKey(name);
}

function serviceHref(title) {
  return `service/?title=${encodeURIComponent(title)}`;
}

function siteRootUrl() {
  const scripts = document.querySelectorAll('script[src*="script.js"]');
  const current = scripts[scripts.length - 1];
  if (current?.src) {
    return new URL("./", current.src);
  }
  return new URL("./", window.location.href);
}

function assetUrl(path) {
  const segments = path.split("/");
  const encoded = segments
    .map((segment, index) =>
      index === 0 || segment === "" ? segment : encodeURIComponent(segment)
    )
    .join("/");
  return new URL(encoded, siteRootUrl()).href;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

async function loadSiteData() {
  const embedded = window.SITE_DATA;
  if (embedded?.portfolio?.length && embedded?.services?.length) {
    return {
      portfolio: embedded.portfolio,
      servicesImages: embedded.servicesImages,
      services: embedded.services,
    };
  }

  try {
    const [manifest, services] = await Promise.all([
      fetchJson(new URL("data/manifest.json", siteRootUrl()).href),
      fetchJson(new URL("services.json", siteRootUrl()).href),
    ]);
    return {
      portfolio: manifest.portfolio,
      servicesImages: manifest.services,
      services,
    };
  } catch (err) {
    console.error(err);
    return embedded || null;
  }
}

function showLoadError(container, message) {
  if (!container) return;
  container.innerHTML = `<p class="error-msg">${message}</p>`;
}

function ensureLightbox() {
  if (!document.getElementById("lightbox")) {
    const lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="بستن">&times;</button>
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-dialog">
        <img class="lightbox-img" src="" alt="">
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);
  }
  initLightbox();
}

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox || lightbox.dataset.bound === "1") return;

  const img = lightbox.querySelector(".lightbox-img");
  const caption = lightbox.querySelector(".lightbox-caption");
  const backdrop = lightbox.querySelector(".lightbox-backdrop");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  const dialog = lightbox.querySelector(".lightbox-dialog");

  function close() {
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    img.src = "";
    document.body.style.overflow = "";
  }

  function open(src, alt) {
    img.src = src;
    img.alt = alt || "";
    caption.textContent = alt || "";
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  window.openLightbox = open;
  window.closeLightbox = close;

  backdrop.addEventListener("click", close);
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", (e) => e.stopPropagation());
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) close();
  });

  lightbox.dataset.bound = "1";
}

function createSquareThumb(src, alt) {
  const wrap = document.createElement("div");
  wrap.className = "square-thumb";
  const bg = document.createElement("div");
  bg.className = "square-thumb-bg";
  bg.style.backgroundImage = `url("${src}")`;
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.draggable = false;
  wrap.appendChild(bg);
  wrap.appendChild(img);
  return wrap;
}

function bindThumbLightbox(thumb, url, caption) {
  thumb.classList.add("thumb-lightbox");
  thumb.setAttribute("role", "button");
  thumb.tabIndex = 0;
  const open = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.openLightbox(url, caption);
  };
  thumb.addEventListener("click", open);
  thumb.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(e);
    }
  });
}

async function initGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const data = await loadSiteData();
  if (!data?.portfolio?.length) {
    showLoadError(grid, "بارگذاری تصاویر نمونه کارها ممکن نشد.");
    return;
  }

  data.portfolio.forEach((path) => {
    const url = assetUrl(path);
    const caption = captionFromPath(path);
    const item = document.createElement("article");
    item.className = "card gallery-card photo";
    item.tabIndex = 0;
    item.setAttribute("role", "button");

    const thumb = createSquareThumb(url, caption);

    const body = document.createElement("div");
    body.className = "card-body card-body--title-only";
    const h3 = document.createElement("h3");
    h3.textContent = caption;
    body.appendChild(h3);

    item.appendChild(thumb);
    item.appendChild(body);

    const open = () => window.openLightbox(url, caption);
    item.addEventListener("click", open);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    grid.appendChild(item);
  });
}

async function initServicesGrid() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;

  const data = await loadSiteData();
  if (!data?.services?.length || !data?.servicesImages?.length) {
    showLoadError(grid, "بارگذاری خدمات ممکن نشد. لطفاً صفحه را رفرش کنید.");
    return;
  }

  const imageByTitle = new Map();
  data.servicesImages.forEach((path) => {
    const key = normalizeKey(path.split("/").pop());
    imageByTitle.set(key, path);
  });

  let count = 0;
  data.services.forEach((service) => {
    const key = normalizeKey(service.title);
    const imagePath = imageByTitle.get(key);
    if (!imagePath) return;

    const url = assetUrl(imagePath);
    const card = document.createElement("article");
    card.className = "card service-card";

    const thumb = createSquareThumb(url, service.title);
    bindThumbLightbox(thumb, url, service.title);

    const link = document.createElement("a");
    link.className = "card-body";
    link.href = serviceHref(service.title);
    const h3 = document.createElement("h3");
    h3.textContent = service.title;
    const p = document.createElement("p");
    p.textContent = service.short_description;
    link.appendChild(h3);
    link.appendChild(p);

    card.appendChild(thumb);
    card.appendChild(link);
    grid.appendChild(card);
    count += 1;
  });

  if (count === 0) {
    showLoadError(grid, "خدمتی با تصویر مطابق یافت نشد.");
  }
}

function formatDescription(text) {
  const parts = text.split(/\n\n+/).filter(Boolean);
  return parts.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function initServiceDetail() {
  const root = document.getElementById("service-detail");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const title = params.get("title");
  if (!title) {
    root.innerHTML = '<p class="error-msg">خدمت مورد نظر یافت نشد.</p>';
    return;
  }

  const data = await loadSiteData();
  if (!data) {
    root.innerHTML = '<p class="error-msg">بارگذاری اطلاعات ممکن نشد.</p>';
    return;
  }

  const service = data.services.find((s) => s.title === title);
  if (!service) {
    root.innerHTML = '<p class="error-msg">خدمت مورد نظر یافت نشد.</p>';
    return;
  }

  const imageByTitle = new Map();
  data.servicesImages.forEach((path) => {
    const key = normalizeKey(path.split("/").pop());
    imageByTitle.set(key, path);
  });

  const imagePath = imageByTitle.get(normalizeKey(service.title));
  if (!imagePath) {
    root.innerHTML = '<p class="error-msg">تصویر این خدمت یافت نشد.</p>';
    return;
  }

  const url = assetUrl(imagePath);
  document.title = `${service.title} | دکتر دالغا نادری`;

  root.innerHTML = `
    <h1>${escapeHtml(service.title)}</h1>
    <div class="service-detail-image thumb-lightbox" role="button" tabindex="0" aria-label="نمایش تصویر در اندازه کامل">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(service.title)}">
      <span class="image-expand-hint">برای بزرگ‌نمایی کلیک کنید</span>
    </div>
    <div class="service-detail-body">${formatDescription(service.description)}</div>
  `;

  const imageWrap = root.querySelector(".service-detail-image");
  const open = () => window.openLightbox(url, service.title);
  imageWrap.addEventListener("click", open);
  imageWrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
}

function initScrollReveal() {
  window.addEventListener("scroll", () => {
    document.querySelectorAll(".card,.photo,.gallery-card").forEach((item) => {
      const pos = item.getBoundingClientRect().top;
      if (pos < window.innerHeight - 100) {
        item.style.opacity = "1";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ensureLightbox();
  initScrollReveal();
  initGallery();
  initServicesGrid();
  initServiceDetail();
});
