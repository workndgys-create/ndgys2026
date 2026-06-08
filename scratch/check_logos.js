const fs = require('fs');
const path = require('path');

const dirs = ['public', 'public/logos'];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
      const filePath = path.join(dir, file);
      try {
        const buf = fs.readFileSync(filePath);
        // Let's check PNG or JPEG dimensions
        let width = 0, height = 0;
        if (file.toLowerCase().endsWith('.png')) {
          width = buf.readInt32BE(16);
          height = buf.readInt32BE(20);
        }
        console.log(`${filePath}: ${width}x${height} (${buf.length} bytes)`);
      } catch (e) {
        console.log(`Error reading ${filePath}: ${e.message}`);
      }
    }
  }
}
