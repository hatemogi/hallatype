<template>
  <div class="mask-studio">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">▦</span><div><strong>키별 자소 마스크</strong><small>완성 글꼴의 픽셀을 두 입력 키에 나눕니다</small></div></div>
      <nav class="top-actions" aria-label="도구 이동">
        <router-link to="/">글꼴 편집</router-link>
        <router-link to="/practice">타자 연습</router-link>
        <button @click="openFile">JSON 불러오기</button>
        <button class="primary" @click="downloadMasks">마스크 저장 ↗</button>
        <input ref="fileInput" class="hidden" type="file" accept=".json,application/json" @change="loadFile">
      </nav>
    </header>

    <main class="workspace">
      <aside class="sidebar">
        <span class="eyebrow">KEY MASK EDITOR / 72 GLYPHS</span>
        <h1>한 자소 안의<br><em>두 번의 입력.</em></h1>
        <p class="intro">파란 픽셀은 첫 키, 주황 픽셀은 둘째 키에 속합니다. 완성 자소의 모양은 그대로 유지됩니다.</p>

        <div class="section-title"><span>자소 종류</span><span>{{ part === 'jung' ? '겹모음 7종' : '겹받침 11종' }}</span></div>
        <div class="part-tabs">
          <button :class="{ active: part === 'jung' }" @click="selectPart('jung')">겹모음</button>
          <button :class="{ active: part === 'jong' }" @click="selectPart('jong')">겹받침</button>
        </div>
        <div class="section-title"><span>자소 선택</span><span>{{ compounds.length }}종</span></div>
        <div class="jamo-grid">
          <button v-for="item in compounds" :key="item.jamo" :class="{ active: selectedJamo === item.jamo }" :aria-label="`${item.label}, ${item.first} 다음 ${item.second}`" @click="selectedJamo = item.jamo">{{ item.label }}</button>
        </div>
        <div class="section-title"><span>글꼴 벌</span><span>4가지 모양</span></div>
        <div class="variant-grid">
          <button v-for="n in 4" :key="n" :class="{ active: variant === n - 1 }" @click="variant = n - 1">{{ n }}벌</button>
        </div>
        <p class="sidebar-note">글꼴 편집기에서 저장한 16×16 원본 글꼴을 자동으로 읽습니다. 글꼴을 고친 뒤 이 화면을 다시 열면 새 모양에 맞춰 마스크를 확인할 수 있습니다.</p>
      </aside>

      <section class="main-panel">
        <div class="heading">
          <div><span class="eyebrow">PIXEL OWNERSHIP / {{ selected.label }} · {{ variant + 1 }}벌</span><h2>{{ selected.label }} <small>{{ selected.first }} + {{ selected.second }}</small></h2><p>완성 비트맵의 칠해진 픽셀만 선택할 수 있습니다. 왼쪽 클릭·드래그는 선택한 키로, 오른쪽 클릭·드래그는 둘째 키로 지정합니다.</p></div>
          <span class="source-badge">{{ fontSource }}</span>
        </div>

        <div class="editor-layout">
          <div class="canvas-card">
            <div class="card-heading"><strong>16 × 16 원본 마스크 편집</strong><span>{{ selected.label }} · {{ variant + 1 }}벌</span></div>
            <canvas ref="editCanvas" width="512" height="512" aria-label="첫 키와 둘째 키 픽셀 마스크 편집 화면" @contextmenu.prevent @pointerdown="startStroke" @pointermove="moveStroke" @pointerup="endStroke" @pointercancel="endStroke" @lostpointercapture="endStroke"></canvas>
            <div class="canvas-foot"><span>왼쪽 드래그: 선택한 키</span><span>오른쪽 드래그: 둘째 키</span></div>
          </div>

          <div class="controls">
            <section class="control-card">
              <span class="eyebrow">PAINT / PIXEL OWNER</span>
              <h3>이 픽셀은 어느 키의 몫인가요?</h3>
              <div class="paint-buttons">
                <button :class="['first', { active: brush === 'first' }]" :aria-pressed="brush === 'first'" @click="brush = 'first'"><span>01</span><strong>{{ selected.first }}</strong><small>첫 키 · {{ firstCount }}픽셀</small></button>
                <button :class="['second', { active: brush === 'second' }]" :aria-pressed="brush === 'second'" @click="brush = 'second'"><span>02</span><strong>{{ selected.second }}</strong><small>둘째 키 · {{ secondCount }}픽셀</small></button>
              </div>
              <p class="tip">파란색과 주황색을 합치면 원래 자소와 정확히 같은 비트맵이 됩니다.</p>
            </section>

            <section class="control-card">
              <span class="eyebrow">QUICK ACTIONS</span>
              <h3>초안과 편집 기록</h3>
              <div class="action-grid">
                <button @click="applySuggested">↻ 자동 초안 다시 적용</button>
                <button @click="assignAll('first')">전체를 첫 키로</button>
                <button @click="assignAll('second')">전체를 둘째 키로</button>
                <button :disabled="!undoStack.length" @click="undo">↶ 되돌리기</button>
                <button :disabled="!redoStack.length" @click="redo">↷ 다시하기</button>
              </div>
              <p class="tip">자동 초안은 첫 키의 단독 글꼴을 완성 글꼴에 맞춰 본 결과입니다. 연결된 획은 눈으로 확인해 조정하세요.</p>
            </section>
          </div>
        </div>

        <section class="preview-section">
          <div class="preview-heading"><div><span class="eyebrow">LIVE PREVIEW</span><h3>입력 단계 미리보기</h3></div><span>실제 글꼴 모양으로 확인</span></div>
          <div class="preview-grid">
            <div><strong>① {{ selected.first }} 입력 후</strong><canvas ref="firstCanvas" width="192" height="192" aria-label="첫 키 입력 후 모습"></canvas><small>첫 키에 속한 픽셀</small></div>
            <div><strong>② {{ selected.second }} 입력 후</strong><canvas ref="combinedCanvas" width="192" height="192" aria-label="두 키 입력 후 색상 구분 모습"></canvas><small>두 키의 영역을 합친 모습</small></div>
            <div><strong>원래 완성 글꼴</strong><canvas ref="originalCanvas" width="192" height="192" aria-label="원래 완성 자소 모습"></canvas><small>비교용 원본 비트맵</small></div>
          </div>
        </section>
        <p class="save-status" role="status">{{ status }}</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { Bitmap, cloneFont, hasPixel, setPixel } from '@/font-editor';
