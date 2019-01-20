/*
            00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
 ----------------------------------------------------------------------------------------------
 초성 19자     ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
 중성 21자     ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ
 종성 27자     ㄱ ㄲ ㄳ ㄴ ㄵ ㄶ ㄷ ㄹ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ

 한글유니코드 = ((초성-1 * 21) + 중성-1) * 28 + 종성 + 0xAC00
 */

export enum 초성 {
    없음 = 0,
    ㄱ, ㄲ, ㄴ, ㄷ, ㄸ,
    ㄹ, ㅁ, ㅂ, ㅃ, ㅅ,
    ㅆ, ㅇ, ㅈ, ㅉ, ㅊ,
    ㅋ, ㅌ, ㅍ, ㅎ,
}

export enum 중성 {
    없음 = 0,
    ㅏ, ㅐ, ㅑ, ㅒ, ㅓ,
    ㅔ, ㅕ, ㅖ, ㅗ, ㅘ,
    ㅙ, ㅚ, ㅛ, ㅜ, ㅝ,
    ㅞ, ㅟ, ㅠ, ㅡ, ㅢ,
    ㅣ,
}

export enum 종성 {
    없음 = 0,
    ㄱ, ㄲ, ㄳ, ㄴ, ㄵ,
    ㄶ, ㄷ, ㄹ, ㄺ, ㄻ,
    ㄼ, ㄽ, ㄾ, ㄿ, ㅀ,
    ㅁ, ㅂ, ㅃ, ㅅ, ㅆ,
    ㅇ, ㅈ, ㅊ, ㅋ, ㅌ,
    ㅍ, ㅎ,
}

const 몫 = (v: number, q: number) => Math.floor(v / q);

// 유니코드 한글 한자 초중종성 분리
export function 분리(code: number): [number, number, number] {
    const 코드 = code - 0xAC00;
    const 종 = 코드 % 28;
    const 중 = 몫(코드 - 종, 28) % 21 + 1;
    const 초 = 몫(몫(코드 - 종, 28), 21) + 1;
    return [초, 중, 종];
}

/*
 한글글꼴 비트맵은 초성 8벌, 중성 4벌, 종성 4벌로 구성한다.
 1) 초성은 받침유무와 어떤 모음이 있냐에 따라 8가지로 구분한다.
 2) 중성은 받침유무와 ㄱㅋ과 결합했는지 그외 자음과 결합했는지에 따라 4가지로 나눈다.
 3) 종성은 어떤 중성과 결합했는지에 따라 4가지로 나눈다.
 */
export function 벌식([초, 중, 종]: [number, number, number]): [number, number, number] {
    const 받침없음 = 종 === 0;
    return [초벌(받침없음, 중), 중벌(받침없음, 초), 종벌(중)];
}

function 초벌(받침없음: boolean, 중: number) {
    if (받침없음) {
        if (중 <= 8 || 중 === 21) {
            return 0;
        }
        switch (중) {
            case 9: case 13: case 19:
                return 1;
            case 14: case 18:
                return 2;
            case 10: case 11: case 12: case 20:
                return 3;
            default:
                return 4;
        }
    } else {
        if (중 <= 8 || 중 === 21) {
            return 5;
        }
        switch (중) {
            case 9: case 13: case 14: case 18: case 19:
                return 6;
            default:
                return 7;
        }
    }
}

function 중벌(받침없음: boolean, 초: number) {
    const ㄱㅋ = 초 === 1 || 초 === 16;
    if (받침없음) {
        return ㄱㅋ ? 0 : 1;
    } else {
        return ㄱㅋ ? 2 : 3;
    }
}

function 종벌(중: number) {
    const table = [0, 0, 2, 0, 2, 1, 2, 1, 2, 3, 0, 2, 1, 3, 3, 1, 2, 1, 3, 3, 1, 1, 3];
    return table[중] || 0;
}
