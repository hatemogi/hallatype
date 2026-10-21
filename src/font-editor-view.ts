import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {
    AlphaGlyph, alphaAt, antialiasFont, antialiasGlyph, Bitmap, cloneFont,
    exportAlphaFont, exportFnt, FontSize, glyphIndex, hasPixel, importAlphaFont,
    importFnt, paintAlphaText, paintBitmap, paintText, Part, PARTS,
    previewSyllable, regenerateAutomaticFonts, setPixel, syllableSelection, upscaleFont, upscaleGlyph, validAlphaFont,
} from './font-editor';

type EditorPane = FontSize | 'aa';

interface EditorState {
    source: Bitmap[];
    target: Bitmap[];
    alpha: AlphaGlyph[];
    manual32: boolean[];
    manualAA: boolean[];
}

const validFont = (value: unknown, size: FontSize): value is Bitmap[] =>
    Array.isArray(value) && value.length === 348 && value.every((rows) =>
        Array.isArray(rows) && rows.length === size && rows.every((row: unknown) =>
            Number.isInteger(row) && Number(row) >= 0 && Number(row) <= (size === 32 ? 0xffffffff : 0xffff)));

const validManual = (value: unknown): value is boolean[] =>
    Array.isArray(value) && value.length === 348 && value.every((flag) => typeof flag === 'boolean');

