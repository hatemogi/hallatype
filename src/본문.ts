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

import * as 색상 from './색상';
import {글자없음, 글자꼴, 글자틀, 글자꾸밈, 색칠할글자} from './글자';
import { 입력중, 필요타수 } from './입력';

export class 위치틀 {
    public readonly 행: number;
    public readonly 열: number;
    constructor(행: number = 0, 열: number = 0) {
        this.행 = 행;
        this.열 = 열;
    }

    public get 행렬(): [number, number] {
        return [this.행, this.열];
    }

    public get 다음() {
        return new 위치틀(this.행, this.열 + 1);
    }

    public get 다음행() {
        return new 위치틀(this.행 + 1, 0);
    }

    public 이전(전줄마지막열: number = 0): 위치틀 {
        const [행, 열] = this.행렬;
        if (열 > 0) {
            return new 위치틀(행, 열 - 1);
        } else if (열 <= 0 && 행 > 0) {
            return new 위치틀(행 - 1, 전줄마지막열);
        } else {
            return new 위치틀(0, 0);
        }
    }

    public 같나(위치: 위치틀) {
        return this.행 === 위치.행 && this.열 === 위치.열;
    }
}

export interface 본문그림판 {
    글자그리기: (위치: 위치틀, 글자: 색칠할글자) => void;
}

interface 지문꼴 {
    글자: (위치: 위치틀) => 글자꼴;
    쓰기: (위치: 위치틀, 글자: 글자꼴) => any;
    줄끝: (행: number) => number;
}

/**
 * 지문 커서는 지문을 따라서, 이전/다음만 지원한다.
 */
class 지문커서 {
    private _위치: 위치틀;
    private 지문: 지문꼴;
    constructor(지문: 지문꼴, 위치 = new 위치틀()) {
        this.지문 = 지문;
        this._위치 = 위치;
    }

    public get 다음(): 지문커서 {
        const 현재글자 = this.지문.글자(this.위치);
        const 다음위치 = 현재글자.다음행 ? this.위치.다음행 : this.위치.다음;
        return new 지문커서(this.지문, 다음위치);
    }

    public get 이전(): 지문커서 {
        const 행 = this.위치.행;
        return new 지문커서(this.지문, this.위치.이전(this.지문.줄끝(행 - 1)));
    }

    public get 위치(): 위치틀 {
        return this._위치;
    }

    public 같나(커서: 지문커서) {
        return this.위치.같나(커서.위치);
    }
}
/**
 * 지문: 타자연습할 장문의 바탕글.
 * 미리 준비해 두는 글이고, 편집이 필요 없다.
 * 한번 입력해 두고, 본문이 읽는 용도.
 */
export class 지문틀 implements 지문꼴 {
    public 위치: 위치틀;
    private 행렬: 글자꼴[][];

    constructor(위치: 위치틀 = new 위치틀(), 행렬: 글자꼴[][] = []) {
        this.위치 = 위치;
        this.행렬 = 행렬;
    }

    public 글쓰기(글: string) {
        for (let i = 0; i <= 글.length; i++) {
            if (글.codePointAt(i)) {
                const 글자 = 글자틀.생성(글.codePointAt(i)!);
                this.쓰기(this.위치, 글자);
                this.위치 = 글자.다음행 ? this.위치.다음행 : this.위치.다음;
            }
        }
    }

    public 글자(위치: 위치틀): 글자꼴 {
        return this.줄(위치.행)[위치.열] || 글자없음;
    }

    public 쓰기(위치: 위치틀, 글자: 글자꼴) {
        this.행렬[위치.행] = this.행렬[위치.행] || [];
        this.행렬[위치.행][위치.열] = 글자;
    }

    public 줄(행: number): 글자꼴[] {
        return this.행렬[행] || [];
    }

    public 줄끝(행: number): number {
        return Math.max(0, this.줄(행).length - 1);
    }
}

/* 각 글자(자소)별 타이핑 상태 */
enum 정오표 {
    미정,   // 미입력 상태. 종성의 경우 아직 정오 구분 못함
    정타,   // 지문과 쓴글이 같음
    오타,   // 지문과 쓴글이 다름
    정정,   // 오타를 수정한 정타
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
    private 지문: 지문틀;
    private 커서: 지문커서;
    private 쓴글: 지문틀 = new 지문틀();
    constructor(지문: 지문틀) {
        this.지문 = 지문;
        this.커서 = new 지문커서(지문);
    }

    public 글자스트림(시작위치 = new 위치틀(0, 0)): Iterator<색칠할글자> {
        const 지문 = this.지문;
        const 쓴글 = this.쓴글;
        const 본문커서 = this.커서;
        let 커서 = new 지문커서(지문, 시작위치);
        // 현재 위치가 커서 이전인지, 커서 위치인지, 커서 이후 위치인지에 따라, 색상과 정오 판단이 다르다.
        // -> 커서위치를 고려해서 글자판을 생성하자.
        // 정오판단은 키 입력 기준으로 해야 정확하다. 예) 완 -> dhks
        return {
            next: () => {
                const ㅈ = 지문.글자(커서.위치);
                const ㅆ = 쓴글.글자(커서.위치);
                const 커서자리 = 본문커서.같나(커서);
                const 색자 = 색칠글자(커서자리, ㅈ, ㅆ);
                커서 = 커서.다음;
                return {done: ㅈ.끝, value: 색자};
            },
        };
    }

    public 쓰기(글자: 글자꼴) {
        this.쓴글.쓰기(this.커서.위치, 글자);
        return this;
    }

    public 다음() {
        this.커서 = this.커서.다음;
        return this;
    }

    public 이전() {
        this.커서 = this.커서.이전;
        return this;
    }

    public get 위치(): 위치틀 {
        return this.커서.위치;
    }

