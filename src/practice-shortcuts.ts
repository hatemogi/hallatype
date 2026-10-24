export type 필사단축동작 = '다음' | '다시쓰기' | '주제고르기' | '환경설정' | '도움말' | null;

/** 입력 중과 완료 후에 같은 Alt 조합을 단축키로 쓴다. */
export function 필사단축키(event: Pick<KeyboardEvent,
  'code' | 'repeat' | 'isComposing' | 'defaultPrevented' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>,
  완료: boolean): 필사단축동작 {
  if (!event.altKey || event.repeat || event.isComposing || event.defaultPrevented ||
      event.ctrlKey || event.metaKey || event.shiftKey) { return null; }

  switch (event.code) {
    case 'Enter':
    case 'NumpadEnter': return 완료 ? '다음' : null;
    case 'KeyR': return '다시쓰기';
    case 'KeyG': return '주제고르기';
    case 'KeyS': return '환경설정';
    case 'KeyH': return '도움말';
    default: return null;
  }
}
