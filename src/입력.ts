/**
 * 한글 두벌식 오토마타 구현
 */

import { 글자꼴, 글자없음 } from './글자';
import { mapGetters } from 'vuex';

export enum 상태코드 {
    S0  = '시작상태',
    S10 = '초성단자음',
    S11 = '초성복자음',
    S20 = '중성기본',   // 두벌식 키 하나로 입력하는 모음
    S21 = '중성조합',   // 두벌식 키 두번 눌러서 입력하는 모음
    S30 = '종성단일',   // 쌍자음 포함 한 키로 입력하는 자음
    S31 = '종성자음군', // 자음 키 두 번 눌러서 입력하는 받침
}

export enum 위치이동 {
    이전 = '이전',
    유지 = '유지',
    다음 = '다음',
}

const 자음키맵 = new Map<string, number>([
    ['KeyQ', 8], ['KeyW', 13], ['KeyE', 4], ['KeyR', 1], ['KeyT', 10],
    ['KeyA', 7], ['KeyS', 3], ['KeyD', 12], ['KeyF', 6], ['KeyG', 19],
    ['KeyZ', 16], ['KeyX', 17], ['KeyC', 15], ['KeyV', 18]]);
const 초성to종성: ReadonlyArray<[number, number]> = [
    [0, 0], [1, 1], [2, 2], [3, 4], [4, 7],
    [5, 0], [6, 8], [7, 16], [8, 17], [9, 18],
    [10, 19], [11, 20], [12, 21], [13, 22], [14, 0],
    [15, 23], [16, 24], [17, 25], [18, 26], [19, 27],
];
const 초성to종성맵 = new Map<number, number>(초성to종성);
const 종성to초성맵 = new Map<number, number>(
    초성to종성.map((초종) => 초종.reverse() as [number, number]));
const 쌍자음키맵 = new Map<string, number>([
    ['KeyQ', 9], ['KeyW', 14], ['KeyE', 5], ['KeyR', 2], ['KeyT', 11]]);
const 쌍자음코드 = new Set<number>(쌍자음키맵.values());
const 모음키맵 = new Map<string, number>([
    ['KeyY', 13], ['KeyU', 7], ['KeyI', 3], ['KeyO', 2], ['KeyP', 6],
    ['KeyH', 9], ['KeyJ', 5], ['KeyK', 1], ['KeyL', 21], ['KeyB', 18],
    ['KeyN', 14], ['KeyM', 19]]);
const 라틴키맵 = new Map<string, number>([
    ['Backquote', 0x60], ['Digit1', 0x31], ['Digit2', 0x32], ['Digit3', 0x33], ['Digit4', 0x34],
    ['Digit5', 0x35], ['Digit6', 0x36], ['Digit7', 0x37], ['Digit8', 0x38], ['Digit9', 0x39],
    ['Digit0', 0x30], ['Minus', 0x2D], ['Equal', 0x3D], ['Backspace', 0x08], ['KeyQ', 0x71],
    ['KeyW', 0x77], ['KeyE', 0x65], ['KeyR', 0x72], ['KeyT', 0x74], ['KeyY', 0x79],
    ['KeyU', 0x75], ['KeyI', 0x69], ['KeyO', 0x6F], ['KeyP', 0x70], ['BracketLeft', 0x5B],
    ['BracketRight', 0x5D], ['Backslash', 0x5C], ['KeyA', 0x61], ['KeyS', 0x73], ['KeyD', 0x64],
    ['KeyF', 0x66], ['KeyG', 0x67], ['KeyH', 0x68], ['KeyJ', 0x6A], ['KeyK', 0x6B],
    ['KeyL', 0x6C], ['Semicolon', 0x3B], ['Quote', 0x27], ['Enter', 0x0A], ['KeyZ', 0x7A],
    ['KeyX', 0x78], ['KeyC', 0x63], ['KeyV', 0x76], ['KeyB', 0x62], ['KeyN', 0x6E],
    ['KeyM', 0x6D], ['Comma', 0x2C], ['Period', 0x2E], ['Slash', 0x2F],
]);

