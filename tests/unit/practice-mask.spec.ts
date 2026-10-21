import savedMasks from '@/assets/key-masks.json';
import { 지문틀, 위치틀 } from '@/본문';
import { 끝글자 } from '@/글자';
import { 따라그리기틀 } from '@/따라그리기';
import 그림판틀 from '@/그림판';
import { 한글글꼴 } from '@/fonts';
import { COMPOUNDS, clampMasks, maskKey, validMasks } from '@/key-mask';
import { practiceMasks } from '@/practice-mask';
import * as 색상 from '@/색상';

describe('편집한 키 마스크의 타자 연습 반영', () => {
    it('내보낸 72개 마스크를 기본 데이터로 읽고 사용자 편집본을 우선한다', () => {
        expect(validMasks(savedMasks.masks)).toBe(true);
        expect(practiceMasks()).toEqual(clampMasks(savedMasks.masks, 한글글꼴));
        expect(clampMasks(savedMasks.masks, 한글글꼴)).toEqual(savedMasks.masks);
        expect(COMPOUNDS.flatMap((item) => [0, 1, 2, 3].map((variant) => maskKey(item, variant)))).toHaveLength(72);
        const draft = structuredClone(savedMasks.masks);
        draft['jung:0:16'][0] = 0xffff;
        const storage = { getItem: () => JSON.stringify(draft) };
        expect(practiceMasks(storage)['jung:0:16']).toEqual(clampMasks(draft, 한글글꼴)['jung:0:16']);
        expect(practiceMasks({ getItem: () => '{' })).toEqual(practiceMasks());
    });

    it('ㅟ의 두 키 픽셀을 각각 미입력·정타·오타·정정 색으로 그린다', () => {
        const 지문 = new 지문틀();
        지문.글쓰기('위');
        지문.쓰기(지문.위치, 끝글자);
        const 본문 = new 따라그리기틀(지문);
        const 이미지들: ImageData[] = [];
        const ctx = {
            canvas: { width: 1286, height: 500 },
            fillRect: () => undefined,
            getImageData: (_x: number, _y: number, width: number, height: number) =>
                ({ width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) } as ImageData),
            putImageData: (image: ImageData) => 이미지들.push(image),
        } as unknown as CanvasRenderingContext2D;
        const 그림판 = new 그림판틀(ctx, 본문);
        const 중성색 = () => {
            이미지들.length = 0;
            그림판.글자그리기(new 위치틀(), 본문.글자스트림().next().value);
            const pixels = 이미지들[1].data;
            const count = (color: 색상.RGBA) => {
                let total = 0;
                for (let i = 0; i < pixels.length; i += 4) {
                    if (pixels[i] === color[0] && pixels[i + 1] === color[1] && pixels[i + 2] === color[2]) { total++; }
                }
                return total;
            };
            return { first: count(색상.검정), pending: count(색상.밝은회색),
                wrong: count(색상.오타빨강), corrected: count(색상.정정파랑) };
        };

        본문.입력('KeyD', false); // ㅇ
        expect(중성색().first).toBe(0);
        본문.입력('KeyN', false); // ㅜ
        expect(중성색().first).toBeGreaterThan(0);
        expect(중성색().pending).toBeGreaterThan(0);
        본문.입력('KeyJ', false); // 둘째 키 오타
        expect(중성색().wrong).toBeGreaterThan(0);
        expect(중성색().first).toBeGreaterThan(0);
        본문.입력('KeyL', false); // ㅣ 정정
        expect(중성색().corrected).toBeGreaterThan(0);
        expect(중성색().wrong).toBe(0);
    });
});
