import sharp from 'sharp';
import fs from 'fs';

async function recolorText() {
  const input = 'public/logos/IMG_7820.png';
  const output = 'public/logos/IMG_7820_textwhite.png';
  if (!fs.existsSync(input)) {
    console.error('Input not found:', input);
    process.exit(1);
  }

  const img = sharp(input);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Work on a copy buffer
  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = channels === 4 ? out[i + 3] : 255;

    // Only modify visible pixels
    if (a === 0) continue;

    // Detect likely logo text blue color: fairly high blue, medium-low red/green
    // Adjust thresholds to avoid touching orange/green artwork
    const isBlueText = (b > 120 && r < 140 && g < 140 && (b - Math.max(r, g)) > 30);

    if (isBlueText) {
      out[i] = 255; // R
      out[i + 1] = 255; // G
      out[i + 2] = 255; // B
      // keep alpha as-is
    }
  }

  await sharp(out, { raw: { width, height, channels } }).png().toFile(output);
  console.log('Wrote', output);
}

recolorText().catch((e) => { console.error(e); process.exit(1); });
