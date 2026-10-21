import { cloneFont, hasPixel, setPixel } from '@/font-editor';
import { COMPOUNDS, clampMasks, compoundGlyph, downsampleLegacyMasks, exportMasks, importMasks, maskKey, suggestedMasks } from '@/key-mask';

describe('키별 자소 마스크', () => {
    const font = cloneFont();

    it('겹모음과 겹받침의 4벌씩 72개 마스크를 만들고 완성 비트맵 밖은 칠하지 않는다', () => {
        expect(COMPOUNDS.filter((item) => item.part === 'jung')).toHaveLength(7);
        expect(COMPOUNDS.filter((item) => item.part === 'jong')).toHaveLength(11);
        const masks = suggestedMasks(font);
        expect(Object.keys(masks)).toHaveLength(72);
        for (const compound of COMPOUNDS) {
            for (let variant = 0; variant < 4; variant++) {
                const mask = masks[maskKey(compound, variant)];
                const glyph = compoundGlyph(font, compound, variant);
                expect(mask).toHaveLength(16);
                const firstPixels = mask.reduce((sum, row) => sum + (row >>> 0).toString(2).replace(/0/g, '').length, 0);
                const allPixels = glyph.reduce((sum, row) => sum + (row >>> 0).toString(2).replace(/0/g, '').length, 0);
                expect(firstPixels, `${compound.label} ${variant + 1}벌`).toBeGreaterThan(0);
                expect(firstPixels, `${compound.label} ${variant + 1}벌`).toBeLessThan(allPixels);
                for (let y = 0; y < 16; y++) {
                    expect((mask[y] & ~glyph[y]) >>> 0).toBe(0);
                }
            }
        }
        const wi = COMPOUNDS.find((item) => item.label === 'ㅟ')!;
        const mask = masks[maskKey(wi, 0)];
        const glyph = compoundGlyph(font, wi, 0);
        const first = mask.reduce((sum, row) => sum + (row >>> 0).toString(2).replace(/0/g, '').length, 0);
        const total = glyph.reduce((sum, row) => sum + (row >>> 0).toString(2).replace(/0/g, '').length, 0);
        expect(first).toBeGreaterThan(0);
        expect(first).toBeLessThan(total);
    });

    it('마스크 파일을 왕복하고 잘못된 파일과 글꼴 밖 픽셀을 처리한다', () => {
        const masks = suggestedMasks(font);
        expect(importMasks(exportMasks(masks))).toEqual(masks);
        expect(() => importMasks('{"format":"wrong","size":16,"masks":{}}')).toThrow();
        const wi = COMPOUNDS.find((item) => item.label === 'ㅟ')!;
        const key = maskKey(wi, 0);
        masks[key][0] = 0xffff;
        const clamped = clampMasks(masks, font);
        for (let x = 0; x < 16; x++) {
            expect(hasPixel(clamped[key], 16, x, 0)).toBe(hasPixel(compoundGlyph(font, wi, 0), 16, x, 0));
        }
    });

    it('기존 32×32 마스크의 2×2 픽셀을 원본 픽셀에 맞춰 변환한다', () => {
        const legacy = Object.fromEntries(Object.entries(suggestedMasks(font)).map(([key, rows]) => {
            const enlarged = Array<number>(32).fill(0);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    if (!hasPixel(rows, 16, x, y)) { continue; }
                    for (let oy = 0; oy < 2; oy++) {
                        for (let ox = 0; ox < 2; ox++) {
                            setPixel(enlarged, 32, x * 2 + ox, y * 2 + oy, true);
                        }
                    }
                }
            }
            return [key, enlarged];
        }));
        const expected = suggestedMasks(font);
        expect(downsampleLegacyMasks(legacy, font)).toEqual(expected);
        const file = JSON.stringify({ format: 'hallatype-key-mask-v1', size: 32, masks: legacy });
        expect(importMasks(file, font)).toEqual(expected);
        expect(() => importMasks(file)).toThrow();
    });
});
