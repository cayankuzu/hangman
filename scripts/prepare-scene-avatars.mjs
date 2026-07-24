import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "public", "avatars", "heads");
const outputDir = path.join(root, "public", "avatars", "game");
const names = ["einstein", "epstein", "hawking", "sheikh-said", "cartman"];

await mkdir(outputDir, { recursive: true });

for (const name of names) {
  const input = path.join(sourceDir, `${name}.png`);
  const output = path.join(outputDir, `${name}.png`);
  const image = sharp(input).ensureAlpha();
  const { width, height } = await image.metadata();

  if (!width || !height || name === "cartman") {
    await image.png({ compressionLevel: 9 }).toFile(output);
    continue;
  }

  const mask = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="1"/>
          <stop offset="76%" stop-color="white" stop-opacity="1"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>
  `);

  await image
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toFile(output);
}

console.log(`Prepared ${names.length} scene avatars in ${outputDir}`);
