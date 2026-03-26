const fs = require("fs");
const path = require("path");

module.exports = function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.end();
    return;
  }

  const htmlPath = path.join(process.cwd(), "index.html");
  let html;
  try {
    html = fs.readFileSync(htmlPath, "utf8");
  } catch {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Failed to load index");
    return;
  }

  const key = process.env.GMAPS_KEY || "";
  html = html.split("GMAPS_KEY_PLACEHOLDER").join(key);

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(html);
};
