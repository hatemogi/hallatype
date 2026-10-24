export type 필사단축동작 = '다음' | '다시쓰기' | '즐겨찾기' | '주제고르기' | '환경설정' | '도움말' | null;

/** 주요 진행 동작은 Enter, 보조 동작은 Alt 조합으로 쓴다. */
export function 필사단축키(event: Pick<KeyboardEvent,
  'code' | 'repeat' | 'isComposing' | 'defaultPrevented' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>,
  완료: boolean): 필사단축동작 {
  if (event.repeat || event.isComposing || event.defaultPrevented ||
      event.ctrlKey || event.metaKey || event.shiftKey) { return null; }

  if (!event.altKey) {
    return 완료 && (event.code === 'Enter' || event.code === 'NumpadEnter') ? '다음' : null;
  }
  switch (event.code) {
    case 'KeyR': return '다시쓰기';
    case 'KeyF': return '즐겨찾기';
    case 'KeyG': return '주제고르기';
    case 'KeyS': return '환경설정';
    case 'KeyH': return '도움말';
    default: return null;
  }
}
