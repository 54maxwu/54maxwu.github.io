// 樹義國小校園對戰：畫面輸出
//
// 對外介面
//   new Renderer(canvas, quality)
//   .renderer  THREE.WebGLRenderer
//   .scene / .camera        世界場景與相機
//   .vmScene / .vmCamera    第一人稱手與槍（另外畫在最上層，不會插進牆裡）
//   .fx.uniforms            畫面特效參數（game.js 每幀設定）
//   .render()  .resize()
//
// 流程（每幀兩步）
//   1. 世界、手槍依序畫進一張 HDR 多重取樣畫布（線性色彩）
//   2. 一個全螢幕 shader 讀那張畫布，套用受傷／震盪／低血量等效果，
//      再做色調映射與 sRGB 轉換，直接輸出到螢幕
import * as THREE from 'three';

const QUALITY = {
  low: { dpr: 1.0, msaa: 0 },
  medium: { dpr: 1.15, msaa: 2 },
  high: { dpr: 1.5, msaa: 4 },
};

const SCREEN_VS = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const SCREEN_FS = /* glsl */`
uniform sampler2D tScene;
uniform vec2 uTexel;
uniform float uTime, uDamage, uLowHP, uFlash, uVignette, uDeath, uScope, uProtect, uUnderRoof, uConc;
varying vec2 vUv;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// 心跳：一長一短兩下，比單純正弦更像真的心跳
float heartbeat(float t) {
  float p = fract(t * 1.25);
  return exp(-pow((p - 0.08) * 22.0, 2.0)) + 0.6 * exp(-pow((p - 0.26) * 22.0, 2.0));
}

void main() {
  vec2 uv = vUv;
  vec2 fromC = uv - 0.5;
  float aspect = uTexel.y / uTexel.x;
  float rad = length(fromC * vec2(aspect, 1.0)) / length(vec2(aspect * 0.5, 0.5));   // 中心 0、角落 1

  // 爆炸震盪：畫面緩慢漂移、放射狀模糊、錯位重影
  float k = clamp(uConc, 0.0, 1.0);
  vec2 drift = vec2(sin(uTime * 2.7) , sin(uTime * 1.9 + 1.3)) * 0.005 * k;
  uv += drift;

  vec3 col;
  float split = (uDamage * 0.003 + uDeath * 0.005 + k * 0.004) * rad;
  if (split > 0.00005) {
    vec2 dir = normalize(fromC + 1e-5) * split;
    col = vec3(texture2D(tScene, uv + dir).r, texture2D(tScene, uv).g, texture2D(tScene, uv - dir).b);
  } else {
    col = texture2D(tScene, uv).rgb;
  }

  if (k > 0.002) {
    vec3 blur = col;
    for (int i = 1; i <= 6; i++) {
      float s = float(i) / 6.0;
      blur += texture2D(tScene, mix(uv, vec2(0.5), s * 0.035 * k)).rgb;
    }
    blur /= 7.0;
    vec3 ghost = texture2D(tScene, uv + vec2(0.014, -0.004) * k).rgb;
    col = mix(col, blur * 0.75 + ghost * 0.25, k);
    col = mix(col, vec3(luma(col)), k * 0.4);
  }

  // 低血量：顏色流失，邊緣隨心跳泛紅
  float edge = smoothstep(0.45, 1.05, rad);
  float L = luma(col);
  col = mix(col, vec3(L) * vec3(1.06, 0.95, 0.93), uLowHP * 0.5);
  col = mix(col, vec3(0.45, 0.02, 0.02) * (0.4 + L), uLowHP * edge * (0.2 + 0.35 * heartbeat(uTime)));

  // 剛受到傷害：外圈紅色
  col = mix(col, vec3(0.6, 0.03, 0.0), edge * clamp(uDamage, 0.0, 1.0) * 0.7);

  // 出生保護：淡藍外框
  col = mix(col, vec3(0.3, 0.58, 1.0), uProtect * edge * 0.2);

  // 陣亡：褪成暗灰
  col = mix(col, vec3(L * 0.55), uDeath * 0.8);

  // 暗角（開鏡時加重）
  col *= 1.0 - smoothstep(0.55, 1.2, rad) * clamp(uVignette + uScope * 0.5 + k * 0.4, 0.0, 1.0);

  // 閃光彈／爆炸閃白
  col += vec3(uFlash);

  gl_FragColor = vec4(max(col, 0.0), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class Renderer {
  constructor(canvas, quality = 'high') {
    this.quality = quality;
    this.cfg = QUALITY[quality] || QUALITY.high;

    // 多重取樣在離屏畫布上做，螢幕畫布本身不需要反鋸齒
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.cfg.dpr));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.75;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(78, 16 / 9, 0.05, 60000);
    this.vmScene = new THREE.Scene();
    this.vmCamera = new THREE.PerspectiveCamera(58, 16 / 9, 0.01, 50);

    this.target = new THREE.WebGLRenderTarget(4, 4, {
      type: THREE.HalfFloatType,
      samples: this.cfg.msaa,
      depthBuffer: true,
    });

    // 全螢幕三角形（比兩個三角形組成的四邊形少一條對角接縫）
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    const u = (v) => ({ value: v });
    this.screenMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene: u(this.target.texture), uTexel: u(new THREE.Vector2(1, 1)),
        uTime: u(0), uDamage: u(0), uLowHP: u(0), uFlash: u(0), uVignette: u(0.28), uDeath: u(0),
        uScope: u(0), uProtect: u(0), uUnderRoof: u(0), uConc: u(0),
      },
      vertexShader: SCREEN_VS,
      fragmentShader: SCREEN_FS,
      depthTest: false,
      depthWrite: false,
      toneMapped: true,
    });
    this.screenQuad = new THREE.Mesh(tri, this.screenMat);
    this.screenQuad.frustumCulled = false;
    this.screenScene = new THREE.Scene();
    this.screenScene.add(this.screenQuad);
    this.screenCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // game.js 透過 fx.uniforms 控制特效
    this.fx = { uniforms: this.screenMat.uniforms };

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    const px = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.target.setSize(px.x, px.y);
    this.screenMat.uniforms.uTexel.value.set(1 / px.x, 1 / px.y);
    for (const cam of [this.camera, this.vmCamera]) { cam.aspect = w / h; cam.updateProjectionMatrix(); }
  }

  render() {
    const r = this.renderer;
    const autoClear = r.autoClear;

    // 1. 世界
    r.setRenderTarget(this.target);
    r.autoClear = true;
    r.render(this.scene, this.camera);

    // 2. 手與槍：保留世界的顏色，只清深度，所以永遠畫在最前面
    r.autoClear = false;
    r.clearDepth();
    r.render(this.vmScene, this.vmCamera);

    // 3. 畫面特效 + 色調映射，輸出到螢幕
    r.setRenderTarget(null);
    r.render(this.screenScene, this.screenCam);

    r.autoClear = autoClear;
  }
}
