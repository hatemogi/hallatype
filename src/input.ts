/**
 * 한글 두벌식 오토마타 구현
 */

import { 글자 } from './charactor';

enum 상태 {
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

type 입력 = [boolean, string];

function 자음(키: 입력): boolean {
    return false;
}

function 모음(키: 입력): boolean {
    return false;
}

function 쌍자음(키: 입력): boolean {
    return false;
}

export class 입력머신 {
    private 조립글자 = 글자.없음;
    private readonly 완성글자 = 글자.없음;
    private readonly state = 상태.S0;
    public 입력(shift: boolean, code: string): [위치이동, 글자, 글자] {
        return [위치이동.유지, this.완성글자, this.조립글자];
    }
}
