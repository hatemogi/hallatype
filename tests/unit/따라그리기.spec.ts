import { 지문틀, 위치틀 } from '@/본문';
import { 끝글자 } from '@/글자';
import { 따라그리기틀 } from '@/따라그리기';
import * as 색상 from '@/색상';

function 연습(글: string): 따라그리기틀 {
    const 지문 = new 지문틀();
    지문.글쓰기(글);
    지문.쓰기(지문.위치, 끝글자);
    return new 따라그리기틀(지문);
}

function 보이는글자(본문: 따라그리기틀, 위치 = new 위치틀()) {
    return 본문.글자스트림(위치).next().value;
}

describe('장문 따라그리기', () => {
    it('틀린 키에서 멈추고 같은 키를 정정하면 지문 자소를 그대로 그린다', () => {
        const 본문 = 연습('가나');
        expect(본문.기대타수).toBe(4);
        expect(본문.입력('KeyT', false)).toEqual([new 위치틀()]);
        expect(본문.방금오타).toBe(true);
        expect(본문.위치).toEqual(new 위치틀());
        expect(보이는글자(본문).자.코드).toEqual([1, 1, 0]);
        expect(보이는글자(본문).색[0]).toBe(색상.오타빨강);
        본문.입력('KeyR', false);
        expect(본문.방금오타).toBe(false);
        expect(보이는글자(본문).색[0]).toBe(색상.정정파랑);
        본문.입력('KeyK', false);
        expect(보이는글자(본문).색[1]).toBe(색상.검정);
        expect(본문.위치).toEqual(new 위치틀(0, 1));
        본문.입력('KeyS', false);
        본문.입력('KeyK', false);
        expect(본문.끝).toBe(true);
        expect(본문.유효타수).toBe(3);
    });

    it('겹모음과 겹받침을 순서대로 받고, 도중에 틀린 획만 유효타수에서 뺀다', () => {
        const 본문 = 연습('괆'); // ㄱ + ㅘ + ㄻ
        expect(본문.기대타수).toBe(5);
        본문.입력('KeyR', false);
        본문.입력('KeyH', false);
        expect(보이는글자(본문).색[1]).toBe(색상.검정);
        expect(보이는글자(본문).키색[1]).toEqual([색상.검정, 색상.밝은회색]);
        본문.입력('KeyJ', false);
        expect(보이는글자(본문).색[1]).toBe(색상.오타빨강);
        expect(보이는글자(본문).키색[1]).toEqual([색상.검정, 색상.오타빨강]);
        expect(본문.위치).toEqual(new 위치틀());
        본문.입력('KeyK', false);
        expect(보이는글자(본문).색[1]).toBe(색상.정정파랑);
        expect(보이는글자(본문).키색[1]).toEqual([색상.검정, 색상.정정파랑]);
        본문.입력('KeyF', false);
        expect(보이는글자(본문).키색[2]).toEqual([색상.검정, 색상.밝은회색]);
        본문.입력('KeyA', false);
        expect(보이는글자(본문).키색[2]).toEqual([색상.검정, 색상.검정]);
        expect(본문.끝).toBe(true);
        expect(본문.유효타수).toBe(4);
    });

    it('쉬프트 자소, 문장부호, 줄바꿈을 물리 키로 확인한다', () => {
        const 본문 = 연습('까!\n가');
        expect(본문.기대타수).toBe(6);
        본문.입력('KeyR', false);
        expect(보이는글자(본문).색[0]).toBe(색상.오타빨강);
        본문.입력('KeyR', true);
        본문.입력('KeyK', false);
        본문.입력('Digit1', true);
        expect(본문.위치).toEqual(new 위치틀(0, 2));
        본문.입력('Enter', false);
        expect(본문.위치).toEqual(new 위치틀(1, 0));
        본문.입력('KeyR', false);
        본문.입력('KeyK', false);
        expect(본문.끝).toBe(true);
        expect(본문.유효타수).toBe(5);
    });

    it('띄어쓰기 대신 다음 글자 키를 누르면 건너뛰고 기대타수에서도 뺀다', () => {
        const 본문 = 연습('가 나');
        본문.입력('KeyR', false);
        본문.입력('KeyK', false);
        expect(본문.위치).toEqual(new 위치틀(0, 1));
        const 바뀐위치 = 본문.입력('KeyS', false);
        expect(바뀐위치).toContainEqual(new 위치틀(0, 1));
        expect(바뀐위치).toContainEqual(new 위치틀(0, 2));
        expect(본문.방금오타).toBe(false);
        expect(보이는글자(본문, new 위치틀(0, 1)).색[0]).toBe(색상.검정);
        expect(본문.기대타수).toBe(4);
        본문.입력('KeyK', false);
        expect(본문.끝).toBe(true);
        expect(본문.유효타수).toBe(4);

        const 공백입력 = 연습('가 나');
        for (const code of ['KeyR', 'KeyK', 'Space', 'KeyS', 'KeyK']) {
            공백입력.입력(code, false);
        }
        expect(공백입력.끝).toBe(true);
        expect(공백입력.기대타수).toBe(5);
        expect(공백입력.유효타수).toBe(5);
    });

    it('연속된 공백과 줄바꿈을 넘겨 다음 행으로 진행한다', () => {
        const 본문 = 연습('가 \n나');
        본문.입력('KeyR', false);
        본문.입력('KeyK', false);
        본문.입력('KeyS', false);
        expect(본문.위치).toEqual(new 위치틀(1, 0));
        expect(본문.기대타수).toBe(4);
        expect(보이는글자(본문, new 위치틀(0, 2)).색[0]).toBe(색상.검정);
        본문.입력('KeyK', false);
        expect(본문.끝).toBe(true);
    });

    it('공백에서 엉뚱한 키는 오타로 남고 다음 글자 키로 건너뛰면 정정 색이 된다', () => {
        const 본문 = 연습('가 나');
        본문.입력('KeyR', false);
        본문.입력('KeyK', false);
        본문.입력('KeyT', false);
        expect(본문.방금오타).toBe(true);
        expect(본문.위치).toEqual(new 위치틀(0, 1));
        본문.입력('KeyS', false);
        expect(본문.방금오타).toBe(false);
        expect(보이는글자(본문, new 위치틀(0, 1)).색[0]).toBe(색상.정정파랑);
        expect(본문.기대타수).toBe(4);
    });

    it('끝에 남은 줄바꿈은 마지막 글자와 함께 완료한다', () => {
        const 본문 = 연습('가\n');
        본문.입력('KeyR', false);
        본문.입력('KeyK', false);
        expect(본문.끝).toBe(true);
        expect(본문.기대타수).toBe(2);
        expect(본문.유효타수).toBe(2);
        expect(보이는글자(본문, new 위치틀(0, 1)).색[0]).toBe(색상.검정);
    });
});
