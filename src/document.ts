
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
