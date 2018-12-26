/**
 * 문서 본문, 그리고 이용자가 타이핑한 상태 모델
 *
 * 문서 -> 섹션 -> 글자
 * 글자 = 한글 | 라틴(숫자, 기호 포함) | 모름
 * 한글 -> 음소
 *
 * 각 글자별 타이핑 상태 = 정타 | 일부 오타 | 완전 오타
 *
 * 오타도 1) 여전히 틀린 상태와 2) 수정해서 지금은 맞지만, 틀린 적이 있는 상태 두가지.
 */

import * as color from './color';
import {decompose} from './hangul';

enum 글자종류 {
    한글, 라틴, 모름,
}

enum 글자상태 {
    지문,
    정타,
    오타,
    정정,
    조립중,
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
    public readonly 종류: 글자종류;
    public readonly codes: number[];
    constructor(종류: 글자종류, codes: number[]) {
        this.종류 = 종류;
        this.codes = codes;
    }

    // 반각 or 전각 글자 구분
    get double(): boolean {
        return this.종류 === 글자종류.한글;
    }
}

function 한글(code: number) {
    return new 글자(글자종류.한글, decompose(code));
}

function 라틴(code: number) {
    return new 글자(글자종류.라틴, [code]);
}

class TextAttribute {
    public readonly 글자색: color.RGBA;
    public readonly 배경색: color.RGBA;
    constructor(글자색: color.RGBA = color.흰색, 배경색: color.RGBA = color.검정) {
        this.글자색 = 글자색;
        this.배경색 = 배경색;
    }
}

export class TextPosition {
    public column: number;
    public line: number;
    constructor(column: number, line: number) {
        this.column = column;
        this.line = line;
    }
}

export class TextCharactor {
    public readonly char: 글자;
    public colors: color.RGBA[];
    constructor(char: 글자, colors: color.RGBA[]) {
        this.char = char;
        this.colors = colors;
    }
}

export interface TextModelDrawer {
    onTextWrite: (pos: TextPosition, charactor: TextCharactor) => void;
    onTextFill: (pos: TextPosition, double: boolean, fill: color.RGBA) => void;
}

/**
 * 특징: 지문과 입력문이 있다. 지문은 한번에 다 쓰고 바꾸지 않고,
 * 입력문은 순차적으로 쓰되 앞뒤로 한글자 단위로만 이동한다.
 * 지문은 특정 영역을 한꺼번에 화면에 보이고,
 * 입력문은 지문을 쫓아가며 상태를 바꾼다.
 * 입력문과 지문의 차이가 나는 범위는 한계가 있다. (예. 최대 5글자)
 */
export class TextModel {
    private cursor: TextPosition = new TextPosition(0, 0);
    private 기본속성 = new TextAttribute();
    private lines: TextCharactor[][] = [];
    private maxColumn = 80;
    private currentLine: TextCharactor[] = this.lines[0];
    private drawer?: TextModelDrawer;
    constructor(drawer?: TextModelDrawer) {
        this.drawer = drawer;
    }

    public moveCursor(pos: TextPosition): void {
        this.cursor = pos;
    }

    public write(text: string): void {
        // noop yet;
        // this.listeners.forEach
        for (let i = 0; i <= text.length; i++) {
            if (text.codePointAt(i)) {
                this.writeChar(text.codePointAt(i)!);
            }
        }
    }

    public refresh(lines: [number, number]): void {
        // 특정 영역 다시 그리기
    }

    private writeChar(code: number): void {
        // noop
        switch (글자종류판단(code)) {
            case 글자종류.라틴:
                break;
            case 글자종류.한글:
                break;
            case 글자종류.모름:
                break;
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
