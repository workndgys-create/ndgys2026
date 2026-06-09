const fs = require('fs');

async function makeTransparent(input, output) {
  const mod = await import('jimp');
  const Jimp = mod.default || mod;
  const image = await Jimp.read(input);
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (r > 240 && g > 240 && b > 240) {
      this.bitmap.data[idx + 3] = 0; // set alpha to 0
    }
  });
  await image.writeAsync(output);
  console.log(`Wrote ${output}`);
}

(async () => {
  const inPath = 'public/logos/IMG_2821.PNG';
  const outPath = 'public/logos/IMG_2821_trans.png';
  if (!fs.existsSync(inPath)) {
    console.error(`Input not found: ${inPath}`);
    process.exit(1);
  }
  await makeTransparent(inPath, outPath);
})();
