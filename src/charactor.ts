import * as color from './color';
import { decompose } from './hangul';

export enum 글자종류 {
    한글, 라틴, 모름, 없음,
}

function 글자종류판단(code: number): 글자종류 {
    if (!code) {
        return 글자종류.없음;
    } else if (code < 256) {
        return 글자종류.라틴;
    } else if (code >= 0xAC00 && code <= 0xD7AF) {
        return 글자종류.한글;
    } else {
        return 글자종류.모름;
    }
}

export class 글자 {
    public static readonly 없음 = new 글자(글자종류.없음, []);
    public static 생성(code: number): 글자 {
        const 종류 = 글자종류판단(code);
        switch (종류) {
            case 글자종류.한글:
                return new 글자(종류, decompose(code));
            case 글자종류.라틴:
                return new 글자(종류, [code]);
            default:
                return new 글자(종류, []);
        }
    }

    public readonly 종류: 글자종류;
    public readonly 코드: number[];
    constructor(종류: 글자종류, 코드: number[]) {
        this.종류 = 종류;
        this.코드 = 코드;
    }

    // 반각 or 전각 글자 구분
    get 전각(): boolean {
        return this.종류 === 글자종류.한글;
    }

    get 다음행(): boolean {
        return this.종류 === 글자종류.라틴 && this.코드[0] === 10;
    }
}

export class 글자꾸밈 {
    public readonly 글자색: color.RGBA;
    public readonly 배경색: color.RGBA;
    constructor(글자색: color.RGBA = color.흰색, 배경색: color.RGBA = color.검정) {
        this.글자색 = 글자색;
        this.배경색 = 배경색;
    }
}

/**
 * 특정 글자 위치. 커서.
 * (x, y)의 순서와 달리 행이 먼저고 열이 나중 표기.
 * # 기본 기능
 *     글자 단위 이전/다음 이동.
 *     엔터를 누르면 다음행, 맨 앞 열에서 백스페이스 누르면 전줄 끝으로 이동.
 */
export class 글자위치 {
    public readonly 행: number;
    public readonly 열: number;
    private 열경계: number;
    constructor(행: number, 열: number, 열경계 = 80) {
        this.행 = 행;
        this.열 = 열;
        this.열경계 = 열경계;
    }

    public 이동(행: number, 열: number): 글자위치 {
        return new 글자위치(행, 열, this.열경계);
    }

    public get 다음(): 글자위치 {
        if (this.열 + 1 >= this.열경계) {
            return this.이동(this.행 + 1, 0);
        } else {
            return this.이동(this.행, this.열 + 1);
        }
    }

    public 이전(전행마지막열 = this.열경계 - 1): 글자위치 {
        if (this.열 === 0 && this.행 === 0) {
            return this;
        } else if (this.열 === 0) {
            return this.이동(this.행 - 1, 전행마지막열);
        } else {
            return this.이동(this.행, this.열 - 1);
        }
    }

    public get 다음행(): 글자위치 {
        return this.이동(this.행 + 1, 0);
    }
}

/**
 * 지문과 입력상태, 그리고 커서 위치등을 파악해서 색칠할 준비를 마친 모델
 */
export class 색칠할글자 {
    public readonly 자: 글자;
    public readonly 색: color.RGBA[];
    constructor(자: 글자, 색: color.RGBA[]) {
        this.자 = 자;
        this.색 = 색;
    }
}