import { COMPOUNDS, MaskPart, MaskSet, clampMasks, compoundGlyph, downsampleLegacyMasks, exportMasks, firstMaskFor, importMasks, maskKey, suggestedMasks, validLegacyMasks, validMasks } from '@/key-mask';

type Brush = 'first' | 'second';
type HistoryItem = { key: string; rows: Bitmap };

const STORAGE_KEY = 'hallatype-key-mask-editor-v2';
const LEGACY_STORAGE_KEY = 'hallatype-key-mask-editor-v1';
const part = ref<MaskPart>('jung');
const selectedJamo = ref(16);
const variant = ref(0);
const brush = ref<Brush>('first');
const font = ref<Bitmap[]>(cloneFont());
const masks = ref<MaskSet>({});
const fontSource = ref('기본 16×16 원본');
const status = ref('마스크를 준비하고 있습니다');
const editCanvas = ref<HTMLCanvasElement | null>(null);
const firstCanvas = ref<HTMLCanvasElement | null>(null);
const combinedCanvas = ref<HTMLCanvasElement | null>(null);
const originalCanvas = ref<HTMLCanvasElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const undoStack = ref<HistoryItem[]>([]);
const redoStack = ref<HistoryItem[]>([]);
const compounds = computed(() => COMPOUNDS.filter((item) => item.part === part.value));
const selected = computed(() => compounds.value.find((item) => item.jamo === selectedJamo.value) || compounds.value[0]);
const key = computed(() => maskKey(selected.value, variant.value));
const glyph = computed(() => compoundGlyph(font.value, selected.value, variant.value));
const firstMask = computed(() => masks.value[key.value] || Array<number>(16).fill(0));
const pixelCount = (rows: Bitmap) => rows.reduce((count, row) => count + (row >>> 0).toString(2).replace(/0/g, '').length, 0);
const firstCount = computed(() => pixelCount(firstMask.value));
const secondCount = computed(() => pixelCount(glyph.value) - firstCount.value);
let dragging = false;
let strokeBrush: Brush = 'first';
let strokeRecorded = false;

function selectPart(value: MaskPart) {
  part.value = value;
  selectedJamo.value = COMPOUNDS.find((item) => item.part === value)!.jamo;
}

function selectKey(maskKeyValue: string) {
  const [nextPart, nextVariant, nextJamo] = maskKeyValue.split(':');
  part.value = nextPart as MaskPart;
  variant.value = Number(nextVariant);
  selectedJamo.value = Number(nextJamo);
}

