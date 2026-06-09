const fs = require('fs');
const buf = fs.readFileSync('public/logos/IMG_7820_textwhite.png');
const width = buf.readInt32BE(16);
const height = buf.readInt32BE(20);
console.log(`Dimensions: ${width}x${height}`);
