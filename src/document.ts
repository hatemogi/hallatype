/**
 * 입력해야 할 문서 본문(지문), 그리고 이용자가 타이핑한 문장(입력문) 상태 모델
 * 각 입력 상태에 따라 화면에 보일 색상도 준비해 둔다.
 *
 * 텍스트 모델은 미리 작성한 "바닥글"과 현재 타이핑 중인 "쓴글"로 구성한다.
 * 글자마다 "바닥글"과 "쓴글"을 비교해 정오 상태를 판단하고 그에 맞춰 색상을 구분한다.
 * 더불어 커서 위치의 글자는 다른 배경색을 입힌다.
 *
 * # 각 글자(자소)별 타이핑 상태
 *     = 지문 (미입력상태)
 *     | 정타 (바닥글과 쓴글이 일치)
 *     | 오타 (바닥글과 쓴글이 다름)
 *     | 정정 (오타를 수정한 정타)
 *     | 쓰는중 (종성의 경우 아직 정오 구분이 불명)
 *
 * 문서 -> 섹션 -> 글자
 * 글자 = 한글 | 라틴(숫자, 기호 포함) | 모름
 * 한글 -> 음소
 *
 */

import * as color from './color';
import {decompose} from './hangul';

enum 글자종류 {
    한글, 라틴, 모름,
}

/* 각 글자(자소)별 타이핑 상태 */
enum 글자상태 {
    지문,       // 미입력 상태
    정타,       // 지문과 쓴글이 같음
    오타,       // 지문과 쓴글이 다름
    정정,       // 오타를 수정한 정타
    쓰는중,     // 종성의 경우 아직 정오 구분 못함
}

function 글자종류판단(code: number): 글자종류 {
    if (code < 256) {
        return 글자종류.라틴;
    } else if (code >= 0xAC00 && code <= 0xD7AF) {
        return 글자종류.한글;
    } else {
        return 글자종류.모름;
    }
}

class 글자 {
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
    public readonly codes: number[];
    constructor(종류: 글자종류, codes: number[]) {
        this.종류 = 종류;
        this.codes = codes;
    }

    // 반각 or 전각 글자 구분
    get 전각(): boolean {
        return this.종류 === 글자종류.한글;
    }

}

class 글자꾸밈 {
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
 * 지문 한 자와 현재 그 자리의 쓴글 입력 상태.
 */
export class 글자판 {
    public readonly 지문: 글자;
    public readonly 쓴글?: 글자;
    public readonly 상태: 글자상태[];
    constructor(지문: 글자) {
        this.지문 = 지문;
        this.상태 = [];
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

export interface 본문그림판 {
    글자그리기: (위치: 글자위치, 글자: 색칠할글자) => void;
    배경칠하기: (위치: 글자위치, 전각: boolean, 배경색: color.RGBA) => void;
}

/**
 * 특징: 지문과 입력문이 있다. 지문은 한번에 다 쓰고 바꾸지 않고,
 * 입력문은 순차적으로 쓰되 앞뒤로 한글자 단위로만 이동한다.
 * 지문은 특정 영역을 한꺼번에 화면에 보이고,
 * 입력문은 지문을 쫓아가며 상태를 바꾼다.
 * 입력문과 지문의 차이가 나는 범위는 한계가 있다. (예. 최대 5글자)
 *
 * 지문은 미리 준비해 놓는다. (별도 클래스가 적합할까?)
 */
export class 본문 {
    private 열수: number;
    private 지문위치: 글자위치;
    private 쓴글위치: 글자위치;
    private 기본속성 = new 글자꾸밈();
    private 행렬: 글자판[][] = [];
    private 그림판?: 본문그림판;
    constructor(그림판?: 본문그림판, 열수 = 80) {
        this.그림판 = 그림판;
        this.열수 = 열수;
        this.지문위치 = new 글자위치(0, 0, 열수);
        this.쓴글위치 = new 글자위치(0, 0, 열수);
    }

    public 지문입력(text: string) {
        // no yet
    }

    public 지문쓰기(text: string): void {
        // noop yet;
        // this.listeners.forEach
        for (let i = 0; i <= text.length; i++) {
            if (text.codePointAt(i)) {
                this.지문글자쓰기(text.codePointAt(i)!);
            }
        }
    }

    public refresh(lines: [number, number]): void {
        // 특정 영역 다시 그리기
    }

    private 지문글자쓰기(code: number): void {
        const 자 = 글자.생성(code);
    }
}

/**
 * 특정 단어 수 만큼씩 이상의 문단들을 묶어 섹션들로 나눈다.
 * 마지막 섹션이 너무 조금이라면 그 전 섹션에 묶어서 반환.
 */
export function splitSections(text: string, wordsToSplit: number): string[] {
    const lines = text.split('\n');
    const sections: string[][] = [];
    const words = lines.map(wordCount);
    let w = 0;
    let si = 0;
    lines.forEach((line: string, i: number) => {
        sections[si] = sections[si] || [];
        sections[si].push(line);
        w += words[i];
        if (w >= wordsToSplit) {
            w = 0;
            si++;
        }
    });
    if (sections.length > 1 &&
        sections[sections.length - 1].length < wordsToSplit / 4) {
        const lastStrings = sections.pop();
        if (lastStrings) {
            lastStrings.forEach((s: string) => sections[sections.length - 1].push(s));
        }
    }
    return sections.map((strings: string[]) => strings.join('\n'));
}

function wordCount(text: string): number {
    return text.split(/[ ,\?\.\/:'"\[\]{}|~`!@#$%^&*()\-_=\+]/)
               .filter((w: string) => w.length >= 1)
               .length;
}
