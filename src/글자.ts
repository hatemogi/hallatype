import * as color from './색상';
import { 분리 } from './한글';

export enum 글자종류 {
    한글, 라틴, 모름, 없음, 끝,
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

export interface 글자꼴 {
    코드: number[];
    초성: number;
    중성: number;
    종성: number;
    종류: 글자종류;
    전각: boolean;
    한글: boolean;
    다음행: boolean;
    끝: boolean;
    새초성: (초성: number) => 글자꼴;
    새중성: (중성: number) => 글자꼴;
    새종성: (종성: number) => 글자꼴;
    라틴: (코드: number) => 글자꼴;
}

export abstract class 글자틀 implements 글자꼴 {
    public static 생성(code: number): 글자꼴 {
        const 종류 = 글자종류판단(code);
        switch (종류) {
            case 글자종류.한글:
                return new 한글(분리(code));
            case 글자종류.라틴:
                return new 라틴(code);
            default:
                return 글자없음;
        }
    }

    public abstract get 초성(): number;
    public abstract get 중성(): number;
    public abstract get 종성(): number;
    public abstract get 코드(): number[];
    public abstract get 전각(): boolean;
    public abstract get 한글(): boolean;
    public abstract get 다음행(): boolean;
    public abstract get 종류(): 글자종류;
    public get 끝() {
        return this.종류 === 글자종류.끝;
    }

    public 새초성(초성: number): 글자꼴 {
        return new 한글([초성, this.중성, this.종성]);
    }

    public 새중성(중성: number): 글자꼴 {
        return new 한글([this.초성, 중성, this.종성]);
    }

    public 새종성(종성: number): 글자꼴 {
        return new 한글([this.초성, this.중성, 종성]);
    }

    public 라틴(코드: number): 글자꼴 {
        return new 라틴(코드);
    }
}

class 글자없음틀 extends 글자틀 {
    public readonly 종류 = 글자종류.없음;
    public readonly 전각 = false;
    public readonly 한글 = false;
    public readonly 초성 = 0;
    public readonly 중성 = 0;
    public readonly 종성 = 0;
    public readonly 코드 = [0];
    public readonly 다음행 = false;
}

class 끝글자틀 extends 글자틀 {
    public readonly 종류 = 글자종류.끝;
    public readonly 전각 = false;
    public readonly 한글 = false;
    public readonly 초성 = 0;
    public readonly 중성 = 0;
    public readonly 종성 = 0;
    public readonly 코드 = [0];
    public readonly 다음행 = false;
}

export const 글자없음 = new 글자없음틀();
export const 끝글자 = new 끝글자틀();

class 라틴 extends 글자틀 {
    public readonly 종류 = 글자종류.라틴;
    public readonly 전각 = false;
    public readonly 한글 = false;
    public readonly 초성 = 0;
    public readonly 중성 = 0;
    public readonly 종성 = 0;
    private _코드: number;

    constructor(코드: number) {
        super();
        this._코드 = 코드;
    }

    public get 코드() {
        return [this._코드];
    }

    public get 다음행() {
        return this._코드 === 10;
    }
}

class 한글 extends 글자틀 {
    public readonly 종류 = 글자종류.한글;
    public readonly 전각 = true;
    public readonly 한글 = true;
    public readonly 다음행 = false;

    public readonly 코드: number[];

    constructor(코드: [number, number, number]) {
        super();
        this.코드 = 코드;
    }

    public get 초성() {
        return this.코드[0];
    }
    public get 중성() {
        return this.코드[1];
    }
    public get 종성() {
        return this.코드[2];
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
 * 지문과 입력상태, 그리고 커서 위치등을 파악해서 색칠할 준비를 마친 모델
 */
export class 색칠할글자 {
    public readonly 자: 글자꼴;
    public readonly 색: color.RGBA[];
    public readonly 배경색: color.RGBA;
    constructor(자: 글자꼴, 색: color.RGBA[], 배경색: color.RGBA) {
        this.자 = 자;
        this.색 = 색;
        this.배경색 = 배경색;
    }
}