function changeMask(rows: Bitmap) {
  masks.value = { ...masks.value, [key.value]: rows };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masks.value));
    status.value = `${selected.value.label} ${variant.value + 1}벌 마스크를 브라우저에 저장했습니다`;
  } catch (_) { status.value = '자동 저장에 실패했습니다. JSON 파일로 저장해 주세요.'; }
}

function remember() {
  undoStack.value.push({ key: key.value, rows: firstMask.value.slice() });
  if (undoStack.value.length > 100) { undoStack.value.shift(); }
  redoStack.value = [];
}

function replaceSelected(rows: Bitmap) {
  if (rows.every((row, y) => row === firstMask.value[y])) { return; }
  remember();
  changeMask(rows);
}

function assignAll(owner: Brush) {
  replaceSelected(owner === 'first' ? glyph.value.slice() : Array<number>(16).fill(0));
}

function applySuggested() { replaceSelected(firstMaskFor(font.value, selected.value, variant.value)); }

function undo() {
  const item = undoStack.value.pop();
  if (!item) { return; }
  redoStack.value.push({ key: item.key, rows: masks.value[item.key].slice() });
  selectKey(item.key);
  changeMask(item.rows);
}

function redo() {
  const item = redoStack.value.pop();
  if (!item) { return; }
  undoStack.value.push({ key: item.key, rows: masks.value[item.key].slice() });
  selectKey(item.key);
  changeMask(item.rows);
}

function pointerPixel(event: PointerEvent): [number, number] | null {
  const canvas = editCanvas.value;
  if (!canvas) { return null; }
  const box = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - box.left) * 16 / box.width);
  const y = Math.floor((event.clientY - box.top) * 16 / box.height);
  return x >= 0 && x < 16 && y >= 0 && y < 16 ? [x, y] : null;
}

function paint(event: PointerEvent) {
  const pixel = pointerPixel(event);
  if (!pixel) { return; }
  const [x, y] = pixel;
  if (!hasPixel(glyph.value, 16, x, y)) { return; }
  const on = strokeBrush === 'first';
  if (hasPixel(firstMask.value, 16, x, y) === on) { return; }
  if (!strokeRecorded) { remember(); strokeRecorded = true; }
  const rows = firstMask.value.slice();
  setPixel(rows, 16, x, y, on);
  changeMask(rows);
}

function startStroke(event: PointerEvent) {
  if (event.button !== 0 && event.button !== 2) { return; }
  dragging = true;
  strokeRecorded = false;
  strokeBrush = event.button === 2 ? 'second' : brush.value;
  editCanvas.value?.setPointerCapture(event.pointerId);
  paint(event);
}
function moveStroke(event: PointerEvent) { if (dragging) { paint(event); } }
function endStroke() { dragging = false; }

function renderBitmap(canvas: HTMLCanvasElement | null, mode: 'first' | 'combined' | 'original') {
  const ctx = canvas?.getContext('2d');
  if (!ctx || !canvas) { return; }
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / 16;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!hasPixel(glyph.value, 16, x, y)) { continue; }
      const first = hasPixel(firstMask.value, 16, x, y);
      if (mode === 'first' && !first) { continue; }
      ctx.fillStyle = mode === 'original' ? '#263e57' : first ? '#186c95' : '#e87952';
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

function render() {
  const canvas = editCanvas.value;
  const ctx = canvas?.getContext('2d');
  if (!ctx || !canvas) { return; }
  const cell = canvas.width / 16;
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = !hasPixel(glyph.value, 16, x, y) ? '#edf0ec'
        : hasPixel(firstMask.value, 16, x, y) ? '#186c95' : '#e87952';
      ctx.fillRect(x * cell + 1, y * cell + 1, cell - 1, cell - 1);
    }
  }
  renderBitmap(firstCanvas.value, 'first');
  renderBitmap(combinedCanvas.value, 'combined');
  renderBitmap(originalCanvas.value, 'original');
}

function openFile() { fileInput.value?.click(); }
async function loadFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) { return; }
  try {
    const contents = await file.text();
    const imported = importMasks(contents, font.value);
    const legacy = JSON.parse(contents).format === 'hallatype-key-mask-v1';
    masks.value = clampMasks(imported, font.value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masks.value));
    undoStack.value = [];
    redoStack.value = [];
    status.value = legacy
      ? '32×32 마스크를 16×16 원본 픽셀로 변환했습니다. 경계 픽셀을 확인해 주세요.'
      : '16×16 마스크 72개를 불러왔습니다. 현재 글꼴 밖의 픽셀은 제외했습니다.';
  } catch (error) { status.value = `불러오기 실패: ${(error as Error).message}`; }
  input.value = '';
}

