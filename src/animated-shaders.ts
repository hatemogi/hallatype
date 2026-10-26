/** 수면 이외의 종이 애니메이션. 모든 효과는 글자를 다시 그리지 않고 배경만 그린다. */
export const 움직이는테마들 = ['청보리', '폭포', '커피', '촛불', '수면과 파문', '매트릭스', '빗방울', '구름', '모닥불', '인센스', '오로라', '별똥별'] as const;
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
uniform vec4 u_flow; // 입력 위치, 이어지는 세기, 글줄 방향

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
float flowWake(vec2 p) {
  float aspect = u_size.x / max(u_size.y, 1.0);
  vec2 d = vec2((p.x - u_flow.x + u_flow.w * 0.045) * aspect,
    p.y - u_flow.y - 0.04);
  return exp(-pow(d.x * 7.0, 2.0) - pow(d.y * 27.0, 2.0)) * u_flow.z;
}
`;

const 청보리 = `${공통}
uniform sampler2D u_landscape;
uniform float u_hasLandscape;
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = vec3(0.112, 0.178, 0.125);
  if (u_hasLandscape > 0.5 && p.y > 0.78) {
    float top = 1.0 - smoothstep(0.78, 0.99, p.y);
    float breeze = (0.0045 * sin(t * 0.68 - p.x * 7.0 + p.y * 8.0) +
      0.0015 * sin(t * 0.91 + p.x * 13.0)) * top * top;
    vec2 uv = vec2(0.5 + (p.x - 0.5) * 0.88 + breeze,
      0.22 + (p.y - 0.78));
    vec3 field = texture2D(u_landscape,
      clamp(uv, vec2(0.01), vec2(0.99))).rgb;
    // 가는 이삭의 이동에 넓은 명암의 물결을 섞어 바람 방향이 읽히게 한다.
    float gust = 0.95 + 0.05 * sin(p.x * 13.0 - t * 0.88 + p.y * 6.0);
    field *= vec3(0.49, 0.54, 0.47) * gust;
    float reveal = smoothstep(0.78, 0.84, p.y) *
      0.88 * u_tuning.x;
    color = mix(color, field, reveal);
  }
  gl_FragColor = vec4(color, 1.0);
}`;

const 폭포 = `${공통}
uniform sampler2D u_landscape;
uniform float u_hasLandscape;
uniform vec2 u_landscapeSize;
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.055, 0.098, 0.111),
    vec3(0.039, 0.080, 0.091), p.y);
  if (u_hasLandscape > 0.5) {
    // 넓은 폭포의 중앙을 유지하며 종이 아래쪽에 사진 비율대로 펼친다.
    float top = 0.48;
    float height = 1.0 - top;
    float aspect = u_size.x / max(u_size.y, 1.0);
    float regionAspect = aspect / height;
    float coverX = min(1.0, regionAspect / 1.776);
    float coverY = min(1.0, 1.776 / regionAspect);
    vec2 uv = vec2(0.5 + (p.x - 0.5) * coverX,
      0.5 + ((p.y - top) / height - 0.5) * coverY);
    // 물줄기의 질감만 아주 작게 움직여 사진의 절벽과 수평선은 고정한다.
    float fallBody = smoothstep(0.32, 0.40, uv.y) *
      (1.0 - smoothstep(0.57, 0.70, uv.y));
    vec2 imageUv = uv + vec2(0.0, fallBody * 0.0025 *
      sin(uv.x * 85.0 + uv.y * 35.0 - t * 1.2));
    vec2 sampleUv = clamp(imageUv, vec2(0.0), vec2(1.0));
    vec3 landscape = texture2D(u_landscape, sampleUv).rgb;
    vec2 texel = 2.0 / max(u_landscapeSize, vec2(1.0));
    vec3 nearby = (texture2D(u_landscape, sampleUv + vec2(texel.x, 0.0)).rgb +
      texture2D(u_landscape, sampleUv - vec2(texel.x, 0.0)).rgb +
      texture2D(u_landscape, sampleUv + vec2(0.0, texel.y)).rgb +
      texture2D(u_landscape, sampleUv - vec2(0.0, texel.y)).rgb) * 0.25;
    landscape = clamp((landscape + (landscape - nearby) * 0.42 - 0.46) * 1.14 + 0.46,
      vec3(0.0), vec3(1.0));
    float reveal = smoothstep(top, top + 0.13, p.y);
    float textContrast = mix(0.67, 1.0,
      smoothstep(u_textBottom - 0.02, u_textBottom + 0.09, p.y));
    color = mix(color, landscape * vec3(0.58, 0.66, 0.70) * textContrast,
      reveal * 0.96 * u_tuning.x);

    // 낙하지점 전반에서 굵은 안개와 가는 물보라가 서로 다른 속도로 위로 흐른다.
    float basin = 0.62 + 0.013 * sin(uv.x * 10.0 + t * 0.52);
    float plume = exp(-pow((uv.y - basin) / 0.16, 2.0));
    float broad = noise(vec2(uv.x * 8.0 + t * 0.12,
      uv.y * 12.0 + t * 0.62));
    float wisps = noise(vec2(uv.x * 22.0 - t * 0.17,
      uv.y * 25.0 + t * 1.05));
    float uneven = 0.75 + 0.25 * noise(vec2(uv.x * 5.0, t * 0.28));
    float mist = plume * (0.07 + smoothstep(0.32, 0.70, broad) * 0.48 +
      wisps * 0.18) * uneven;

    float textMist = mix(0.52, 1.0,
      smoothstep(u_textBottom - 0.03, u_textBottom + 0.10, p.y));
    color += vec3(0.27, 0.30, 0.30) * mist * reveal * textMist * u_tuning.z;
  }
  gl_FragColor = vec4(color, 1.0);
}`;

const 커피 = `${공통}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  vec3 color = mix(vec3(0.205, 0.157, 0.132),
    vec3(0.167, 0.117, 0.097), p.y);
  gl_FragColor = vec4(color, 1.0);
}`;

const 촛불 = `${공통}
uniform vec3 u_candle; // 심지 x, 심지 y, 초 높이
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float aspect = u_size.x / max(u_size.y, 1.0);
  vec3 color = mix(vec3(0.090, 0.074, 0.073), vec3(0.065, 0.052, 0.057), p.y);
  vec2 fromWick = vec2((p.x - u_candle.x) * aspect, p.y - u_candle.y);
  float candlelight = exp(-pow(fromWick.x * 2.2, 2.0) - pow(fromWick.y * 2.5, 2.0));
  color += vec3(0.105, 0.057, 0.025) * candlelight * u_tuning.z;
  gl_FragColor = vec4(color, 1.0);
}`;

/** 배경과 같은 WebGL 컨텍스트에서 머그잔 이미지 위에 그리는 커피 김. */
export const 커피김조각 = `${공통}
uniform vec3 u_cup; // 종이 안에서의 머그잔 중심 x, 커피 수면 y, 이미지 높이 배율
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float aspect = u_size.x / max(u_size.y, 1.0);
  float t = u_time * u_motion;
  // 커피 수면에서 시작해 입구를 지나며 옅고 넓게 풀어지는 수증기.
  float scale = max(u_cup.z, 0.01);
  float steamX = (p.x - u_cup.x) * aspect / scale;
  float rise = (u_cup.y - p.y) / scale;
  float drift = smoothstep(0.0, 0.16, rise) *
    (0.035 * sin(rise * 10.0 - t * 0.38) +
      0.018 * sin(rise * 17.0 + t * 0.22));
  float spread = 0.045 + rise * 0.31;
  float veil = exp(-pow((steamX - drift) / spread, 2.0));
  float softEdge = exp(-pow((steamX - drift -
    0.048 * sin(rise * 9.0 + t * 0.20)) / (spread * 0.78), 2.0));
  float billow = 0.72 * veil + 0.28 * softEdge;
  float variation = 0.64 + 0.36 * noise(vec2(
    steamX * 8.0 + t * 0.10, rise * 15.0 - t * 0.16));
  float fade = smoothstep(0.0, 0.012, rise) *
    (1.0 - smoothstep(0.19, 0.37, rise));
  float strands = 0.0;
  for (int i = 0; i < 2; i++) {
    float side = float(i) * 2.0 - 1.0;
    float fan = smoothstep(0.01, 0.17, rise);
    float center = drift + side * 0.038 * fan +
      (0.012 + rise * 0.033) * fan *
      sin(rise * (19.0 + float(i) * 3.0) -
        t * (0.72 + float(i) * 0.11) + float(i) * 1.7);
    float feather = 0.018 + rise * 0.042;
    float thread = exp(-pow((steamX - center) / feather, 2.0));
    float uneven = 0.72 + 0.28 * noise(vec2(
      rise * 17.0 - t * 0.35, float(i) * 3.7));
    strands += thread * uneven;
  }
  float nearCup = exp(-pow(steamX / (0.052 + rise * 0.10), 2.0)) *
    (1.0 - smoothstep(0.025, 0.10, rise));
  float alpha = (0.22 * billow * variation +
    0.44 * min(strands, 1.15)) * fade;
  alpha += 0.14 * nearCup * smoothstep(0.0, 0.008, rise);
  gl_FragColor = vec4(vec3(0.75, 0.68, 0.59),
    min(alpha * u_tuning.x, 0.72));
}`;

/** 심지에서 시작하는 작고 부드러운 불꽃과 주변 빛. */
export const 촛불꽃조각 = `${공통}
uniform vec3 u_candle; // 심지 x, 심지 y, 초 높이
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float aspect = u_size.x / max(u_size.y, 1.0);
  float t = u_time * u_motion;
  float scale = max(u_candle.z, 0.01);
  float y = (u_candle.y - p.y) / scale;
  float x = (p.x - u_candle.x) * aspect / scale;
  float height = 0.30 + 0.016 * sin(t * 2.1) + 0.010 * sin(t * 3.3 + 1.2);
  float progress = clamp(y / height, 0.0, 1.0);
  float sway = (0.010 * sin(t * 1.6) + 0.005 * sin(t * 2.9 + 0.7)) *
    smoothstep(0.0, 0.7, progress);
  float width = 0.008 + 0.045 * pow(max(sin(progress * 3.14159), 0.0), 0.85);
  float body = (1.0 - smoothstep(width * 0.67, width, abs(x - sway))) *
    smoothstep(-0.003, 0.013, y) * (1.0 - smoothstep(height - 0.023, height, y));
  float core = (1.0 - smoothstep(width * 0.18, width * 0.53, abs(x - sway))) *
    smoothstep(0.005, 0.027, y) * (1.0 - smoothstep(height * 0.55, height * 0.84, y));
  float glow = exp(-pow(x / 0.19, 2.0) - pow((y - 0.09) / 0.23, 2.0));
  float flicker = 0.94 + 0.06 * sin(t * 3.1 + 0.8);
  vec3 color = mix(vec3(0.91, 0.45, 0.13), vec3(1.0, 0.87, 0.51),
    clamp(progress * 0.55 + core * 0.6, 0.0, 1.0));
  float alpha = min(glow * 0.22 * u_tuning.z + body * 0.96 + core * 0.45, 0.98);
  float belowText = smoothstep(u_textBottom - 0.04, u_textBottom + 0.07, p.y);
  gl_FragColor = vec4(color, alpha * flicker * u_tuning.x * mix(0.82, 1.0, belowText));
}`;

/** 투명 소품 이미지를 원래 비율과 위치로 종이 위에 그린다. */
export const 소품이미지조각 = `${공통}
uniform sampler2D u_propImage;
uniform vec4 u_propRect; // 왼쪽, 아래쪽, 너비, 높이 (종이 정규화 좌표)
uniform float u_dimBehindText;
void main() {
  vec2 uv = (v_uv - u_propRect.xy) / u_propRect.zw;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { discard; }
  vec4 prop = texture2D(u_propImage, uv);
  float gray = dot(prop.rgb, vec3(0.213, 0.715, 0.072));
  vec3 color = mix(vec3(gray), prop.rgb, 0.85) * 0.92;
  float belowText = smoothstep(u_textBottom - 0.04, u_textBottom + 0.07,
    1.0 - v_uv.y);
  float legibility = mix(1.0, mix(0.14, 1.0, belowText), u_dimBehindText);
  gl_FragColor = vec4(color, prop.a * 0.90 * legibility);
}`;

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
  color += vec3(0.070, 0.110, 0.130) * flowWake(p) * 2.1 * u_tuning.z * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

const 구름 = `${공통}
uniform sampler2D u_landscape;
uniform float u_hasLandscape;
uniform vec4 u_cloudVariation; // 가로 위치, 세로 위치, 좌우 방향과 크기, 프랙탈 씨앗
float cloudFbm(vec2 p) {
  float value = 0.0;
  float weight = 0.5;
  for (int i = 0; i < 3; i++) {
    value += weight * noise(p);
    p = mat2(1.62, -1.17, 1.17, 1.62) * p + vec2(3.7, 1.9);
    weight *= 0.5;
  }
  return value;
}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  vec3 color = mix(vec3(0.015, 0.30, 0.63), vec3(0.10, 0.43, 0.76), p.y);
  if (u_hasLandscape > 0.5) {
    float t = u_time * u_motion;
    float aspect = u_size.x / max(u_size.y, 1.0);
    float cropX = min(1.0, aspect / 2.20);
    vec2 uv = vec2(0.5 + (p.x - 0.5) * cropX * u_cloudVariation.z + u_cloudVariation.x,
      (p.y - 0.12) / 1.28 + u_cloudVariation.y);
    // 큰 덩어리의 윤곽을 중심으로 천천히 부풀리고 펼친다.
    vec2 outward = normalize(uv - vec2(0.5, 0.72) + vec2(0.001));
    vec2 seed = vec2(u_cloudVariation.w, u_cloudVariation.w * 0.73);
    vec2 shape = vec2(cloudFbm(uv * 3.2 + seed - outward * t * 0.020),
      cloudFbm(uv * 4.1 - seed.yx - outward * t * 0.015)) - 0.5;
    uv += vec2(0.012 * sin(t * 0.14), 0.0);
    uv += shape * vec2(0.095, 0.062);
    uv -= outward * (0.006 * sin(t * 0.27));
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      vec4 cloud = texture2D(u_landscape, uv);
      float edge = smoothstep(0.18, 0.78, cloud.a);
      float belowText = smoothstep(u_textBottom - 0.03,
        u_textBottom + 0.11, p.y);
      float alpha = edge * mix(0.18, 0.98, belowText) * u_tuning.x;
      // 투명 가장자리의 색 번짐은 흰 빛으로 덮어 하늘색에 자연스럽게 섞는다.
      vec3 cloudColor = mix(vec3(0.94, 0.97, 1.0), cloud.rgb,
        smoothstep(0.15, 0.60, cloud.a));
      color = mix(color, cloudColor, alpha);
    }
  }
  gl_FragColor = vec4(color, 1.0);
}`;

const 불 = `${공통}
uniform vec2 u_focus;
uniform vec2 u_mistake;
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.052, 0.037, 0.036), vec3(0.092, 0.043, 0.028), p.y);
  float up = 1.0 - p.y;
  float turbulence = noise(vec2(p.x * 9.0, p.y * 6.0 + t * 0.56));
  // 불기둥의 몸통은 제자리에 두고, 가늘어지는 끝만 입력 위치 쪽으로 기울인다.
  float tip = smoothstep(0.38, 0.76, up);
  float lean = clamp((u_focus.x - 0.52) * 0.22, -0.10, 0.10) * tip;
  float flinch = 0.0;
  if (u_mistake.x >= 0.0 && u_mistake.x < 0.9) {
    flinch = u_mistake.y * sin(u_mistake.x * 15.0) *
      exp(-u_mistake.x * 5.0) * u_motion;
  }
  float center = 0.52 + lean + 0.045 * sin(t * 0.77 + p.y * 7.0) +
    0.028 * (turbulence - 0.5) + flinch * (0.003 + 0.013 * tip);
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
  gl_FragColor = vec4(color, 1.0);
}`;

const 인센스 = `${공통}
uniform vec2 u_mistake;
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.054, 0.064, 0.076), vec3(0.085, 0.078, 0.073), p.y);
  color += vec3(0.016, 0.019, 0.022) *
    exp(-pow(length((p - vec2(0.75, 0.53)) * vec2(1.5, 1.0)) * 2.4, 2.0));

  // 향 끝에서 시작한 가는 연기가 위로 갈수록 여러 결로 풀어진다.
  float rise = max(0.0, 0.69 - p.y);
  float loose = smoothstep(0.0, 0.24, rise);
  float width = 0.009 + rise * 0.13;
  // 입력 위치는 바람의 좌우 방향만 정한다. 연기가 글자를 향해 따라가지는 않는다.
  float windDirection = 2.0 * smoothstep(0.32, 0.68, u_flow.x) - 1.0;
  float breeze = 0.006 * windDirection * u_flow.z *
    smoothstep(0.08, 0.44, rise) * u_motion;
  float center = 0.78 - rise * 0.21 +
    (0.018 + rise * 0.042) * loose * sin(rise * 12.0 - t * 0.58) +
    rise * 0.025 * sin(rise * 25.0 + t * 0.36) + breeze;
  // 오타가 나면 향 끝은 고정한 채 연기 중간 결만 잠깐 접혔다 풀린다.
  float crease = u_mistake.x * u_motion;
  float dent = crease * exp(-pow((rise - 0.23) * 8.0, 2.0));
  float smokeCenter = center + 0.010 * dent *
    sin((rise - 0.23) * 18.0 + 0.8);
  float smokeWidth = width * (1.0 - 0.18 * dent);
  float feather = noise(vec2(p.x * 17.0 + t * 0.08, p.y * 16.0 - t * 0.18));
  float thread1 = exp(-pow((p.x - smokeCenter - smokeWidth * 0.28 *
    loose * sin(rise * 31.0 + t * 0.62)) / (smokeWidth * 0.27), 2.0));
  float thread2 = exp(-pow((p.x - smokeCenter + smokeWidth * 0.38 *
    loose * sin(rise * 23.0 - t * 0.43)) / (smokeWidth * 0.34), 2.0));
  float veil = exp(-pow((p.x - smokeCenter) / (smokeWidth * 1.15), 2.0));
  float fade = (1.0 - smoothstep(0.689, 0.701, p.y)) *
    (1.0 - smoothstep(0.48, 0.69, rise));
  float smoke = (thread1 * 0.55 + thread2 * 0.43 + veil * 0.14) *
    (0.45 + feather * 0.60) * fade;
  float behind = mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.04,
    u_textBottom + 0.11, p.y));
  color += vec3(0.28, 0.29, 0.29) * smoke * u_tuning.x * behind;

  float stickX = 0.78 + (p.y - 0.69) * 0.14;
  float stick = exp(-pow((p.x - stickX) * 320.0, 2.0)) *
    smoothstep(0.685, 0.705, p.y);
  float tip = exp(-pow((p.x - 0.78) * 170.0, 2.0) -
    pow((p.y - 0.69) * 170.0, 2.0));
  float halo = exp(-pow((p.x - 0.78) * 18.0, 2.0) -
    pow((p.y - 0.69) * 17.0, 2.0));
  color += vec3(0.13, 0.092, 0.067) * stick;
  color += vec3(0.34, 0.14, 0.065) * tip * u_tuning.z;
  color += vec3(0.07, 0.031, 0.016) * halo * u_tuning.z;
  gl_FragColor = vec4(color, 1.0);
}`;

const 매트릭스 = `${공통}
uniform sampler2D u_glyphs;
uniform vec2 u_mistake;

