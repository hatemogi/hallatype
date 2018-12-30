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
import {글자위치, 글자, 글자꾸밈, 색칠할글자} from './charactor';

export interface 본문그림판 {
    글자그리기: (위치: 글자위치, 글자: 색칠할글자) => void;
    바탕칠하기: (위치: 글자위치, 전각: boolean, 배경색: color.RGBA) => void;
}

/**
 * 지문: 타자연습할 장문의 바탕글.
 * 미리 준비해 두는 글이고, 편집이 필요 없다.
 * 한번 입력해 두고, 본문이 읽는 용도.
 */
export class 지문틀 {
    private 열수: number;
    private 위치: 글자위치;
    private 행렬: 글자[][] = [];

    constructor(열수 = 80) {
        this.열수 = 열수;
        this.위치 = new 글자위치(0, 0, 열수);
    }

    public 쓰기(글: string) {
        for (let i = 0; i <= 글.length; i++) {
            if (글.codePointAt(i)) {
                this.글자쓰기(글.codePointAt(i)!);
            }
        }
    }

    public 글자(위치: 글자위치): 글자 {
        return this.행렬[위치.행][위치.열];
    }

    public 줄(행: number): 글자[] {
        return this.행렬[행];
    }

    private 글자쓰기(code: number) {
        const 자 = 글자.생성(code);
        const [행, 열] = [this.위치.행, this.위치.열];
        if (!this.행렬[행]) {
            this.행렬[행] = [];
        }
        this.행렬[행][열] = 자;
        this.위치 = this.다음위치(자);
    }

    private 다음위치(자: 글자): 글자위치 {
        if (자.다음행) {
            return this.위치.다음행;
        } else if (자.전각) {
            return this.위치.다음.다음;
        } else {
            return this.위치.다음;
        }
    }
}

/* 각 글자(자소)별 타이핑 상태 */
enum 글자상태 {
    지문,       // 미입력 상태
    정타,       // 지문과 쓴글이 같음
    오타,       // 지문과 쓴글이 다름
    정정,       // 오타를 수정한 정타
    쓰는중,     // 종성의 경우 아직 정오 구분 못함
}

/**
 * 지문 한 자와 현재 그 자리의 쓴글 입력 상태.
 */
export class 글자판 {
    public readonly 바탕글자: 글자;
    public readonly 쓴글자?: 글자;
    public readonly 상태: 글자상태[];
    constructor(바탕글자: 글자) {
        this.바탕글자 = 바탕글자;
        this.상태 = [];
    }
}

/**
 * 특징: 지문과 쓴글이 있다. 지문은 한번에 다 쓰고 바꾸지 않고,
 * 쓴글은 순차적으로 쓰되 앞뒤로 한글자 단위로만 이동한다.
 * 지문은 특정 영역을 한꺼번에 화면에 보이고,
 * 입력문은 지문을 쫓아가며 상태를 바꾼다.
 * 입력문과 지문의 차이가 나는 범위는 한계가 있다. (예. 최대 5글자)
 *
 * 지문은 미리 준비해 놓는다. (별도 클래스가 적합할까?)
 */
export class 본문틀 {
    private 열수: number;
    private 지문: 지문틀;
    private 위치: 글자위치;
    private 기본속성 = new 글자꾸밈();
    private 행렬: 글자판[][] = [];
    private 그림판: 본문그림판;
    constructor(지문: 지문틀, 그림판: 본문그림판, 열수 = 80) {
        this.지문 = 지문;
        this.그림판 = 그림판;
        this.열수 = 열수;
        this.위치 = new 글자위치(0, 0, 열수);
    }

    public 영역그리기([시작행, 끝행]: [number, number] = [0, 30]): void {
        // 특정 영역 다시 그리기
        for (let 행 = 시작행; 행 < 끝행; 행++) {
            const 현재줄 = this.지문.줄(행);
            if (현재줄) {
                현재줄.forEach((자: 글자, 열: number) => {
                    const 위치 = new 글자위치(행, 열);
                    const 색칠 = new 색칠할글자(자, [color.검정, color.검정, color.검정]);
                    this.그림판.글자그리기(위치, 색칠);
                });
            }
        }
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