function downloadMasks() {
  const data = exportMasks(clampMasks(masks.value, font.value));
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hangul-key-masks-16x16.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.value = '72개 마스크를 JSON 파일로 저장했습니다';
}

watch([part, selectedJamo, variant, masks, font], () => nextTick(render));

onMounted(() => {
  try {
    const savedFont = localStorage.getItem('hallatype-font-editor-v7');
    if (savedFont) {
      const parsed: unknown = JSON.parse(savedFont);
      if (parsed && typeof parsed === 'object' && 'source' in parsed && Array.isArray(parsed.source) &&
          parsed.source.length === 348 && parsed.source.every((rows: unknown) =>
            Array.isArray(rows) && rows.length === 16 && rows.every((row: unknown) =>
              Number.isInteger(row) && Number(row) >= 0 && Number(row) <= 0xffff))) {
        font.value = parsed.source as Bitmap[];
        fontSource.value = '저장된 16×16 원본';
      }
    }
    const savedMasks = localStorage.getItem(STORAGE_KEY);
    const parsedMasks: unknown = savedMasks ? JSON.parse(savedMasks) : null;
    if (validMasks(parsedMasks)) {
      masks.value = clampMasks(parsedMasks, font.value);
      status.value = '저장된 16×16 마스크 72개를 복원했습니다';
    } else {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsedLegacy: unknown = legacy ? JSON.parse(legacy) : null;
      if (validLegacyMasks(parsedLegacy)) {
        masks.value = downsampleLegacyMasks(parsedLegacy, font.value);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(masks.value));
        status.value = '기존 32×32 마스크를 16×16 원본 픽셀로 변환했습니다. 경계 픽셀을 확인해 주세요.';
      } else {
        masks.value = suggestedMasks(font.value);
        status.value = '72개 마스크의 자동 초안을 만들었습니다. 연결된 획을 확인해 주세요.';
      }
    }
  } catch (_) {
    masks.value = suggestedMasks(font.value);
    status.value = '기본 글꼴에서 마스크 초안을 만들었습니다';
  }
  nextTick(render);
});
</script>

