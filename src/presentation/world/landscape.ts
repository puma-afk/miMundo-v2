import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3, VertexData } from '../engine';
import { groundHeight, material, merge, orb, seeded } from './materials';

export type Landscape = { ground: Mesh; water: Mesh; motes: Mesh[]; tree: Vector3; bench: Vector3 };

export function createLandscape(scene: Scene): Landscape {
  const random = seeded(742);
  const grass = material(scene, 'island-meadow', '#ffffff');
  const rock = material(scene, 'weathered-blue-stone', '#637b80');
  const paleRock = material(scene, 'warm-limestone', '#d2c5ab');
  const bark = material(scene, 'silver-bark', '#8a7974');
  const leafColors = ['#c88bb2', '#e9b4cc', '#f2d0d9', '#b99ac5'];
  const foliage = leafColors.map((c, i) => material(scene, `blossom-${i}`, c));
  const leaves = material(scene, 'sage-leaves', '#6ba58f');
  const darkLeaves = material(scene, 'evergreen-leaves', '#548b80');
  const gold = material(scene, 'soft-gold', '#efcd83', 0.3);

  const ground = island(scene, 'garden-island', 15, Vector3.Zero(), grass, rock, 0);
  ground.isPickable = true;
  ground.metadata = { walkable: true };
  const pathMat = material(scene, 'pale-garden-path', '#d9cbb0');
  const left: Vector3[] = [], right: Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const z = 12 - i * 0.29;
    const x = Math.sin((z + 2) * 0.34) * 1.5;
    left.push(new Vector3(x - 1, groundHeight(x - 1, z) + 0.025, z));
    right.push(new Vector3(x + 1, groundHeight(x + 1, z) + 0.025, z));
  }
  const path = MeshBuilder.CreateRibbon('winding-path', { pathArray: [left, right], sideOrientation: Mesh.DOUBLESIDE }, scene);
  path.material = pathMat; path.isPickable = false;

  const treePos = new Vector3(-1.4, groundHeight(-1.4, -3), -3);
  tree(scene, treePos, 1.1, bark, foliage, random, true);
  tree(scene, new Vector3(-9.5, groundHeight(-9.5, -4), -4), 0.64, bark, [leaves, darkLeaves], random);
  tree(scene, new Vector3(9.3, groundHeight(9.3, -4.8), -4.8), 0.66, bark, [leaves, darkLeaves], random);
  tree(scene, new Vector3(-10, groundHeight(-10, 4), 4), 0.42, bark, foliage, random);

  // Repeated grass is one mesh, with per-vertex color rather than hundreds of entities.
  const positions: number[] = [], indices: number[] = [], colors: number[] = [];
  for (let i = 0; i < 2600; i++) {
    const x = (random() - 0.5) * 29, z = (random() - 0.5) * 29;
    if (x * x + z * z > 190 || Math.abs(x - Math.sin((z + 2) * 0.34) * 1.5) < 1.3 || (x - 5) ** 2 + (z + 3) ** 2 < 12) continue;
    const y = groundHeight(x, z), h = 0.12 + random() * 0.26, w = 0.045 + random() * 0.035;
    const a = random() * Math.PI, dx = Math.cos(a) * w, dz = Math.sin(a) * w;
    const base = positions.length / 3;
    positions.push(x - dx, y, z - dz, x + dx, y, z + dz, x + dx * 2, y + h, z);
    indices.push(base, base + 1, base + 2);
    const tint = Color3.Lerp(Color3.FromHexString('#658f75'), Color3.FromHexString('#bdd4a0'), random());
    for (let k = 0; k < 3; k++) colors.push(tint.r, tint.g, tint.b, 1);
  }
  const grassBlades = new Mesh('meadow-blades', scene), vd = new VertexData();
  vd.positions = positions; vd.indices = indices; vd.colors = colors;
  const normals: number[] = []; VertexData.ComputeNormals(positions, indices, normals); vd.normals = normals; vd.applyToMesh(grassBlades);
  const bladeMat = material(scene, 'blade-material', '#ffffff'); bladeMat.backFaceCulling = false;
  grassBlades.material = bladeMat; grassBlades.isPickable = false;

  const stones: Mesh[] = [], flowers: Mesh[] = [];
  const flowerMat = material(scene, 'wildflower-ivory', '#fff0bc', 0.12);
  const lavender = material(scene, 'wildflower-lavender', '#bd9cde');
  for (let i = 0; i < 150; i++) {
    const a = random() * Math.PI * 2, r = 9 + random() * 5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const s = 0.12 + random() * 0.34;
    if (i < 50) stones.push(orb(scene, 'river-stone', new Vector3(x, groundHeight(x, z) + s * 0.2, z), new Vector3(s * 1.4, s * 0.7, s), paleRock, 8));
    else {
      flowers.push(orb(scene, 'wildflower', new Vector3(x, groundHeight(x, z) + 0.16, z), new Vector3(0.10, 0.10, 0.10), i % 2 ? flowerMat : lavender, 5));
    }
  }
  merge(stones, 'scattered-stones'); merge(flowers, 'wildflowers');

  const pondMat = material(scene, 'still-water', '#69bbb5', 0.13); pondMat.specularColor.set(0.8, 0.85, 0.8); pondMat.specularPower = 90;
  const water = orb(scene, 'moon-pool', new Vector3(5, 0.28, -3), new Vector3(2.7, 0.075, 1.9), pondMat, 36);
  const rim: Mesh[] = [];
  for (let i = 0; i < 32; i++) {
    const a = i / 32 * Math.PI * 2;
    rim.push(orb(scene, 'pond-rim', new Vector3(5 + Math.cos(a) * 2.7, 0.28, -3 + Math.sin(a) * 1.9), new Vector3(0.3, 0.19, 0.25), paleRock, 8));
  }
  merge(rim, 'pond-stones');
  for (let i = 0; i < 5; i++) {
    const p = new Vector3(4 + random() * 2, 0.37, -3.8 + random());
    orb(scene, 'lily-pad', p, new Vector3(0.24, 0.018, 0.22), leaves, 12);
    orb(scene, 'lily', p.add(new Vector3(0, 0.065, 0)), new Vector3(0.10, 0.09, 0.1), foliage[2], 8);
  }

  // A curved stone arch, with a single continuous tube silhouette.
  const archPath: Vector3[] = [];
  for (let i = 0; i <= 32; i++) {
    const a = i / 32 * Math.PI;
    archPath.push(new Vector3(5.2 + Math.cos(a) * 1.9, 1.5 + Math.sin(a) * 2, -9));
  }
  const arch = MeshBuilder.CreateTube('forgotten-arch', { path: archPath, radius: 0.28, tessellation: 14, cap: Mesh.CAP_ALL }, scene); arch.material = paleRock; arch.isPickable = false;
  for (const x of [3.3, 7.1]) {
    const column = MeshBuilder.CreateCylinder('arch-column', { height: 1.5, diameter: 0.6, tessellation: 16 }, scene);
    column.position.set(x, 0.75, -9); column.material = paleRock; column.isPickable = false;
    orb(scene, 'arch-base', new Vector3(x, 0.2, -9), new Vector3(0.6, 0.3, 0.5), paleRock);
  }

  const benchPos = new Vector3(-6.4, groundHeight(-6.4, -5), -5);
  const wood = material(scene, 'warm-bench', '#9b7b69');
  const seat = MeshBuilder.CreateCapsule('bench-seat', { height: 2.4, radius: 0.15, tessellation: 12 }, scene);
  seat.rotation.z = Math.PI / 2; seat.position.copyFrom(benchPos.add(new Vector3(0, 0.65, 0))); seat.scaling.z = 2.2; seat.material = wood; seat.isPickable = false;
  const back = seat.clone('bench-back')!; back.position.addInPlace(new Vector3(0, 0.42, -0.23)); back.scaling.z = 1;
  for (const dx of [-0.8, 0.8]) orb(scene, 'bench-support', benchPos.add(new Vector3(dx, 0.28, 0)), new Vector3(0.17, 0.32, 0.28), paleRock);

  for (const [x, z] of [[-2.2, 6.8], [2.5, 2], [-3.8, -7], [7.3, -7]]) {
    const y = groundHeight(x, z);
    const stem = MeshBuilder.CreateCylinder('lantern-stem', { height: 0.7, diameter: 0.065, tessellation: 8 }, scene);
    stem.position.set(x, y + 0.35, z); stem.material = bark; stem.isPickable = false;
    orb(scene, 'lantern-glow', new Vector3(x, y + 0.78, z), new Vector3(0.17, 0.24, 0.17), gold, 10);
  }

  // Silhouettes beyond the playable zone create depth without additional loaded zones.
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const mountain = orb(scene, 'distant-mountain', new Vector3(Math.cos(a) * 110, -43, Math.sin(a) * 110), new Vector3(25 + random() * 18, 17 + random() * 14, 24), material(scene, `mountain-${i}`, i % 2 ? '#8aa5b0' : '#9ab7bb'), 18);
    mountain.rotation.z = (random() - 0.5) * 0.5;
  }
  for (let i = 0; i < 4; i++) {
    island(scene, `distant-island-${i}`, 3 + i, new Vector3(-32 + i * 23, -3 - i, -38 - (i % 2) * 20), grass, rock, 1);
  }

  const motes: Mesh[] = [];
  const moteMat = material(scene, 'firefly-light', '#ffe2a4', 1);
  for (let i = 0; i < 24; i++) {
    const m = orb(scene, 'firefly', new Vector3((random() - 0.5) * 15, 0.6 + random() * 4, (random() - 0.5) * 16), new Vector3(0.025, 0.025, 0.025), moteMat, 4);
    m.metadata = { base: m.position.clone(), phase: random() * 7 };
    motes.push(m);
  }
  return { ground, water, motes, tree: treePos, bench: benchPos };
}