function 자음([쉬프트, 키]: 키입력): number {
    return 쌍자음([쉬프트, 키]) || 자음키맵.get(키) || 0;
}

function 종성자음(입력: 키입력): number {
    return 초성to종성맵.get(자음(입력)) || 0;
}

function 모음([쉬프트, 키]: 키입력): number {
    const 코드 = 모음키맵.get(키) || 0;
    if (쉬프트 && (코드 === 2 || 코드 === 6)) {
        return 코드 + 2;
    }
    return 코드;
}

function 쌍자음([쉬프트, 키]: 키입력): number {
    return 쉬프트 && 쌍자음키맵.get(키) || 0;
}

function 라틴([쉬프트, 키]: 키입력): number {
    return 라틴키맵.get(키) || 0;
}

export type 머신상태 = [상태코드, 글자꼴, 글자꼴];
type 다음상태 = [위치이동, 상태코드, 글자꼴, 글자꼴];

export type 키입력 = [boolean, string];

function 라틴처리([현재상태, 완성, 조립]: 머신상태, [쉬프트, 키]: 키입력): 다음상태 {
    return [위치이동.다음, 상태코드.S0, 조립, 글자없음.라틴(라틴([쉬프트, 키]))];
}

/**
 * 시작상태 S0에서 전이
 */
