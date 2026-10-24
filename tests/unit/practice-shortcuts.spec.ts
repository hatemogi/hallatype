import { 필사단축키 } from '@/practice-shortcuts';

function 키(code: string, 변경: Partial<Record<'repeat' | 'isComposing' | 'defaultPrevented' |
  'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>> = {}) {
  return { code, repeat: false, isComposing: false, defaultPrevented: false,
    altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, ...변경 };
}

describe('필사 단축키', () => {
  it.each([false, true])('완료 상태 %s에서 Alt 조합만 공통 동작시킨다', (완료) => {
    for (const code of ['KeyR', 'KeyG', 'KeyS', 'KeyH']) {
      expect(필사단축키(키(code), 완료)).toBeNull();
    }
    expect(필사단축키(키('KeyR', { altKey: true }), 완료)).toBe('다시쓰기');
    expect(필사단축키(키('KeyG', { altKey: true }), 완료)).toBe('주제고르기');
    expect(필사단축키(키('KeyS', { altKey: true }), 완료)).toBe('환경설정');
    expect(필사단축키(키('KeyH', { altKey: true }), 완료)).toBe('도움말');
  });

  it('Enter는 완료 후에만 다음 지문으로 이동한다', () => {
    for (const code of ['Enter', 'NumpadEnter']) {
      expect(필사단축키(키(code), false)).toBeNull();
      expect(필사단축키(키(code), true)).toBe('다음');
      expect(필사단축키(키(code, { altKey: true }), true)).toBeNull();
      expect(필사단축키(키(code, { repeat: true }), true)).toBeNull();
      expect(필사단축키(키(code, { isComposing: true }), true)).toBeNull();
    }
  });

  it('반복·조합 입력과 다른 수정키에는 반응하지 않는다', () => {
    for (const 변경 of [{ repeat: true }, { isComposing: true }, { defaultPrevented: true },
      { shiftKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      expect(필사단축키(키('KeyR', { altKey: true, ...변경 }), true)).toBeNull();
    }
  });
});
