// Repack embedded GLB textures without changing mesh data. Never overwrites originals.
// Requires sharp in the development environment or SHARP_MODULE pointing to it.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'sharp');
await fs.mkdir('public/assets/models', { recursive: true });
for (const name of ['arbol', 'flor']) {
  const original = await fs.readFile(`../${name}.glb`);
  const jsonLength = original.readUInt32LE(12);
  const json = JSON.parse(original.subarray(20, 20 + jsonLength).toString());
  // The source tree includes a presentation backdrop, not part of the tree itself.
  if (name === 'arbol') for (const node of json.nodes || []) {
    if (node.mesh !== undefined && json.meshes[node.mesh].name === 'Plane.007_drop_0') delete node.mesh;
  }
  const binary = original.subarray(20 + jsonLength + 8);
  const replacements = new Map();
  for (const image of json.images || []) {
    const view = json.bufferViews[image.bufferView];
    const buffer = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const limit = name === 'arbol' ? 384 : 512;
    const converted = await sharp(buffer).resize({ width: limit, height: limit, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
    replacements.set(image.bufferView, converted); image.mimeType = 'image/png';
  }
  let offset = 0; const chunks = [];
  for (let i = 0; i < json.bufferViews.length; i++) {
    const view = json.bufferViews[i];
    const data = replacements.get(i) || binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    view.byteOffset = offset; view.byteLength = data.length;
    chunks.push(data); offset += data.length;
    const padding = (4 - offset % 4) % 4; if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  }
  json.buffers[0].byteLength = offset;
  const rawJson = Buffer.from(JSON.stringify(json));
  const jsonBuffer = Buffer.concat([rawJson, Buffer.alloc((4 - rawJson.length % 4) % 4, 32)]);
  const bin = Buffer.concat(chunks);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonBuffer.length + 8 + bin.length, 8);
  const jhead = Buffer.alloc(8); jhead.writeUInt32LE(jsonBuffer.length); jhead.writeUInt32LE(0x4e4f534a, 4);
  const bhead = Buffer.alloc(8); bhead.writeUInt32LE(bin.length); bhead.writeUInt32LE(0x004e4942, 4);
  const output = Buffer.concat([header, jhead, jsonBuffer, bhead, bin]);
  await fs.writeFile(`public/assets/models/${name}-mobile.glb`, output);
  console.log(JSON.stringify({ model: name, originalBytes: original.length, mobileBytes: output.length, reductionPercent: Math.round((1 - output.length / original.length) * 100) }));
}
