import { 추가효과조각, 커피김조각, 소품이미지조각, 촛불꽃조각,
  type 움직이는테마 } from './animated-shaders';
import galaxyUrl from './assets/milky-way.webp';
import barleyUrl from './assets/barley-field.webp';
import waterfallUrl from './assets/distant-waterfall.webp';
import skyCloudUrl from './assets/cumulus-cloud.webp';
import coffeeCupUrl from './assets/coffee-tumbler.webp';
import candleUrl from './assets/ivory-candle.webp';

const 풍경이미지: Partial<Record<움직이는테마, string>> = {
  청보리: barleyUrl,
  폭포: waterfallUrl,
  구름: skyCloudUrl,
};
const 소품이미지: Partial<Record<움직이는테마, string>> = {
  커피: coffeeCupUrl,
  촛불: candleUrl,
};

/** 종이 전체 뒤에서 동작하는 WebGL 효과. 테마별 강도는 여기에서 조절한다. */
export const 동적효과조절: Record<움직이는테마,
  { 기본세기: number; 타건세기: number; 감쇠속도: number; 빛강도: number; 글뒤세기: number }> = {
  청보리: { 기본세기: 0.90, 타건세기: 0, 감쇠속도: 1.5, 빛강도: 0.90, 글뒤세기: 1.0 },
  폭포: { 기본세기: 1.0, 타건세기: 0, 감쇠속도: 1.5, 빛강도: 0.85, 글뒤세기: 1.0 },
  커피: { 기본세기: 0.90, 타건세기: 0, 감쇠속도: 1.5, 빛강도: 0.90, 글뒤세기: 1.0 },
  촛불: { 기본세기: 0.98, 타건세기: 0, 감쇠속도: 1.5, 빛강도: 0.85, 글뒤세기: 1.0 },
  '수면과 파문': { 기본세기: 0.58, 타건세기: 0.72, 감쇠속도: 1.55, 빛강도: 0.37, 글뒤세기: 0.85 },
  매트릭스: { 기본세기: 0.90, 타건세기: 0.55, 감쇠속도: 1.5, 빛강도: 0.74, 글뒤세기: 0.28 },
  빗방울: { 기본세기: 0.94, 타건세기: 0.76, 감쇠속도: 1.7, 빛강도: 0.74, 글뒤세기: 0.65 },
  구름: { 기본세기: 1.0, 타건세기: 0, 감쇠속도: 1.25, 빛강도: 0, 글뒤세기: 0.53 },
  불멍: { 기본세기: 0.95, 타건세기: 0.86, 감쇠속도: 1.65, 빛강도: 0.82, 글뒤세기: 0.72 },
  인센스: { 기본세기: 0.90, 타건세기: 0.55, 감쇠속도: 1.5, 빛강도: 0.72, 글뒤세기: 0.67 },
  오로라: { 기본세기: 1.34, 타건세기: 0.86, 감쇠속도: 1.0, 빛강도: 1.05, 글뒤세기: 0.80 },
  별똥별: { 기본세기: 0.55, 타건세기: 0.92, 감쇠속도: 1.4, 빛강도: 0.90, 글뒤세기: 0.70 },
};
const 공통조절 = {
  최대파문: 12,
  최대유성: 5,
  유성발생확률: 1 / 7,
  흐름주입: 0.42,
  흐름감쇠: 1.8,
  흐름추종: 15,
  흐름완충: 18,
  인센스바람추종: 2.4,
  인센스바람완충: 3.4,
  인센스오타주입: 0.8,
  인센스오타감쇠: 3.5,
  인센스오타완충: 12,
  최대DPR: 1.5,
} as const;

type 파문 = { x: number; y: number; 시작: number; 세기: number };

