import { 한글글꼴, 라틴글꼴 } from './fonts';
import { 벌식, 분리 } from './한글';

export type Part = 'cho' | 'jung' | 'jong';
export type Bitmap = number[];
/** Row-major alpha values, each in the range 0–255. */
export type AlphaGlyph = number[];

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

/** Nearest-neighbour 2× scale, then join diagonal strokes without rounding right-angle corners. */
export function upscaleGlyph(source: Bitmap): Bitmap {
    if (source.length !== 16) { throw new Error('16행 원본 비트맵이 필요합니다.'); }
    const result = Array<number>(32).fill(0);
    const runBounds = (y: number, start: number): [number, number] => {
        let left = start;
        let right = start;
        while (left > 0 && hasPixel(source, 16, left - 1, y)) { left--; }
        while (right < 15 && hasPixel(source, 16, right + 1, y)) { right++; }
        return [left, right];
    };
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
            } else if ([a, b, c, d].filter(Boolean).length === 3) {
                const [upperLeft, upperRight] = runBounds(y, a ? x : x + 1);
                const [lowerLeft, lowerRight] = runBounds(y + 1, c ? x : x + 1);
                const shift = lowerLeft - upperLeft;
                if (Math.abs(shift) !== 1 || lowerRight - upperRight !== shift) { continue; }
                if (!a) { setPixel(result, 32, x * 2 + 1, y * 2 + 1, true); }
                else if (!b) { setPixel(result, 32, x * 2 + 2, y * 2 + 1, true); }
                else if (!c) { setPixel(result, 32, x * 2 + 1, y * 2 + 2, true); }
                else { setPixel(result, 32, x * 2 + 2, y * 2 + 2, true); }
            }
        }
    }
    return result;
}

export function upscaleFont(font: Bitmap[]): Bitmap[] {
    if (font.length !== 348) { throw new Error('348개 자소 글꼴이 필요합니다.'); }
    return font.map(upscaleGlyph);
}

export function alphaAt(glyph: AlphaGlyph, x: number, y: number): number {
    return x >= 0 && x < 32 && y >= 0 && y < 32 ? glyph[y * 32 + x] : 0;
}

/** Keep solid pixels opaque and add a faint 8-bit edge fringe. */
export function antialiasGlyph(source: Bitmap): AlphaGlyph {
    return antialiasBitmap(source, 32);
}

/** 32행짜리 16픽셀 또는 32픽셀 비트맵의 가장자리에 옅은 알파를 더한다. */
export function antialiasBitmap(source: Bitmap, width: 16 | 32): AlphaGlyph {
    if (source.length !== 32) { throw new Error('32행 비트맵이 필요합니다.'); }
    const weights = [1, 2, 1];
    const result: AlphaGlyph = Array(width * 32).fill(0);
    const filled = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < 32 &&
        !!(source[y] & (1 << (width - 1 - x)));
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < width; x++) {
            if (filled(x, y)) {
                result[y * width + x] = 255;
                continue;
            }
            let sum = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (filled(x + dx, y + dy)) {
                        sum += weights[dy + 1] * weights[dx + 1];
                    }
                }
            }
            result[y * width + x] = Math.round(sum * 255 / 64);
        }
    }
    return result;
}

