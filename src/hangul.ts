import { hangul, latin } from './fonts';

/*
            00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
 ----------------------------------------------------------------------------------------------
 초성 19자  ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
 중성 21자  ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ
 종성 27자     ㄱ ㄲ 앇 ㄴ 앉 않 ㄷ ㄹ 앍 앎 앏 앐 앑 앒 앓 ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ

 한글유니코드 = ((초성 * 21) + 중성) * 28 + 종성 + 0xAC00
 */
const div = (v: number, q: number) => Math.floor(v / q);

// 유니코드 한글 한자 초중종성 분리
export function decompose(code: number): number[] {
    const 코드 = code - 0xAC00;
    const 종성 = 코드 % 28;
    const 중성 = div(코드 - 종성, 28) % 21;
    const 초성 = div(div(코드 - 종성, 28), 21);
    return [초성, 중성, 종성];
}

/*
 한글글꼴 비트맵은 초성 8벌, 중성 4벌, 종성 4벌로 구성한다.
 1) 초성은 받침유무와 어떤 모음이 있냐에 따라 8가지로 구분한다.
 2) 중성은 받침유무와 ㄱㅋ과 결합했는지 그외 자음과 결합했는지에 따라 4가지로 나눈다.
 3) 종성은 어떤 중성과 결합했는지에 따라 4가지로 나눈다.
 */
export function packs([초성, 중성, 종성]: number[]): number[] {
    const 받침없음 = 종성 === 0;
    return [초벌(받침없음, 중성), 중벌(받침없음, 초성), 종벌(중성)];
}

function 초벌(받침없음: boolean, 중성: number) {
    if (받침없음) {
        if (중성 <= 7 || 중성 === 20) {
            return 0;
        }
        switch (중성) {
            case 8: case 12: case 18:
                return 1;
            case 13: case 17:
                return 2;
            case 9: case 10: case 11: case 19:
                return 3;
            default:
                return 4;
        }
    } else {
        if (중성 <= 7 || 중성 === 20) {
            return 5;
        }
        switch (중성) {
            case 8: case 12: case 13: case 17: case 18:
                return 6;
            default:
                return 7;
        }
    }
}

function 중벌(받침없음: boolean, 초성: number) {
    const ㄱㅋ = 초성 === 0 || 초성 === 15;
    if (받침없음) {
        return ㄱㅋ ? 0 : 1;
    } else {
        return ㄱㅋ ? 2 : 3;
    }
}

function 종벌(중성: number) {
    switch (중성) {
        case 0: case 2: case 9:
            return 0;
        case 4: case 6: case 11: case 14: case 16: case 19: case 20:
            return 1;
        case 1: case 3: case 5: case 7: case 10: case 15:
            return 2;
        default:
            return 3;
    }
}

/** 한글 한 음절을 받아, 기본 글꼴 16x16 비트맵을 반환  */
export function hangulToBitmap(음절: number): number[] {
    const [초, 중, 종] = decompose(음절);
    const 벌 = packs([초, 중, 종]);
    const 비트맵 = [hangul[벌[0] * 19 + 초],
                    hangul[벌[1] * 21 + 중 + 19 * 8],
                    hangul[벌[2] * 28 + 종 + 21 * 4 + 19 * 8]];
    let bitmap = 비트맵[0].map((line: number, i: number) => line | 비트맵[1][i]);
    if (종 > 0) {
        bitmap = bitmap.map((line: number, i: number) => line | 비트맵[2][i]);
    }
    return bitmap;
}

export function latinToBitmap(char: number): number[] {
    return latin[char];
}