<style scoped>
.mask-studio{min-height:100vh;background:#f3f4ef;color:#263e57;font-family:Inter,Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;text-align:left}.topbar{min-height:78px;background:#fffdf8;border-bottom:1px solid #dae1dc;display:flex;align-items:center;justify-content:space-between;padding:12px 38px;gap:20px}.brand{display:flex;align-items:center;gap:13px}.brand-mark{display:grid;place-items:center;width:38px;height:38px;background:#244668;color:#fff;font-size:27px;border-radius:8px}.brand strong{display:block;font-size:16px;letter-spacing:-.04em}.brand small{display:block;color:#82939a;font-size:11px;margin-top:3px}.top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.top-actions a,.top-actions button{font-size:12px;font-weight:700;font-family:inherit;text-decoration:none;border:1px solid #cedbd9;border-radius:8px;padding:10px 13px;background:#fffdf8;color:#355267;cursor:pointer}.top-actions .primary{background:#e87952;color:#fff;border-color:#e87952}.hidden{display:none}.workspace{display:grid;grid-template-columns:275px minmax(0,1fr);max-width:1500px;margin:auto}.sidebar{background:#e9efec;border-right:1px solid #d5e1dc;padding:34px 24px;min-height:calc(100vh - 78px)}.eyebrow{font-size:10px;font-weight:800;color:#72919b;letter-spacing:.14em}.sidebar h1{font-size:28px;line-height:1.25;letter-spacing:-.06em;margin:15px 0 12px}.sidebar h1 em{color:#e87952;font-style:normal}.intro,.sidebar-note{font-size:12px;line-height:1.65;color:#758b91}.intro{margin:0 0 34px}.section-title{display:flex;justify-content:space-between;border-top:1px solid #d1dcd7;padding-top:20px;margin:25px 0 11px;font-size:11px;font-weight:800}.section-title span:last-child{color:#8ca5a6;font-size:10px}.part-tabs,.variant-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.part-tabs button,.variant-grid button,.jamo-grid button{border:1px solid #d1ded8;background:#f8faf6;color:#6c858a;border-radius:8px;cursor:pointer;font-weight:800}.part-tabs button,.variant-grid button{padding:11px}.jamo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.jamo-grid button{aspect-ratio:1;font-size:20px}.part-tabs button.active,.variant-grid button.active{background:#284e6c;border-color:#284e6c;color:#fff}.jamo-grid button.active{background:#f5e3d7;color:#c85f3a;border:2px solid #e87952}.sidebar-note{border-top:1px solid #d1dcd7;margin-top:32px;padding-top:18px}.main-panel{padding:34px 40px 50px;min-width:0}.heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.heading h2{font-size:38px;margin:7px 0;letter-spacing:-.05em}.heading h2 small{font-size:17px;color:#879ca0;font-weight:500}.heading p{font-size:12px;color:#70878d;line-height:1.6;max-width:720px}.source-badge{font-size:11px;font-weight:800;color:#3e7d73;background:#e5f2ea;border:1px solid #cee5d9;border-radius:99px;padding:9px 13px;white-space:nowrap}.editor-layout{display:grid;grid-template-columns:minmax(320px,512px) minmax(260px,1fr);gap:24px;margin-top:25px;align-items:start}.canvas-card,.control-card,.preview-grid>div{background:#fffdf8;border:1px solid #dce4de;border-radius:12px;box-shadow:0 3px 12px #2644630a}.canvas-card{padding:16px}.card-heading,.canvas-foot{display:flex;justify-content:space-between;gap:10px;color:#82989b;font-size:11px}.card-heading strong{color:#35536b;font-size:13px}.canvas-card canvas{display:block;width:100%;max-width:512px;height:auto;aspect-ratio:1;margin:15px auto 10px;border:1px solid #d6dfd9;image-rendering:pixelated;touch-action:none;cursor:crosshair}.canvas-foot{font-size:10px}.controls{display:grid;gap:15px}.control-card{padding:21px}.control-card h3{font-size:18px;letter-spacing:-.04em;margin:8px 0 18px}.paint-buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px}.paint-buttons button{display:grid;text-align:left;border-radius:9px;padding:13px;border:2px solid transparent;cursor:pointer}.paint-buttons button.first{background:#e5f2f7;color:#186c95}.paint-buttons button.second{background:#fff0e6;color:#b25736}.paint-buttons button.active{border-color:currentColor;box-shadow:0 3px 0 #d6e1e1}.paint-buttons span{font-size:10px;font-weight:900}.paint-buttons strong{font-size:29px}.paint-buttons small{font-size:10px;font-weight:700}.tip{font-size:11px;line-height:1.6;color:#86999b;margin:15px 0 0}.action-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.action-grid button{font-size:11px;font-weight:700;color:#4e6d79;background:#f6f9f6;border:1px solid #d8e3dc;border-radius:7px;padding:11px;cursor:pointer}.action-grid button:first-child{grid-column:span 2;background:#e8f4f1;color:#2c6975}.action-grid button:disabled{opacity:.4;cursor:default}.preview-section{border-top:1px solid #dbe5df;margin-top:33px;padding-top:27px}.preview-heading{display:flex;justify-content:space-between;align-items:end}.preview-heading h3{font-size:23px;margin:5px 0 0;letter-spacing:-.04em}.preview-heading>span{font-size:11px;color:#84979a}.preview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:17px}.preview-grid>div{padding:17px;text-align:center}.preview-grid strong{display:block;font-size:12px;text-align:left}.preview-grid canvas{display:block;width:min(100%,192px);height:auto;margin:14px auto;background:#fff;image-rendering:pixelated}.preview-grid small{color:#8c9fa0;font-size:10px}.save-status{font-size:11px;color:#61827e;padding-top:15px}@media(max-width:1050px){.workspace{grid-template-columns:1fr}.sidebar{min-height:auto;border-right:0;border-bottom:1px solid #d5e1dc}.sidebar h1 br{display:none}.editor-layout{grid-template-columns:1fr}.canvas-card{max-width:544px}.main-panel{padding:28px}}@media(max-width:650px){.topbar{padding:13px 18px;align-items:flex-start;flex-direction:column}.sidebar{padding:24px 18px}.main-panel{padding:24px 18px}.editor-layout{grid-template-columns:minmax(0,1fr)}.preview-grid{grid-template-columns:1fr}.heading{display:block}.source-badge{display:inline-block;margin-top:8px}}
</style>
