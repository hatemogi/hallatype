import { 지문틀 } from '@/본문';
import { 끝글자 } from '@/글자';
import { 따라그리기틀, 새화면키, 화면문자키 } from '@/따라그리기';

function 연습(글: string) {
    const 지문 = new 지문틀();
    지문.글쓰기(글);
    지문.쓰기(지문.위치, 끝글자);
    return new 따라그리기틀(지문);
}

describe('화면 키보드 입력', () => {
    it('두벌식 한글의 조합 중간값을 중복 없이 기존 획 판정에 전달한다', () => {
        const 본문 = 연습('가나');
        let 이전 = '';
        for (const 다음 of ['ㄱ', '가', '간', '가나']) {
            for (const 키 of 새화면키(이전, 다음)) { 본문.입력(키.code, 키.shift); }
            이전 = 다음;
        }
        expect(본문.끝).toBe(true);
        expect(본문.입력타수).toBe(4);
        expect(본문.유효타수).toBe(4);
    });

    it('겹모음, 겹받침, Shift 자모를 두벌식 키로 펼친다', () => {
        expect(화면문자키('괆')).toEqual([
            { code: 'KeyR', shift: false }, { code: 'KeyH', shift: false },
            { code: 'KeyK', shift: false }, { code: 'KeyF', shift: false },
            { code: 'KeyA', shift: false },
        ]);
        expect(화면문자키('ㄲ')).toEqual([{ code: 'KeyR', shift: true }]);
        expect(화면문자키('ㅒ')).toEqual([{ code: 'KeyO', shift: true }]);
    });

    it('QWERTY 대소문자와 문장부호도 기존 키 코드로 전달한다', () => {
        const 본문 = 연습('Hi!');
        for (const 키 of 새화면키('', 'Hi!')) { 본문.입력(키.code, 키.shift); }
        expect(본문.끝).toBe(true);
        expect(본문.유효타수).toBe(3);
    });
});
