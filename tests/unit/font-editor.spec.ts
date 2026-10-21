import { cloneFont, exportFnt, glyphForSyllable, glyphIndex, hasPixel, importFnt, setPixel, syllableSelection, upscaleFont, upscaleGlyph } from '@/font-editor';
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

    it('잘못된 크기와 순서의 파일을 거부한다', () => {
        expect(() => importFnt('cho_0_0 16 0\n0000000000000000')).toThrow();
        expect(() => glyphIndex('cho', 8, 0)).toThrow();
    });

    it('16×16 픽셀을 2배로 늘리고 사선 계단과 안쪽 모서리를 메운다', () => {
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
        expect(hasPixel(rounded, 32, 1, 2)).toBe(true);
        expect(hasPixel(rounded, 32, 0, 2)).toBe(false);
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
