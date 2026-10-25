import { 추가효과조각, type 움직이는테마 } from './animated-shaders';
import galaxyUrl from './assets/milky-way.webp';

/** 종이 전체 뒤에서 동작하는 WebGL 효과. 테마별 강도는 여기에서 조절한다. */
export const 동적효과조절: Record<움직이는테마,
  { 기본세기: number; 타건세기: number; 감쇠속도: number; 빛강도: number; 글뒤세기: number }> = {
  '수면과 파문': { 기본세기: 0.58, 타건세기: 0.72, 감쇠속도: 1.55, 빛강도: 0.37, 글뒤세기: 0.85 },
  매트릭스: { 기본세기: 0.90, 타건세기: 0.55, 감쇠속도: 1.5, 빛강도: 0.74, 글뒤세기: 0.28 },
  빗방울: { 기본세기: 0.94, 타건세기: 0.76, 감쇠속도: 1.7, 빛강도: 0.74, 글뒤세기: 0.65 },
  바람결: { 기본세기: 1.0, 타건세기: 0.72, 감쇠속도: 1.45, 빛강도: 0.7, 글뒤세기: 0.80 },
  '흐르는 구름': { 기본세기: 1.10, 타건세기: 0.78, 감쇠속도: 1.25, 빛강도: 0.82, 글뒤세기: 0.78 },
  불멍: { 기본세기: 0.95, 타건세기: 0.86, 감쇠속도: 1.65, 빛강도: 0.82, 글뒤세기: 0.72 },
  인센스: { 기본세기: 0.90, 타건세기: 0.55, 감쇠속도: 1.5, 빛강도: 0.72, 글뒤세기: 0.67 },
  '달빛 창가': { 기본세기: 0.94, 타건세기: 0.58, 감쇠속도: 1.6, 빛강도: 0.72, 글뒤세기: 0.58 },
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
  private glyphTexture: WebGLTexture | null = null;
  private galaxyImage: HTMLImageElement | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private observer: ResizeObserver | null = null;
  private media = window.matchMedia('(prefers-reduced-motion: reduce)');
  private frame = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private sourceBottom = 0.5;
  private focusText: { x: number; y: number } | null = null;
  private flameFocus: { x: number; y: number } | null = null;
  private mistakeAt: number | null = null;
  private mistakeDirection = 1;
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
    this.glyphTexture = null;
    for (const name of ['u_size', 'u_time', 'u_horizon', 'u_textBottom',
      'u_motion', 'u_tuning', 'u_ripples[0]', 'u_focus', 'u_mistake',
      'u_galaxy', 'u_hasGalaxy', 'u_glyphs', 'u_flow']) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    if (this.theme === '매트릭스') { this.uploadGlyphs(); }
    if (this.galaxyImage?.complete && this.galaxyImage.naturalWidth) { this.uploadGalaxy(); }
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

  setContentBottom(fraction: number) {
    this.sourceBottom = Math.max(0, Math.min(1, fraction));
  }

  setFocus(x: number, y: number) {
    if (this.theme === '불멍') {
      this.focusText = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    }
  }

  typing(x: number, textY: number, wide = false) {
    if (!this.valid || document.hidden) { return; }
    if (this.theme === '불멍') { return; }
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
    if (this.theme !== '불멍' || !this.valid || document.hidden) { return; }
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
    this.flowVisible += (this.flowEnergy - this.flowVisible) *
      (1 - Math.exp(-dt * 공통조절.흐름완충));
    if (this.flowTarget && this.flowPosition) {
      const follow = 1 - Math.exp(-dt * 공통조절.흐름추종);
      this.flowPosition.x += (this.flowTarget.x - this.flowPosition.x) * follow;
      this.flowPosition.y += (this.flowTarget.y - this.flowPosition.y) * follow;
    }
    this.resize();
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
    } else if (this.theme === '매트릭스') {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.glyphTexture);
      gl.uniform1i(uniform('u_glyphs'), 0);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
      this.flowEnergy = this.flowVisible = 0; this.schedule(); }
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
    if (this.gl) {
      if (this.galaxyTexture) { this.gl.deleteTexture(this.galaxyTexture); }
      if (this.glyphTexture) { this.gl.deleteTexture(this.glyphTexture); }
      if (this.buffer) { this.gl.deleteBuffer(this.buffer); }
      if (this.program) { this.gl.deleteProgram(this.program); }
    }
    this.gl = null;
    this.buffer = null;
    this.program = null;
    this.galaxyImage = null;
    this.galaxyTexture = null;
    this.glyphTexture = null;
    this.uniforms = {};
    this.ripples = [];
    this.flowTarget = null;
    this.flowPosition = null;
    this.flowEnergy = 0;
    this.flowVisible = 0;
    this.focusText = null;
    this.flameFocus = null;
    this.mistakeAt = null;
  }
}
