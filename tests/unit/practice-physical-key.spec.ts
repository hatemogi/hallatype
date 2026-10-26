import { 지문틀 } from '@/본문';
import { 끝글자 } from '@/글자';
import { 필사키인가, 물리키직접처리환경 } from '@/practice-physical-key';
import { 화면입력흐름 } from '@/practice-textarea-input';
import { 따라그리기틀, 화면문자키 } from '@/따라그리기';
import { 필사팔레트들 } from '@/practice-settings';
import { 시작하기지문들 } from '@/practice-intro-passages';

function 키(code: string, keyCode: number) {
  return { code, keyCode, ctrlKey: false, altKey: false, metaKey: false };
}

describe('한글 물리 키 입력', () => {
  it('첫 글자 지문을 한 번씩 누르면 정타 215/215로 마친다', () => {
    const 지문 = new 지문틀();
    지문.글쓰기(시작하기지문들[0].본문);
    지문.쓰기(지문.위치, 끝글자);
    const 본문 = new 따라그리기틀(지문);
    const 흐름 = new 화면입력흐름();
    흐름.물리키우선설정();
    const 키들 = [...시작하기지문들[0].본문].flatMap(화면문자키);
    expect(키들).toHaveLength(215);
    키들.forEach((입력, 순서) => {
      // Safari는 같은 입력의 textarea input을 keydown보다 먼저 보낼 수도 있다.
      expect(흐름.입력(String(순서), 'insertText')).toEqual([]);
      const 이벤트 = 키(입력.code, 순서 % 2 ? 229 : 65);
      expect(필사키인가(이벤트)).toBe(true);
      for (const 전달 of 흐름.물리키(입력.code, 입력.shift)) {
        본문.입력(전달.code, 전달.shift);
      }
      expect(흐름.물리키(입력.code, 입력.shift)).toEqual([]);
      흐름.키뗌(입력.code);
    });
    expect(본문.끝).toBe(true);
    expect(본문.입력타수).toBe(215);
    expect(본문.유효타수).toBe(215);
  });

  it('Mac Safari는 한글 재조합 중에도 물리 키마다 한 타씩 센다', () => {
    const 지문 = new 지문틀();
    지문.글쓰기('화면의 문장을 보며');
    지문.쓰기(지문.위치, 끝글자);
    const 본문 = new 따라그리기틀(지문);
    const 흐름 = new 화면입력흐름();
    const Safari = { vendor: 'Apple Computer, Inc.', maxTouchPoints: 0 };
    expect(물리키직접처리환경(Safari)).toBe(true);
    흐름.물리키우선설정();

    // textarea 문자열이 매번 바뀌어도 물리 키를 한 번만 전달한다.
    for (const [값, code, keyCode] of [
      ['ㅎ', 'KeyG', 71], ['호', 'KeyH', 229], ['화', 'KeyK', 229],
      ['홤', 'KeyA', 65], ['화며', 'KeyU', 229], ['화면', 'KeyS', 229],
      ['화면ㅇ', 'KeyD', 68], ['화면으', 'KeyM', 229], ['화면의', 'KeyL', 229],
      ['화면의 ', 'Space', 32], ['화면의 ㅁ', 'KeyA', 229],
      ['화면의 무', 'KeyN', 78], ['화면의 문', 'KeyS', 229],
      ['화면의 문ㅈ', 'KeyW', 229], ['화면의 문자', 'KeyK', 75],
      ['화면의 문장', 'KeyD', 229], ['화면의 문장ㅇ', 'KeyD', 68],
      ['화면의 문장으', 'KeyM', 229], ['화면의 문장을', 'KeyF', 229],
      ['화면의 문장을 ', 'Space', 32], ['화면의 문장을 ㅂ', 'KeyQ', 229],
      ['화면의 문장을 보', 'KeyH', 72], ['화면의 문장을 봄', 'KeyA', 229],
      ['화면의 문장을 보며', 'KeyU', 229],
    ] as const) {
      if (물리키직접처리환경(Safari) && 필사키인가(키(code, keyCode))) {
        for (const 입력 of 흐름.물리키(code, false)) { 본문.입력(입력.code, 입력.shift); }
      }
      expect(흐름.입력(값, 'insertText')).toEqual([]);
      흐름.키뗌(code);
      expect(본문.방금오타).toBe(false);
    }
    expect(본문.끝).toBe(true);
    expect(본문.입력타수).toBe(24);
    expect(본문.유효타수).toBe(24);
    expect(물리키직접처리환경({ maxTouchPoints: 1 })).toBe(false);
  });

  it('Safari 입력 중 오타를 지운 뒤 바른 자소를 넣으면 같은 자리에서 진행한다', () => {
    const 지문 = new 지문틀();
    지문.글쓰기('화면');
    지문.쓰기(지문.위치, 끝글자);
    const 본문 = new 따라그리기틀(지문);
    const 흐름 = new 화면입력흐름();
    for (const 값 of ['ㅎ', '호', '화', '홤', '화며', '화멈']) {
      for (const 입력 of 흐름.입력(값, 'insertText')) { 본문.입력(입력.code, 입력.shift); }
    }
    expect(본문.방금오타).toBe(true);
    expect(본문.진행획수).toBe(5);
    expect(흐름.입력('화며', 'deleteContentBackward')).toEqual([]);
    for (const 입력 of 흐름.입력('화면', 'insertText')) { 본문.입력(입력.code, 입력.shift); }
    expect(본문.끝).toBe(true);
    expect(본문.방금오타).toBe(false);
  });

  it('첫 ㅎ 뒤에 온 IME 조합 알림을 다시 입력하지 않는다', () => {
    const 지문 = new 지문틀();
    지문.글쓰기('화');
    지문.쓰기(지문.위치, 끝글자);
    const 본문 = new 따라그리기틀(지문);
    const 흐름 = new 화면입력흐름();
    흐름.물리키우선설정();

    expect(흐름.입력('ㅎ', 'insertCompositionText')).toEqual([]);
    if (필사키인가(키('KeyG', 71))) {
      for (const 입력 of 흐름.물리키('KeyG', false)) { 본문.입력(입력.code, 입력.shift); }
    }
    if (필사키인가(키('KeyG', 229))) {
      for (const 입력 of 흐름.물리키('KeyG', false)) { 본문.입력(입력.code, 입력.shift); }
    }
    expect(흐름.입력('ㅎ', 'insertCompositionText')).toEqual([]);
    expect(본문.진행획수).toBe(1);
    expect(본문.입력타수).toBe(1);
    expect(본문.방금오타).toBe(false);
    expect(본문.글자스트림().next().value.색[1]).toEqual(필사팔레트들.한지.바탕글);
    흐름.키뗌('KeyG');
    expect(흐름.물리키('KeyH', false)).toEqual([{ code: 'KeyH', shift: false }]);
  });

  it('물리 키 코드가 없는 조합 이벤트는 textarea 입력으로 이어진다', () => {
    const 흐름 = new 화면입력흐름();
    expect(필사키인가(키('Unidentified', 229))).toBe(false);
    expect(흐름.입력('ㅎ', 'insertCompositionText')).toEqual([{ code: 'KeyG', shift: false }]);
    expect(흐름.입력('화', 'insertCompositionText')).toEqual([
      { code: 'KeyH', shift: false }, { code: 'KeyK', shift: false },
    ]);
  });
});
