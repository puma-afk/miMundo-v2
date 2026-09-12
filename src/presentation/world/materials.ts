import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from '../engine';

export function material(scene: Scene, name: string, hex: string, emissive = 0): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.specularColor = new Color3(0.04, 0.04, 0.04);
  m.emissiveColor = m.diffuseColor.scale(emissive);
  return m;
}

export function orb(scene: Scene, name: string, position: Vector3, scale: Vector3, mat: StandardMaterial, segments = 10): Mesh {
  const mesh = MeshBuilder.CreateSphere(name, { diameter: 2, segments }, scene);
  mesh.position.copyFrom(position);
  mesh.scaling.copyFrom(scale);
  mesh.material = mat;
  mesh.isPickable = false;
  return mesh;
}

export function merge(meshes: Mesh[], name: string): Mesh | null {
  if (!meshes.length) return null;
  const mesh = Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
  if (mesh) { mesh.name = name; mesh.isPickable = false; mesh.freezeWorldMatrix(); }
  return mesh;
}

export function seeded(seed: number): () => number {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function groundHeight(x: number, z: number): number {
  return 0.15 + Math.sin(x * 0.26) * Math.cos(z * 0.23) * 0.25 + Math.sin(z * 0.53 + x * 0.1) * 0.09;
}
