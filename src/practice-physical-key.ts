const 필사키코드 = /^(Key[A-Z]|Digit[0-9]|Space|Enter|Backspace|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/;

/** IME가 처리한 키도 code가 실제 키 위치를 알려주면 입력으로 받는다. */
export function 필사키인가(event: Pick<KeyboardEvent,
  'code' | 'keyCode' | 'ctrlKey' | 'altKey' | 'metaKey'>): boolean {
  return !(event.keyCode === 229 && event.code === 'Enter') &&
    !event.ctrlKey && !event.altKey && !event.metaKey &&
    필사키코드.test(event.code);
}

/** 물리 키가 있는 기기는 IME의 문자열 재조합 대신 실제 키 누름을 기준으로 받는다. */
export function 물리키직접처리환경(환경: Pick<Navigator, 'maxTouchPoints'>): boolean {
  return 환경.maxTouchPoints === 0;
}
