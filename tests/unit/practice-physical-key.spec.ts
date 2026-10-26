import { 지문틀 } from '@/본문';
import { 끝글자 } from '@/글자';
import { 필사키인가 } from '@/practice-physical-key';
import { 화면입력흐름 } from '@/practice-textarea-input';
import { 따라그리기틀 } from '@/따라그리기';
import { 필사팔레트들 } from '@/practice-settings';

function 키(code: string, keyCode: number) {
  return { code, keyCode, ctrlKey: false, altKey: false, metaKey: false };
}

describe('한글 물리 키 입력', () => {
  it('첫 ㅎ 뒤에 온 IME 조합 알림을 다시 입력하지 않는다', () => {
    const 지문 = new 지문틀();
    지문.글쓰기('화');
    지문.쓰기(지문.위치, 끝글자);
    const 본문 = new 따라그리기틀(지문);
    const 흐름 = new 화면입력흐름();

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
  });

  it('물리 키 코드가 없는 조합 이벤트는 textarea 입력으로 이어진다', () => {
    const 흐름 = new 화면입력흐름();
    expect(필사키인가(키('KeyG', 229))).toBe(false);
    expect(흐름.입력('ㅎ', 'insertCompositionText')).toEqual([{ code: 'KeyG', shift: false }]);
    expect(흐름.입력('화', 'insertCompositionText')).toEqual([
      { code: 'KeyH', shift: false }, { code: 'KeyK', shift: false },
    ]);
  });
});