export function island(scene: Scene, name: string, radius: number, offset: Vector3, grass: StandardMaterial, rock: StandardMaterial, distant: number): Mesh {
  const mesh = new Mesh(name, scene);
  const pos: number[] = [], idx: number[] = [], colors: number[] = [];
  const rings = distant ? 5 : 22, segments = 96;
  for (let r = 0; r <= rings; r++) for (let a = 0; a <= segments; a++) {
    const angle = a / segments * Math.PI * 2;
    const rr = radius * r / rings * (1 + 0.035 * Math.sin(angle * 5) + 0.022 * Math.cos(angle * 9));
    const x = Math.cos(angle) * rr, z = Math.sin(angle) * rr;
    pos.push(x, distant ? 0 : groundHeight(x, z), z);
    const c = Color3.Lerp(Color3.FromHexString('#659e80'), Color3.FromHexString('#a5c993'), 0.5 + Math.sin(x * 0.38 + z * 0.2) * 0.25);
    colors.push(c.r, c.g, c.b, 1);
    if (r < rings && a < segments) { const k = r * (segments + 1) + a; idx.push(k, k + segments + 1, k + 1, k + 1, k + segments + 1, k + segments + 2); }
  }
  const vd = new VertexData(), normals: number[] = [];
  vd.positions = pos; vd.indices = idx; vd.colors = colors; VertexData.ComputeNormals(pos, idx, normals); vd.normals = normals; vd.applyToMesh(mesh);
  mesh.material = grass; mesh.position.copyFrom(offset); mesh.isPickable = false;
  const under = MeshBuilder.CreateLathe(`${name}-stone`, { shape: [new Vector3(0, -7, 0), new Vector3(radius * 0.22, -5.5, 0), new Vector3(radius * 0.65, -2.4, 0), new Vector3(radius * 0.94, -0.65, 0), new Vector3(radius, 0.1, 0)], tessellation: 64, sideOrientation: Mesh.DOUBLESIDE }, scene);
  under.material = rock; under.position.copyFrom(offset); under.isPickable = false;
  return mesh;
}

