const fs = require("fs");
const path = require("path");

const root = __dirname;
const templatePath = path.join(root, "index.template.html");
const publicDir = path.join(root, "public");
const outPath = path.join(publicDir, "index.html");

const key = process.env.GMAPS_KEY || "";
let html = fs.readFileSync(templatePath, "utf8");
html = html.split("GMAPS_KEY_PLACEHOLDER").join(key);
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(outPath, html, "utf8");
