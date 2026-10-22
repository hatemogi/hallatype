import 그림판틀 from '@/그림판';
import { 위치틀, 지문틀, 본문틀 } from '@/본문';
import { 끝글자, 글자틀, 색칠할글자 } from '@/글자';
import { 검정, 흰색 } from '@/색상';
import { 따라그리기틀 } from '@/따라그리기';

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

    it('입력과 커서 이동 때 바뀐 칸만 지우고 다시 그린다', () => {
        const 지문 = new 지문틀();
        지문.글쓰기('가A나');
        지문.쓰기(지문.위치, 끝글자);
        const 본문 = new 본문틀(지문);
        const 칠한영역: number[][] = [];
        const 이미지영역: number[][] = [];
        const ctx = {
            canvas: { width: 1286, height: 500 },
            fillRect: (x: number, y: number, w: number, h: number) => 칠한영역.push([x, y, w, h]),
            getImageData: (_x: number, _y: number, w: number, h: number) =>
                ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4).fill(255) } as ImageData),
            putImageData: (이미지: ImageData, x: number, y: number,
                           _dx: number, _dy: number, w: number) => 이미지영역.push([x, y, 이미지.width, w]),
        } as unknown as CanvasRenderingContext2D;
        const 그림판 = new 그림판틀(ctx, 본문);
        그림판.그리기();

        칠한영역.length = 0;
        이미지영역.length = 0;
        본문.쓰기(글자틀.생성('A'.charCodeAt(0)));
        그림판.변경그리기([본문.위치]);
        expect(칠한영역).toContainEqual([0, 0, 32, 44]);
        expect(이미지영역).toEqual([[0, 0, 16, 16]]);

        칠한영역.length = 0;
        이미지영역.length = 0;
        const 이전위치 = 본문.위치;
        본문.다음();
        그림판.변경그리기([이전위치, 본문.위치]);
        expect(칠한영역.filter(([, , , h]) => h === 44)).toEqual([[0, 0, 32, 44], [32, 0, 16, 44]]);
        expect(이미지영역.every(([x]) => x === 0 || x === 32)).toBe(true);

        칠한영역.length = 0;
        이미지영역.length = 0;
        본문.쓰기(글자틀.생성('가'.charCodeAt(0)));
        그림판.변경그리기([본문.위치]);
        expect(칠한영역).toContainEqual([32, 0, 16, 44]);
        expect(이미지영역).toEqual([[32, 0, 32, 16], [32, 0, 32, 16]]);
    });

    it('줄바꿈 후의 글자도 문서 위치로 찾아 해당 칸만 갱신한다', () => {
        const 지문 = new 지문틀();
        지문.글쓰기('가'.repeat(39) + 'A나');
        지문.쓰기(지문.위치, 끝글자);
        const 본문 = new 본문틀(지문);
        const 칠한영역: number[][] = [];
        const ctx = {
            canvas: { width: 1286, height: 500 },
            fillRect: (x: number, y: number, w: number, h: number) => 칠한영역.push([x, y, w, h]),
            getImageData: (_x: number, _y: number, w: number, h: number) =>
                ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4).fill(255) } as ImageData),
            putImageData: () => undefined,
        } as unknown as CanvasRenderingContext2D;
        const 그림판 = new 그림판틀(ctx, 본문);
        그림판.그리기();
        for (let i = 0; i < 40; i++) { 본문.다음(); }

        칠한영역.length = 0;
        그림판.변경그리기([본문.위치]);
        expect(칠한영역).toContainEqual([0, 44, 32, 44]);
        expect(칠한영역.some(([, , w]) => w === 1286)).toBe(false);
    });

    it('긴 필사 지문의 마지막 줄까지 캔버스를 늘려 그린다', () => {
        const 지문 = new 지문틀();
        지문.글쓰기('가'.repeat(500));
        지문.쓰기(지문.위치, 끝글자);
        const 본문 = new 따라그리기틀(지문);
        const ctx = {
            canvas: { width: 1286, height: 500 },
            fillRect: () => undefined,
        } as unknown as CanvasRenderingContext2D;
        const 그림판 = new 그림판틀(ctx, 본문);
        const 그린글자 = vi.spyOn(그림판, '글자그리기').mockImplementation(() => undefined);

        그림판.그리기();

        expect(ctx.canvas.height).toBeGreaterThan(500);
        expect(그린글자).toHaveBeenCalledTimes(500);
        expect(그린글자.mock.calls.at(-1)?.[0].행).toBeGreaterThanOrEqual(11);
        expect(그림판.커서세로위치).toBe(44);
    });

    it('80칸 끝의 공백과 마침표는 같은 줄에 남기고 다음 글자부터 줄을 바꾼다', () => {
        for (const [글, 예상위치] of [
            ['가'.repeat(40) + ' 나', [new 위치틀(0, 80), new 위치틀(1, 0)]],
            ['가'.repeat(40) + '. 나', [new 위치틀(0, 80), new 위치틀(0, 81), new 위치틀(1, 0)]],
        ] as const) {
            const 지문 = new 지문틀();
            지문.글쓰기(글);
            지문.쓰기(지문.위치, 끝글자);
            const 원문글자들 = 지문.줄(0).map((글자) => [...글자.코드]);
            const ctx = {
                canvas: { width: 1286, height: 500 },
                fillRect: () => undefined,
            } as unknown as CanvasRenderingContext2D;
            const 그림판 = new 그림판틀(ctx, new 따라그리기틀(지문));
            const 그린글자 = vi.spyOn(그림판, '글자그리기').mockImplementation(() => undefined);

            그림판.그리기();

            expect(그린글자.mock.calls.slice(40).map(([위치]) => 위치)).toEqual(예상위치);
            expect(ctx.canvas.width).toBeGreaterThanOrEqual(1302);
            expect(지문.줄(0).map((글자) => 글자.코드)).toEqual(원문글자들);
        }
    });

    it('자동 줄바꿈의 남은 폭만 단어 사이 공백에 나누고 원문과 입력 위치를 보존한다', () => {
        const 글 = '가 '.repeat(26) + 'A나';
        const 지문 = new 지문틀();
        지문.글쓰기(글);
        지문.쓰기(지문.위치, 끝글자);
        const 원문글자들 = 지문.줄(0).map((글자) => [...글자.코드]);
        const 칠한영역: number[][] = [];
        const ctx = {
            canvas: { width: 1286, height: 500 },
            fillRect: (x: number, y: number, w: number, h: number) => 칠한영역.push([x, y, w, h]),
        } as unknown as CanvasRenderingContext2D;
        const 그림판 = new 그림판틀(ctx, new 따라그리기틀(지문));
        const 그린글자 = vi.spyOn(그림판, '글자그리기').mockImplementation(() => undefined);

        그림판.그리기();

        expect(그린글자.mock.calls[0][0]).toEqual(new 위치틀(0, 0));
        expect(그린글자.mock.calls[52][0]).toEqual(new 위치틀(0, 79));
        expect(그린글자.mock.calls[53][0]).toEqual(new 위치틀(1, 0));
        expect(그린글자.mock.calls.filter(([, , 너비], i) => i < 52 && 너비 === 17)).toHaveLength(16);
        expect(지문.줄(0).map((글자) => 글자.코드)).toEqual(원문글자들);

        칠한영역.length = 0;
        그림판.변경그리기([new 위치틀(0, 52)]);
        expect(칠한영역).toContainEqual([1264, 0, 16, 44]);
    });

    it('문단 마지막 줄과 공백 없는 줄은 늘리지 않는다', () => {
        for (const [글, 예상] of [
            ['가 '.repeat(26) + 'A', 78],
            ['가 '.repeat(26) + 'A\n나', 78],
            ['가'.repeat(39) + 'A나', 78],
        ] as const) {
            const 지문 = new 지문틀();
            지문.글쓰기(글);
            지문.쓰기(지문.위치, 끝글자);
            const ctx = {
                canvas: { width: 1286, height: 500 },
                fillRect: () => undefined,
            } as unknown as CanvasRenderingContext2D;
            const 그림판 = new 그림판틀(ctx, new 따라그리기틀(지문));
            const 그린글자 = vi.spyOn(그림판, '글자그리기').mockImplementation(() => undefined);

            그림판.그리기();

            expect(그린글자.mock.calls[글.indexOf('A')][0].열).toBe(예상);
        }
    });

    it('오타 애니메이션 중에는 밑줄만 갱신하고 정타 입력을 즉시 반영한다', () => {
        const 지문 = new 지문틀();
        지문.글쓰기('가나');
        지문.쓰기(지문.위치, 끝글자);
        const 본문 = new 따라그리기틀(지문);
        const ctx = {
            canvas: { width: 1286, height: 500 },
            fillRect: () => undefined,
            getImageData: (_x: number, _y: number, w: number, h: number) =>
                ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4).fill(255) } as ImageData),
            putImageData: () => undefined,
        } as unknown as CanvasRenderingContext2D;
        const 그림판 = new 그림판틀(ctx, 본문);
        그림판.그리기();
        let 프레임: FrameRequestCallback = () => undefined;
        const 취소 = vi.fn();
        vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            프레임 = callback;
            return 1;
        });
        vi.stubGlobal('cancelAnimationFrame', 취소);
        try {
            const 다시그리기 = vi.spyOn(그림판, '변경그리기');
            본문.입력('KeyT', false);
            그림판.오타효과시작(본문.위치);
            expect(다시그리기).toHaveBeenCalledTimes(1);
            프레임(performance.now() + 100);
            expect(다시그리기).toHaveBeenCalledTimes(1);

            const 바뀐위치 = 본문.입력('KeyR', false);
            그림판.오타효과중지(false);
            그림판.변경그리기(바뀐위치);
            expect(취소).toHaveBeenCalled();
            expect(다시그리기).toHaveBeenCalledTimes(2);
            expect(본문.방금오타).toBe(false);
            expect(본문.유효타수).toBe(0);
            본문.입력('KeyK', false);
            expect(본문.위치).toEqual(new 위치틀(0, 1));
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('커서 밑줄만 깜빡이고 입력 시 새 위치에서 다시 시작한다', () => {
        const 지문 = new 지문틀();
        지문.글쓰기('가나');
        지문.쓰기(지문.위치, 끝글자);
        const 본문 = new 따라그리기틀(지문);
        const 칠한영역: Array<{ 위치: number[]; 색: string }> = [];
        let 이미지수 = 0;
        let 현재색 = '';
        const ctx = {
            canvas: { width: 1286, height: 500 },
            set fillStyle(색: string) { 현재색 = 색; },
            fillRect(x: number, y: number, w: number, h: number) {
                칠한영역.push({ 위치: [x, y, w, h], 색: 현재색 });
            },
            getImageData: (_x: number, _y: number, w: number, h: number) =>
                ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4).fill(255) } as ImageData),
            putImageData: () => { 이미지수++; },
        } as unknown as CanvasRenderingContext2D;
        const 틱들: Array<() => void> = [];
        const 타이머시작 = vi.fn((틱: () => void) => { 틱들.push(틱); return 틱들.length; });
        const 타이머중지 = vi.fn();
        let 프레임: FrameRequestCallback = () => undefined;
        vi.stubGlobal('window', {
            setInterval: 타이머시작,
            clearInterval: 타이머중지,
            matchMedia: () => ({ matches: false }),
        });
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            프레임 = callback;
            return 1;
        });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        try {
            const 그림판 = new 그림판틀(ctx, 본문);
            그림판.그리기();
            expect(타이머시작).toHaveBeenCalledWith(expect.any(Function), 500);
            const 처음이미지수 = 이미지수;
            칠한영역.length = 0;

            틱들[0]();
            expect(칠한영역).toEqual([{ 위치: [0, 32, 32, 4], 색: '#fff' }]);
            틱들[0]();
            expect(칠한영역[2].위치).toEqual([0, 32, 32, 4]);
            expect(칠한영역[2].색).not.toBe('#fff');
            expect(이미지수).toBe(처음이미지수);

            본문.입력('KeyR', false);
            그림판.변경그리기([본문.위치]);
            const 바뀐위치 = 본문.입력('KeyK', false);
            그림판.변경그리기(바뀐위치);
            expect(타이머중지).toHaveBeenCalled();
            칠한영역.length = 0;
            틱들.at(-1)!();
            expect(칠한영역).toEqual([{ 위치: [32, 32, 32, 4], 색: '#fff' }]);

            const 이전타이머수 = 틱들.length;
            그림판.오타효과시작(본문.위치);
            expect(타이머중지).toHaveBeenLastCalledWith(이전타이머수);
            expect(틱들).toHaveLength(이전타이머수);
            프레임(performance.now() + 500);
            expect(틱들).toHaveLength(이전타이머수 + 1);

            그림판.종료();
            expect(타이머중지).toHaveBeenLastCalledWith(틱들.length);
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