/** Reconstruct the edge between bitmap pixel centres and measure its coverage at 8× resolution. */
export function contourAlphaBitmap(source: Bitmap, width: 16 | 32): AlphaGlyph {
    if (source.length !== 32) { throw new Error('32행 비트맵이 필요합니다.'); }
    const samples = 8;
    const result: AlphaGlyph = Array(width * 32).fill(0);
    const filled = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < 32 &&
        !!(source[y] & (1 << (width - 1 - x)));
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < width; x++) {
            const centre = filled(x, y);
            let edge = false;
            for (let dy = -1; dy <= 1 && !edge; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (filled(x + dx, y + dy) !== centre) { edge = true; break; }
                }
            }
            if (!edge) { result[y * width + x] = centre ? 255 : 0; continue; }
            let covered = 0;
            for (let sy = 0; sy < samples; sy++) {
                const sampleY = y - 0.5 + (sy + 0.5) / samples;
                const y0 = Math.floor(sampleY);
                const fy = sampleY - y0;
                for (let sx = 0; sx < samples; sx++) {
                    const sampleX = x - 0.5 + (sx + 0.5) / samples;
                    const x0 = Math.floor(sampleX);
                    const fx = sampleX - x0;
                    const upper = Number(filled(x0, y0)) * (1 - fx) + Number(filled(x0 + 1, y0)) * fx;
                    const lower = Number(filled(x0, y0 + 1)) * (1 - fx) + Number(filled(x0 + 1, y0 + 1)) * fx;
                    if (upper * (1 - fy) + lower * fy >= 0.4) { covered++; }
                }
            }
            result[y * width + x] = Math.round(covered * 255 / (samples * samples));
        }
    }
    return result;
}

type TracedEdge = { start: number; side: -1 | 1; positions: number[] };

/** Follow each run boundary across rows, retaining only long, gently changing paths. */
function traceLongContours(source: Bitmap, width: 8 | 16, horizontal: boolean): TracedEdge[] {
    const axisLength = horizontal ? width : 16;
    const crossLength = horizontal ? 16 : width;
    const filled = (axis: number, cross: number) => {
        const x = horizontal ? axis : cross;
        const y = horizontal ? cross : axis;
        return !!(source[y] & (1 << (width - 1 - x)));
    };
    const chains: TracedEdge[] = [];
    let active: TracedEdge[] = [];
    for (let axis = 0; axis < axisLength; axis++) {
        const edges: Array<{ side: -1 | 1; position: number }> = [];
        for (let cross = 0; cross < crossLength; cross++) {
            if (!filled(axis, cross)) { continue; }
            if (cross === 0 || !filled(axis, cross - 1)) {
                edges.push({ side: -1, position: cross - 0.5 });
            }
            if (cross === crossLength - 1 || !filled(axis, cross + 1)) {
                edges.push({ side: 1, position: cross + 0.5 });
            }
        }
        const next: TracedEdge[] = [];
        for (const edge of edges) {
            let match: TracedEdge | undefined;
            let distance = 1.5;
            for (const chain of active) {
                if (chain.side !== edge.side || next.includes(chain)) { continue; }
                const gap = Math.abs(chain.positions[chain.positions.length - 1] - edge.position);
                if (gap <= distance) { match = chain; distance = gap; }
            }
            if (match) {
                match.positions.push(edge.position);
                next.push(match);
            } else {
                const chain = { start: axis, side: edge.side, positions: [edge.position] };
                chains.push(chain);
                next.push(chain);
            }
        }
        active = next;
    }
    return chains.filter(({ positions }) => positions.length >= 5 &&
        Math.max(...positions) - Math.min(...positions) >= 1.5 &&
        positions.some((value, index) => index > 1 &&
            Math.abs(value - 2 * positions[index - 1] + positions[index - 2]) > 0.01));
}

type FittedContour = { position: number; tangentX: number; tangentY: number };

