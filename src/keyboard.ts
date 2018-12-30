/**
 * 자바스크립트 keydown 이벤트 핸들러에 받을 수 있는 KeyboardEvent.code에는
 * IME 상태와 상관없이 키보드 키값을 읽을 수 있다. 아래의 문자열이 들어있다.
 *
 * Backquote Digit1..Digit0 Minus Equal Backspace
 * KeyQ..KeyP BracketLeft BracketRight Backslash
 * KeyA..KeyL Semicolon Quote Enter
 * KeyZ..KeyM Comma Period Slash
 * Space
 * ShiftLeft ShiftRight ControlLeft AltLeft AltRight MetaLeft MetaRight
 * ArrowLeft ArrowRight ArrowUp ArrowDown
 *
 * 여기서 관심있는 것은, 눌린 글자와 쉬프트키가 눌려있는지 여부.
 * 쿼티기준 대소문자 포함해서 표현하면 편리할 것 같다.
 * 변환이 귀찮으니, 그냥 (쉬프트, 코드값) 튜플로 쓰는 것도 방법
 */

export default function 키코드(code: string): [boolean, string] {
    return [false, 'unknown'];
}
