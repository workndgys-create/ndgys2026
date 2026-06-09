import sharp from 'sharp';
import fs from 'fs';

async function removeWhiteBackground() {
  const inputPath = 'public/logos/IMG_7820.JPG.jpeg';
  const outputPath = 'public/logos/IMG_7820.png';

  try {
    // Read the image and convert to RGBA (with alpha channel)
    const image = sharp(inputPath)
      .toFormat('png')
      .ensureAlpha();

    // Get metadata to process pixels
    const data = await image.raw().toBuffer({ resolveWithObject: true });
    const { data: pixels, info } = data;
    const { width, height, channels } = info;

    // Process each pixel - remove white background
    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // If pixel is near-white (R>240, G>240, B>240), make it transparent
      if (r > 240 && g > 240 && b > 240) {
        pixels[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Write the processed image
    await sharp(pixels, {
      raw: {
        width,
        height,
        channels,
      },
    })
      .toFormat('png')
      .toFile(outputPath);

    console.log(`✓ Background removed: ${outputPath}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

removeWhiteBackground();
