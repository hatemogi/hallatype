import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {
    Bitmap, cloneFont, exportFnt, glyphIndex, hasPixel, importFnt, paintText, Part, PARTS,
    setPixel, syllableSelection, upscaleFont, upscaleGlyph, FontSize,
} from './font-editor';

interface EditorState {
    source: Bitmap[];
    target: Bitmap[];
    manual: boolean[];
}

const validFont = (value: unknown, size: FontSize): value is Bitmap[] =>
    Array.isArray(value) && value.length === 348 && value.every((rows) =>
        Array.isArray(rows) && rows.length === size && rows.every((row: unknown) =>
            Number.isInteger(row) && Number(row) >= 0 && Number(row) <= (size === 32 ? 0xffffffff : 0xffff)));

export default defineComponent({
    setup() {
        const part = ref<Part>('cho');
        const variant = ref(0);
        const jamo = ref(0);
        const tool = ref<'draw' | 'erase'>('draw');
        const font16 = ref<Bitmap[]>(cloneFont());
        const font32 = ref<Bitmap[]>(upscaleFont(font16.value));
        const manual32 = ref<boolean[]>(Array(348).fill(false));
        const undoStack = ref<EditorState[]>([]);
        const redoStack = ref<EditorState[]>([]);
        const sampleCharacter = ref('한');
        const sampleText = ref('한글을 한 점씩, 새롭게 그리다.\n가나다라마바사 아자차카타파하');
        const colors = ref(['#183b66', '#f39b52', '#e45e64']);
        const status = ref('16×16 원본에서 32×32를 자동 생성했습니다');
        const message = ref('');
        const canvas16 = ref<HTMLCanvasElement | null>(null);
        const canvas32 = ref<HTMLCanvasElement | null>(null);
        const compositionCanvas = ref<HTMLCanvasElement | null>(null);
        const textCanvas = ref<HTMLCanvasElement | null>(null);
        const fileInput = ref<HTMLInputElement | null>(null);
        let draggingSize: FontSize | null = null;
        let strokeValue = true;
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
        const isCustomized = computed(() => manual32.value[currentIndex.value]);
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
        function renderBoards() {
            drawBoard(canvas16.value, rows16.value, 16);
            drawBoard(canvas32.value, rows32.value, 32);
        }
        function renderPreviews() {
            const composition = compositionCanvas.value;
            const text = textCanvas.value;
            if (!composition || !text) { return; }
            const ctx = composition.getContext('2d') as CanvasRenderingContext2D;
            ctx.fillStyle = '#f7f5ee'; ctx.fillRect(0, 0, composition.width, composition.height);
            if (selection.value) {
                paintText(ctx, font32.value, sampleCharacter.value, colors.value as [string, string, string], 4, composition.width, 32);
            }
            const textCtx = text.getContext('2d') as CanvasRenderingContext2D;
            textCtx.fillStyle = '#fffdf7'; textCtx.fillRect(0, 0, text.width, text.height);
            paintText(textCtx, font32.value, sampleText.value, colors.value as [string, string, string], 2, text.width, 32);
        }
        function renderAll() { renderBoards(); renderPreviews(); }
        function selectPart(nextPart: Part) { part.value = nextPart; variant.value = 0; jamo.value = 0; nextTick(renderAll); }
        function selectVariant(nextVariant: number) { variant.value = nextVariant; renderAll(); }
        function selectJamo(nextJamo: number) { jamo.value = nextJamo; renderAll(); }
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
                manual: manual32.value.slice(),
            };
        }
        function snapshot() {
            undoStack.value.push(capture());
            if (undoStack.value.length > 30) { undoStack.value.shift(); }
            redoStack.value = [];
        }
        function changed() {
            status.value = '편집 중 · 이 브라우저에 자동 저장';
            renderAll();
            window.clearTimeout(saveTimer);
            saveTimer = window.setTimeout(() => {
                try {
                    localStorage.setItem('hallatype-font-editor-v2', JSON.stringify({
                        source: font16.value, target: font32.value, manual: manual32.value,
                    }));
                } catch (_) { status.value = '자동 저장 공간이 부족합니다 · 파일로 내보내세요'; }
            }, 250);
        }
        function restore(state: EditorState) {
            font16.value = state.source;
            font32.value = state.target;
            manual32.value = state.manual;
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
        function cellFromEvent(event: PointerEvent, size: FontSize): [number, number] | null {
            const canvas = size === 16 ? canvas16.value : canvas32.value;
            if (!canvas) { return null; }
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / rect.width * size);
            const y = Math.floor((event.clientY - rect.top) / rect.height * size);
            return x >= 0 && x < size && y >= 0 && y < size ? [x, y] : null;
        }
        function applyPointer(event: PointerEvent, size: FontSize) {
            const cell = cellFromEvent(event, size);
            if (!cell) { return; }
            const [x, y] = cell;
            const rows = size === 16 ? rows16.value : rows32.value;
            if (hasPixel(rows, size, x, y) === strokeValue) { return; }
            if (!strokeSnapshotTaken) { snapshot(); strokeSnapshotTaken = true; }
            setPixel(rows, size, x, y, strokeValue);
            if (size === 16 && !manual32.value[currentIndex.value]) {
                font32.value.splice(currentIndex.value, 1, upscaleGlyph(rows16.value));
            }
            if (size === 32) { manual32.value[currentIndex.value] = true; }
            changed();
        }
        function startStroke(event: PointerEvent, size: FontSize) {
            event.preventDefault();
            draggingSize = size; strokeSnapshotTaken = false;
            strokeValue = event.button === 2 ? false : tool.value === 'draw';
            (size === 16 ? canvas16.value : canvas32.value)?.setPointerCapture(event.pointerId);
            applyPointer(event, size);
        }
        function moveStroke(event: PointerEvent, size: FontSize) {
            if (draggingSize === size) { applyPointer(event, size); }
        }
        function endStroke() { draggingSize = null; }
        function clearGlyph(size: FontSize) {
            const rows = size === 16 ? rows16.value : rows32.value;
            if (!rows.some(Boolean)) { return; }
            snapshot();
            if (size === 16) {
                font16.value.splice(currentIndex.value, 1, Array(16).fill(0));
                if (!manual32.value[currentIndex.value]) {
                    font32.value.splice(currentIndex.value, 1, Array(32).fill(0));
                }
            } else {
                font32.value.splice(currentIndex.value, 1, Array(32).fill(0));
                manual32.value[currentIndex.value] = true;
            }
            changed();
        }
        function regenerateSelected() {
            const generated = upscaleGlyph(rows16.value);
            if (!manual32.value[currentIndex.value] && generated.every((row, y) => row === rows32.value[y])) { return; }
            snapshot();
            font32.value.splice(currentIndex.value, 1, generated);
            manual32.value[currentIndex.value] = false;
            changed(); toast('현재 자소를 16×16 원본에서 다시 만들었습니다');
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
                changed(); toast(`${size}×${size} 글꼴을 불러왔습니다`);
            } catch (error) { toast(`불러오기 실패: ${(error as Error).message}`); }
            input.value = '';
        }
        function downloadFont(size: FontSize) {
            const value = size === 16 ? font16.value : font32.value;
            const blob = new Blob([exportFnt(value, size)], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `hangul-jamo-${size}x${size}.fnt`; link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast(`${size}×${size} 글꼴 파일을 내보냈습니다`);
        }

        onMounted(() => {
            try {
                const saved = localStorage.getItem('hallatype-font-editor-v2');
                if (saved) {
                    const state: EditorState = JSON.parse(saved);
                    if (validFont(state.source, 16) && validFont(state.target, 32) &&
                        Array.isArray(state.manual) && state.manual.length === 348 && state.manual.every((value) => typeof value === 'boolean')) {
                        font16.value = state.source; font32.value = state.target; manual32.value = state.manual;
                        status.value = '저장된 16×16 / 32×32 작업을 복원했습니다';
                    }
                } else {
                    const old = localStorage.getItem('hallatype-font-editor-v1');
                    if (old) {
                        const source: unknown = JSON.parse(old);
                        if (validFont(source, 16)) {
                            font16.value = source; font32.value = upscaleFont(source);
                            status.value = '기존 16×16 작업을 32×32로 확대했습니다';
                        }
                    }
                }
            } catch (_) { status.value = '16×16 원본에서 32×32를 자동 생성했습니다'; }
            renderAll(); window.addEventListener('keydown', onKeydown);
        });
        onBeforeUnmount(() => {
            window.removeEventListener('keydown', onKeydown);
            window.clearTimeout(toastTimer); window.clearTimeout(saveTimer);
        });
        return {
            part, variant, jamo, tool, font16, font32, manual32, undoStack, redoStack,
            sampleCharacter, sampleText, colors, status, message, canvas16, canvas32,
            compositionCanvas, textCanvas, fileInput, partInfo, partOptions, selectedLabel,
            currentName, rows16, rows32, isCustomized, pixelCount16, pixelCount32,
            selection, compositionItems, selectPart, selectVariant, selectJamo, jumpTo,
            onSampleChange, startStroke, moveStroke, endStroke, clearGlyph, regenerateSelected,
            undo, redo, renderPreviews, openFile, loadFile, downloadFont,
        };
    },
});
