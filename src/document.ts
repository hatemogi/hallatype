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

type RGBA = number[];

type Charactor = HangulCharactor | LatinCharactor;

interface HangulCharactor {
    code: number;
    음소: number[];
}

interface LatinCharactor {
    code: number;
}

interface TextAttribute {
    color: RGBA;
    backgroundColor: RGBA;
}

interface TextPosition {
    column: number;
    line: number;
}

interface TextCharactor {
    charCode: number;
    cols: number;               // 한글은 2컬럼, 라틴문자는 1컬럼
    attribute: TextAttribute;
}

interface TextModel {
    cursor: TextPosition;
    color: RGBA;
    backgroundColor: RGBA;
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
    lines.forEach((line: string, i: number) =>  {
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