const 꼭짓점 = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const 수면조각 = `
precision mediump float;
varying vec2 v_uv;
uniform vec2 u_size;
uniform float u_time;
uniform float u_horizon;
uniform float u_textBottom;
uniform float u_motion;
uniform vec4 u_ripples[12];
uniform vec4 u_tuning; // 기본 물결, 감쇠, 금빛, 지문 뒤 물결
uniform vec4 u_flow; // 입력 위치, 이어지는 세기, 글줄 방향

void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float aspect = u_size.x / max(u_size.y, 1.0);
  vec3 color = mix(vec3(0.025, 0.085, 0.091), vec3(0.015, 0.057, 0.064), p.y);
  color += vec3(0.006, 0.019, 0.018) * (1.0 - length((p - vec2(0.5, 0.22)) * vec2(0.8, 1.4)));

  float depth = clamp((p.y - u_horizon) / max(1.0 - u_horizon, 0.01), 0.0, 1.0);
  float surface = smoothstep(0.0, 0.13, depth);
  float z = 1.0 / (depth + 0.16);
  float t = u_time * u_motion;
  float w1 = sin(z * 11.0 + p.x * 17.0 + t * 0.45);
  float w2 = sin(z * 21.0 - p.x * 31.0 - t * 0.66);
  float w3 = sin(z * 35.0 + p.x * 52.0 + t * 0.29);
  float wave = (w1 * 0.48 + w2 * 0.34 + w3 * 0.18) * u_tuning.x;

  float ripple = 0.0;
  for (int i = 0; i < 12; i++) {
    vec4 r = u_ripples[i];
    float age = r.z;
    float alive = step(0.0, age) * step(age, 3.5);
    float distance = length(vec2((p.x - r.x) * aspect, (p.y - r.y) * 2.1));
    float radius = age * (r.w > 1.0 ? 0.18 : 0.24);
    float ring = exp(-pow((distance - radius) * 31.0, 2.0)) *
      exp(-age * u_tuning.y) * r.w * alive;
    ripple += ring;
  }
  ripple = min(ripple, 1.15);
  float flow = exp(-pow((p.x - u_flow.x + u_flow.w * 0.045) * aspect * 7.0, 2.0) -
    pow((p.y - u_flow.y - 0.04) * 27.0, 2.0)) * u_flow.z;

  float quiet = smoothstep(0.04, 0.22, depth);
  float farFade = smoothstep(0.02, 0.28, depth);
  // 글자 뒤에서도 물결을 보이되, 밝은 반짝임은 글 아래로 내려갈수록 살아난다.
  float belowText = smoothstep(u_textBottom - 0.06, u_textBottom + 0.08, p.y);
  float lane = exp(-pow((p.x - 0.56 - 0.075 * sin(z * 0.7 + t * 0.08)) * 3.3, 2.0));
  float slope = cos(z * 11.0 + p.x * 17.0 + t * 0.45) * 0.50 +
    cos(z * 21.0 - p.x * 31.0 - t * 0.66) * 0.33 +
    cos(z * 35.0 + p.x * 52.0 + t * 0.29) * 0.17;
  float facing = exp(-pow((slope - 0.18) * 2.4, 2.0));
  float glint = pow(max(0.0, 0.5 + 0.5 * sin(z * 16.0 + p.x * 6.0 + wave * 1.6 + ripple * 0.9)), 11.0);
  float glint2 = pow(max(0.0, 0.5 + 0.5 * sin(z * 29.0 - p.x * 12.0 + wave + ripple * 0.5)), 15.0);
  float gold = (glint * 0.64 + glint2 * 0.26) * lane * facing * farFade * quiet;
  gold += ripple * 0.27 * smoothstep(0.0, 0.17, depth);
  color += surface * vec3(0.012, 0.055, 0.059) * depth;
  color += vec3(0.60, 0.43, 0.22) * (gold + flow * 0.22) * u_tuning.z * mix(0.12, 1.0, belowText);
  color += vec3(0.030, 0.090, 0.086) * (wave + ripple * 0.24 + flow * 0.45) * surface * quiet *
    mix(u_tuning.w, 1.0, belowText);
  float broadWave = 0.5 + 0.5 * sin(z * 10.0 + p.x * 13.0 + t * 0.38);
  color += vec3(0.014, 0.058, 0.060) * broadWave * u_tuning.x * quiet *
    (1.0 - belowText);
  gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
}`;