function tree(scene: Scene, p: Vector3, scale: number, bark: StandardMaterial, foliage: StandardMaterial[], random: () => number, magic = false): void {
  const branches: Mesh[] = [], canopy: Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    const end = new Vector3(Math.cos(angle) * 2.5 * scale, (4.6 + random()) * scale, Math.sin(angle) * 2.1 * scale).add(p);
    const path = [p, p.add(new Vector3(-0.3 * scale, 1.4 * scale, 0)), p.add(new Vector3(0.2 * scale, 3 * scale, 0)), Vector3.Lerp(p.add(new Vector3(0, 3.8 * scale, 0)), end, 0.6), end];
    const branch = MeshBuilder.CreateTube('curving-branch', { path, radiusFunction: (j) => (0.38 * (1 - j / 5) + 0.02) * scale, tessellation: 10, cap: Mesh.CAP_ALL }, scene);
    branch.material = bark; branches.push(branch);
    for (let j = 0; j < 5; j++) {
      const pp = end.add(new Vector3((random() - 0.5) * 2.7 * scale, (random() - 0.4) * 1.3 * scale, (random() - 0.5) * 2.3 * scale));
      canopy.push(orb(scene, 'soft-canopy', pp, new Vector3((1 + random() * 0.55) * scale, (0.65 + random() * 0.4) * scale, (0.85 + random() * 0.45) * scale), foliage[Math.floor(random() * foliage.length)], 10));
    }
    if (magic) for (let j = 0; j < 3; j++) {
      const strand: Vector3[] = [];
      const len = (0.8 + random() * 1.5) * scale;
      const start = end.add(new Vector3((random() - 0.5) * 1.5, -0.2, (random() - 0.5) * 1.5));
      for (let k = 0; k < 5; k++) strand.push(start.add(new Vector3(Math.sin(k) * 0.08, -len * k / 4, 0)));
      const vine = MeshBuilder.CreateTube('hanging-blossoms', { path: strand, radius: 0.055, tessellation: 5 }, scene); vine.material = foliage[j % foliage.length]; canopy.push(vine);
    }
  }
  merge(branches, 'tree-trunk'); merge(canopy, 'tree-canopy');
}