vec2 codeRain(vec2 p, float t, vec2 density, float layer) {
  float column = floor(p.x * density.x);
  float phase = hash21(vec2(column, layer * 29.0));
  float speed = mix(0.085, 0.19, hash21(vec2(column + 7.0, layer * 13.0))) *
    mix(0.58, 1.0, layer);
  float head = mod(t * speed + phase * 1.4, 1.52) - 0.22;
  float distance = head - p.y;
  float lengthOfTrail = mix(0.24, 0.52, hash21(vec2(column + 17.0, layer * 5.0)));
  float trail = step(0.0, distance) *
    (1.0 - smoothstep(0.02, lengthOfTrail, distance));
  vec2 grid = vec2(p.x * density.x, (p.y - t * speed) * density.y);
  vec2 cell = floor(grid);
  vec2 local = fract(grid);
  float glyphId = floor(hash21(cell + vec2(layer * 19.0, layer * 37.0)) * 64.0);
  vec2 atlasUv = vec2((mod(glyphId, 8.0) + local.x) / 8.0,
    1.0 - (floor(glyphId / 8.0) + local.y) / 8.0);
  float glyph = texture2D(u_glyphs, atlasUv).a;
  float gap = step(0.20, hash21(cell + vec2(13.0, layer * 31.0)));
  float headLight = exp(-pow(distance * 31.0, 2.0));
  return vec2(glyph * trail * gap, glyph * headLight * trail * gap);
}

