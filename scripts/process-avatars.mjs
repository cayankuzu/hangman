import { access, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const rawDirectory = path.join(projectRoot, "public", "avatars", "raw");
const processedDirectory = path.join(
  projectRoot,
  "public",
  "avatars",
  "processed",
);
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

await mkdir(rawDirectory, { recursive: true });
await mkdir(processedDirectory, { recursive: true });

const entries = await readdir(rawDirectory, { withFileTypes: true });
const images = entries.filter(
  (entry) =>
    entry.isFile() &&
    supportedExtensions.has(path.extname(entry.name).toLowerCase()),
);

if (images.length === 0) {
  console.log(
    "İşlenecek avatar bulunamadı. PNG, JPG, JPEG veya WebP dosyalarını public/avatars/raw içine ekleyin.",
  );
  process.exit(0);
}

for (const entry of images) {
  const inputPath = path.join(rawDirectory, entry.name);
  await access(inputPath);
  const outputName = `${path.parse(entry.name).name}.webp`;
  const outputPath = path.join(processedDirectory, outputName);

  await sharp(inputPath)
    .rotate()
    .resize(1024, 1024, {
      fit: "cover",
      position: sharp.strategy.attention,
      withoutEnlargement: false,
    })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(outputPath);

  console.log(`✓ ${entry.name} → ${outputName}`);
}
