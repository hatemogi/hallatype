/**
 * 한글 두벌식 오토마타 구현
 */

import { 글자, 글자종류, 한글 } from './charactor';

export enum 상태코드 {
    S0, // 시작상태
    S1, // 초성 단자음
    S2, // 초성 복자음
    S3, // 중성 기본모음 (두벌식 키 하나로 입력하는 모음)
    S4, // 중성 조합모음 (두벌식 키 두번 눌러서 입력하는 모음)
    S5, // 종성 단일자음 (쌍자음 포함 한 키로 입력하는 자음)
    S6, // 종성 조합자음 (자음 키 두 번 눌러서 입력하는 받침)
}

export enum 위치이동 {
    이전,
    유지,
    다음,
}

const 자음키맵 = new Map<string, number>([
    ['KeyQ', 8], ['KeyW', 13], ['KeyE', 4], ['KeyR', 1], ['KeyT', 10],
    ['KeyA', 7], ['KeyS', 3], ['KeyD', 12], ['KeyF', 6], ['KeyG', 19],
    ['KeyZ', 16], ['KeyX', 17], ['KeyC', 15], ['KeyV', 18]]);
const 쌍자음키맵 = new Map<string, number>([
    ['KeyQ', 9], ['KeyW', 14], ['KeyE', 5], ['KeyR', 2], ['KeyT', 11]]);
const 모음키맵 = new Map<string, number>([
    ['KeyY', 13], ['KeyU', 7], ['KeyI', 3], ['KeyO', 12], ['KeyP', 6],
    ['KeyH', 9], ['KeyJ', 5], ['KeyK', 1], ['KeyL', 21], ['KeyB', 18],
    ['KeyN', 14], ['KeyM', 19 ]]);

function 자음([쉬프트, 키]: 키입력): number {
    return 자음키맵.get(키) || 0;
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

function 라틴([쉬프트, 키]: 키입력): boolean {
    return false;
}

export type 머신상태 = [상태코드, 한글, 한글];
type 다음상태 = [위치이동, 상태코드, 한글, 한글];

export type 키입력 = [boolean, string];

function 한글조립(자: 글자, [초성, 중성, 종성]: [number, number, number]): 글자 {
    const 조립 = (기존자소: number, 새자소: number) => {
        if (새자소 > 0) {
            return 새자소;
        } else if (기존자소 && 기존자소 > 0) {
            return 기존자소;
        }
        return 0;
    };
    const 초 = 조립(자.코드[0], 초성);
    const 중 = 조립(자.코드[1], 중성);
    const 종 = 조립(자.코드[2], 종성);
    return new 글자(글자종류.한글, [초, 중, 종]);
}

/**
 * 초기상태 S0에서 전이
 */
function 전이S0([현재상태, 완성, 조립]: 머신상태, 입력: 키입력): 다음상태 {
    const 상태 = 상태코드;
    const [쉬프트, 키] = 입력;
    if (쌍자음(입력)) {
        return [위치이동.유지, 상태.S2, 완성, 조립.새초성(쌍자음(입력))];
    } else if (자음(입력)) {
        return [위치이동.유지, 상태.S1, 완성, 조립.새초성(자음(입력))];
    } else if (모음(입력)) {
        return [위치이동.유지, 상태.S3, 완성, 조립.새중성(모음(입력))];
    } else if (라틴([쉬프트, 키])) {
        return [위치이동.다음, 상태.S0, 완성, 조립];
    } else if (키 === 'Backspace') {
        return [위치이동.이전, 상태.S0, 완성, 조립];
    } else if (키 === 'Enter') {
        return [위치이동.다음, 상태.S0, 완성, 조립];
    } else if (키 === 'Space') {
        return [위치이동.다음, 상태.S0, 완성, 조립];
    }
    return [위치이동.유지, 현재상태, 완성, 조립];
}

export function 상태전이([현재상태, 완성글자, 조립글자]: 머신상태, 입력: 키입력): 다음상태 {
    switch (현재상태) {
        case 상태코드.S0:
            return 전이S0([현재상태, 완성글자, 조립글자], 입력);
        case 상태코드.S1:
            break;
    }
    return [위치이동. 유지, 상태코드.S0, 한글.없음, 한글.없음];
}

export class 입력머신 {
    private 조립글자 = 한글.없음;
    private 완성글자 = 한글.없음;
    private 상태 = 상태코드.S0;
    public 입력(키: 키입력): [위치이동, 한글, 한글] {
        return [위치이동.유지, this.완성글자, this.조립글자];
    }
}
