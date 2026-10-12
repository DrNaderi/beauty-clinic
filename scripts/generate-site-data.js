const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "data/manifest.json"), "utf8")
);
const services = JSON.parse(
  fs.readFileSync(path.join(root, "services.json"), "utf8")
);

const payload = {
  portfolio: manifest.portfolio,
  servicesImages: manifest.services,
  services,
};

fs.writeFileSync(
  path.join(root, "site-data.js"),
  `window.SITE_DATA=${JSON.stringify(payload)};\n`
);

console.log("Wrote site-data.js");