void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.014, 0.055, 0.025), vec3(0.006, 0.036, 0.015), p.y);
  float behind = max(1.0 - smoothstep(0.17, 0.28, p.y),
    mix(u_tuning.w, 1.0, smoothstep(u_textBottom - 0.05,
      u_textBottom + 0.10, p.y)));
  float quiet = 0.62 + 0.38 * smoothstep(0.12, 0.47, abs(p.x - 0.5));
  float shock = 0.0;
  if (u_mistake.x >= 0.0 && u_mistake.x < 0.85) {
    shock = u_mistake.y * 0.012 * sin(u_mistake.x * 34.0) *
      exp(-u_mistake.x * 6.0) * u_motion;
  }
  vec2 distant = codeRain(p + vec2(shock * 0.45, 0.0),
    t, vec2(70.0, 46.0), 0.0);
  vec2 nearby = codeRain(p + vec2(shock, 0.0),
    t, vec2(43.0, 29.0), 1.0);
  color += vec3(0.035, 0.23, 0.065) * distant.x * behind * quiet;
  color += vec3(0.055, 0.51, 0.10) * nearby.x * u_tuning.x * behind * quiet;
  color += vec3(0.38, 0.76, 0.39) * nearby.y * u_tuning.z * behind * quiet;
  color += vec3(0.030, 0.19, 0.055) * flowWake(p) * behind;
  gl_FragColor = vec4(color, 1.0);
}`;

const 오로라 = `${공통}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y);
  float t = u_time * u_motion;
  vec3 color = mix(vec3(0.018, 0.035, 0.065), vec3(0.014, 0.029, 0.053), p.y);
  float presence = u_flow.z * exp(-pow((p.x - u_flow.x) * 3.2, 2.0) -
    pow((p.y - u_flow.y) * 3.5, 2.0));
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
  청보리,
  폭포,
  커피,
  촛불,
  매트릭스,
  빗방울: 비,
  구름,
  모닥불: 불,
  인센스,
  오로라,
  별똥별,
};