/** Fit long boundaries while keeping them within 0.35 source pixels of the traced edge. */
function traceFittedContours(source: Bitmap, width: 8 | 16, horizontal: boolean,
                             scale: 2 | 3 | 4, samples: number): FittedContour[][] {
    const chains = traceLongContours(source, width, horizontal);
    if (!chains.length) { return []; }
    const axisLength = (horizontal ? width : 16) * scale * samples;
    const contours: FittedContour[][] = Array.from({ length: axisLength }, () => []);
    for (const { start, positions } of chains) {
        const fitted = positions.map((value, index) => index === 0 || index === positions.length - 1
            ? value : Math.max(value - 0.25, Math.min(value + 0.25,
                (positions[index - 1] + 2 * value + positions[index + 1]) / 4)));
        for (let axis = 0; axis < axisLength; axis++) {
            const sourceAxis = (axis + 0.5) / (scale * samples) - 0.5 - start;
            // The first and last source rows may contain a junction or a square end.
            if (sourceAxis < 1 || sourceAxis >= positions.length - 2) { continue; }
            const segment = Math.floor(sourceAxis);
            const t = sourceAxis - segment;
            const linear = positions[segment] * (1 - t) + positions[segment + 1] * t;
            const curve = cubicInterpolate(
                fitted[Math.max(0, segment - 1)], fitted[segment], fitted[segment + 1],
                fitted[Math.min(fitted.length - 1, segment + 2)], t);
            const position = Math.max(linear - 0.35, Math.min(linear + 0.35, curve));
            const before = cubicInterpolate(
                fitted[Math.max(0, segment - 1)], fitted[segment], fitted[segment + 1],
                fitted[Math.min(fitted.length - 1, segment + 2)], Math.max(0, t - 0.05));
            const after = cubicInterpolate(
                fitted[Math.max(0, segment - 1)], fitted[segment], fitted[segment + 1],
                fitted[Math.min(fitted.length - 1, segment + 2)], Math.min(1, t + 0.05));
            const slope = (after - before) / (Math.min(1, t + 0.05) - Math.max(0, t - 0.05));
            const norm = Math.hypot(1, slope);
            contours[axis].push({ position, tangentX: horizontal ? 1 / norm : slope / norm,
                tangentY: horizontal ? slope / norm : 1 / norm });
        }
    }
    return contours;
}

function nearbyContour(curves: FittedContour[] | undefined, coordinate: number):
    { contour: FittedContour; distance: number } | undefined {
    if (!curves) { return undefined; }
    let closest = 0.65;
    let match: FittedContour | undefined;
    for (const curve of curves) {
        const distance = Math.abs(coordinate - curve.position);
        if (distance < closest) {
            closest = distance;
            match = curve;
        }
    }
    return match ? { contour: match, distance: closest } : undefined;
}

function cubicInterpolate(a: number, b: number, c: number, d: number, t: number): number {
    return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
}

