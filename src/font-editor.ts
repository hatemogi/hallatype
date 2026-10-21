import { 한글글꼴, 라틴글꼴 } from './fonts';
import { 벌식, 분리 } from './한글';

export type Part = 'cho' | 'jung' | 'jong';
export type Bitmap = number[];

export const INITIALS = Array.from('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ');
export const MEDIALS = Array.from('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ');
export const FINALS = Array.from('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ');

export const PARTS: Record<Part, { label: string; variants: number; labels: string[]; offset: number; stride: number }> = {
    cho: { label: '초성', variants: 8, labels: INITIALS, offset: 0, stride: 19 },
    jung: { label: '중성', variants: 4, labels: MEDIALS, offset: 152, stride: 21 },
    jong: { label: '종성', variants: 4, labels: FINALS, offset: 236, stride: 28 },
};

export function glyphIndex(part: Part, variant: number, jamo: number): number {
    const info = PARTS[part];
    if (!Number.isInteger(variant) || variant < 0 || variant >= info.variants ||
        !Number.isInteger(jamo) || jamo < 0 || jamo >= info.labels.length) {
        throw new RangeError('글꼴 위치가 범위를 벗어났습니다.');
    }
    return info.offset + variant * info.stride + jamo + (part === 'jong' ? 1 : 0);
}

export function cloneFont(): Bitmap[] {
    return 한글글꼴.map((rows) => rows.slice());
}

export type FontSize = 16 | 32;

export function hasPixel(rows: Bitmap, size: FontSize, x: number, y: number): boolean {
    return x >= 0 && x < size && y >= 0 && y < size && !!(rows[y] & (1 << (size - 1 - x)));
}

export function setPixel(rows: Bitmap, size: FontSize, x: number, y: number, on: boolean): void {
    const mask = 1 << (size - 1 - x);
    rows[y] = (on ? rows[y] | mask : rows[y] & ~mask) >>> 0;
}

/** Nearest-neighbour 2× scale, then fill one-pixel gaps at diagonal and inside corners. */
export function upscaleGlyph(source: Bitmap): Bitmap {
    if (source.length !== 16) { throw new Error('16행 원본 비트맵이 필요합니다.'); }
    const result = Array<number>(32).fill(0);
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if (!hasPixel(source, 16, x, y)) { continue; }
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) { setPixel(result, 32, x * 2 + dx, y * 2 + dy, true); }
            }
        }
    }
    for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
            const a = hasPixel(source, 16, x, y);
            const b = hasPixel(source, 16, x + 1, y);
            const c = hasPixel(source, 16, x, y + 1);
            const d = hasPixel(source, 16, x + 1, y + 1);
            if (a && d && !b && !c) {
                setPixel(result, 32, x * 2 + 2, y * 2 + 1, true);
                setPixel(result, 32, x * 2 + 1, y * 2 + 2, true);
            } else if (b && c && !a && !d) {
                setPixel(result, 32, x * 2 + 1, y * 2 + 1, true);
                setPixel(result, 32, x * 2 + 2, y * 2 + 2, true);
            } else if (a && b && c && !d) {
                setPixel(result, 32, x * 2 + 2, y * 2 + 2, true);
            } else if (a && b && d && !c) {
                setPixel(result, 32, x * 2 + 1, y * 2 + 2, true);
            } else if (a && c && d && !b) {
                setPixel(result, 32, x * 2 + 2, y * 2 + 1, true);
            } else if (b && c && d && !a) {
                setPixel(result, 32, x * 2 + 1, y * 2 + 1, true);
            }
        }
    }
    return result;
}

export function upscaleFont(font: Bitmap[]): Bitmap[] {
    if (font.length !== 348) { throw new Error('348개 자소 글꼴이 필요합니다.'); }
    return font.map(upscaleGlyph);
}

export function glyphForSyllable(font: Bitmap[], character: string): [Bitmap, Bitmap, Bitmap | null] | null {
    const code = character.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) { return null; }
    const [cho, jung, jong] = 분리(code);
    const [choVariant, jungVariant, jongVariant] = 벌식([cho, jung, jong]);
    return [
        font[glyphIndex('cho', choVariant, cho - 1)],
        font[glyphIndex('jung', jungVariant, jung - 1)],
        jong ? font[glyphIndex('jong', jongVariant, jong - 1)] : null,
    ];
}