function 셰이더(gl: WebGLRenderingContext, 종류: number, 코드: string): WebGLShader {
  const shader = gl.createShader(종류);
  if (!shader) { throw new Error('WebGL 셰이더를 만들 수 없습니다.'); }
  gl.shaderSource(shader, 코드);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const 오류 = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(오류 ?? 'WebGL 셰이더 컴파일 실패');
  }
  return shader;
}

export class 동적종이효과 {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private galaxyTexture: WebGLTexture | null = null;
  private landscapeTexture: WebGLTexture | null = null;
  private glyphTexture: WebGLTexture | null = null;
  private propTexture: WebGLTexture | null = null;
  private propImage: HTMLImageElement | null = null;
  private propProgram: WebGLProgram | null = null;
  private overlayProgram: WebGLProgram | null = null;
  private propUniforms: Record<string, WebGLUniformLocation | null> = {};
  private overlayUniforms: Record<string, WebGLUniformLocation | null> = {};
  private galaxyImage: HTMLImageElement | null = null;
  private landscapeImage: HTMLImageElement | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private observer: ResizeObserver | null = null;
  private media = window.matchMedia('(prefers-reduced-motion: reduce)');
  private frame = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private cloudVariation: [number, number, number, number] = [0, 0, 1, 0];
  private sourceBottom = 0.5;
  private focusText: { x: number; y: number } | null = null;
  private flameFocus: { x: number; y: number } | null = null;
  private mistakeAt: number | null = null;
  private mistakeDirection = 1;
  private incenseDentEnergy = 0;
  private incenseDentVisible = 0;
  private ripples: 파문[] = [];
  private flowTarget: { x: number; y: number } | null = null;
  private flowPosition: { x: number; y: number } | null = null;
  private flowEnergy = 0;
  private flowVisible = 0;
  private flowDirection = 1;
  private disposed = false;
  private valid = false;

  constructor(private canvas: HTMLCanvasElement, private text: HTMLCanvasElement,
    readonly theme: 움직이는테마,
    private available: (value: boolean) => void) {}

