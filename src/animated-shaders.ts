/** 수면 이외의 종이 애니메이션. 모든 효과는 글자를 다시 그리지 않고 배경만 그린다. */
export const 움직이는테마들 = ['수면과 파문', '빗방울', '바람결', '흐르는 구름', '불멍', '오로라', '별똥별'] as const;
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
  float tapGlow = 0.0;
  float tapFlame = 0.0;
  float sparks = 0.0;
  float aspect = u_size.x / max(u_size.y, 1.0);
  for (int i = 0; i < 12; i++) {
    vec4 r = u_ripples[i];
    float age = r.z;
    if (age < 0.0 || age > 2.4 / u_tuning.y) { continue; }
    float alive = step(0.0, age) * (1.0 - smoothstep(0.18, 2.4 / u_tuning.y, age));
    vec2 d = vec2((p.x - r.x) * aspect, p.y - r.y);
    float seed = hash21(vec2(r.x * 71.0 + float(i), r.y * 89.0));
    float sway = sin(age * 16.0 + seed * 6.28) * 0.007 * u_motion;
    tapGlow += exp(-pow(d.x * 24.0, 2.0) - pow(d.y * 23.0, 2.0)) * alive * r.w;
    float tongue = exp(-pow((d.x - sway) * 64.0, 2.0)) *
      exp(-pow((d.y + 0.017 + age * 0.024 * u_motion) * 54.0, 2.0));
    float flicker = exp(-pow((d.x + 0.012 + sway) * 88.0, 2.0)) *
      exp(-pow((d.y + 0.032 + age * 0.018 * u_motion) * 82.0, 2.0));
    tapFlame += (tongue + flicker * 0.62) * alive * r.w;
    for (int j = 0; j < 3; j++) {
      float piece = float(j);
      float scatter = (hash21(vec2(seed * 37.0, piece + 2.0)) - 0.5) * 0.034;
      float lift = (0.018 + piece * 0.009) + age * (0.035 + piece * 0.015) * u_motion;
      float spark = exp(-pow((d.x - scatter - sway) * 105.0, 2.0) -
        pow((d.y + lift) * 105.0, 2.0));
      sparks += spark * alive * r.w;
    }
  }
  color += vec3(0.185, 0.065, 0.019) * min(tapGlow, 1.0) * u_tuning.z * behind;
  color += vec3(0.630, 0.225, 0.060) * min(tapFlame, 1.0) * u_tuning.z * behind;
  color += vec3(0.750, 0.430, 0.135) * min(sparks, 1.0) * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

