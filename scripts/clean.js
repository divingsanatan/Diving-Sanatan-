// Removes the previous production build so `next build` always starts fresh.
// `.next/dev` is kept: it belongs to `next dev` and may be locked while it runs.
const fs = require("fs");
const path = require("path");

const NEXT_DIR = path.join(__dirname, "..", ".next");

if (fs.existsSync(NEXT_DIR)) {
  for (const entry of fs.readdirSync(NEXT_DIR)) {
    if (entry === "dev") continue;
    fs.rmSync(path.join(NEXT_DIR, entry), { recursive: true, force: true, maxRetries: 3 });
  }
}

console.log("Cleaned previous build output in .next");