function 전이S0([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    if (쌍자음(입력)) {
        return [위치이동.유지, 상태.S11, 완성, 조립.새초성(쌍자음(입력))];
    } else if (자음(입력)) {
        return [위치이동.유지, 상태.S10, 완성, 조립.새초성(자음(입력))];
    } else if (모음(입력)) {
        return [위치이동.유지, 상태.S20, 완성, 조립.새중성(모음(입력))];
    } else if (키 === 'Backspace') {
        return [위치이동.이전, 상태코드.S0, 완성, 조립];
    }
    return 라틴처리([현재상태, 완성, 조립], 입력);
}

/**
 * 초성 S10에서 전이 - 초성 단자음 상태
 */
function 전이S10([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    if (쌍자음(입력)) {
        return [위치이동.다음, 상태.S11, 조립, 글자없음.새초성(쌍자음(입력))];
    } else if (자음(입력)) {
        if (쌍자음([true, 키]) && 조립.초성 === 자음(입력)) {
            // 쌍자음으로 만들 수 있는 단자음 두번 -> 쌍자음 전환
            return [위치이동.유지, 상태.S11, 완성, 글자없음.새초성(쌍자음([true, 키]))];
        } else {
            // 단자음 두번으로 쌍자음을 만들지 못할 경우 다음 글자로 이동
            return [위치이동.다음, 상태.S10, 조립, 글자없음.새초성(자음(입력))];
        }
    } else if (모음(입력)) {
        return [위치이동.유지, 상태.S20, 완성, 조립.새중성(모음(입력))];
    } else if (키 === 'Backspace') {
        return [위치이동.이전, 상태.S0, 완성, 조립];
    }
    return 라틴처리([현재상태, 완성, 조립], 입력);
}

/**
 * 초성 S11에서 전이 - 초성 쌍자음 상태
 */
function 전이S11([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    if (쌍자음(입력)) {
        return [위치이동.다음, 상태.S11, 조립, 글자없음.새초성(쌍자음(입력))];
    } else if (자음(입력)) {
        return [위치이동.다음, 상태.S10, 조립, 글자없음.새초성(자음(입력))];
    } else if (모음(입력)) {
        return [위치이동.유지, 상태.S20, 완성, 조립.새중성(모음(입력))];
    } else if (키 === 'Backspace') {
        return [위치이동.유지, 상태.S10, 완성, 조립.새초성(조립.초성 - 1)];
    }
    return 라틴처리([현재상태, 완성, 조립], 입력);
}

/**
 * 중성 S20에서 전이 - 중성 한번에 입력한 상태
 */
function 전이S20([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    if (종성자음(입력)) {
        return [위치이동.유지, 상태.S30, 완성, 조립.새종성(종성자음(입력))];
    } else if (자음(입력)) {
        // 종성에 못 오는 자음. ㄸ,ㅉ
        return [위치이동.다음, 상태.S10, 조립, 글자없음.새초성(자음(입력))];
    } else if (모음(입력)) {
        const 코드 = 모음(입력);
        if (조립.중성 === 9) { // ㅗ
            if (코드 === 1 || 코드 === 2) {    // ㅘ ㅙ
                return [위치이동.유지, 상태.S21, 완성, 조립.새중성(코드 + 9)];
            } else if (코드 === 21) {    // ㅚ
                return [위치이동.유지, 상태.S21, 완성, 조립.새중성(12)];
            }
            return [위치이동.다음, 상태.S20, 조립, 글자없음.새중성(코드)];
        } else if (조립.중성 === 14) {    // ㅜ
            if (코드 === 5 || 코드 === 6) {
                return [위치이동.유지, 상태.S21, 완성, 조립.새중성(코드 + 10)];
            } else if (코드 === 21) {
                return [위치이동.유지, 상태.S21, 완성, 조립.새중성(17)];
            }
            return [위치이동.다음, 상태.S20, 조립, 글자없음.새중성(코드)];
        } else if (조립.중성 === 19) {    // ㅡ
            if (코드 === 21) {
                return [위치이동.유지, 상태.S21, 완성, 조립.새중성(20)];
            }
            return [위치이동.다음, 상태.S20, 조립, 글자없음.새중성(코드)];
        }
        return [위치이동.다음, 상태.S20, 조립, 글자없음.새중성(모음(입력))];
    } else if (키 === 'Backspace') {
        return [위치이동.유지,
                쌍자음코드.has(조립.초성) ? 상태.S11 : 상태.S10,
                완성, 조립.새중성(0)];
    }
    return 라틴처리([현재상태, 완성, 조립], 입력);
}

/**
 * 중성 S21에서 전이 - 중성 두번에 입력한 상태 상태
 */
function 전이S21([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    if (종성자음(입력)) {
        return [위치이동.유지, 상태.S30, 완성, 조립.새종성(종성자음(입력))];
    } else if (자음(입력)) {
        return [위치이동.유지, 상태.S30, 조립, 글자없음.새초성(자음(입력))];
    } else if (모음(입력)) {
        return [위치이동.다음, 상태.S20, 조립, 글자없음.새중성(모음(입력))];
    } else if (키 === 'Backspace') {
        let 새중성 = 0;
        if (조립.중성 >= 10 && 조립.중성 <= 12) {
            새중성 = 9;
        } else if (조립.중성 >= 15 && 조립.중성 <= 17) {
            새중성 = 14;
        } else if (조립.중성 === 20) {
            새중성 = 19;
        }
        return [위치이동.유지, 상태.S20, 완성, 조립.새중성(새중성)];
    }
    return 라틴처리([현재상태, 완성, 조립], 입력);
}

const ㄹ자음군맵 = new Map<number, number>([
    [1, 9], [16, 10], [17, 11], [19, 12], [25, 13], [26, 14], [27, 15]]);
const ㄹ자음군분리후초성맵 = new Map<number, number>([
    [9, 1], [10, 7], [11, 8], [12, 10], [13, 17], [14, 18], [15, 19]]);

/**
 * 종성 S30에서 전이 - 중성 하나로 입력상태 (쌍자음 포함)
 */
function 전이S30([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    if (자음(입력)) {
        const 코드 = 자음(입력);
        if (조립.종성 === 1 && 코드 === 10) {
            return [위치이동.유지, 상태.S31, 완성, 조립.새종성(3)];
        } else if (조립.종성 === 4 && (코드 === 13 || 코드 === 19)) {
            return [위치이동.유지, 상태.S31, 완성, 조립.새종성(코드 === 13 ? 5 : 6)];
        } else if (조립.종성 === 8 && ㄹ자음군맵.has(코드)) {
            return [위치이동.유지, 상태.S31, 완성, 조립.새종성(ㄹ자음군맵.get(코드)!)];
        }
        return [위치이동.다음, 상태.S10, 조립, 글자없음.새초성(자음(입력))];
    } else if (모음(입력)) {
        return [위치이동.다음, 상태.S20,
                조립.새종성(0),
                글자없음.새초성(종성to초성맵.get(조립.종성)!).새중성(모음(입력))];
    } else if (키 === 'Backspace') {
        const 조립중성 = (조립.중성 >= 10 && 조립.중성 <= 12)
                        || (조립.중성 >= 15 && 조립.중성 <= 17)
                        || 조립.중성 === 20;
        return [위치이동.유지,
                조립중성 ? 상태.S21 : 상태.S20,
                완성, 조립.새종성(0)];
    }
    return 라틴처리([현재상태, 완성, 조립], 입력);
}

/**
 * 종성 S30에서 전이 - 자음군 입력상태
 */
function 전이S31([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    const 자음군분리 = (종성: number) => {
        if (조립.종성 === 3) {
            return [1, 10];
        } else if (조립.종성 === 5 || 조립.종성 === 6) {
            return [4, 조립.종성 === 5 ? 13 : 19];
        } else if (조립.종성 >= 9 && 조립.종성 <= 15) {
            return [8, ㄹ자음군분리후초성맵.get(조립.종성)!];
        }
        return [0, 0];
    };
    if (자음(입력)) {
        return [위치이동.다음, 상태.S10, 조립, 글자없음.새초성(자음(입력))];
    } else if (모음(입력)) {
        const [남은자음, 다음자음] = 자음군분리(조립.종성);
        return [위치이동.다음, 상태.S20, 조립.새종성(남은자음), 글자없음.새초성(다음자음).새중성(모음(입력))];
    } else if (키 === 'Backspace') {
        return [위치이동.유지, 상태.S30, 완성, 조립.새종성(자음군분리(조립.종성)[0])];
    }
    return 라틴처리([현재상태, 완성, 조립], 입력);
}


export function 상태전이([현재상태, 완성글자, 조립글자]: 머신상태, 입력: 키입력): 다음상태 {
    switch (현재상태) {
        case 상태코드.S0:
            return 전이S0([현재상태, 완성글자, 조립글자], 입력);
        case 상태코드.S10:
            return 전이S10([현재상태, 완성글자, 조립글자], 입력);
        case 상태코드.S11:
            return 전이S11([현재상태, 완성글자, 조립글자], 입력);
        case 상태코드.S20:
            return 전이S20([현재상태, 완성글자, 조립글자], 입력);
        case 상태코드.S21:
            return 전이S21([현재상태, 완성글자, 조립글자], 입력);
        case 상태코드.S30:
            return 전이S30([현재상태, 완성글자, 조립글자], 입력);
        case 상태코드.S31:
            return 전이S31([현재상태, 완성글자, 조립글자], 입력);
    }
    return [위치이동. 유지, 상태코드.S0, 글자없음, 글자없음];
}

export interface 입력머신이벤트핸들러 {
    새완성글자: (글자: 글자꼴) => any;
    새조립글자: (글자: 글자꼴) => any;
    이전글자: () => 글자꼴;
}

export class 입력머신틀 {
    private 상태: 머신상태 = [상태코드.S0, 글자없음, 글자없음];
    public 입력(키: 키입력): [위치이동, 글자꼴, 글자꼴] {
        const [위치, 새상태, 완성, 조립] = 상태전이(this.상태, 키);
        this.상태 = [새상태, 완성, 조립];
        return [위치, 완성, 조립];
    }
}
