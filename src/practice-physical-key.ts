const 필사키코드 = /^(Key[A-Z]|Digit[0-9]|Space|Enter|Backspace|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/;

/** IME가 내보내는 keyCode 229 조합 알림은 실제 물리 키 입력으로 세지 않는다. */
export function 필사키인가(event: Pick<KeyboardEvent,
  'code' | 'keyCode' | 'ctrlKey' | 'altKey' | 'metaKey'>): boolean {
  return event.keyCode !== 229 && !event.ctrlKey && !event.altKey && !event.metaKey &&
    필사키코드.test(event.code);
}
