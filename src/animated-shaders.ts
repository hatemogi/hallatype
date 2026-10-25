/** 수면 이외의 종이 애니메이션. 모든 효과는 글자를 다시 그리지 않고 배경만 그린다. */
export const 움직이는테마들 = ['수면과 파문', '빗방울', '바람결', '흐르는 구름', '불멍'] as const;
export type 움직이는테마 = typeof 움직이는테마들[number];

export function 움직이는테마인가(테마: string): 테마 is 움직이는테마 {
  return 움직이는테마들.some(이름 => 이름 === 테마);
}

const 공통 = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform vec2 u_size;
uniform float u_time;
uniform float u_motion;
uniform float u_textBottom;
uniform vec4 u_tuning; // 기본 세기, 감쇠, 빛, 글자 뒤 빛
uniform vec4 u_ripples[12];

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 4375.8545);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float typingRing(vec2 p, float speed) {
  float sum = 0.0;
  float aspect = u_size.x / max(u_size.y, 1.0);
  for (int i = 0; i < 12; i++) {
    vec4 r = u_ripples[i];
    float age = r.z;
    float alive = step(0.0, age) * step(age, 3.5);
    float dist = length(vec2((p.x - r.x) * aspect, (p.y - r.y) * 1.8));
    float ring = exp(-pow((dist - age * speed) * 27.0, 2.0));
    sum += ring * exp(-age * u_tuning.y) * r.w * alive;
  }
  return min(sum, 1.15);
}
`;

const 비 = `${공통}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.030, 0.055, 0.070), vec3(0.020, 0.045, 0.063), p.y);
  color += vec3(0.012, 0.020, 0.023) * exp(-pow((p.x - 0.72) * 2.7, 2.0));
  float rain = 0.0;
  for (int i = 0; i < 3; i++) {
    float layer = float(i);
    vec2 grid = vec2(p.x * (39.0 + layer * 17.0) + p.y * (7.0 + layer * 2.0),
      (p.y - t * (0.19 + layer * 0.10)) * (13.0 + layer * 7.0));
    vec2 cell = floor(grid);
    vec2 f = fract(grid);
    float seed = hash21(cell + vec2(layer * 13.0, layer * 29.0));
    float x = 0.15 + 0.7 * hash21(cell + vec2(7.0, 19.0));
    float streak = exp(-pow((f.x - x) * 42.0, 2.0)) *
      smoothstep(0.02, 0.17, f.y) * (1.0 - smoothstep(0.68, 0.96, f.y));
    rain += streak * step(0.78 + layer * 0.035, seed) * (1.0 - layer * 0.18);
  }
  float behind = mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.04,
    u_textBottom + 0.10, p.y));
  color += vec3(0.110, 0.160, 0.180) * min(rain, 1.0) * u_tuning.x * behind;
  float puddle = pow(max(0.0, sin(p.y * 77.0 + p.x * 12.0 - t * 0.75)), 12.0);
  color += vec3(0.015, 0.031, 0.037) * puddle * smoothstep(0.48, 1.0, p.y);
  color += vec3(0.045, 0.085, 0.105) * typingRing(p, 0.23) * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

