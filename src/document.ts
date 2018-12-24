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

enum 글자종류 {
    한글, 라틴,
}

enum 글자상태 {
    지문,
    정타,
    오타,
    조립중,
}

class 글자 {
    public readonly type: 글자종류;
    public readonly code: number;
    constructor(type: 글자종류, code: number) {
        this.type = type;
        this.code = code;
    }

    // 반각 or 전각 글자 구분
    get double(): boolean {
        return this.type === 글자종류.한글;
    }
}

function 한글(code: number) {
    return new 글자(글자종류.한글, code);
}

function 라틴(code: number) {
    return new 글자(글자종류.라틴, code);
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

export class TextModel {
    private cursor: TextPosition = new TextPosition(0, 0);
    private 기본속성 = new TextAttribute();
    private lines: TextCharactor[][] = [];
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
    }

    public refresh(lines: [number, number]): void {
        // 특정 영역 다시 그리기
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