/** Reconstruct a continuous contour from the 16-row source, then measure pixel coverage. */
export function smoothSourceAlphaBitmap(source: Bitmap, width: 8 | 16 = 16, scale: 2 | 3 | 4 = 2): AlphaGlyph {
    if (source.length !== 16) { throw new Error('16행 원본 비트맵이 필요합니다.'); }
    const samples = 8;
    const targetWidth = width * scale;
    const targetHeight = 16 * scale;
    const result: AlphaGlyph = Array(targetWidth * targetHeight).fill(0);
    const filled = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < 16 &&
        !!(source[y] & (1 << (width - 1 - x)));
    const weights = (t: number): [number, number, number, number] => {
        const t2 = t * t;
        const t3 = t2 * t;
        return [-0.5 * t + t2 - 0.5 * t3, 1 - 2.5 * t2 + 1.5 * t3,
            0.5 * t + 2 * t2 - 1.5 * t3, -0.5 * t2 + 0.5 * t3];
    };
    const positions = (length: number) => Array.from({ length: length * samples }, (_, index) => {
        const coordinate = (index + 0.5) / (scale * samples) - 0.5;
        const base = Math.floor(coordinate);
        return { coordinate, base, weight: weights(coordinate - base) };
    });
    const xPositions = positions(targetWidth);
    const yPositions = positions(targetHeight);
    const verticalCurves = traceFittedContours(source, width, false, scale, samples);
    const horizontalCurves = traceFittedContours(source, width, true, scale, samples);
    const hasLongCurves = verticalCurves.length > 0 || horizontalCurves.length > 0;
    const interpolate = (x: number, y: number) => {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const wx = weights(x - x0);
        const wy = weights(y - y0);
        let value = 0;
        for (let dy = 0; dy < 4; dy++) {
            let row = 0;
            for (let dx = 0; dx < 4; dx++) {
                row += Number(filled(x0 + dx - 1, y0 + dy - 1)) * wx[dx];
            }
            value += row * wy[dy];
        }
        return value;
    };
    // Horizontal interpolation is shared by every vertical sample of the glyph.
    const horizontal = new Float32Array(16 * xPositions.length);
    for (let row = 0; row < 16; row++) {
        for (let p = 0; p < xPositions.length; p++) {
            const { base, weight } = xPositions[p];
            horizontal[row * xPositions.length + p] =
                Number(filled(base - 1, row)) * weight[0] + Number(filled(base, row)) * weight[1] +
                Number(filled(base + 1, row)) * weight[2] + Number(filled(base + 2, row)) * weight[3];
        }
    }
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const centre = filled(Math.floor(x / scale), Math.floor(y / scale));
            let edge = false;
            for (let dy = -1; dy <= 1 && !edge; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (filled(Math.floor(x / scale) + dx, Math.floor(y / scale) + dy) !== centre) {
                        edge = true;
                        break;
                    }
                }
            }
            if (!edge) { result[y * targetWidth + x] = centre ? 255 : 0; continue; }
            let covered = 0;
            for (let sy = 0; sy < samples; sy++) {
                const sampleY = y * samples + sy;
                const { coordinate: sourceY, base, weight } = yPositions[sampleY];
                for (let sx = 0; sx < samples; sx++) {
                    const sampleX = x * samples + sx;
                    let value = 0;
                    for (let dy = 0; dy < 4; dy++) {
                        const row = base + dy - 1;
                        if (row >= 0 && row < 16) {
                            value += horizontal[row * xPositions.length + sampleX] * weight[dy];
                        }
                    }
                    if (hasLongCurves) {
                        const sourceX = xPositions[sampleX].coordinate;
                        const vertical = nearbyContour(verticalCurves[sampleY], sourceX);
                        const horizontalCurve = nearbyContour(horizontalCurves[sampleX], sourceY);
                        const curve = vertical && (!horizontalCurve || vertical.distance <= horizontalCurve.distance)
                            ? vertical.contour : horizontalCurve?.contour;
                        if (curve) {
                            const dx = curve.tangentX * 0.6;
                            const dy = curve.tangentY * 0.6;
                            value = 0.5 * value + 0.25 * interpolate(sourceX - dx, sourceY - dy)
                                + 0.25 * interpolate(sourceX + dx, sourceY + dy);
                        }
                    }
                    if (value >= 0.4) { covered++; }
                }
            }
            result[y * targetWidth + x] = Math.round(covered * 255 / (samples * samples));
        }
    }
    return result;
}

