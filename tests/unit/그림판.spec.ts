import 그림판틀 from '@/그림판';
import { 위치틀, 본문틀 } from '@/본문';
import { 글자틀, 색칠할글자 } from '@/글자';
import { 검정, 흰색 } from '@/색상';

describe('타자 연습 캔버스 글꼴', () => {
    const 화면 = (흰바탕 = false) => {
        const 요청: Array<[number, number, number, number]> = [];
        const 이미지들: ImageData[] = [];
        const ctx = {
            canvas: { width: 1286, height: 500 },
            getImageData: (x: number, y: number, w: number, h: number) => {
                요청.push([x, y, w, h]);
                const data = new Uint8ClampedArray(w * h * 4);
                if (흰바탕) { data.fill(255); }
                return { width: w, height: h, data } as ImageData;
            },
            putImageData: (이미지: ImageData) => 이미지들.push(이미지),
        } as unknown as CanvasRenderingContext2D;
        return { 그림판: new 그림판틀(ctx, {} as 본문틀), 요청, 이미지들 };
    };

    it('한글 자소를 32×32로 그려 실제 획을 채운다', () => {
        const { 그림판, 요청, 이미지들 } = 화면();
        const 글자 = new 색칠할글자(글자틀.생성('가'.charCodeAt(0)), [검정, 검정, 검정], 흰색);

        그림판.글자그리기(new 위치틀(1, 2), 글자);

        expect(요청).toEqual([[32, 44, 32, 32], [32, 44, 32, 32]]);
        expect(이미지들.every((이미지) => 이미지.data.some((값, i) => i % 4 === 3 && 값 === 255))).toBe(true);
    });

    it('라틴 8×16 글꼴은 16×32로 확대해 같은 행에 배치한다', () => {
        const { 그림판, 요청, 이미지들 } = 화면();
        const 글자 = new 색칠할글자(글자틀.생성('A'.charCodeAt(0)), [검정], 흰색);

        그림판.글자그리기(new 위치틀(1, 3), 글자);

        expect(요청).toEqual([[48, 44, 16, 32]]);
        const 알파 = (x: number, y: number) => 이미지들[0].data[(y * 16 + x) * 4 + 3];
        for (let y = 0; y < 32; y += 2) {
            for (let x = 0; x < 16; x += 2) {
                expect(알파(x, y)).toBe(알파(x + 1, y));
                expect(알파(x, y)).toBe(알파(x, y + 1));
            }
        }
        expect(이미지들[0].data.some((값, i) => i % 4 === 3 && 값 === 255)).toBe(true);
    });

    it('안티앨리어싱 강도를 올리면 중심 획은 유지되고 가장자리만 진해진다', () => {
        const 그리기 = (강도?: number) => {
            const { 그림판, 이미지들 } = 화면(true);
            if (강도 !== undefined) { 그림판.안티앨리어싱강도설정(강도); }
            그림판.글자그리기(new 위치틀(),
                new 색칠할글자(글자틀.생성('가'.charCodeAt(0)), [검정, 검정], 흰색));
            return 이미지들[0].data;
        };
        const 선명 = 그리기(0);
        const 기본 = 그리기();
        const 강함 = 그리기(300);
        expect(기본).toEqual(그리기(100));
        let 부드러운가장자리 = false;
        for (let i = 0; i < 선명.length; i += 4) {
            if (선명[i] === 0) {
                expect(기본[i]).toBe(0);
                expect(강함[i]).toBe(0);
            } else if (기본[i] < 255 && 강함[i] < 기본[i]) {
                부드러운가장자리 = true;
            }
        }
        expect(부드러운가장자리).toBe(true);
    });
});
