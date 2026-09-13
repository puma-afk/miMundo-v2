import { Color3, Effect, Mesh, MeshBuilder, Scene, ShaderMaterial, Vector3, DirectionalLight, HemisphericLight } from '../engine';
import { worldTime, DAY_MS } from '../../domain/worldTime';
export type SkyTheme = 'garden' | 'forest' | 'celestial';

Effect.ShadersStore.fantasySkyVertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 direction;
void main() { direction = position; gl_Position = worldViewProjection * vec4(position, 1.0); }
`;
Effect.ShadersStore.fantasySkyFragmentShader = `
precision highp float;
varying vec3 direction;
uniform vec3 topColor;
uniform vec3 horizonColor;
uniform vec3 sunDirection;
uniform float time;
uniform float night;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main() {
  vec3 d=normalize(direction);
  vec3 color=mix(horizonColor,topColor,pow(max(d.y,0.0),0.6));
  float sun=max(dot(d,sunDirection),0.0);
  color += vec3(1.0,0.71,0.38) * pow(sun,18.0)*0.28*(1.0-night);
  color = mix(color,vec3(1.0,0.91,0.65),smoothstep(0.9990,0.9995,sun)*(1.0-night));
  vec2 uv=d.xz/max(d.y+0.25,0.12)*1.8+vec2(time*0.004,0.0);
  float n=noise(uv)*0.57+noise(uv*2.07)*0.28+noise(uv*4.01)*0.15;
  float cloud=smoothstep(0.53,0.77,n)*smoothstep(-0.02,0.18,d.y)*(1.0-smoothstep(0.6,0.95,d.y));
  color=mix(color,mix(vec3(1.0,0.88,0.80),vec3(0.045,0.065,0.11),night),cloud*0.78);
  vec2 starUV=vec2(atan(d.z,d.x),asin(d.y))*220.0;
  float stars=step(0.997,hash(floor(starUV)))*pow(max(0.0,1.0-length(fract(starUV)-0.5)*2.0),4.0);
  color+=stars*night*smoothstep(0.0,0.25,d.y)*1.8;
  float moon=max(dot(d,normalize(vec3(-0.45,0.48,-0.7))),0.0);
  color+=vec3(0.68,0.8,1.0)*(smoothstep(0.9992,0.9996,moon)+pow(moon,80.0)*0.10)*night;
  gl_FragColor=vec4(color,1.0);
}
`;

export class FantasySky {
  hour = 17;
  auto = true;
  readonly secondsPerHour = DAY_MS / 24000;
  theme: SkyTheme = 'garden';
  private clock = 0;
  private mat: ShaderMaterial;
  readonly sun: DirectionalLight;
  readonly ambient: HemisphericLight;
  constructor(private scene: Scene, private createdAt: () => number | undefined = () => undefined) {
    try { const saved = localStorage.getItem('mi-mundo-sky-theme'); if (saved === 'garden' || saved === 'forest' || saved === 'celestial') this.theme = saved; } catch { /* Storage may be unavailable. */ }
    const dome = MeshBuilder.CreateSphere('atmosphere', { diameter: 450, segments: 24, sideOrientation: Mesh.BACKSIDE }, scene);
    dome.infiniteDistance = true;
    dome.isPickable = false;
    this.mat = new ShaderMaterial('sky', scene, { vertex: 'fantasySky', fragment: 'fantasySky' }, {
      attributes: ['position'], uniforms: ['worldViewProjection', 'topColor', 'horizonColor', 'sunDirection', 'time', 'night'],
    });
    this.mat.disableDepthWrite = true;
    this.mat.backFaceCulling = false;
    dome.material = this.mat;
    this.sun = new DirectionalLight('sun', new Vector3(-0.6, -0.8, 0.4), scene);
    this.sun.position.set(15, 23, -12);
    this.ambient = new HemisphericLight('sky-light', Vector3.Up(), scene);
    this.ambient.groundColor = Color3.FromHexString('#5a6b6a');
    this.update(0, false);
  }
  update(dt: number, reducedMotion: boolean): void {
    if (!reducedMotion) this.clock += dt;
    if (this.auto) this.hour = worldTime(Date.now(), this.createdAt()).hour;
    const night = Math.min(1, Math.max(0, (Math.abs(this.hour - 12) - 5.8) / 2.2));
    const sunset = Math.max(0, 1 - Math.abs(this.hour - 17) / 3) * (1 - night);
    const palette = this.theme === 'forest' ? ['#78a29b','#08131d','#b8d2bb','#e0b69f','#162635'] : this.theme === 'celestial' ? ['#a3b2e0','#100d23','#e0d7f0','#f2bbcf','#282039'] : ['#75b5ce','#070e20','#c9e6df','#f6c3a0','#19263d'];
    const top = Color3.Lerp(Color3.FromHexString(palette[0]), Color3.FromHexString(palette[1]), night);
    const horizon = Color3.Lerp(Color3.Lerp(Color3.FromHexString(palette[2]), Color3.FromHexString(palette[3]), sunset), Color3.FromHexString(palette[4]), night);
    const theta = ((this.hour - 6) / 12) * Math.PI;
    const dir = new Vector3(Math.cos(theta), Math.max(0.04, Math.sin(theta) * 0.8), -0.8).normalize();
    this.mat.setColor3('topColor', top);
    this.mat.setColor3('horizonColor', horizon);
    this.mat.setVector3('sunDirection', dir);
    this.mat.setFloat('time', this.clock);
    this.mat.setFloat('night', night);
    this.sun.direction.copyFrom(dir.scale(-1));
    this.sun.intensity = 1.15 - night * 1.08;
    this.sun.diffuse = Color3.Lerp(Color3.FromHexString('#ffe1b4'), Color3.FromHexString('#8ca6ed'), night);
    this.ambient.intensity = 0.84 - night * 0.65;
    this.scene.fogColor = horizon;
    this.scene.clearColor.set(horizon.r, horizon.g, horizon.b, 1);
  }
  setTheme(theme: SkyTheme): void {
    this.theme = theme;
    try { localStorage.setItem('mi-mundo-sky-theme', theme); } catch { /* Keep the session preference. */ }
    this.update(0, true);
  }
}