const 바람 = `${공통}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.037, 0.079, 0.067), vec3(0.022, 0.061, 0.057), p.y);
  float ribbons = 0.0;
  for (int i = 0; i < 4; i++) {
    float layer = float(i);
    float center = 0.13 + layer * 0.21 +
      0.055 * sin(p.x * (7.0 + layer) - t * (0.45 + layer * 0.09) + layer * 1.7);
    float line = exp(-pow((p.y - center) * (22.0 - layer * 2.0), 2.0));
    float broken = 0.56 + 0.44 * sin(p.x * 9.0 - t * 0.50 + layer * 2.2);
    ribbons += line * broken;
  }
  float soft = 0.5 + 0.5 * sin(p.y * 20.0 +
    1.2 * sin(p.x * 6.0 - t * 0.35) - p.x * 10.0 + t * 0.35);
  float behind = mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.05,
    u_textBottom + 0.10, p.y));
  color += vec3(0.045, 0.125, 0.095) * ribbons * u_tuning.x * behind;
  color += vec3(0.018, 0.055, 0.045) * soft * u_tuning.x * behind;
  vec2 drift = vec2((p.x - t * 0.035) * 18.0, p.y * 10.0 + sin(t * 0.3) * 0.2);
  vec2 cell = floor(drift);
  vec2 f = fract(drift);
  float leaf = exp(-pow((f.x - hash21(cell + 3.0)) * 20.0, 2.0) -
    pow((f.y - hash21(cell + 7.0)) * 32.0, 2.0)) *
    step(0.90, hash21(cell + 11.0));
  color += vec3(0.075, 0.100, 0.052) * leaf * behind;
  color += vec3(0.055, 0.100, 0.075) * typingRing(p, 0.21) * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

const 구름 = `${공통}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.052, 0.067, 0.108), vec3(0.028, 0.049, 0.088), p.y);
  vec2 flow = vec2(p.x * 2.5 - t * 0.027, p.y * 3.2);
  float clouds = noise(flow) * 0.55 + noise(flow * 2.1 + 3.7) * 0.31 +
    noise(flow * 4.0 + 8.2) * 0.14;
  float shape = smoothstep(0.32, 0.62, clouds);
  float haze = noise(flow * 0.65 + 1.2);
  float behind = mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.05,
    u_textBottom + 0.10, p.y));
  color += vec3(0.100, 0.115, 0.145) * shape * u_tuning.x * behind;
  color += vec3(0.015, 0.021, 0.030) * haze;
  color += vec3(0.020, 0.026, 0.037) *
    exp(-pow(length((p - vec2(0.76, 0.14)) * vec2(1.4, 1.0)) * 2.0, 2.0));
  color += vec3(0.068, 0.086, 0.111) * typingRing(p, 0.17) * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

const 불 = `${공통}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.052, 0.037, 0.036), vec3(0.092, 0.043, 0.028), p.y);
  float up = 1.0 - p.y;
  float turbulence = noise(vec2(p.x * 9.0, p.y * 6.0 + t * 0.56));
  float center = 0.52 + 0.045 * sin(t * 0.77 + p.y * 7.0) +
    0.028 * (turbulence - 0.5);
  float width = max(0.035, 0.26 * (1.0 - up * 1.15));
  float flame = (1.0 - smoothstep(width * 0.45, width, abs(p.x - center))) *
    (1.0 - smoothstep(0.45, 0.85, up + 0.06 * turbulence));
  float core = (1.0 - smoothstep(width * 0.12, width * 0.46, abs(p.x - center))) *
    (1.0 - smoothstep(0.33, 0.68, up + 0.05 * turbulence));
  float glow = exp(-pow((p.x - 0.52) * 2.8, 2.0)) * smoothstep(0.38, 1.0, p.y);
  float behind = mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.05,
    u_textBottom + 0.10, p.y));
  color += vec3(0.160, 0.050, 0.014) * glow * u_tuning.x * behind;
  color += vec3(0.370, 0.120, 0.034) * flame * u_tuning.x * behind;
  color += vec3(0.130, 0.095, 0.028) * core * u_tuning.x * behind;
  vec2 drift = vec2(p.x * 25.0, (p.y + t * 0.16) * 17.0);
  vec2 cell = floor(drift);
  vec2 f = fract(drift);
  float ember = exp(-pow((f.x - hash21(cell + 5.0)) * 26.0, 2.0) -
    pow((f.y - hash21(cell + 9.0)) * 26.0, 2.0)) *
    step(0.94, hash21(cell + 13.0)) * smoothstep(0.35, 1.0, p.y);
  color += vec3(0.25, 0.110, 0.034) * ember * behind;
  color += vec3(0.115, 0.052, 0.018) * typingRing(p, 0.18) * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

export const 추가효과조각: Record<Exclude<움직이는테마, '수면과 파문'>, string> = {
  빗방울: 비,
  바람결: 바람,
  '흐르는 구름': 구름,
  불멍: 불,
};