/** Draw the ring in ㅇ and ㅎ as an actual ellipse; retain ㅎ's upper strokes. */
export function roundedRingAlphaGlyph(source: Bitmap, hieuh = false, scale: 2 | 3 | 4 = 2): AlphaGlyph {
    if (source.length !== 16) { throw new Error('16행 원본 비트맵이 필요합니다.'); }
    let firstSplit = 16;
    let lastSplit = -1;
    let holeLeft = 16;
    let holeRight = -1;
    for (let y = 0; y < 16; y++) {
        let previous = -1;
        for (let x = 0; x < 16; x++) {
            if (!hasPixel(source, 16, x, y)) { continue; }
            if (previous >= 0 && x - previous > 1) {
                firstSplit = Math.min(firstSplit, y);
                lastSplit = Math.max(lastSplit, y);
                holeLeft = Math.min(holeLeft, previous + 1);
                holeRight = Math.max(holeRight, x - 1);
            }
            previous = x;
        }
    }
    if (lastSplit < 0) { return smoothSourceAlphaBitmap(source, 16, scale); }
    const top = firstSplit - 1;
    let bottom = lastSplit;
    for (let y = lastSplit + 1; y < 16; y++) {
        if (source[y]) { bottom = y; }
    }
    let left = 16;
    let right = -1;
    for (let y = top; y <= bottom; y++) {
        for (let x = 0; x < 16; x++) {
            if (hasPixel(source, 16, x, y)) {
                left = Math.min(left, x);
                right = Math.max(right, x);
            }
        }
    }
    const upper = hieuh
        ? smoothSourceAlphaBitmap(source.map((row, y) => y < top ? row : 0), 16, scale)
        : Array<number>(16 * scale * 16 * scale).fill(0);
    const ellipse = (x: number, y: number, minX: number, maxX: number, minY: number, maxY: number) => {
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const nx = (x - cx) / ((maxX - minX) / 2);
        const ny = (y - cy) / ((maxY - minY) / 2);
        return nx * nx + ny * ny <= 1;
    };
    const samples = 8;
    // The binary enlargement thickens corners; keep a similar stroke weight after rounding them.
    const outerPadding = 0.15;
    const innerInset = 0.2;
    for (let y = Math.max(0, Math.floor((top - outerPadding) * scale));
        y < Math.min(16 * scale, Math.ceil((bottom + 1 + outerPadding) * scale)); y++) {
        for (let x = Math.max(0, Math.floor((left - outerPadding) * scale));
            x < Math.min(16 * scale, Math.ceil((right + 1 + outerPadding) * scale)); x++) {
            let covered = 0;
            for (let sy = 0; sy < samples; sy++) {
                for (let sx = 0; sx < samples; sx++) {
                    const sampleX = (x + (sx + 0.5) / samples) / scale;
                    const sampleY = (y + (sy + 0.5) / samples) / scale;
                    if (ellipse(sampleX, sampleY, left - outerPadding, right + 1 + outerPadding,
                        top - outerPadding, bottom + 1 + outerPadding) &&
                        !ellipse(sampleX, sampleY, holeLeft + innerInset, holeRight + 1 - innerInset,
                            firstSplit + innerInset, lastSplit + 1 - innerInset)) {
                        covered++;
                    }
                }
            }
            const index = y * 16 * scale + x;
            upper[index] = Math.max(upper[index], Math.round(covered * 255 / (samples * samples)));
        }
    }
    return upper;
}

export function antialiasFont(font: Bitmap[]): AlphaGlyph[] {
    if (font.length !== 348) { throw new Error('348개 자소 글꼴이 필요합니다.'); }
    return font.map(antialiasGlyph);
}

/** Refresh generated glyphs after an algorithm change while preserving manual pixel edits. */
export function regenerateAutomaticFonts(source: Bitmap[], target: Bitmap[], alpha: AlphaGlyph[],
                                         manual32: boolean[], manualAA: boolean[]): { target: Bitmap[]; alpha: AlphaGlyph[] } {
    const refreshed = source.map((glyph, index) => manual32[index] ? target[index] : upscaleGlyph(glyph));
    return {
        target: refreshed,
        alpha: refreshed.map((glyph, index) => manualAA[index] ? alpha[index] : antialiasGlyph(glyph)),
    };
}

export function validAlphaFont(value: unknown): value is AlphaGlyph[] {
    return Array.isArray(value) && value.length === 348 && value.every((glyph) =>
        Array.isArray(glyph) && glyph.length === 1024 && glyph.every((alpha: unknown) =>
            Number.isInteger(alpha) && Number(alpha) >= 0 && Number(alpha) <= 255));
}

export function exportAlphaFont(font: AlphaGlyph[]): string {
    if (!validAlphaFont(font)) { throw new Error('올바른 32×32 8비트 글꼴이 필요합니다.'); }
    return JSON.stringify({ format: 'hallatype-alpha-v1', width: 32, height: 32, glyphs: font });
}

