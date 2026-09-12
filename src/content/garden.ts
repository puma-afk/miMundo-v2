export const plots = [
  { id: 'luna-01', x: -3.5, z: 5.2 },
  { id: 'luna-02', x: -5.5, z: 3.5 },
  { id: 'luna-03', x: -6.3, z: 1.0 },
  { id: 'luna-04', x: 4.0, z: 5.5 },
  { id: 'luna-05', x: 6.1, z: 3.7 },
  { id: 'luna-06', x: 7.2, z: 1.0 },
] as const;

export const assetCatalog = {
  moonTree: { url: 'assets/models/arbol-mobile.glb', scale: 1 },
  pottedFlower: { url: 'assets/models/flor-mobile.glb', scale: 1 },
} satisfies Record<string, { url: string; scale: number }>;
