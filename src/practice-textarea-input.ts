import { 화면문자키, type 키 } from './따라그리기';

/** textarea에서 실제로 바뀐 구간만 두벌식 키로 펼친다. */
export function 새화면키(이전: string, 다음: string): 키[] {
    const 이전글자 = [...이전];
    const 다음글자 = [...다음];
    let 앞 = 0;
    while (앞 < 이전글자.length && 앞 < 다음글자.length && 이전글자[앞] === 다음글자[앞]) { 앞++; }
    let 뒤 = 0;
    while (뒤 < 이전글자.length - 앞 && 뒤 < 다음글자.length - 앞 &&
        이전글자[이전글자.length - 뒤 - 1] === 다음글자[다음글자.length - 뒤 - 1]) { 뒤++; }

    const 이전키 = 이전글자.slice(앞, 이전글자.length - 뒤).flatMap(화면문자키);
    const 다음키 = 다음글자.slice(앞, 다음글자.length - 뒤).flatMap(화면문자키);
    let 공통 = 0;
    while (공통 < 이전키.length && 공통 < 다음키.length &&
        이전키[공통].code === 다음키[공통].code &&
        이전키[공통].shift === 다음키[공통].shift) { 공통++; }
    return 다음키.slice(공통);
}

const 직접입력종류 = new Set(['', 'insertText', 'insertCompositionText',
    'insertFromComposition', 'insertLineBreak', 'insertParagraph']);

/** 입력창은 키 변환만 맡고, 정오와 타수는 따라그리기틀이 계산한다. */
export class 화면입력흐름 {
    private 이전 = '';
    private 조합중 = false;
    private 물리키사용중 = false;

    public get 조합하고있음(): boolean { return this.조합중; }
    public get 물리키우선(): boolean { return this.물리키사용중; }
    public 초기화(): void { this.이전 = ''; this.조합중 = false; this.물리키사용중 = false; }
    public 물리키(code: string, shift: boolean): 키[] {
        this.물리키사용중 = true;
        return [{ code, shift }];
    }
    public 조합시작(): void { this.조합중 = true; }
    public 조합끝(다음: string): 키[] {
        this.조합중 = false;
        return this.입력(다음);
    }
    public 입력(다음: string, inputType = ''): 키[] {
        if (this.물리키사용중) { return []; }
        // 조합 중의 삭제는 입력기가 같은 자소를 다시 그리는 과정일 수 있다.
        if (inputType.startsWith('delete')) { return []; }
        if (!직접입력종류.has(inputType)) { this.이전 = 다음; return []; }
        const 키들 = 새화면키(this.이전, 다음);
        this.이전 = 다음;
        return 키들;
    }
}
