import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate a minimal PNG file with a teal circle on dark background
// This creates a valid minimal PNG programmatically

function createPNG(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData.writeUInt8(8, 8);        // bit depth
  ihdrData.writeUInt8(2, 9);        // color type (RGB)
  ihdrData.writeUInt8(0, 10);       // compression
  ihdrData.writeUInt8(0, 11);       // filter
  ihdrData.writeUInt8(0, 12);       // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk - create image data
  const rawData = [];
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.25;

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= outerR && dist >= innerR) {
        // Teal ring: #2dd4bf
        rawData.push(45, 212, 191);
      } else if (dist < innerR) {
        // Dark center: #09090b
        rawData.push(9, 9, 11);
      } else {
        // Dark background: #09090b
        rawData.push(9, 9, 11);
      }
    }
  }

  // Compress with deflate (using zlib-compatible raw deflate)
  // Simple uncompressed deflate blocks
  const raw = Buffer.from(rawData);
  const compressed = deflateUncompressed(raw);

  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function deflateUncompressed(data) {
  // zlib header (CM=8, CINFO=7, FCHECK for no dict/compression)
  const header = Buffer.from([0x78, 0x01]);

  const maxBlock = 65535;
  const blocks = [];

  for (let i = 0; i < data.length; i += maxBlock) {
    const end = Math.min(i + maxBlock, data.length);
    const isLast = end === data.length;
    const block = data.subarray(i, end);
    const len = block.length;

    const blockHeader = Buffer.alloc(5);
    blockHeader.writeUInt8(isLast ? 1 : 0, 0);
    blockHeader.writeUInt16LE(len, 1);
    blockHeader.writeUInt16LE(len ^ 0xffff, 3);

    blocks.push(blockHeader, block);
  }

  // Adler-32 checksum
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((b << 16) | a, 0);

  return Buffer.concat([header, ...blocks, checksum]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return crc ^ 0xffffffff;
}

// Generate icons
for (const size of [16, 48, 128]) {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png`);
}
