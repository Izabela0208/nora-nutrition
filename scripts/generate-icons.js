// Genereaza PNG-urile app icon-ului Nora (semnatura "nora" pe patrat pine)
// din scripts/petit-formal-script.ttf, folosind @resvg/resvg-js.
// Ruleaza: node scripts/generate-icons.js

const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const FONT = path.join(__dirname, "petit-formal-script.ttf");
const OUT_DIR = path.join(__dirname, "..", "public");

const FONT_SIZE = 145;
const DY = -12; // nudge optic in sus, fata de centrarea automata pe baseline

function makeSvg(size) {
  const rx = size * (7 / 32);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${rx}" fill="#1F2E26"/>
    <text x="50%" y="50%" dy="${DY}" text-anchor="middle" dominant-baseline="central"
      font-family="Petit Formal Script" font-size="${FONT_SIZE}" fill="#F4F2ED">nora</text>
  </svg>`;
}

function render(size, filename) {
  const resvg = new Resvg(makeSvg(512), {
    font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: "Petit Formal Script" },
    fitTo: { mode: "width", value: size },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(path.join(OUT_DIR, filename), png);
  console.log("wrote", filename, `(${size}x${size})`, png.length, "bytes");
}

render(512, "icon-512.png");
render(192, "icon-192.png");
render(180, "apple-touch-icon.png");
