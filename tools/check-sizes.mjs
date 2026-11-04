import fs from 'fs';
import zlib from 'zlib';

function check(file) {
  if (!fs.existsSync(file)) return console.log(file, 'does not exist');
  const content = fs.readFileSync(file);
  const gz = zlib.gzipSync(content);
  console.log(`${file}: raw ${(content.length/1024).toFixed(1)} KB, gzip ${(gz.length/1024).toFixed(1)} KB`);
}

console.log("=== ASSET SIZE CHECKS ===");
check("styles.css");
check("puzzles.css");
check("landing.css");
check("js/app.js");
check("js/screens.js");
check("js/config.js");
check("js/state.js");
check("js/router.js");
check("index.html");

// Total JS
const jsFiles = ["js/app.js", "js/screens.js", "js/config.js", "js/state.js", "js/router.js", "js/modal.js", "js/icons.js"];
let totalJs = Buffer.concat(jsFiles.map(f => fs.readFileSync(f)));
console.log(`Total Core JS: raw ${(totalJs.length/1024).toFixed(1)} KB, gzip ${(zlib.gzipSync(totalJs).length/1024).toFixed(1)} KB`);

// Total CSS
const cssFiles = ["styles.css", "puzzles.css"];
let totalCss = Buffer.concat(cssFiles.map(f => fs.readFileSync(f)));
console.log(`Total Core CSS: raw ${(totalCss.length/1024).toFixed(1)} KB, gzip ${(zlib.gzipSync(totalCss).length/1024).toFixed(1)} KB`);
