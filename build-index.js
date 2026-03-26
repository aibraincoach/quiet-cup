const fs = require("fs");
const path = require("path");

const root = __dirname;
const templatePath = path.join(root, "index.template.html");
const outPath = path.join(root, "index.html");

const key = process.env.GMAPS_KEY || "";
let html = fs.readFileSync(templatePath, "utf8");
html = html.split("GMAPS_KEY_PLACEHOLDER").join(key);
fs.writeFileSync(outPath, html, "utf8");