export function syllableSelection(character: string): { cho: [number, number]; jung: [number, number]; jong: [number, number] | null } | null {
    const code = character.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) { return null; }
    const [cho, jung, jong] = 분리(code);
    const [a, b, c] = 벌식([cho, jung, jong]);
    return { cho: [a, cho - 1], jung: [b, jung - 1], jong: jong ? [c, jong - 1] : null };
}

export function paintBitmap(ctx: CanvasRenderingContext2D, rows: Bitmap | undefined | null,
                            x: number, y: number, color: string, scale = 1, width = 16): void {
    if (!rows) { return; }
    ctx.fillStyle = color;
    rows.forEach((row, py) => {
        for (let px = 0; px < width; px++) {
            if (row & (1 << (width - 1 - px))) {
                ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
            }
        }
    });
}

export function paintText(ctx: CanvasRenderingContext2D, font: Bitmap[], text: string,
                          colors: [string, string, string], scale: number, maxWidth: number, fontSize: FontSize = 16): void {
    let x = 0;
    let y = 0;
    const lineHeight = (fontSize + (fontSize === 32 ? 10 : 5)) * scale;
    for (const character of text) {
        if (character === '\n') { x = 0; y += lineHeight; continue; }
        const syllable = glyphForSyllable(font, character);
        const width = syllable ? fontSize : fontSize / 2;
        if (x + width * scale > maxWidth && x > 0) { x = 0; y += lineHeight; }
        if (syllable) {
            syllable.forEach((rows, part) => paintBitmap(ctx, rows, x, y, colors[part], scale, fontSize));
        } else {
            const code = character.charCodeAt(0);
            if (code < 라틴글꼴.length) {
                if (fontSize === 32) {
                    const latin = 라틴글꼴[code];
                    if (latin) {
                        for (let py = 0; py < 16; py++) {
                            for (let px = 0; px < 8; px++) {
                                if (latin[py] & (1 << (7 - px))) {
                                    ctx.fillStyle = colors[0];
                                    ctx.fillRect(x + px * scale * 2, y + py * scale * 2, scale * 2, scale * 2);
                                }
                            }
                        }
                    }
                } else {
                    paintBitmap(ctx, 라틴글꼴[code], x, y, colors[0], scale, 8);
                }
            }
        }
        x += width * scale;
    }
}

/** Source format: 348 named glyphs, each followed by size binary rows. */
export function exportFnt(font: Bitmap[], size: FontSize = 16): string {
    if (font.length !== 348) { throw new Error('348개 자소 글꼴이 필요합니다.'); }
    const lines: string[] = [];
    (['cho', 'jung', 'jong'] as Part[]).forEach((part) => {
        const info = PARTS[part];
        for (let variant = 0; variant < info.variants; variant++) {
            for (let jamo = 0; jamo < info.stride; jamo++) {
                const index = info.offset + variant * info.stride + jamo;
                lines.push(`${part}_${jamo}_${variant} ${size} 0`);
                const rows = font[index];
                if (!rows || rows.length !== size || rows.some((row) => !Number.isInteger(row) || row < 0 || row > (size === 32 ? 0xffffffff : 0xffff))) {
                    throw new Error(`${size}행 비트맵이 필요합니다.`);
                }
                rows.forEach((row) => lines.push((row >>> 0).toString(2).padStart(size, '0')));
            }
        }
    });
    return lines.join('\n') + '\n';
}

export function importFnt(source: string, size: FontSize = 16): Bitmap[] {
    const lines = source.trim().split(/\r?\n/).map((line) => line.trim());
    const font: Bitmap[] = [];
    let cursor = 0;
    (['cho', 'jung', 'jong'] as Part[]).forEach((part) => {
        const info = PARTS[part];
        for (let variant = 0; variant < info.variants; variant++) {
            for (let jamo = 0; jamo < info.stride; jamo++) {
                const expected = `${part}_${jamo}_${variant} ${size} 0`;
                if (lines[cursor++] !== expected) { throw new Error(`${expected} 항목을 찾을 수 없습니다.`); }
                const rows = lines.slice(cursor, cursor + size);
                if (rows.length !== size || rows.some((row) => row.length !== size || !/^[01]+$/.test(row))) {
                    throw new Error(`${expected}의 ${size}×${size} 비트맵이 올바르지 않습니다.`);
                }
                font.push(rows.map((row) => parseInt(row, 2)));
                cursor += size;
            }
        }
    });
    if (cursor !== lines.length) { throw new Error('글꼴 데이터 뒤에 알 수 없는 내용이 있습니다.'); }
    return font;
}