  start(): boolean {
    this.shuffleCloud();
    this.canvas.addEventListener('webglcontextlost', this.contextLost);
    this.canvas.addEventListener('webglcontextrestored', this.contextRestored);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    this.media.addEventListener('change', this.motionChanged);
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(this.canvas.parentElement!);
    }
    window.addEventListener('resize', this.resize);
    try { this.initialize(); }
    catch (error) { console.warn(`${this.theme} 테마를 시작할 수 없습니다.`, error); this.destroy(); return false; }
    this.valid = true;
    if (this.theme === '별똥별') { this.loadGalaxy(); }
    const propUrl = 소품이미지[this.theme];
    if (propUrl) { this.loadProp(propUrl); }
    const landscapeUrl = 풍경이미지[this.theme];
    if (landscapeUrl) { this.loadLandscape(landscapeUrl); }
    this.resize();
    this.schedule();
    return true;
  }

  private initialize() {
    const gl = this.canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) { throw new Error('WebGL을 사용할 수 없습니다.'); }
    const vertex = 셰이더(gl, gl.VERTEX_SHADER, 꼭짓점);
    const fragment = 셰이더(gl, gl.FRAGMENT_SHADER,
      this.theme === '수면과 파문' ? 수면조각 : 추가효과조각[this.theme]);
    const program = gl.createProgram();
    if (!program) { throw new Error('WebGL 프로그램을 만들 수 없습니다.'); }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const 오류 = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(오류 ?? 'WebGL 프로그램 연결 실패');
    }
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      throw new Error('WebGL 자원을 만들 수 없습니다.');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    this.gl = gl;
    this.program = program;
    this.buffer = buffer;
    this.galaxyTexture = null;
    this.landscapeTexture = null;
    this.glyphTexture = null;
    this.propTexture = null;
    this.propProgram = null;
    this.overlayProgram = null;
    for (const name of ['u_size', 'u_time', 'u_horizon', 'u_textBottom',
      'u_motion', 'u_tuning', 'u_ripples[0]', 'u_focus', 'u_mistake',
      'u_galaxy', 'u_hasGalaxy', 'u_landscape', 'u_hasLandscape',
      'u_landscapeSize', 'u_cloudVariation', 'u_glyphs', 'u_flow', 'u_candle']) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    if (this.theme === '매트릭스') { this.uploadGlyphs(); }
    if (소품이미지[this.theme]) {
      try { this.initializeProp(); }
      catch (error) { console.warn(`${this.theme} 소품 효과를 시작할 수 없습니다.`, error); }
    }
    if (this.galaxyImage?.complete && this.galaxyImage.naturalWidth) { this.uploadGalaxy(); }
    if (this.landscapeImage?.complete && this.landscapeImage.naturalWidth) {
      this.uploadLandscape();
    }
    if (this.propImage?.complete && this.propImage.naturalWidth) { this.uploadProp(); }
  }

  private initializeProp() {
    const gl = this.gl;
    if (!gl) { return; }
    const makeProgram = (fragmentCode: string) => {
      const vertex = 셰이더(gl, gl.VERTEX_SHADER, 꼭짓점);
      const fragment = 셰이더(gl, gl.FRAGMENT_SHADER, fragmentCode);
      const program = gl.createProgram();
      if (!program) { throw new Error('소품 WebGL 프로그램을 만들 수 없습니다.'); }
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const 오류 = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(오류 ?? '소품 WebGL 프로그램 연결 실패');
      }
      return program;
    };
    this.propProgram = makeProgram(소품이미지조각);
    this.overlayProgram = makeProgram(this.theme === '커피' ? 커피김조각 : 촛불꽃조각);
    for (const name of ['u_propImage', 'u_propRect', 'u_textBottom', 'u_dimBehindText']) {
      this.propUniforms[name] = gl.getUniformLocation(this.propProgram, name);
    }
    for (const name of ['u_size', 'u_time', 'u_motion', 'u_tuning', 'u_textBottom',
      'u_cup', 'u_candle']) {
      this.overlayUniforms[name] = gl.getUniformLocation(this.overlayProgram, name);
    }
  }

  private uploadGlyphs() {
    const gl = this.gl;
    if (!gl) { return; }
    const atlas = document.createElement('canvas');
    atlas.width = atlas.height = 256;
    const ctx = atlas.getContext('2d');
    const texture = gl.createTexture();
    if (!ctx || !texture) { throw new Error('매트릭스 글자 텍스처를 만들 수 없습니다.'); }
    const glyphs = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    ctx.font = 'bold 25px "Hiragino Kaku Gothic ProN", "Yu Gothic", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 64; i++) {
      ctx.fillText(glyphs[i % glyphs.length], (i % 8) * 32 + 16,
        Math.floor(i / 8) * 32 + 17);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    this.glyphTexture = texture;
  }

  private loadGalaxy() {
    const image = new Image();
    this.galaxyImage = image;
    image.onload = () => { if (!this.disposed && this.valid) { this.uploadGalaxy(); } };
    image.onerror = () => { console.warn('별똥별 은하 이미지를 불러올 수 없습니다.'); };
    image.src = galaxyUrl;
  }

  private uploadGalaxy() {
    const gl = this.gl;
    const image = this.galaxyImage;
    if (!gl || !image || !image.naturalWidth || gl.isContextLost()) { return; }
    const texture = gl.createTexture();
    if (!texture) { return; }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    if (this.galaxyTexture) { gl.deleteTexture(this.galaxyTexture); }
    this.galaxyTexture = texture;
  }

  private loadLandscape(url: string) {
    const image = new Image();
    this.landscapeImage = image;
    image.onload = () => { if (!this.disposed && this.valid) { this.uploadLandscape(); } };
    image.onerror = () => { console.warn(`${this.theme} 풍경 이미지를 불러올 수 없습니다.`); };
    image.src = url;
  }

  private uploadLandscape() {
    const gl = this.gl;
    const image = this.landscapeImage;
    if (!gl || !image || !image.naturalWidth || gl.isContextLost()) { return; }
    const texture = gl.createTexture();
    if (!texture) { return; }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.theme === '구름' ? gl.RGBA : gl.RGB,
      this.theme === '구름' ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, image);
    if (this.landscapeTexture) { gl.deleteTexture(this.landscapeTexture); }
    this.landscapeTexture = texture;
  }

  private loadProp(url: string) {
    const image = new Image();
    this.propImage = image;
    image.onload = () => { if (!this.disposed && this.valid) { this.uploadProp(); } };
    image.onerror = () => { console.warn(`${this.theme} 소품 이미지를 불러올 수 없습니다.`); };
    image.src = url;
  }

  private uploadProp() {
    const gl = this.gl;
    const image = this.propImage;
    if (!gl || !image || !image.naturalWidth || gl.isContextLost()) { return; }
    const texture = gl.createTexture();
    if (!texture) { return; }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 이미지의 위쪽이 화면 위쪽에 오도록 일반 WebGL UV 방향에 맞춘다.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (this.propTexture) { gl.deleteTexture(this.propTexture); }
    this.propTexture = texture;
  }

  setContentBottom(fraction: number) {
    this.sourceBottom = Math.max(0, Math.min(1, fraction));
  }

  shuffleCloud() {
    if (this.theme !== '구름') { return; }
    this.cloudVariation = [
      (Math.random() - 0.5) * 0.24,
      (Math.random() - 0.5) * 0.14,
      (Math.random() < 0.5 ? -1 : 1) * (0.60 + Math.random() * 0.22),
      Math.random() * 20,
    ];
  }

  setFocus(x: number, y: number) {
    if (this.theme === '불멍') {
      this.focusText = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    }
  }

  typing(x: number, textY: number, wide = false) {
    if (!this.valid || document.hidden) { return; }
    if (this.theme === '불멍' || 소품이미지[this.theme] || 풍경이미지[this.theme]) { return; }
    const meteor = this.theme === '별똥별';
    if (meteor && Math.random() >= 공통조절.유성발생확률) { return; }
    let position: { x: number; y: number };
    if (meteor) {
      // 타건 위치와 무관하게 종이 전체에서 고르게 나타난다.
      position = { x: 0.08 + Math.random() * 0.84, y: 0.08 + Math.random() * 0.80 };
    } else {
      const paper = this.canvas.getBoundingClientRect();
      const text = this.text.getBoundingClientRect();
      const px = (text.left + x * text.width - paper.left) / Math.max(paper.width, 1);
      const py = (text.top + textY * text.height - paper.top) / Math.max(paper.height, 1);
      position = { x: Math.max(0.08, Math.min(0.92, px)),
        y: Math.max(0.07, Math.min(0.91, py)) };
    }
    if (!meteor) {
      if (this.flowTarget) {
        const dx = position.x - this.flowTarget.x;
        if (dx > 0.005 && dx < 0.22) { this.flowDirection = 1; }
        else if (dx < -0.005 && dx > -0.22) { this.flowDirection = -1; }
      }
      if (!this.flowPosition || Math.hypot(position.x - this.flowPosition.x,
        position.y - this.flowPosition.y) > 0.25) { this.flowPosition = { ...position }; }
      this.flowTarget = position;
      this.flowEnergy = Math.min(1, this.flowEnergy + (wide ? 1.2 : 1) * 공통조절.흐름주입 *
        동적효과조절[this.theme].타건세기);
    }
    if (meteor || (wide && this.theme === '수면과 파문')) {
      const strength = 동적효과조절[this.theme].타건세기;
      this.ripples.push({ ...position, 시작: this.elapsed,
        세기: wide ? strength * (meteor ? 1.2 : 2) : strength });
      const limit = meteor ? 공통조절.최대유성 : 공통조절.최대파문;
      if (this.ripples.length > limit) { this.ripples.shift(); }
    }
  }

  mistake() {
    if ((this.theme !== '불멍' && this.theme !== '매트릭스' && this.theme !== '인센스') ||
      !this.valid || document.hidden) { return; }
    if (this.theme === '인센스') {
      this.incenseDentEnergy = Math.min(1,
        this.incenseDentEnergy + 공통조절.인센스오타주입);
      return;
    }
    this.mistakeAt = this.elapsed;
    this.mistakeDirection *= -1;
  }

  private resize = () => {
    if (!this.gl || !this.canvas.parentElement) { return; }
    const bounds = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 공통조절.최대DPR);
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  };

  private propGeometry(paper: DOMRect) {
    const image = this.propImage;
    if (!image?.naturalWidth) { return null; }
    const width = this.theme === '커피'
      ? Math.max(88, Math.min(paper.width * 0.12, 112))
      : paper.width < 500 ? 72 : Math.max(112, Math.min(paper.width * 0.15, 146));
    const height = width * image.naturalHeight / image.naturalWidth;
    const x = (paper.width * 0.98 - width) / Math.max(paper.width, 1);
    const w = width / Math.max(paper.width, 1);
    const h = height / Math.max(paper.height, 1);
    return { x, w, h, center: x + w / 2,
      originY: this.theme === '커피' ? 1 - h * 0.84 : 1 - h * 0.90,
      scale: this.theme === '커피' ? h / 0.31 : h };
  }

  private drawProp(paper: DOMRect, textBottom: number) {
    const gl = this.gl;
    const propProgram = this.propProgram;
    const overlayProgram = this.overlayProgram;
    const rect = this.propGeometry(paper);
    if (!gl || !this.buffer || !rect || !this.propTexture || !propProgram || !overlayProgram) { return; }
    const { x, w, h } = rect;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.propTexture);
    gl.useProgram(propProgram);
    const propAttribute = gl.getAttribLocation(propProgram, 'a_position');
    gl.enableVertexAttribArray(propAttribute);
    gl.vertexAttribPointer(propAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(this.propUniforms.u_propImage, 0);
    gl.uniform4f(this.propUniforms.u_propRect, x, 0, w, h);
    gl.uniform1f(this.propUniforms.u_textBottom, textBottom);
    gl.uniform1f(this.propUniforms.u_dimBehindText, this.theme === '촛불' ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(overlayProgram);
    const overlayAttribute = gl.getAttribLocation(overlayProgram, 'a_position');
    gl.enableVertexAttribArray(overlayAttribute);
    gl.vertexAttribPointer(overlayAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.overlayUniforms.u_size, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.overlayUniforms.u_time, this.elapsed);
    gl.uniform1f(this.overlayUniforms.u_motion, this.media.matches ? 0.08 : 1);
    gl.uniform1f(this.overlayUniforms.u_textBottom, textBottom);
    const tuning = 동적효과조절[this.theme];
    gl.uniform4f(this.overlayUniforms.u_tuning, tuning.기본세기, 0, tuning.빛강도, 0);
    gl.uniform3f(this.overlayUniforms[this.theme === '커피' ? 'u_cup' : 'u_candle'],
      rect.center, rect.originY, rect.scale);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }

  private draw = (now: number) => {
    this.frame = 0;
    if (!this.valid || document.hidden || !this.gl || !this.program || !this.buffer) { return; }
    if (this.lastFrame && now - this.lastFrame < (this.media.matches ? 80 : 33)) {
      this.schedule();
      return;
    }
    const gl = this.gl;
    const dt = Math.min(0.05, this.lastFrame ? (now - this.lastFrame) / 1000 : 0);
    this.elapsed += dt;
    this.lastFrame = now;
    this.flowEnergy *= Math.exp(-dt * 공통조절.흐름감쇠);
    const flowSmoothing = this.theme === '인센스'
      ? 공통조절.인센스바람완충 : 공통조절.흐름완충;
    this.flowVisible += (this.flowEnergy - this.flowVisible) *
      (1 - Math.exp(-dt * flowSmoothing));
    if (this.theme === '인센스') {
      this.incenseDentEnergy *= Math.exp(-dt * 공통조절.인센스오타감쇠);
      this.incenseDentVisible += (this.incenseDentEnergy - this.incenseDentVisible) *
        (1 - Math.exp(-dt * 공통조절.인센스오타완충));
    }
    if (this.flowTarget && this.flowPosition) {
      const followRate = this.theme === '인센스'
        ? 공통조절.인센스바람추종 : 공통조절.흐름추종;
      const follow = 1 - Math.exp(-dt * followRate);
      this.flowPosition.x += (this.flowTarget.x - this.flowPosition.x) * follow;
      this.flowPosition.y += (this.flowTarget.y - this.flowPosition.y) * follow;
    }
    this.resize();
    gl.disable(gl.BLEND);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const attribute = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name: string) => this.uniforms[name];
    const paper = this.canvas.getBoundingClientRect();
    const text = this.text.getBoundingClientRect();
    const bottom = (text.top + this.sourceBottom * text.height - paper.top) /
      Math.max(paper.height, 1);
    gl.uniform2f(uniform('u_size'), this.canvas.width, this.canvas.height);
    gl.uniform1f(uniform('u_time'), this.elapsed);
    gl.uniform1f(uniform('u_horizon'), 0);
    gl.uniform1f(uniform('u_textBottom'), bottom);
    gl.uniform1f(uniform('u_motion'), this.media.matches ? 0.08 : 1);
    gl.uniform4f(uniform('u_flow'), this.flowPosition?.x ?? 0.5,
      this.flowPosition?.y ?? 0.5, this.flowVisible * (this.media.matches ? 0.18 : 1),
      this.flowDirection);
    const tuning = 동적효과조절[this.theme];
    gl.uniform4f(uniform('u_tuning'), tuning.기본세기,
      tuning.감쇠속도, tuning.빛강도, tuning.글뒤세기);
    if (this.theme === '촛불') {
      const rect = this.propGeometry(paper);
      gl.uniform3f(uniform('u_candle'), rect?.center ?? 0.84,
        rect?.originY ?? 0.65, rect?.scale ?? 0.3);
    }
    if (this.theme === '불멍') {
      const target = this.focusText
        ? { x: (text.left + this.focusText.x * text.width - paper.left) / Math.max(paper.width, 1),
          y: (text.top + this.focusText.y * text.height - paper.top) / Math.max(paper.height, 1) }
        : { x: 0.5, y: 0.6 };
      if (!this.flameFocus) { this.flameFocus = target; }
      const follow = this.media.matches ? 1 : 1 - Math.exp(-dt * 2.7);
      this.flameFocus.x += (target.x - this.flameFocus.x) * follow;
      this.flameFocus.y += (target.y - this.flameFocus.y) * follow;
      gl.uniform2f(uniform('u_focus'), this.flameFocus.x, this.flameFocus.y);
    }
    if (this.theme === '인센스') {
      gl.uniform2f(uniform('u_mistake'), this.incenseDentVisible, 0);
    } else if (this.theme === '불멍' || this.theme === '매트릭스') {
      gl.uniform2f(uniform('u_mistake'),
        this.mistakeAt === null ? -1 : this.elapsed - this.mistakeAt,
        this.mistakeDirection);
    }
    const values = new Float32Array(48);
    for (let i = 0; i < 12; i++) {
      const ripple = this.ripples[i];
      values[i * 4 + 2] = ripple ? this.elapsed - ripple.시작 : -1;
      if (ripple) {
        values[i * 4] = ripple.x;
        values[i * 4 + 1] = ripple.y;
        values[i * 4 + 3] = ripple.세기 * (this.media.matches ? 0.24 : 1);
      }
    }
    gl.uniform4fv(uniform('u_ripples[0]'), values);
    if (this.theme === '별똥별') {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.galaxyTexture);
      gl.uniform1i(uniform('u_galaxy'), 0);
      gl.uniform1f(uniform('u_hasGalaxy'), this.galaxyTexture ? 1 : 0);
    } else if (풍경이미지[this.theme]) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.landscapeTexture);
      gl.uniform1i(uniform('u_landscape'), 0);
      gl.uniform1f(uniform('u_hasLandscape'), this.landscapeTexture ? 1 : 0);
      gl.uniform2f(uniform('u_landscapeSize'), this.landscapeImage?.naturalWidth ?? 1,
        this.landscapeImage?.naturalHeight ?? 1);
      if (this.theme === '구름') {
        gl.uniform4f(uniform('u_cloudVariation'), ...this.cloudVariation);
      }
    } else if (this.theme === '매트릭스') {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.glyphTexture);
      gl.uniform1i(uniform('u_glyphs'), 0);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (소품이미지[this.theme]) { this.drawProp(paper, bottom); }
    this.ripples = this.ripples.filter(r => this.elapsed - r.시작 < 3.5);
    this.schedule();
  };

  private schedule() {
    if (!this.frame && this.valid && !document.hidden) { this.frame = requestAnimationFrame(this.draw); }
  }
  private visibilityChanged = () => {
    this.lastFrame = 0;
    if (document.hidden) { cancelAnimationFrame(this.frame); this.frame = 0; }
    else { this.ripples = []; this.mistakeAt = null;
      this.flowEnergy = this.flowVisible = 0;
      this.incenseDentEnergy = this.incenseDentVisible = 0; this.schedule(); }
  };
  private motionChanged = () => { this.lastFrame = 0; };
  private contextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.valid = false;
    this.available(false);
  };
  private contextRestored = () => {
    if (this.disposed) { return; }
    try { this.initialize(); this.valid = true; this.resize(); this.available(true); this.schedule(); }
    catch (error) { console.warn(`${this.theme} 테마를 복구할 수 없습니다.`, error); this.available(false); }
  };
  destroy() {
    this.disposed = true;
    this.valid = false;
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.media.removeEventListener('change', this.motionChanged);
    this.canvas.removeEventListener('webglcontextlost', this.contextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.contextRestored);
    if (this.galaxyImage) {
      this.galaxyImage.onload = null;
      this.galaxyImage.onerror = null;
    }
    if (this.landscapeImage) {
      this.landscapeImage.onload = null;
      this.landscapeImage.onerror = null;
    }
    if (this.propImage) {
      this.propImage.onload = null;
      this.propImage.onerror = null;
    }
    if (this.gl) {
      if (this.galaxyTexture) { this.gl.deleteTexture(this.galaxyTexture); }
      if (this.landscapeTexture) { this.gl.deleteTexture(this.landscapeTexture); }
      if (this.glyphTexture) { this.gl.deleteTexture(this.glyphTexture); }
      if (this.propTexture) { this.gl.deleteTexture(this.propTexture); }
      if (this.propProgram) { this.gl.deleteProgram(this.propProgram); }
      if (this.overlayProgram) { this.gl.deleteProgram(this.overlayProgram); }
      if (this.buffer) { this.gl.deleteBuffer(this.buffer); }
      if (this.program) { this.gl.deleteProgram(this.program); }
    }
    this.propProgram = null;
    this.overlayProgram = null;
    this.propUniforms = {};
    this.overlayUniforms = {};
    this.gl = null;
    this.buffer = null;
    this.program = null;
    this.galaxyImage = null;
    this.landscapeImage = null;
    this.propImage = null;
    this.galaxyTexture = null;
    this.landscapeTexture = null;
    this.glyphTexture = null;
    this.propTexture = null;
    this.uniforms = {};
    this.ripples = [];
    this.flowTarget = null;
    this.flowPosition = null;
    this.flowEnergy = 0;
    this.flowVisible = 0;
    this.focusText = null;
    this.flameFocus = null;
    this.mistakeAt = null;
    this.incenseDentEnergy = this.incenseDentVisible = 0;
  }
}
