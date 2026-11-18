import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Cinematic post stack: GTAO ambient occlusion -> bloom (fluorescents, emergency lights) -> tone map -> lens grade.
// Quality tiers: 'high' (AO + bloom + grade), 'medium' (bloom + grade), 'low' (grade only).
const LensShader = {
  uniforms: {
    tDiffuse: { value: null }, time: { value: 0 }, aberration: { value: 0.0016 },
    vignette: { value: 0.95 }, tint: { value: new THREE.Color('#d4ece2') }, red: { value: 0 }, damage: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, aberration, vignette, red, damage; uniform vec3 tint; varying vec2 vUv;
    float rnd(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233)) + time*7.0) * 43758.5453); }
    void main(){
      vec2 uv = vUv; vec2 d = uv - 0.5; float r2 = dot(d,d);
      float jit = damage * (rnd(vec2(floor(uv.y*90.0), time)) - 0.5) * 0.02;
      uv.x += jit;
      float ab = aberration * (1.0 + r2 * 6.0) + damage * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + d*ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - d*ab).b;
      // cold horror grade: crush blacks slightly, push mids to blue-green
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(vec3(l), col, 0.82) * tint;
      col = pow(col, vec3(1.06));
      col = mix(col, col * vec3(1.6,0.45,0.4), red);
      col *= 1.0 - smoothstep(0.18, 0.75, r2 * vignette * 1.6);
      col += (rnd(uv*vec2(1920.0,1080.0)) - 0.5) * 0.035;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer; this.scene = scene; this.camera = camera;
    const size = renderer.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));
    this.ao = new GTAOPass(scene, camera, size.x, size.y);
    this.ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.0, scale: 1.2, samples: 12 });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    this.ao.blendIntensity = 0.9;
    this.composer.addPass(this.ao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.55, 0.6, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.lens = new ShaderPass(LensShader);
    this.composer.addPass(this.lens);
    this.setQuality('high');
    window.addEventListener('resize', () => this.resize());
  }
  setQuality(q) {
    this.quality = q;
    this.ao.enabled = q === 'high';
    this.bloom.enabled = q !== 'low';
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.composer.setSize(w, h);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
  }
  render(time, { red = 0, damage = 0 } = {}) {
    this.lens.uniforms.time.value = time;
    this.lens.uniforms.red.value += (red - this.lens.uniforms.red.value) * 0.08;
    this.lens.uniforms.damage.value = damage;
    this.composer.render();
  }
}
