import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');

// Copy manifest.json
fs.copyFileSync(
  path.join(root, 'public', 'manifest.json'),
  path.join(dist, 'manifest.json')
);

// Copy offscreen.html
fs.copyFileSync(
  path.join(root, 'public', 'offscreen.html'),
  path.join(dist, 'offscreen.html')
);

// Copy icons
const iconsDir = path.join(dist, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const iconSrc = path.join(root, 'public', 'icons');
if (fs.existsSync(iconSrc)) {
  for (const file of fs.readdirSync(iconSrc)) {
    fs.copyFileSync(path.join(iconSrc, file), path.join(iconsDir, file));
  }
}

// Copy sounds
const soundsDist = path.join(dist, 'sounds');
if (!fs.existsSync(soundsDist)) {
  fs.mkdirSync(soundsDist, { recursive: true });
}
const soundsSrc = path.join(root, 'public', 'sounds');
if (fs.existsSync(soundsSrc)) {
  for (const file of fs.readdirSync(soundsSrc)) {
    fs.copyFileSync(path.join(soundsSrc, file), path.join(soundsDist, file));
  }
}

// Fix sidepanel HTML path: Vite outputs it nested, we need it at root
const sidepanelNested = path.join(dist, 'src', 'sidepanel', 'index.html');
if (fs.existsSync(sidepanelNested)) {
  let html = fs.readFileSync(sidepanelNested, 'utf-8');
  // Fix relative paths: ../../assets/ → ./assets/ (since we move to dist root)
  html = html.replace(/\.\.\/\.\.\/assets\//g, './assets/');
  fs.writeFileSync(path.join(dist, 'sidepanel.html'), html);
}

// Update manifest to point to correct sidepanel path
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf-8'));
manifest.side_panel.default_path = 'sidepanel.html';
fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('Extension build complete! Load dist/ folder in chrome://extensions');