const 오로라 = `${공통}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.018, 0.035, 0.065), vec3(0.014, 0.029, 0.053), p.y);
  float presence = 0.0;
  float aspect = u_size.x / max(u_size.y, 1.0);
  for (int i = 0; i < 12; i++) {
    vec4 r = u_ripples[i];
    float age = r.z;
    if (age < 0.0 || age > 3.2 / u_tuning.y) { continue; }
    float alive = step(0.0, age) * (1.0 - smoothstep(0.15, 3.2 / u_tuning.y, age));
    vec2 d = vec2((p.x - r.x) * aspect, p.y - r.y);
    float drift = 0.018 * sin(age * 3.5 + p.y * 13.0) * u_motion;
    presence += exp(-pow((d.x - drift) * 7.5, 2.0) - pow(d.y * 7.0, 2.0)) *
      alive * r.w;
  }
  presence = min(presence, 1.25);
  vec2 flow = p + presence * vec2(
    0.047 * sin(p.y * 14.0 - t * 1.7),
    0.045 * sin(p.x * 13.0 + t * 1.4));
  float wander = noise(vec2(flow.x * 3.0 - t * 0.065, flow.y * 2.0));
  float arch = 0.31 + 0.075 * sin(flow.x * 6.0 - t * 0.27) +
    0.045 * sin(flow.x * 13.0 + t * 0.19);
  float edge = flow.y - arch - (wander - 0.5) * 0.11;
  float cyan = exp(-pow((edge + 0.14) * 13.0, 2.0));
  float green = exp(-pow((edge + 0.02) * 13.0, 2.0));
  float violet = exp(-pow((edge - 0.10) * 13.0, 2.0));
  float pink = exp(-pow((edge - 0.22) * 13.0, 2.0));
  float lower = exp(-pow((flow.y - 0.75 + 0.045 * sin(flow.x * 8.0 + t * 0.23)) * 7.0, 2.0));
  float curtain = 0.56 + 0.44 * noise(vec2(flow.x * 19.0 - t * 0.17, flow.y * 3.0));
  float folds = pow(0.5 + 0.5 * sin(flow.x * 26.0 +
    1.7 * noise(vec2(flow.x * 4.0, flow.y * 3.0)) - t * 0.30), 5.0);
  float breath = 0.78 + 0.22 * sin(t * 0.42 + flow.x * 4.0);
  float behind = mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.06,
    u_textBottom + 0.10, p.y));
  float light = curtain * breath * u_tuning.x * behind;
  color += vec3(0.015, 0.215, 0.255) * cyan * light;
  color += vec3(0.045, 0.245, 0.085) * green * light;
  color += vec3(0.185, 0.055, 0.265) * violet * light;
  color += vec3(0.240, 0.040, 0.135) * pink * light;
  color += vec3(0.020, 0.095, 0.150) * lower * curtain * u_tuning.x * behind;
  color += vec3(0.035, 0.075, 0.090) * folds * (cyan + green + violet) * light;
  float dance = presence * (0.62 + 0.38 * sin(p.x * 21.0 - t * 2.4 + p.y * 9.0));
  vec3 pulse = mix(vec3(0.025, 0.170, 0.165), vec3(0.195, 0.055, 0.210),
    0.5 + 0.5 * sin(t * 2.2 + p.x * 16.0));
  color += pulse * dance * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

const 별똥별 = `${공통}
uniform sampler2D u_galaxy;
uniform float u_hasGalaxy;
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.016, 0.023, 0.047), vec3(0.010, 0.018, 0.039), p.y);
  float behind = mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.05,
    u_textBottom + 0.10, p.y));
  if (u_hasGalaxy > 0.5) {
    // 넉넉히 확대해 가장자리를 감춘 채 카메라가 천천히 이동하는 느낌을 낸다.
    float zoom = 0.93 + 0.012 * sin(t * 0.09);
    vec2 camera = vec2(0.016 * sin(t * 0.12), 0.012 * cos(t * 0.085));
    vec2 galaxyUv = (p - 0.5) * zoom + 0.5 + camera;
    vec3 galaxy = texture2D(u_galaxy, galaxyUv).rgb;
    color += pow(galaxy, vec3(1.18)) * u_tuning.x * behind;
  }
  vec2 grid = p * vec2(37.0, 23.0);
  vec2 cell = floor(grid);
  vec2 point = fract(grid) - vec2(hash21(cell + 5.0), hash21(cell + 9.0));
  float star = exp(-dot(point, point) * 380.0) * step(0.965, hash21(cell + 15.0));
  float twinkle = 0.50 + 0.50 * sin(t * 1.4 + hash21(cell + 19.0) * 6.28);
  color += vec3(0.095, 0.120, 0.165) * star * twinkle * behind;

  float streak = 0.0;
  float headGlow = 0.0;
  float aspect = u_size.x / max(u_size.y, 1.0);
  for (int i = 0; i < 12; i++) {
    vec4 r = u_ripples[i];
    float age = r.z;
    if (age < 0.0 || age > 1.45) { continue; }
    float seed = hash21(r.xy * vec2(83.0, 61.0));
    float size = mix(0.55, 1.55, hash21(r.xy * vec2(169.0, 237.0)));
    float side = r.x < 0.20 ? 1.0 : (r.x > 0.80 ? -1.0 : (seed > 0.5 ? 1.0 : -1.0));
    float vertical = r.y > 0.75 ? -1.0 : 1.0;
    vec2 direction = normalize(vec2(side * 0.97, vertical * 0.24));
    vec2 head = r.xy + vec2(side * age * 0.19 * u_motion,
      vertical * age * 0.045 * u_motion);
    vec2 d = vec2((p.x - head.x) * aspect, p.y - head.y);
    float along = dot(d, direction);
    float across = abs(d.x * direction.y - d.y * direction.x);
    float tail = exp(-pow(across * 90.0 / size, 2.0)) *
      smoothstep(-0.16 * size, -0.035 * size, along) *
      (1.0 - smoothstep(-0.015 * size, 0.025 * size, along));
    float core = exp(-dot(d, d) * 4600.0 / (size * size));
    float fade = 1.0 - smoothstep(0.42, 1.45, age);
    streak += tail * fade * r.w;
    headGlow += core * fade * r.w;
  }
  color += vec3(0.24, 0.43, 0.72) * min(streak, 1.0) * u_tuning.z * behind;
  color += vec3(0.62, 0.76, 0.93) * min(headGlow, 1.0) * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

export const 추가효과조각: Record<Exclude<움직이는테마, '수면과 파문'>, string> = {
  빗방울: 비,
  바람결: 바람,
  '흐르는 구름': 구름,
  불멍: 불,
  오로라,
  별똥별,
};
