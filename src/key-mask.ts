import { Bitmap, glyphIndex, hasPixel, setPixel, PARTS } from './font-editor';

export type MaskPart = 'jung' | 'jong';
export type Compound = {
    part: MaskPart;
    jamo: number;
    label: string;
    first: string;
    second: string;
    base: number;
};
export type MaskSet = Record<string, Bitmap>;

export const COMPOUNDS: Compound[] = [
    { part: 'jung', jamo: 9, label: 'ㅘ', first: 'ㅗ', second: 'ㅏ', base: 8 },
    { part: 'jung', jamo: 10, label: 'ㅙ', first: 'ㅗ', second: 'ㅐ', base: 8 },
    { part: 'jung', jamo: 11, label: 'ㅚ', first: 'ㅗ', second: 'ㅣ', base: 8 },
    { part: 'jung', jamo: 14, label: 'ㅝ', first: 'ㅜ', second: 'ㅓ', base: 13 },
    { part: 'jung', jamo: 15, label: 'ㅞ', first: 'ㅜ', second: 'ㅔ', base: 13 },
    { part: 'jung', jamo: 16, label: 'ㅟ', first: 'ㅜ', second: 'ㅣ', base: 13 },
    { part: 'jung', jamo: 19, label: 'ㅢ', first: 'ㅡ', second: 'ㅣ', base: 18 },
    { part: 'jong', jamo: 2, label: 'ㄳ', first: 'ㄱ', second: 'ㅅ', base: 0 },
    { part: 'jong', jamo: 4, label: 'ㄵ', first: 'ㄴ', second: 'ㅈ', base: 3 },
    { part: 'jong', jamo: 5, label: 'ㄶ', first: 'ㄴ', second: 'ㅎ', base: 3 },
    { part: 'jong', jamo: 8, label: 'ㄺ', first: 'ㄹ', second: 'ㄱ', base: 7 },
    { part: 'jong', jamo: 9, label: 'ㄻ', first: 'ㄹ', second: 'ㅁ', base: 7 },
    { part: 'jong', jamo: 10, label: 'ㄼ', first: 'ㄹ', second: 'ㅂ', base: 7 },
    { part: 'jong', jamo: 11, label: 'ㄽ', first: 'ㄹ', second: 'ㅅ', base: 7 },
    { part: 'jong', jamo: 12, label: 'ㄾ', first: 'ㄹ', second: 'ㅌ', base: 7 },
    { part: 'jong', jamo: 13, label: 'ㄿ', first: 'ㄹ', second: 'ㅍ', base: 7 },
    { part: 'jong', jamo: 14, label: 'ㅀ', first: 'ㄹ', second: 'ㅎ', base: 7 },
    { part: 'jong', jamo: 17, label: 'ㅄ', first: 'ㅂ', second: 'ㅅ', base: 16 },
];

export function maskKey(compound: Compound, variant: number): string {
    if (!Number.isInteger(variant) || variant < 0 || variant >= 4) { throw new RangeError('글꼴 벌이 잘못되었습니다.'); }
    return `${compound.part}:${variant}:${compound.jamo}`;
}

export function compoundGlyph(font: Bitmap[], compound: Compound, variant: number): Bitmap {
    return font[glyphIndex(compound.part, variant, compound.jamo)];
}

export function firstMaskFor(font: Bitmap[], compound: Compound, variant: number): Bitmap {
    const target = compoundGlyph(font, compound, variant);
    const base = font[glyphIndex(compound.part, variant, compound.base)];
    const basePixels: Array<[number, number]> = [];
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if (hasPixel(base, 16, x, y)) { basePixels.push([x, y]); }
        }
    }
    let bestScore = -Infinity;
    let bestShift: [number, number] = [0, 0];
    for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
            let shared = 0;
            for (const [x, y] of basePixels) {
                if (hasPixel(target, 16, x + dx, y + dy)) { shared++; }
            }
            const score = shared * 100 - Math.abs(dx) - Math.abs(dy);
            if (score > bestScore) { bestScore = score; bestShift = [dx, dy]; }
        }
    }
    const result = Array<number>(16).fill(0);
    for (const [x, y] of basePixels) {
        const tx = x + bestShift[0];
        const ty = y + bestShift[1];
        if (hasPixel(target, 16, tx, ty)) { setPixel(result, 16, tx, ty, true); }
    }
    return result;
}

