// Re-render the selected vector identity; no generated imagery or runtime fonts.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const brand = path.join(publicDir, 'brand');
const source = await fs.readFile(path.join(brand, 'catalogue-constellation.svg'));
for (const size of [512, 2048]) {
    await sharp(source).resize(size, size).png().toFile(path.join(brand, `catalogue-constellation-${size}.png`));
}
await sharp(source).resize(1024,1024).png().toFile(path.join(publicDir,'logo.png'));
await fs.copyFile(path.join(publicDir,'logo.png'),path.join(root,'src/assets/logo.png'));
const favicon = source.toString().replace('width="1000" height="1000" viewBox="0 0 1000 1000"','width="64" height="64" viewBox="200 200 600 600"');
await fs.writeFile(path.join(brand,'favicon-constellation.svg'),favicon);
await sharp(Buffer.from(favicon)).resize(64,64).png().toFile(path.join(brand,'favicon-constellation-64.png'));
await fs.copyFile(path.join(brand,'favicon-constellation-64.png'),path.join(publicDir,'favicon.png'));
await sharp(source).resize(180,180).png().toFile(path.join(brand,'apple-touch-icon-constellation.png'));
for (const size of [192,512]) await sharp(source).resize(size,size).png().toFile(path.join(brand,`icon-constellation-${size}.png`));
// ICO container with PNG frames for legacy tab-icon clients.
const sizes = [16,32,48];
const frames = await Promise.all(sizes.map(size=>sharp(Buffer.from(favicon)).resize(size,size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16); header.writeUInt16LE(1,2); header.writeUInt16LE(sizes.length,4);
let offset = header.length;
frames.forEach((frame,index)=>{const at=6+index*16;header[at]=sizes[index];header[at+1]=sizes[index];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(frame.length,at+8);header.writeUInt32LE(offset,at+12);offset+=frame.length;});
await fs.writeFile(path.join(publicDir,'favicon.ico'),Buffer.concat([header,...frames]));
await sharp(path.join(brand,'catalogue-social-constellation.svg')).png().toFile(path.join(brand,'catalogue-social-constellation.png'));
console.log('Rendered Constellation avatars, favicon, device icons and 1200 × 630 social card.');
