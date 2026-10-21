import savedMasks from './assets/key-masks.json';
import { Bitmap, hasPixel, setPixel, upscaleGlyph } from './font-editor';
import { 한글글꼴 } from './fonts';
import { MaskSet, clampMasks, validMasks } from './key-mask';

const STORAGE_KEY = 'hallatype-key-mask-editor-v2';

/** The exported file is the shared default; an edited browser draft takes effect on the next practice run. */
export function practiceMasks(storage?: Pick<Storage, 'getItem'>): MaskSet {
    const bundled: unknown = savedMasks.masks;
    if (!validMasks(bundled)) { throw new Error('앱에 포함된 키 마스크가 잘못되었습니다.'); }
    if (storage) {
        try {
            const raw = storage.getItem(STORAGE_KEY);
            const draft: unknown = raw ? JSON.parse(raw) : null;
            if (validMasks(draft)) { return clampMasks(draft, 한글글꼴); }
        } catch (_) { /* 저장소를 사용할 수 없으면 포함된 마스크를 사용한다. */ }
    }
    return clampMasks(bundled, 한글글꼴);
}

/** First-key ownership of a 32×32 glyph, including its antialiasing fringe. */
export function expandedMask(first16: Bitmap, glyph32: Bitmap): Bitmap {
    const first32 = upscaleGlyph(first16).map((row, y) => (row & glyph32[y]) >>> 0);
    const owner = first32.slice();
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
            if (hasPixel(glyph32, 32, x, y)) { continue; }
            let first = 0;
            let second = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (!hasPixel(glyph32, 32, nx, ny)) { continue; }
                    if (hasPixel(first32, 32, nx, ny)) { first++; } else { second++; }
                }
            }
            if (first > 0 && first >= second) { setPixel(owner, 32, x, y, true); }
        }
    }
    return owner;
}