export function importAlphaFont(source: string): AlphaGlyph[] {
    const value: unknown = JSON.parse(source);
    if (!value || typeof value !== 'object' || !('format' in value) ||
        value.format !== 'hallatype-alpha-v1' || !('glyphs' in value) || !validAlphaFont(value.glyphs)) {
        throw new Error('올바른 32×32 8비트 글꼴 파일이 아닙니다.');
    }
    return value.glyphs;
}

export function glyphForSyllable<T>(font: T[], character: string): [T, T, T | null] | null {
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

export function paintAlphaBitmap(ctx: CanvasRenderingContext2D, glyph: AlphaGlyph | undefined | null,
                                 x: number, y: number, color: string, scale = 1): void {
    if (!glyph) { return; }
    ctx.fillStyle = color;
    for (let py = 0; py < 32; py++) {
        for (let px = 0; px < 32; px++) {
            const alpha = alphaAt(glyph, px, py);
            if (!alpha) { continue; }
            ctx.globalAlpha = alpha / 255;
            ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
        }
    }
    ctx.globalAlpha = 1;
}

export function paintAlphaText(ctx: CanvasRenderingContext2D, font: AlphaGlyph[], text: string,
                               colors: [string, string, string], scale: number, maxWidth: number): void {
    let x = 0;
    let y = 0;
    for (const character of text) {
        if (character === '\n') { x = 0; y += 42 * scale; continue; }
        const syllable = glyphForSyllable(font, character);
        const width = syllable ? 32 : 16;
        if (x + width * scale > maxWidth && x > 0) { x = 0; y += 42 * scale; }
        if (syllable) {
            for (let part = syllable.length - 1; part >= 0; part--) {
                paintAlphaBitmap(ctx, syllable[part], x, y, colors[part], scale);
            }
        } else {
            const code = character.charCodeAt(0);
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
        }
        x += width * scale;
    }
}

export function syllableSelection(character: string): { cho: [number, number]; jung: [number, number]; jong: [number, number] | null } | null {
    const code = character.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) { return null; }
    const [cho, jung, jong] = 분리(code);
    const [a, b, c] = 벌식([cho, jung, jong]);
    return { cho: [a, cho - 1], jung: [b, jung - 1], jong: jong ? [c, jong - 1] : null };
}

/** Find a composed Hangul syllable that actually uses the selected glyph variant. */
export function previewSyllable(part: Part, variant: number, jamo: number): string {
    glyphIndex(part, variant, jamo);
    for (let code = 0xac00; code <= 0xd7a3; code++) {
        const character = String.fromCharCode(code);
        const selected = syllableSelection(character)?.[part];
        if (selected && selected[0] === variant && selected[1] === jamo) {
            return character;
        }
    }
    throw new Error('선택한 자소를 사용하는 글자가 없습니다.');
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
    const lineHeight = Math.round(fontSize * 1.3125) * scale;
    for (const character of text) {
        if (character === '\n') { x = 0; y += lineHeight; continue; }
        const syllable = glyphForSyllable(font, character);
        const width = syllable ? fontSize : fontSize / 2;
        if (x + width * scale > maxWidth && x > 0) { x = 0; y += lineHeight; }
        if (syllable) {
            for (let part = syllable.length - 1; part >= 0; part--) {
                paintBitmap(ctx, syllable[part], x, y, colors[part], scale, fontSize);
            }
        } else {
            const code = character.charCodeAt(0);
            if (code < 라틴글꼴.length) {
                if (fontSize !== 16) {
                    const latin = 라틴글꼴[code];
                    if (latin) {
                        const latinScale = fontSize / 16 * scale;
                        for (let py = 0; py < 16; py++) {
                            for (let px = 0; px < 8; px++) {
                                if (latin[py] & (1 << (7 - px))) {
                                    ctx.fillStyle = colors[0];
                                    ctx.fillRect(x + px * latinScale, y + py * latinScale, latinScale, latinScale);
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
