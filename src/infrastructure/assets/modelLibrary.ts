import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import type { AssetContainer } from '@babylonjs/core/assetContainer';
import type { Scene } from '@babylonjs/core/scene';
import { DracoDecoder } from '@babylonjs/core/Meshes/Compression/dracoDecoder';

DracoDecoder.DefaultConfiguration = {
  wasmUrl: new URL(`${import.meta.env.BASE_URL}assets/decoders/draco_wasm_wrapper_gltf.js`, location.href).href,
  wasmBinaryUrl: new URL(`${import.meta.env.BASE_URL}assets/decoders/draco_decoder_gltf.wasm`, location.href).href,
  numWorkers: 1,
};

/** Per-zone ownership. Dispose instances before disposing this library. */
export class ModelLibrary {
  private cache = new Map<string, Promise<AssetContainer>>();
  private disposed = false;
  constructor(private scene: Scene) {}
  async load(url: string): Promise<AssetContainer> {
    if (this.disposed) throw new Error('La zona ya está cerrada.');
    let promise = this.cache.get(url);
    if (!promise) {
      promise = (async () => {
        await import('@babylonjs/loaders/glTF');
        const container = await LoadAssetContainerAsync(url, this.scene);
        if (this.disposed) { container.dispose(); throw new Error('La zona se cerró durante la carga.'); }
        return container;
      })();
      this.cache.set(url, promise);
      promise.catch(() => this.cache.delete(url));
    }
    return promise;
  }
  dispose(): void {
    this.disposed = true;
    for (const promise of this.cache.values()) void promise.then(c => c.dispose()).catch(() => {});
    this.cache.clear();
  }
}
