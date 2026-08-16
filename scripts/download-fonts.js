/**
 * Script to download Cairo font files from Google Fonts
 * Run with: node scripts/download-fonts.js
 */

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONTS_DIR = path.join(__dirname, "..", "public", "fonts", "cairo");

// Google Fonts API URLs for Cairo font
const FONT_URLS = {
  "Cairo-Regular.ttf":
    "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo-Regular.ttf",
  "Cairo-Medium.ttf":
    "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo-Medium.ttf",
  "Cairo-SemiBold.ttf":
    "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo-SemiBold.ttf",
  "Cairo-Bold.ttf":
    "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo-Bold.ttf",
};

// Ensure fonts directory exists
if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
  console.log(`✓ Created directory: ${FONTS_DIR}`);
}

// Download a single font file
function downloadFont(filename, url) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(FONTS_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`⊘ Skipping ${filename} (already exists)`);
      resolve();
      return;
    }

    console.log(`↓ Downloading ${filename}...`);

    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          https
            .get(response.headers.location, (redirectResponse) => {
              redirectResponse.pipe(file);
              file.on("finish", () => {
                file.close();
                console.log(`✓ Downloaded ${filename}`);
                resolve();
              });
            })
            .on("error", (err) => {
              fs.unlink(filePath, () => {});
              reject(err);
            });
        } else {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log(`✓ Downloaded ${filename}`);
            resolve();
          });
        }
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
  });
}

// Download all fonts
async function downloadAllFonts() {
  console.log("📥 Downloading Cairo font files...\n");

  try {
    for (const [filename, url] of Object.entries(FONT_URLS)) {
      await downloadFont(filename, url);
    }

    console.log("\n✅ All fonts downloaded successfully!");
    console.log(`📁 Fonts location: ${FONTS_DIR}`);
  } catch (error) {
    console.error("\n❌ Error downloading fonts:", error.message);
    console.error("\nPlease download the fonts manually from:");
    console.error("https://fonts.google.com/specimen/Cairo");
    process.exit(1);
  }
}

downloadAllFonts();