export default defineComponent({
    setup() {
        const part = ref<Part>('cho');
        const variant = ref(0);
        const jamo = ref(0);
        const tool = ref<'draw' | 'erase'>('draw');
        const alphaBrush = ref(192);
        const font16 = ref<Bitmap[]>(cloneFont());
        const font32 = ref<Bitmap[]>(upscaleFont(font16.value));
        const fontAA = ref<AlphaGlyph[]>(antialiasFont(font32.value));
        const manual32 = ref<boolean[]>(Array(348).fill(false));
        const manualAA = ref<boolean[]>(Array(348).fill(false));
        const undoStack = ref<EditorState[]>([]);
        const redoStack = ref<EditorState[]>([]);
        const sampleCharacter = ref('가');
        const sampleText = ref('한글을 한 점씩, 새롭게 그리다.\n가나다라마바사 아자차카타파하');
        const colors = ref(['#183b66', '#f39b52', '#e45e64']);
        const status = ref('16×16 원본에서 32×32와 8비트 글꼴을 자동 생성했습니다');
        const message = ref('');
        const canvas16 = ref<HTMLCanvasElement | null>(null);
        const canvas32 = ref<HTMLCanvasElement | null>(null);
        const canvasAA = ref<HTMLCanvasElement | null>(null);
        const selectedGlyphCanvas = ref<HTMLCanvasElement | null>(null);
        const composition16 = ref<HTMLCanvasElement | null>(null);
        const composition32 = ref<HTMLCanvasElement | null>(null);
        const compositionAA = ref<HTMLCanvasElement | null>(null);
        const composition16Mono = ref<HTMLCanvasElement | null>(null);
        const composition32Mono = ref<HTMLCanvasElement | null>(null);
        const compositionAAMono = ref<HTMLCanvasElement | null>(null);
        const text16 = ref<HTMLCanvasElement | null>(null);
        const text32 = ref<HTMLCanvasElement | null>(null);
        const textAA = ref<HTMLCanvasElement | null>(null);
        const text16Mono = ref<HTMLCanvasElement | null>(null);
        const text32Mono = ref<HTMLCanvasElement | null>(null);
        const textAAMono = ref<HTMLCanvasElement | null>(null);
        const text32Physical = ref<HTMLCanvasElement | null>(null);
        const textAAPhysical = ref<HTMLCanvasElement | null>(null);
        const pixelRatio = ref(1);
        const displayedPixelRatio = computed(() => Number(pixelRatio.value.toFixed(2)));
        const physicalGlyphCssSize = computed(() => Number((32 / pixelRatio.value).toFixed(1)));
        const fileInput = ref<HTMLInputElement | null>(null);
        let draggingPane: EditorPane | null = null;
        let strokeValue = true;
        let strokeAlpha = 255;
        let strokeSnapshotTaken = false;
        let toastTimer = 0;
        let saveTimer = 0;

        const partInfo = computed(() => PARTS[part.value]);
        const partOptions = [
            { key: 'cho' as Part, label: '초성', count: '19 × 8' },
            { key: 'jung' as Part, label: '중성', count: '21 × 4' },
            { key: 'jong' as Part, label: '종성', count: '27 × 4' },
        ];
        const selectedLabel = computed(() => partInfo.value.labels[jamo.value]);
        const currentName = computed(() => `${part.value}_${jamo.value + (part.value === 'jong' ? 1 : 0)}_${variant.value}`);
        const currentIndex = computed(() => glyphIndex(part.value, variant.value, jamo.value));
        const rows16 = computed(() => font16.value[currentIndex.value]);
        const rows32 = computed(() => font32.value[currentIndex.value]);
        const pixelsAA = computed(() => fontAA.value[currentIndex.value]);
        const isCustomized = computed(() => manual32.value[currentIndex.value]);
        const isAACustomized = computed(() => manualAA.value[currentIndex.value]);
        const countPixels = (rows: Bitmap) => rows.reduce((count, row) => count + (row >>> 0).toString(2).replace(/0/g, '').length, 0);
        const pixelCount16 = computed(() => countPixels(rows16.value));
        const pixelCount32 = computed(() => countPixels(rows32.value));
        const selection = computed(() => syllableSelection(sampleCharacter.value));
        const compositionItems = computed(() => {
            const s = selection.value;
            return [
                { part: 'cho' as Part, label: '초성', jamo: s ? PARTS.cho.labels[s.cho[1]] : '—', selection: s ? s.cho : null },
                { part: 'jung' as Part, label: '중성', jamo: s ? PARTS.jung.labels[s.jung[1]] : '—', selection: s ? s.jung : null },
                { part: 'jong' as Part, label: '종성', jamo: s && s.jong ? PARTS.jong.labels[s.jong[1]] : '—', selection: s ? s.jong : null },
            ];
        });

        function drawGrid(ctx: CanvasRenderingContext2D, size: FontSize) {
            const cell = 512 / size;
            ctx.strokeStyle = size === 16 ? '#dfe5e6' : '#e8edeb';
            ctx.lineWidth = 1;
            for (let i = 0; i <= size; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cell + .5, 0); ctx.lineTo(i * cell + .5, 512);
                ctx.moveTo(0, i * cell + .5); ctx.lineTo(512, i * cell + .5);
                ctx.stroke();
            }
            ctx.strokeStyle = '#a7bbc5';
            ctx.beginPath();
            ctx.moveTo(256.5, 0); ctx.lineTo(256.5, 512);
            ctx.moveTo(0, 256.5); ctx.lineTo(512, 256.5); ctx.stroke();
        }
        function drawBoard(canvas: HTMLCanvasElement | null, rows: Bitmap, size: FontSize) {
            if (!canvas) { return; }
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            const cell = 512 / size;
            ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = size === 16 ? '#42637c' : '#263e57';
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (hasPixel(rows, size, x, y)) { ctx.fillRect(x * cell, y * cell, cell, cell); }
                }
            }
            drawGrid(ctx, size);
        }
        function drawAABoard(canvas: HTMLCanvasElement | null, glyph: AlphaGlyph) {
            if (!canvas) { return; }
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, 512, 512);
            for (let y = 0; y < 32; y++) {
                for (let x = 0; x < 32; x++) {
                    const alpha = alphaAt(glyph, x, y);
                    if (!alpha) { continue; }
                    ctx.fillStyle = `rgba(38, 62, 87, ${alpha / 255})`;
                    ctx.fillRect(x * 16, y * 16, 16, 16);
                }
            }
            drawGrid(ctx, 32);
        }
        function renderBoards() {
            drawBoard(canvas16.value, rows16.value, 16);
            drawBoard(canvas32.value, rows32.value, 32);
            drawAABoard(canvasAA.value, pixelsAA.value);
        }
        function bodyCanvasHeight(fontSize: FontSize) {
            let lines = 1;
            let x = 0;
            for (const character of sampleText.value) {
                if (character === '\n') { lines++; x = 0; continue; }
                const width = syllableSelection(character) ? fontSize : fontSize / 2;
                if (x + width > 900 && x > 0) { lines++; x = 0; }
                x += width;
            }
            const lineHeight = Math.round(fontSize * 1.3125);
            return Math.max(72, lines * lineHeight + 12);
        }
        function renderPreviews() {
            const colorsNow = colors.value as [string, string, string];
            const black: [string, string, string] = ['#000000', '#000000', '#000000'];
            pixelRatio.value = window.devicePixelRatio || 1;
            const selected = selectedGlyphCanvas.value;
            if (selected) {
                const ctx = selected.getContext('2d') as CanvasRenderingContext2D;
                ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, selected.width, selected.height);
                paintBitmap(ctx, rows32.value, 0, 0, colorsNow[{ cho: 0, jung: 1, jong: 2 }[part.value]], 3, 32);
            }
            const samples = [
                [composition16.value, font16.value, 16, 8, colorsNow, '#f7f5ee'],
                [composition32.value, font32.value, 32, 4, colorsNow, '#f7f5ee'],
                [composition16Mono.value, font16.value, 16, 8, black, '#ffffff'],
                [composition32Mono.value, font32.value, 32, 4, black, '#ffffff'],
            ] as const;
            for (const [canvas, font, size, scale, palette, background] of samples) {
                if (!canvas) { continue; }
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
                if (selection.value) { paintText(ctx, font, sampleCharacter.value, palette, scale, canvas.width, size); }
            }
            for (const [canvas, palette, background] of [
                [compositionAA.value, colorsNow, '#f7f5ee'],
                [compositionAAMono.value, black, '#ffffff'],
            ] as const) {
                if (!canvas) { continue; }
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
                if (selection.value) { paintAlphaText(ctx, fontAA.value, sampleCharacter.value, palette, 4, canvas.width); }
            }
            const bodies = [
                [text16.value, font16.value, 16, colorsNow, '#fffdf7'],
                [text32.value, font32.value, 32, colorsNow, '#fffdf7'],
                [text16Mono.value, font16.value, 16, black, '#ffffff'],
                [text32Mono.value, font32.value, 32, black, '#ffffff'],
            ] as const;
            for (const [canvas, font, size, palette, background] of bodies) {
                if (!canvas) { continue; }
                canvas.height = bodyCanvasHeight(size);
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
                paintText(ctx, font, sampleText.value, palette, 1, canvas.width, size);
            }
            for (const [canvas, palette, background] of [
                [textAA.value, colorsNow, '#fffdf7'],
                [textAAMono.value, black, '#ffffff'],
            ] as const) {
                if (!canvas) { continue; }
                canvas.height = bodyCanvasHeight(32);
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
                paintAlphaText(ctx, fontAA.value, sampleText.value, palette, 1, canvas.width);
            }
            for (const [canvas, antialias] of [
                [text32Physical.value, false],
                [textAAPhysical.value, true],
            ] as const) {
                if (!canvas) { continue; }
                canvas.height = bodyCanvasHeight(32);
                canvas.style.width = `${canvas.width / pixelRatio.value}px`;
                canvas.style.height = `${canvas.height / pixelRatio.value}px`;
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                if (antialias) { paintAlphaText(ctx, fontAA.value, sampleText.value, black, 1, canvas.width); }
                else { paintText(ctx, font32.value, sampleText.value, black, 1, canvas.width, 32); }
            }
        }
        function renderAll() { renderBoards(); renderPreviews(); }
        function showSelectedGlyphInComposition() {
            const selected = selection.value?.[part.value];
            if (selected?.[0] !== variant.value || selected?.[1] !== jamo.value) {
                sampleCharacter.value = previewSyllable(part.value, variant.value, jamo.value);
            }
        }
        function selectPart(nextPart: Part) { part.value = nextPart; variant.value = 0; jamo.value = 0; showSelectedGlyphInComposition(); nextTick(renderAll); }
        function selectVariant(nextVariant: number) { variant.value = nextVariant; showSelectedGlyphInComposition(); renderAll(); }
        function selectJamo(nextJamo: number) { jamo.value = nextJamo; showSelectedGlyphInComposition(); renderAll(); }
        function jumpTo(nextPart: Part) {
            const s = selection.value && selection.value[nextPart];
            if (!s) { return; }
            part.value = nextPart; variant.value = s[0]; jamo.value = s[1]; nextTick(renderAll);
        }
        function onSampleChange() { sampleCharacter.value = Array.from(sampleCharacter.value)[0] || ''; nextTick(renderPreviews); }

        function capture(): EditorState {
            return {
                source: font16.value.map((rows) => rows.slice()),
                target: font32.value.map((rows) => rows.slice()),
                alpha: fontAA.value.map((glyph) => glyph.slice()),
                manual32: manual32.value.slice(),
                manualAA: manualAA.value.slice(),
            };
        }
        function snapshot() {
            undoStack.value.push(capture());
            if (undoStack.value.length > 15) { undoStack.value.shift(); }
            redoStack.value = [];
        }
        function persist() {
            try {
                localStorage.setItem('hallatype-font-editor-v7', JSON.stringify({
                    source: font16.value, target: font32.value, alpha: fontAA.value,
                    manual32: manual32.value, manualAA: manualAA.value,
                }));
            } catch (_) { status.value = '자동 저장 공간이 부족합니다 · 파일로 내보내세요'; }
        }
        function changed() {
            status.value = '편집 중 · 이 브라우저에 자동 저장';
            showSelectedGlyphInComposition();
            renderAll();
            window.clearTimeout(saveTimer);
            saveTimer = window.setTimeout(persist, 250);
        }
        function restore(state: EditorState) {
            font16.value = state.source;
            font32.value = state.target;
            fontAA.value = state.alpha;
            manual32.value = state.manual32;
            manualAA.value = state.manualAA;
            changed();
        }
        function undo() {
            const previous = undoStack.value.pop(); if (!previous) { return; }
            redoStack.value.push(capture()); restore(previous);
        }
        function redo() {
            const next = redoStack.value.pop(); if (!next) { return; }
            undoStack.value.push(capture()); restore(next);
        }
        function canvasForPane(pane: EditorPane) {
            return pane === 16 ? canvas16.value : pane === 32 ? canvas32.value : canvasAA.value;
        }
        function cellFromEvent(event: PointerEvent, pane: EditorPane): [number, number] | null {
            const canvas = canvasForPane(pane);
            if (!canvas) { return null; }
            const rect = canvas.getBoundingClientRect();
            const size = pane === 16 ? 16 : 32;
            const x = Math.floor((event.clientX - rect.left) / rect.width * size);
            const y = Math.floor((event.clientY - rect.top) / rect.height * size);
            return x >= 0 && x < size && y >= 0 && y < size ? [x, y] : null;
        }
        function applyPointer(event: PointerEvent, pane: EditorPane) {
            const cell = cellFromEvent(event, pane);
            if (!cell) { return; }
            const [x, y] = cell;
            if (pane === 'aa') {
                const glyph = pixelsAA.value;
                if (alphaAt(glyph, x, y) === strokeAlpha) { return; }
                if (!strokeSnapshotTaken) { snapshot(); strokeSnapshotTaken = true; }
                glyph[y * 32 + x] = strokeAlpha;
                manualAA.value[currentIndex.value] = true;
            } else {
                const rows = pane === 16 ? rows16.value : rows32.value;
                if (hasPixel(rows, pane, x, y) === strokeValue) { return; }
                if (!strokeSnapshotTaken) { snapshot(); strokeSnapshotTaken = true; }
                setPixel(rows, pane, x, y, strokeValue);
                if (pane === 16 && !manual32.value[currentIndex.value]) {
                    font32.value.splice(currentIndex.value, 1, upscaleGlyph(rows16.value));
                }
                if (pane === 32) { manual32.value[currentIndex.value] = true; }
                if (!manualAA.value[currentIndex.value] && (pane === 32 || !manual32.value[currentIndex.value])) {
                    fontAA.value.splice(currentIndex.value, 1, antialiasGlyph(rows32.value));
                }
            }
            changed();
        }
        function startStroke(event: PointerEvent, pane: EditorPane) {
            event.preventDefault();
            draggingPane = pane; strokeSnapshotTaken = false;
            strokeValue = event.button === 2 ? false : tool.value === 'draw';
            strokeAlpha = strokeValue ? Number(alphaBrush.value) : 0;
            canvasForPane(pane)?.setPointerCapture(event.pointerId);
            applyPointer(event, pane);
        }
        function moveStroke(event: PointerEvent, pane: EditorPane) {
            if (draggingPane === pane) { applyPointer(event, pane); }
        }
        function endStroke() { draggingPane = null; }
        function clearGlyph(pane: EditorPane) {
            if (pane === 'aa') {
                if (!pixelsAA.value.some(Boolean)) { return; }
                snapshot();
                fontAA.value.splice(currentIndex.value, 1, Array(1024).fill(0));
                manualAA.value[currentIndex.value] = true;
            } else {
                const rows = pane === 16 ? rows16.value : rows32.value;
                if (!rows.some(Boolean)) { return; }
                snapshot();
                if (pane === 16) {
                    font16.value.splice(currentIndex.value, 1, Array(16).fill(0));
                    if (!manual32.value[currentIndex.value]) {
                        font32.value.splice(currentIndex.value, 1, Array(32).fill(0));
                    }
                } else {
                    font32.value.splice(currentIndex.value, 1, Array(32).fill(0));
                    manual32.value[currentIndex.value] = true;
                }
                if (!manualAA.value[currentIndex.value] && (pane === 32 || !manual32.value[currentIndex.value])) {
                    fontAA.value.splice(currentIndex.value, 1, antialiasGlyph(rows32.value));
                }
            }
            changed();
        }
        function regenerateSelected() {
            const generated = upscaleGlyph(rows16.value);
            if (!manual32.value[currentIndex.value] && generated.every((row, y) => row === rows32.value[y])) { return; }
            snapshot();
            font32.value.splice(currentIndex.value, 1, generated);
            manual32.value[currentIndex.value] = false;
            if (!manualAA.value[currentIndex.value]) {
                fontAA.value.splice(currentIndex.value, 1, antialiasGlyph(generated));
            }
            changed(); toast('32×32 글꼴을 원본에서 다시 만들었습니다');
        }
        function regenerateAA() {
            const generated = antialiasGlyph(rows32.value);
            if (!manualAA.value[currentIndex.value] && generated.every((alpha, index) => alpha === pixelsAA.value[index])) { return; }
            snapshot();
            fontAA.value.splice(currentIndex.value, 1, generated);
            manualAA.value[currentIndex.value] = false;
            changed(); toast('8비트 글꼴을 32×32 확대본에서 다시 만들었습니다');
        }
        function regenerateAll() {
            snapshot();
            font32.value = upscaleFont(font16.value);
            fontAA.value = antialiasFont(font32.value);
            manual32.value = Array(348).fill(false);
            manualAA.value = Array(348).fill(false);
            changed(); toast('348개 자소의 32×32와 8비트 글꼴을 모두 다시 만들었습니다');
        }
        function onKeydown(event: KeyboardEvent) {
            const target = event.target as HTMLElement;
            if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) { return; }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault(); event.shiftKey ? redo() : undo();
            } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
                event.preventDefault(); redo();
            } else if (event.key.toLowerCase() === 'b') { tool.value = 'draw'; }
            else if (event.key.toLowerCase() === 'e') { tool.value = 'erase'; }
        }
        function toast(text: string) {
            message.value = text; window.clearTimeout(toastTimer);
            toastTimer = window.setTimeout(() => message.value = '', 3500);
        }
        function openFile() { fileInput.value?.click(); }
        async function loadFile(event: Event) {
            const input = event.target as HTMLInputElement;
            const file = input.files && input.files[0]; if (!file) { return; }
            try {
                const source = await file.text();
                if (source.trimStart().startsWith('{')) {
                    const imported = importAlphaFont(source);
                    snapshot();
                    fontAA.value = imported;
                    manualAA.value = Array(348).fill(true);
                    changed(); toast('32×32 8비트 글꼴을 불러왔습니다');
                } else {
                    const size: FontSize = /^cho_0_0 32 0\s/m.test(source) ? 32 : 16;
                    const imported = importFnt(source, size);
                    snapshot();
                    if (size === 16) {
                        font16.value = imported;
                        font32.value = upscaleFont(imported);
                        manual32.value = Array(348).fill(false);
                    } else {
                        font32.value = imported;
                        manual32.value = Array(348).fill(true);
                    }
                    fontAA.value = antialiasFont(font32.value);
                    manualAA.value = Array(348).fill(false);
                    changed(); toast(`${size}×${size} 글꼴을 불러왔습니다`);
                }
            } catch (error) { toast(`불러오기 실패: ${(error as Error).message}`); }
            input.value = '';
        }
        function download(name: string, data: string, type: string) {
            const blob = new Blob([data], { type });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = name; link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        function downloadFont(size: FontSize) {
            download(`hangul-jamo-${size}x${size}.fnt`, exportFnt(size === 16 ? font16.value : font32.value, size), 'text/plain;charset=utf-8');
            toast(`${size}×${size} 글꼴 파일을 내보냈습니다`);
        }
        function downloadAA() {
            download('hangul-jamo-32x32-alpha.json', exportAlphaFont(fontAA.value), 'application/json;charset=utf-8');
            toast('32×32 8비트 글꼴 파일을 내보냈습니다');
        }

        onMounted(() => {
            let migrated = false;
            try {
                const saved = localStorage.getItem('hallatype-font-editor-v7');
                if (saved) {
                    const state: EditorState = JSON.parse(saved);
                    if (validFont(state.source, 16) && validFont(state.target, 32) &&
                        validAlphaFont(state.alpha) && validManual(state.manual32) && validManual(state.manualAA)) {
                        font16.value = state.source; font32.value = state.target; fontAA.value = state.alpha;
                        manual32.value = state.manual32; manualAA.value = state.manualAA;
                        status.value = '저장된 세 단계 글꼴 작업을 복원했습니다';
                    }
                } else {
                    const previousModern = localStorage.getItem('hallatype-font-editor-v6') ||
                        localStorage.getItem('hallatype-font-editor-v5') ||
                        localStorage.getItem('hallatype-font-editor-v4') ||
                        localStorage.getItem('hallatype-font-editor-v3');
                    if (previousModern) {
                        const state: EditorState = JSON.parse(previousModern);
                        if (validFont(state.source, 16) && validFont(state.target, 32) &&
                            validAlphaFont(state.alpha) && validManual(state.manual32) && validManual(state.manualAA)) {
                            const refreshed = regenerateAutomaticFonts(state.source, state.target, state.alpha,
                                state.manual32, state.manualAA);
                            font16.value = state.source;
                            font32.value = refreshed.target;
                            fontAA.value = refreshed.alpha;
                            manual32.value = state.manual32; manualAA.value = state.manualAA;
                            status.value = '자동 생성 자소를 현재 계단 메우기 규칙과 약한 안티앨리어싱으로 갱신했습니다';
                            migrated = true;
                        }
                    } else {
                        const previousV2 = localStorage.getItem('hallatype-font-editor-v2');
                        if (previousV2) {
                            const state: { source: unknown; target: unknown; manual: unknown } = JSON.parse(previousV2);
                            if (validFont(state.source, 16) && validFont(state.target, 32) && validManual(state.manual)) {
                                const oldSource = state.source;
                                const oldManual = state.manual;
                                font16.value = oldSource;
                                font32.value = state.target.map((rows, index) => oldManual[index] ? rows : upscaleGlyph(oldSource[index]));
                                manual32.value = oldManual;
                                fontAA.value = antialiasFont(font32.value);
                                status.value = '기존 32×32 수동 작업을 보존하고 세 단계로 확장했습니다';
                                migrated = true;
                            }
                        } else {
                            const old = localStorage.getItem('hallatype-font-editor-v1');
                            if (old) {
                                const source: unknown = JSON.parse(old);
                                if (validFont(source, 16)) {
                                    font16.value = source;
                                    font32.value = upscaleFont(source);
                                    fontAA.value = antialiasFont(font32.value);
                                    status.value = '기존 16×16 작업을 세 단계로 확장했습니다';
                                    migrated = true;
                                }
                            }
                        }
                    }
                }
            } catch (_) { status.value = '16×16 원본에서 세 단계 글꼴을 자동 생성했습니다'; }
            if (migrated) { persist(); }
            renderAll(); window.addEventListener('keydown', onKeydown);
            window.addEventListener('resize', renderPreviews);
        });
        onBeforeUnmount(() => {
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('resize', renderPreviews);
            window.clearTimeout(toastTimer); window.clearTimeout(saveTimer);
        });
        return {
            part, variant, jamo, tool, alphaBrush, font16, font32, fontAA, manual32, manualAA, undoStack, redoStack,
            sampleCharacter, sampleText, colors, status, message, canvas16, canvas32, canvasAA, selectedGlyphCanvas,
            composition16, composition32, compositionAA, composition16Mono, composition32Mono, compositionAAMono,
            text16, text32, textAA, text16Mono, text32Mono, textAAMono, text32Physical, textAAPhysical,
            displayedPixelRatio, physicalGlyphCssSize, fileInput, partInfo, partOptions, selectedLabel,
            currentName, rows16, rows32, pixelsAA, isCustomized, isAACustomized, pixelCount16, pixelCount32,
            selection, compositionItems, selectPart, selectVariant, selectJamo, jumpTo,
            onSampleChange, startStroke, moveStroke, endStroke, clearGlyph, regenerateSelected, regenerateAA, regenerateAll,
            undo, redo, renderPreviews, openFile, loadFile, downloadFont, downloadAA,
        };
    },
});
