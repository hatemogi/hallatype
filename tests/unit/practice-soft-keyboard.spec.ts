import { 지문틀 } from '@/본문';
import { 끝글자 } from '@/글자';
import { 따라그리기틀, 화면문자키 } from '@/따라그리기';
import { 새화면키, 화면입력흐름 } from '@/practice-textarea-input';

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

    it('입력창 중간에 넣은 글자만 전달하고 기존 뒷글자를 다시 세지 않는다', () => {
        expect(새화면키('가나', '가다나')).toEqual([
            { code: 'KeyE', shift: false }, { code: 'KeyK', shift: false },
        ]);
        expect(새화면키('가바나', '가다나')).toEqual([
            { code: 'KeyE', shift: false }, { code: 'KeyK', shift: false },
        ]);
    });

    it('붙여넣기와 자동 대체는 타수에 넣지 않고 다음 실제 입력만 전달한다', () => {
        const 흐름 = new 화면입력흐름();
        expect(흐름.입력('가나', 'insertFromPaste')).toEqual([]);
        expect(흐름.입력('가나다', 'insertText')).toEqual([
            { code: 'KeyE', shift: false }, { code: 'KeyK', shift: false },
        ]);
        expect(흐름.입력('가라마', 'insertReplacementText')).toEqual([]);
        expect(흐름.입력('가라마!', 'insertText')).toEqual([{ code: 'Digit1', shift: true }]);
    });

    it('물리 키가 전달되면 같은 키의 textarea 조합 이벤트를 다시 보내지 않는다', () => {
        const 본문 = 연습('가');
        const 흐름 = new 화면입력흐름();
        흐름.조합시작();
        for (const 키 of 흐름.물리키('KeyR', false)) { 본문.입력(키.code, 키.shift); }
        expect(흐름.입력('ㄱ', 'insertCompositionText')).toEqual([]);
        for (const 키 of 흐름.물리키('KeyK', false)) { 본문.입력(키.code, 키.shift); }
        expect(흐름.입력('가', 'insertCompositionText')).toEqual([]);
        expect(흐름.조합끝('가')).toEqual([]);
        expect(본문.끝).toBe(true);
        expect(본문.입력타수).toBe(2);
        expect(본문.유효타수).toBe(2);
    });

    it('iOS 한글 입력기의 내부 삭제 뒤 받침이 초성으로 옮겨져도 중복 집계하지 않는다', () => {
        const 본문 = 연습('가나');
        const 흐름 = new 화면입력흐름();
        for (const [값, 종류] of [
            ['ㄱ', 'insertText'], ['가', 'insertText'], ['간', 'insertText'],
            ['가', 'deleteContentBackward'], ['가나', 'insertText'],
        ]) {
            for (const 키 of 흐름.입력(값, 종류)) { 본문.입력(키.code, 키.shift); }
        }
        expect(본문.끝).toBe(true);
        expect(본문.입력타수).toBe(4);
        expect(본문.유효타수).toBe(4);
    });

    it('맥 한글 조합 중에는 늘어난 자소를 즉시 전달하고 확정 때 중복 집계하지 않는다', () => {
        const 본문 = 연습('가나');
        const 흐름 = new 화면입력흐름();
        흐름.조합시작();
        for (const 키 of 흐름.입력('ㄱ', 'insertCompositionText')) { 본문.입력(키.code, 키.shift); }
        expect(본문.진행획수).toBe(1);
        for (const 키 of 흐름.입력('가', 'insertCompositionText')) { 본문.입력(키.code, 키.shift); }
        expect(본문.진행획수).toBe(2);
        for (const 키 of 흐름.조합끝('가')) { 본문.입력(키.code, 키.shift); }
        expect(흐름.입력('가', 'insertText')).toEqual([]);
        for (const 키 of 흐름.입력('가ㄴ', 'insertCompositionText')) { 본문.입력(키.code, 키.shift); }
        expect(본문.진행획수).toBe(3);
        expect(흐름.입력('가', 'deleteContentBackward')).toEqual([]);
        for (const 키 of 흐름.입력('가나', 'insertCompositionText')) { 본문.입력(키.code, 키.shift); }
        expect(본문.끝).toBe(true);
        expect(본문.입력타수).toBe(4);
        expect(본문.유효타수).toBe(4);
    });

    it('iOS가 넣은 줄바꿈 없는 공백도 공백 키로 처리한다', () => {
        const 본문 = 연습('가 나');
        const 흐름 = new 화면입력흐름();
        for (const 키 of 흐름.입력('가\u00a0나', 'insertText')) { 본문.입력(키.code, 키.shift); }
        expect(본문.끝).toBe(true);
        expect(본문.입력타수).toBe(5);
        expect(본문.유효타수).toBe(5);
    });
});
