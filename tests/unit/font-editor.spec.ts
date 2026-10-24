import { alphaAt, antialiasFont, antialiasGlyph, cloneFont, contourAlphaBitmap, exportAlphaFont, exportFnt, glyphForSyllable, glyphIndex, hasPixel, importAlphaFont, importFnt, paintAlphaText, paintText, previewSyllable, regenerateAutomaticFonts, roundedRingAlphaGlyph, setPixel, smoothSourceAlphaBitmap, syllableSelection, upscaleFont, upscaleGlyph } from '@/font-editor';
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

    it('글꼴 미리보기에서도 겹친 초성을 가장 앞에 그린다', () => {
        const 선택 = syllableSelection('가')!;
        const 초성위치 = glyphIndex('cho', ...선택.cho);
        const 중성위치 = glyphIndex('jung', ...선택.jung);
        const 글자색 = ['red', 'green', 'blue'] as [string, string, string];
        const 색칠순서: string[] = [];
        let 현재색 = '';
        const ctx = {
            set fillStyle(색: string) { 현재색 = 색; },
            globalAlpha: 1,
            fillRect: (_x: number, _y: number, _w: number, _h: number) => 색칠순서.push(현재색),
        } as unknown as CanvasRenderingContext2D;
        const 비트맵 = Array.from({ length: 348 }, () => Array<number>(16).fill(0));
        setPixel(비트맵[초성위치], 16, 0, 0, true);
        setPixel(비트맵[중성위치], 16, 0, 0, true);
        paintText(ctx, 비트맵, '가', 글자색, 1, 16);
        expect(색칠순서).toEqual(['green', 'red']);

        색칠순서.length = 0;
        const 알파글꼴 = Array.from({ length: 348 }, () => Array<number>(1024).fill(0));
        알파글꼴[초성위치][0] = 255;
        알파글꼴[중성위치][0] = 255;
        paintAlphaText(ctx, 알파글꼴, '가', 글자색, 1, 32);
        expect(색칠순서).toEqual(['green', 'red']);
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

    it('윤곽 확대는 대각선의 경계만 부분적으로 덮고 직선의 내부는 진하게 유지한다', () => {
        const source = Array(32).fill(0);
        for (let y = 5; y <= 12; y++) { setPixel(source, 32, 4, y, true); }
        setPixel(source, 32, 10, 10, true);
        setPixel(source, 32, 11, 11, true);
        const alpha = contourAlphaBitmap(source, 32);
        expect(alphaAt(alpha, 4, 8)).toBe(255);
        expect(alphaAt(alpha, 5, 8)).toBeLessThan(64);
        expect(alphaAt(alpha, 10, 10)).toBeGreaterThan(0);
        expect(alphaAt(alpha, 10, 10)).toBeLessThan(255);
        expect(alphaAt(alpha, 10, 11)).toBeGreaterThan(0);
    });

    it('모든 ㅇ·ㅎ 벌의 고리는 둥글게 그리면서 ㅎ의 윗획을 보존한다', () => {
        const font = cloneFont();
        for (const [part, count, jamo] of [
            ['cho', 8, 11], ['cho', 8, 18], ['jong', 4, 20], ['jong', 4, 26],
        ] as const) {
            for (let variant = 0; variant < count; variant++) {
                const source = font[glyphIndex(part, variant, jamo)];
                const alpha = roundedRingAlphaGlyph(source, jamo === 18 || jamo === 26);
                const before = contourAlphaBitmap(upscaleGlyph(source), 32);
                const weight = alpha.reduce((sum, value) => sum + value, 0) /
                    before.reduce((sum, value) => sum + value, 0);
                expect(alpha).toHaveLength(1024);
                expect(alpha.some(value => value > 0 && value < 255)).toBe(true);
                expect(alpha.some(value => value === 255)).toBe(true);
                expect(weight, `${part} ${variant} ${jamo}`).toBeGreaterThan(0.88);
                expect(weight, `${part} ${variant} ${jamo}`).toBeLessThan(1.12);
                if (jamo === 18 || jamo === 26) {
                    const firstY = source.findIndex(row => row !== 0);
                    const firstX = Array.from({ length: 16 }, (_, x) => x)
                        .find(x => hasPixel(source, 16, x, firstY))!;
                    expect(alphaAt(alpha, firstX * 2, firstY * 2)).toBeGreaterThan(0);
                }
            }
        }
    });

    it('ㅅ·ㅈ 계열의 대각선은 원본에서 매끄럽게 잇고 획 무게를 유지한다', () => {
        const font = cloneFont();
        for (const [part, count, jamo] of [
            ['cho', 8, 9], ['cho', 8, 10], ['cho', 8, 12], ['cho', 8, 13], ['cho', 8, 14],
            ['jong', 4, 18], ['jong', 4, 19], ['jong', 4, 21], ['jong', 4, 22],
        ] as const) {
            for (let variant = 0; variant < count; variant++) {
                const source = font[glyphIndex(part, variant, jamo)];
                const smooth = smoothSourceAlphaBitmap(source);
                const previous = contourAlphaBitmap(upscaleGlyph(source), 32);
                const weight = smooth.reduce((sum, value) => sum + value, 0) /
                    previous.reduce((sum, value) => sum + value, 0);
                expect(smooth, `${part} ${variant} ${jamo}`).not.toEqual(previous);
                expect(smooth.some(value => value > 0 && value < 255)).toBe(true);
                expect(weight, `${part} ${variant} ${jamo}`).toBeGreaterThan(0.85);
                expect(weight, `${part} ${variant} ${jamo}`).toBeLessThan(1.15);
            }
        }
    });

    it.each([3, 4] as const)('같은 윤곽 방식으로 %s배 해상도 글리프를 그린다', (scale) => {
        const font = cloneFont();
        for (const [jamo, ring] of [[11, true], [18, true], [9, false], [12, false]] as const) {
            const source = font[glyphIndex('cho', 0, jamo)];
            const alpha = ring
                ? roundedRingAlphaGlyph(source, jamo === 18, scale)
                : smoothSourceAlphaBitmap(source, 16, scale);
            expect(alpha).toHaveLength(16 * scale * 16 * scale);
            expect(alpha.some(value => value === 255)).toBe(true);
            expect(alpha.some(value => value > 0 && value < 255)).toBe(true);
        }
        expect(smoothSourceAlphaBitmap(font[glyphIndex('cho', 0, 9)], 16, 2)).toEqual(
            smoothSourceAlphaBitmap(font[glyphIndex('cho', 0, 9)]));
    });

    it('전체 자소를 원본에서 다시 그려도 획이 사라지거나 과하게 두꺼워지지 않는다', () => {
        for (const [index, source] of cloneFont().entries()) {
            const previous = contourAlphaBitmap(upscaleGlyph(source), 32);
            const previousWeight = previous.reduce((sum, value) => sum + value, 0);
            if (previousWeight === 0) { continue; }
            const smooth = smoothSourceAlphaBitmap(source);
            const weight = smooth.reduce((sum, value) => sum + value, 0) / previousWeight;
            expect(weight, `자소 ${index}`).toBeGreaterThan(0.8);
            expect(weight, `자소 ${index}`).toBeLessThan(1.2);
        }
    });

    it('64×64 곡선 보간으로 분리된 점이나 획을 새로 만들지 않는다', () => {
        const 연결요소수 = (너비: number, 켜짐: (x: number, y: number) => boolean) => {
            const 확인 = new Uint8Array(너비 * 너비);
            let 개수 = 0;
            for (let y = 0; y < 너비; y++) {
                for (let x = 0; x < 너비; x++) {
                    const 시작 = y * 너비 + x;
                    if (확인[시작] || !켜짐(x, y)) { continue; }
                    개수++;
                    const 대기 = [시작];
                    확인[시작] = 1;
                    while (대기.length) {
                        const 위치 = 대기.pop()!;
                        const 열 = 위치 % 너비;
                        const 행 = Math.floor(위치 / 너비);
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = 열 + dx;
                                const ny = 행 + dy;
                                const 다음 = ny * 너비 + nx;
                                if (nx < 0 || nx >= 너비 || ny < 0 || ny >= 너비 ||
                                    확인[다음] || !켜짐(nx, ny)) { continue; }
                                확인[다음] = 1;
                                대기.push(다음);
                            }
                        }
                    }
                }
            }
            return 개수;
        };
        for (const [index, source] of cloneFont().entries()) {
            const 원본 = 연결요소수(16, (x, y) => hasPixel(source, 16, x, y));
            const 확대 = smoothSourceAlphaBitmap(source, 16, 4);
            expect(연결요소수(64, (x, y) => 확대[y * 64 + x] >= 64), `자소 ${index}`)
                .toBeLessThanOrEqual(원본);
        }
    });

    it('긴 곡선의 행별 픽셀 덮임이 계단 없이 이어진다', () => {
        const source = Array<number>(16).fill(0);
        for (let y = 2; y < 14; y++) {
            const right = Math.floor(2 + (y - 2) ** 2 / 15);
            for (let x = 2; x <= right; x++) { setPixel(source, 16, x, y, true); }
        }
        const alpha = smoothSourceAlphaBitmap(source, 16, 4);
        const coverage = Array.from({ length: 64 }, (_, y) =>
            alpha.slice(y * 64, (y + 1) * 64).reduce((sum, value) => sum + value, 0) / 255);
        const roughness = Array.from({ length: 40 }, (_, i) => i + 12).reduce((sum, y) =>
            sum + Math.abs(coverage[y + 1] - 2 * coverage[y] + coverage[y - 1]), 0);
        expect(roughness).toBeLessThan(10);
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