    public get 끝() {
        return this.지문.글자(this.커서.위치).끝;
    }

    public get 유효타수(): number {
        let 커서 = new 지문커서(this.지문, new 위치틀(0, 0));
        let 타수 = 0;
        while (true) {
            const 지문 = this.지문.글자(커서.위치);
            const 쓴글 = this.쓴글.글자(커서.위치);
            if (지문.끝) {
                return 타수;
            }
            커서 = 커서.다음;
            const 정오 = 정오판단(false, 지문, 쓴글);
            const 필요 = 필요타수(지문);
            필요.forEach((타, i) => {
                if (정오[i] && 정오[i] === 정오표.정타) {
                    타수 += 타;
                }
            });
        }
    }
}

function 색칠글자(커서자리: boolean, 지문글자: 글자틀, 쓴글자: 글자틀): 색칠할글자 {
    const [배경색, 글자색] = 정오색상(커서자리, 정오판단(커서자리, 지문글자, 쓴글자));
    let 글자 = 지문글자;
    if (쓴글자 !== 글자없음 && !쓴글자.한글 && !지문글자.다음행) {
        return new 색칠할글자(쓴글자, 글자색, 배경색);
    }
    if (쓴글자.초성 > 0) {
        글자 = 글자.새초성(쓴글자.초성);
    }
    if (쓴글자.중성 > 0) {
        글자 = 글자.새중성(쓴글자.중성);
    }
    if (쓴글자.종성 > 0) {
        글자 = 글자.새종성(쓴글자.종성);
    }
    return new 색칠할글자(글자, 글자색, 배경색);
}
/**
 * 지문에 있는 글자와 타이핑한 쓴글자를 비교해서, 정오판단.
 * 현재 커서위치라면 미정 상태가 있을 수 있음.
 */
function 정오판단(현재커서위치: boolean, 지문글자: 글자꼴, 쓴글자: 글자꼴): [정오표, 정오표, 정오표] {
    const 판단 = (지문자소: number, 쓴글자소: number, 미정가능: boolean): 정오표 =>
        지문자소 === 쓴글자소 ? 정오표.정타 : (현재커서위치 && 미정가능 ? 정오표.미정 : 정오표.오타);
    if (쓴글자 === 글자없음) {
        return [정오표.미정, 정오표.미정, 정오표.미정];
    } else if (지문글자.한글) {
        if (쓴글자.한글) {
            const [초입, 중입, 종입] = 입력중(지문글자, 쓴글자);
            const 초 = 판단(지문글자.초성, 쓴글자.초성,
                ((쓴글자.초성 === 0 || 초입) && 쓴글자.중성 === 0));
            const 중 = 판단(지문글자.중성, 쓴글자.중성,
                (쓴글자.중성 === 0 || 중입));
            const 종 = 판단(지문글자.종성, 쓴글자.종성,
                ((쓴글자.종성 === 0 && 지문글자.종성 > 0)
                 || (쓴글자.종성 > 0 && 지문글자.종성 === 0)
                 || 종입));
            return[초, 중, 종];
        } else {
            return [정오표.오타, 정오표.오타, 정오표.오타];
        }
    } else {
        const 정오 = 판단(지문글자.코드[0], 쓴글자.코드[0], 현재커서위치);
        return [정오, 정오, 정오];
    }
}

type 정오색상표 = [색상.RGBA, [색상.RGBA, 색상.RGBA, 색상.RGBA]];

/**
 * 정오판단에 따라 색칠하기. 커서위치가 아니라면, 이미 지난 글자라고 여기고,
 * 빨간 배경 처리
 */
function 정오색상(현재커서위치: boolean, 정오: [정오표, 정오표, 정오표]): 정오색상표 {
    const 전체오타 = 정오.some((a: 정오표) => a === 정오표.오타);
    const 배경색 = 현재커서위치 ? 색상.파랑 : (전체오타 ? 색상.빨강 : 색상.흰색);
    const 정오색 = (ㅈ: 정오표): 색상.RGBA => {
        switch (ㅈ) {
            case 정오표.정타:
                return 현재커서위치 ? 색상.흰색 : 색상.검정;
            case 정오표.오타:
                return 현재커서위치 ? 색상.빨강 : 색상.노랑;
            case 정오표.미정:
                return 현재커서위치 ? 색상.회색 : 색상.밝은회색;
        }
        return 색상.검정;
    };
    const 글자색 = 정오.map(정오색) as [색상.RGBA, 색상.RGBA, 색상.RGBA];
    return [배경색, 글자색];
}
/**
 * 특정 단어 수 만큼씩 이상의 문단들을 묶어 섹션들로 나눈다.
 * 마지막 섹션이 너무 조금이라면 그 전 섹션에 묶어서 반환.
 */
export function 섹션나누기(텍스트: string, 최소단어수: number): string[] {
    const 줄 = 텍스트.split('\n');
    const 섹션: string[][] = [];
    const words = 줄.map(단어수);
    let w = 0;
    let si = 0;
    줄.forEach((행: string, i: number) => {
        섹션[si] = 섹션[si] || [];
        섹션[si].push(행);
        w += words[i];
        if (w >= 최소단어수) {
            w = 0;
            si++;
        }
    });
    if (섹션.length > 1 &&
        섹션[섹션.length - 1].length < 최소단어수 / 4) {
        const lastStrings = 섹션.pop();
        if (lastStrings) {
            lastStrings.forEach((s: string) => 섹션[섹션.length - 1].push(s));
        }
    }
    return 섹션.map((strings: string[]) => strings.join('\n'));
}

function 단어수(text: string): number {
    return text.split(/[ ,\?\.\/:'"\[\]{}|~`!@#$%^&*()\-_=\+]/)
               .filter((w: string) => w.length >= 1)
               .length;
}
