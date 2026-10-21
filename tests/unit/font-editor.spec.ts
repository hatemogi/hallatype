import { alphaAt, antialiasFont, antialiasGlyph, cloneFont, exportAlphaFont, exportFnt, glyphForSyllable, glyphIndex, hasPixel, importAlphaFont, importFnt, previewSyllable, regenerateAutomaticFonts, setPixel, syllableSelection, upscaleFont, upscaleGlyph } from '@/font-editor';
declare const require: (id: string) => any;
declare const __dirname: string;

describe('조합형 글꼴 편집 데이터', () => {
    it('원본 .fnt의 348개 비트맵을 읽고 내보내도 그대로 보존한다', () => {
        const source = require('fs').readFileSync(require('path').resolve(__dirname, '../../public/fonts/hangul-jamo-source.fnt'), 'utf8');
        const imported = importFnt(source);
        expect(imported).toHaveLength(348);
        expect(exportFnt(imported)).toBe(source);
        expect(imported).toEqual(cloneFont());
    });

    it('한글 음절에서 맞는 벌과 자소를 골라 조합한다', () => {
        const font = cloneFont();
        const selection = syllableSelection('한');
        expect(selection).toEqual({ cho: [5, 18], jung: [3, 0], jong: [0, 3] });
        const glyphs = glyphForSyllable(font, '한');
        expect(glyphs).toEqual([
            font[glyphIndex('cho', 5, 18)],
            font[glyphIndex('jung', 3, 0)],
            font[glyphIndex('jong', 0, 3)],
        ]);
        expect(glyphForSyllable(font, 'A')).toBeNull();
    });

    it('모든 편집 자소에 대해 실제 그 자소를 쓰는 미리보기 글자를 찾는다', () => {
        for (const [part, variants, count] of [['cho', 8, 19], ['jung', 4, 21], ['jong', 4, 27]] as const) {
            for (let variant = 0; variant < variants; variant++) {
                for (let jamo = 0; jamo < count; jamo++) {
                    expect(syllableSelection(previewSyllable(part, variant, jamo))?.[part]).toEqual([variant, jamo]);
                }
            }
        }
    });

    it('잘못된 크기와 순서의 파일을 거부한다', () => {
        expect(() => importFnt('cho_0_0 16 0\n0000000000000000')).toThrow();
        expect(() => glyphIndex('cho', 8, 0)).toThrow();
    });

    it('16×16 픽셀을 2배로 늘리고 대각선의 틈만 메운다', () => {
        const source = Array(16).fill(0);
        setPixel(source, 16, 0, 0, true);
        setPixel(source, 16, 1, 1, true);
        const enlarged = upscaleGlyph(source);
        expect(enlarged).toHaveLength(32);
        expect(hasPixel(enlarged, 32, 0, 0)).toBe(true);
        expect(hasPixel(enlarged, 32, 1, 1)).toBe(true);
        expect(hasPixel(enlarged, 32, 2, 1)).toBe(true);
        expect(hasPixel(enlarged, 32, 1, 2)).toBe(true);
        expect(hasPixel(enlarged, 32, 3, 3)).toBe(true);
        expect(hasPixel(enlarged, 32, 3, 0)).toBe(false);

        setPixel(source, 16, 1, 0, true);
        const rounded = upscaleGlyph(source);
        expect(hasPixel(rounded, 32, 1, 2)).toBe(false);
        expect(hasPixel(rounded, 32, 0, 2)).toBe(false);
    });

    it('네 방향의 직각 안쪽 모서리는 채우지 않는다', () => {
        for (const [missingX, missingY] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            const source = Array(16).fill(0);
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {
                    if (x !== missingX || y !== missingY) { setPixel(source, 16, x, y, true); }
                }
            }
            const enlarged = upscaleGlyph(source);
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    expect(hasPixel(enlarged, 32, missingX * 2 + dx, missingY * 2 + dy)).toBe(false);
                }
            }
        }
    });

    it('두 픽셀 두께의 대각선 획은 메우고 직각 꺾임은 유지한다', () => {
        const diagonal = Array(16).fill(0);
        setPixel(diagonal, 16, 5, 5, true);
        setPixel(diagonal, 16, 6, 5, true);
        setPixel(diagonal, 16, 4, 6, true);
        setPixel(diagonal, 16, 5, 6, true);
        const rounded = upscaleGlyph(diagonal);
        expect(hasPixel(rounded, 32, 9, 11)).toBe(true);
        expect(hasPixel(rounded, 32, 12, 12)).toBe(true);

        const rightAngle = Array(16).fill(0);
        for (let x = 2; x <= 6; x++) { setPixel(rightAngle, 16, x, 4, true); }
        for (let y = 4; y <= 7; y++) {
            setPixel(rightAngle, 16, 5, y, true);
            setPixel(rightAngle, 16, 6, y, true);
        }
        expect(hasPixel(upscaleGlyph(rightAngle), 32, 9, 10)).toBe(false);
    });

    it('실제 ㄱ 자소의 대각선도 메우되 위쪽 직각은 유지한다', () => {
        const source = cloneFont()[0];
        const enlarged = upscaleGlyph(source);
        const count = (rows: number[]) => rows.reduce((sum, row) => sum + (row >>> 0).toString(2).replace(/0/g, '').length, 0);
        expect(count(enlarged)).toBeGreaterThan(count(source) * 4);
        expect(hasPixel(enlarged, 32, 9, 6)).toBe(false);
    });

    it('계단을 메운 픽셀에도 안티앨리어싱을 순서대로 적용한다', () => {
        const source = Array(16).fill(0);
        setPixel(source, 16, 0, 0, true);
        setPixel(source, 16, 1, 1, true);
        const expanded = upscaleGlyph(source);
        const softened = antialiasGlyph(expanded);
        expect(alphaAt(softened, 2, 1)).toBe(255);
        expect(alphaAt(softened, 2, 0)).toBeGreaterThan(0);
        expect(alphaAt(softened, 2, 0)).toBeLessThan(255);
    });

    it('확대본을 8비트 알파로 부드럽게 만들고 파일로 왕복한다', () => {
        const source = Array(32).fill(0);
        setPixel(source, 32, 10, 10, true);
        const softened = antialiasGlyph(source);
        expect(softened).toHaveLength(1024);
        expect(alphaAt(softened, 10, 10)).toBe(255);
        expect(alphaAt(softened, 9, 10)).toBe(8);
        expect(alphaAt(softened, 9, 9)).toBe(4);
        expect(alphaAt(softened, 8, 8)).toBe(0);
        const font = antialiasFont(upscaleFont(cloneFont()));
        font[0][0] = 127;
        expect(importAlphaFont(exportAlphaFont(font))).toEqual(font);
        expect(() => importAlphaFont('{"format":"wrong","glyphs":[]}')).toThrow();
    });

    it('이전 저장본은 자동 생성 자소만 새 규칙으로 갱신한다', () => {
        const source = cloneFont();
        const target = upscaleFont(source);
        const alpha = antialiasFont(target);
        const manuallyEdited = target[1].slice();
        setPixel(manuallyEdited, 32, 0, 0, true);
        target[1] = manuallyEdited;
        target[0] = Array(32).fill(0); // 오래된 자동 생성 결과
        alpha[0] = Array(1024).fill(0);
        alpha[1] = Array(1024).fill(17);
        const manual32 = Array(348).fill(false);
        const manualAA = Array(348).fill(false);
        manual32[1] = true;
        manualAA[1] = true;

        const refreshed = regenerateAutomaticFonts(source, target, alpha, manual32, manualAA);
        expect(refreshed.target[0]).toEqual(upscaleGlyph(source[0]));
        expect(refreshed.alpha[0]).toEqual(antialiasGlyph(refreshed.target[0]));
        expect(refreshed.target[1]).toEqual(manuallyEdited);
        expect(refreshed.alpha[1]).toEqual(alpha[1]);
    });

    it('32×32 글꼴의 최상위 비트와 모든 자소를 파일 왕복으로 보존한다', () => {
        const enlarged = upscaleFont(cloneFont());
        setPixel(enlarged[0], 32, 0, 0, true);
        setPixel(enlarged[0], 32, 31, 31, true);
        const exported = exportFnt(enlarged, 32);
        expect(exported.startsWith('cho_0_0 32 0\n1')).toBe(true);
        expect(importFnt(exported, 32)).toEqual(enlarged);
        expect(() => importFnt(exported, 16)).toThrow();
    });
});
