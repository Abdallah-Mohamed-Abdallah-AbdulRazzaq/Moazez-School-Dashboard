/**
 * Script to copy Cairo font files from @fontsource to public directory
 * This runs automatically after npm install via postinstall script
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(
  __dirname,
  "..",
  "node_modules",
  "@fontsource",
  "cairo",
  "files",
);
const DEST_DIR = path.join(__dirname, "..", "public", "fonts", "cairo");

// Font weights to copy
const WEIGHTS = ["400", "500", "600", "700"];
const SUBSETS = ["latin", "arabic"];

function setupFonts() {
  // Check if @fontsource/cairo is installed
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log("⚠️  @fontsource/cairo not found. Skipping font setup.");
    console.log("   Run: npm install @fontsource/cairo");
    return;
  }

  // Ensure destination directory exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log(`✓ Created directory: ${DEST_DIR}`);
  }

  console.log("📝 Copying Cairo font files...\n");

  let copiedCount = 0;
  let skippedCount = 0;

  // Copy font files for each weight and subset
  WEIGHTS.forEach((weight) => {
    SUBSETS.forEach((subset) => {
      const filename = `cairo-${subset}-${weight}-normal.woff2`;
      const sourcePath = path.join(SOURCE_DIR, filename);
      const destPath = path.join(DEST_DIR, filename);

      if (!fs.existsSync(sourcePath)) {
        console.log(`⚠️  Source file not found: ${filename}`);
        return;
      }

      // Check if file already exists and is identical
      if (fs.existsSync(destPath)) {
        const sourceStats = fs.statSync(sourcePath);
        const destStats = fs.statSync(destPath);

        if (sourceStats.size === destStats.size) {
          skippedCount++;
          return;
        }
      }

      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✓ Copied: ${filename}`);
        copiedCount++;
      } catch (error) {
        console.error(`❌ Failed to copy ${filename}:`, error.message);
      }
    });
  });

  console.log(`\n✅ Font setup complete!`);
  console.log(`   Copied: ${copiedCount} files`);
  if (skippedCount > 0) {
    console.log(`   Skipped: ${skippedCount} files (already up to date)`);
  }
  console.log(`   Location: ${DEST_DIR}`);
}

// Run the setup
try {
  setupFonts();
} catch (error) {
  console.error("❌ Error setting up fonts:", error.message);
  process.exit(1);
}
