import { 추가효과조각, type 움직이는테마 } from './animated-shaders';

/** 종이 전체 뒤에서 동작하는 WebGL 효과. 테마별 강도는 여기에서 조절한다. */
export const 동적효과조절: Record<움직이는테마,
  { 기본세기: number; 타건세기: number; 감쇠속도: number; 빛강도: number; 글뒤세기: number }> = {
  '수면과 파문': { 기본세기: 0.58, 타건세기: 0.72, 감쇠속도: 1.55, 빛강도: 0.37, 글뒤세기: 0.85 },
  빗방울: { 기본세기: 0.94, 타건세기: 0.76, 감쇠속도: 1.7, 빛강도: 0.74, 글뒤세기: 0.65 },
  바람결: { 기본세기: 1.0, 타건세기: 0.72, 감쇠속도: 1.45, 빛강도: 0.7, 글뒤세기: 0.80 },
  '흐르는 구름': { 기본세기: 1.10, 타건세기: 0.78, 감쇠속도: 1.25, 빛강도: 0.82, 글뒤세기: 0.78 },
  불멍: { 기본세기: 0.95, 타건세기: 0.86, 감쇠속도: 1.65, 빛강도: 0.82, 글뒤세기: 0.72 },
  오로라: { 기본세기: 1.05, 타건세기: 0.86, 감쇠속도: 1.0, 빛강도: 0.92, 글뒤세기: 0.76 },
};
const 공통조절 = {
  최대파문: 12,
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
  color += vec3(0.60, 0.43, 0.22) * gold * u_tuning.z * mix(0.12, 1.0, belowText);
  color += vec3(0.030, 0.090, 0.086) * (wave + ripple * 0.24) * surface * quiet *
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
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private observer: ResizeObserver | null = null;
  private media = window.matchMedia('(prefers-reduced-motion: reduce)');
  private frame = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private sourceBottom = 0.5;
  private ripples: 파문[] = [];
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
    for (const name of ['u_size', 'u_time', 'u_horizon', 'u_textBottom',
      'u_motion', 'u_tuning', 'u_ripples[0]']) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
  }

  setContentBottom(fraction: number) {
    this.sourceBottom = Math.max(0, Math.min(1, fraction));
  }

  typing(x: number, textY: number, wide = false) {
    if (!this.valid || document.hidden) { return; }
    const paper = this.canvas.getBoundingClientRect();
    const text = this.text.getBoundingClientRect();
    const px = (text.left + x * text.width - paper.left) / Math.max(paper.width, 1);
    const py = (text.top + textY * text.height - paper.top) / Math.max(paper.height, 1);
    const strength = 동적효과조절[this.theme].타건세기;
    this.ripples.push({ x: Math.max(0.08, Math.min(0.92, px)),
      y: Math.max(0.07, Math.min(0.91, py)),
      시작: this.elapsed, 세기: wide ? strength * 2 : strength });
    if (this.ripples.length > 공통조절.최대파문) { this.ripples.shift(); }
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
    this.elapsed += Math.min(0.05, this.lastFrame ? (now - this.lastFrame) / 1000 : 0);
    this.lastFrame = now;
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
    const tuning = 동적효과조절[this.theme];
    gl.uniform4f(uniform('u_tuning'), tuning.기본세기,
      tuning.감쇠속도, tuning.빛강도, tuning.글뒤세기);
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
    else { this.ripples = []; this.schedule(); }
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
    if (this.gl) {
      if (this.buffer) { this.gl.deleteBuffer(this.buffer); }
      if (this.program) { this.gl.deleteProgram(this.program); }
    }
    this.gl = null;
    this.buffer = null;
    this.program = null;
    this.uniforms = {};
    this.ripples = [];
  }
}