export function suggestedMasks(font: Bitmap[]): MaskSet {
    const masks: MaskSet = {};
    for (const compound of COMPOUNDS) {
        for (let variant = 0; variant < PARTS[compound.part].variants; variant++) {
            masks[maskKey(compound, variant)] = firstMaskFor(font, compound, variant);
        }
    }
    return masks;
}

export function clampMasks(masks: MaskSet, font: Bitmap[]): MaskSet {
    const result: MaskSet = {};
    for (const compound of COMPOUNDS) {
        for (let variant = 0; variant < 4; variant++) {
            const key = maskKey(compound, variant);
            const glyph = compoundGlyph(font, compound, variant);
            result[key] = glyph.map((row, y) => ((masks[key]?.[y] || 0) & row) >>> 0);
        }
    }
    return result;
}

function validRows(value: unknown, size: 16 | 32): value is Bitmap {
    return Array.isArray(value) && value.length === size && value.every((row: unknown) =>
        Number.isInteger(row) && Number(row) >= 0 && Number(row) <= (size === 16 ? 0xffff : 0xffffffff));
}

export function exportMasks(masks: MaskSet): string {
    if (!validMasks(masks)) { throw new Error('72개 자소 마스크가 필요합니다.'); }
    return JSON.stringify({ format: 'hallatype-key-mask-v2', size: 16, masks }, null, 2);
}

export function importMasks(source: string, font?: Bitmap[]): MaskSet {
    const value: unknown = JSON.parse(source);
    if (value && typeof value === 'object' && 'format' in value && 'size' in value && 'masks' in value) {
        if (value.format === 'hallatype-key-mask-v2' && value.size === 16 && validMasks(value.masks)) {
            return value.masks;
        }
        if (value.format === 'hallatype-key-mask-v1' && value.size === 32 && validLegacyMasks(value.masks) && font) {
            return downsampleLegacyMasks(value.masks, font);
        }
    }
    throw new Error('올바른 16×16 키 마스크 파일이 아닙니다.');
}

function validMaskSet(value: unknown, size: 16 | 32): value is MaskSet {
    if (!value || typeof value !== 'object' || Array.isArray(value)) { return false; }
    const expected = COMPOUNDS.flatMap((compound) => [0, 1, 2, 3].map((variant) => maskKey(compound, variant)));
    const record = value as Record<string, unknown>;
    return Object.keys(record).length === expected.length && expected.every((key) => validRows(record[key], size));
}

export function validMasks(value: unknown): value is MaskSet {
    return validMaskSet(value, 16);
}

export function validLegacyMasks(value: unknown): value is MaskSet {
    return validMaskSet(value, 32);
}

export function downsampleLegacyMasks(legacy: MaskSet, font: Bitmap[]): MaskSet {
    if (!validLegacyMasks(legacy)) { throw new Error('올바른 32×32 키 마스크가 아닙니다.'); }
    const result: MaskSet = {};
    for (const compound of COMPOUNDS) {
        for (let variant = 0; variant < 4; variant++) {
            const key = maskKey(compound, variant);
            const glyph = compoundGlyph(font, compound, variant);
            const rows = Array<number>(16).fill(0);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    if (!hasPixel(glyph, 16, x, y)) { continue; }
                    let firstPixels = 0;
                    for (let oy = 0; oy < 2; oy++) {
                        for (let ox = 0; ox < 2; ox++) {
                            if (hasPixel(legacy[key], 32, x * 2 + ox, y * 2 + oy)) { firstPixels++; }
                        }
                    }
                    if (firstPixels >= 2) { setPixel(rows, 16, x, y, true); }
                }
            }
            result[key] = rows;
        }
    }
    return result;
}
