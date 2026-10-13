const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function normalizeKey(name) {
  return name
    .replace(/\.[^.]+$/i, "")
    .replace(/\s+\d+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sortImages(a, b) {
  const na = a.split("/").pop();
  const nb = b.split("/").pop();
  const baseA = normalizeKey(na);
  const baseB = normalizeKey(nb);
  if (baseA !== baseB) return baseA.localeCompare(baseB, "fa");
  const numA = Number((na.match(/(\d+)\.[^.]+$/i) || [, 0])[1]);
  const numB = Number((nb.match(/(\d+)\.[^.]+$/i) || [, 0])[1]);
  return numA - numB;
}

function buildManifest() {
  const portfolioDir = path.join(root, "images/portfolio");
  const servicesDir = path.join(root, "images/services");
  const portfolioFiles = fs
    .readdirSync(portfolioDir)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const groups = new Map();
  for (const f of portfolioFiles) {
    const key = normalizeKey(f);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(`images/portfolio/${f}`);
  }
  const portfolioCategories = [...groups.entries()]
    .sort(
      (a, b) =>
        b[1].length - a[1].length ||
        a[0].localeCompare(b[0], "fa")
    )
    .map(([name, images]) => {
      const sorted = images.sort(sortImages);
      return { name, cover: sorted[0], images: sorted };
    });

  const services = fs
    .readdirSync(servicesDir)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map((f) => `images/services/${f}`)
    .sort((a, b) => a.localeCompare(b, "fa"));

  return { portfolioCategories, services };
}

const manifest = buildManifest();
fs.writeFileSync(
  path.join(root, "data/manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`
);

const services = JSON.parse(
  fs.readFileSync(path.join(root, "services.json"), "utf8")
);

const payload = {
  portfolioCategories: manifest.portfolioCategories,
  servicesImages: manifest.services,
  services,
};

fs.writeFileSync(
  path.join(root, "site-data.js"),
  `window.SITE_DATA=${JSON.stringify(payload)};\n`
);

console.log(
  "Wrote manifest and site-data.js —",
  manifest.portfolioCategories.length,
  "portfolio categories,",
  manifest.services.length,
  "service images"
);
