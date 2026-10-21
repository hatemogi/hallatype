import { 위치틀, 지문틀 } from './본문';
import { 글자꼴, 색칠할글자 } from './글자';
import * as 색상 from './색상';

type 자소 = 0 | 1 | 2;
type 키 = { code: string; shift: boolean };
type 획 = { 글자번호: number; 자소: 자소; 키: 키; 틀림: boolean };
type 상태 = '미입력' | '정타' | '오타' | '정정';

const 자음: string[] = [
    '', 'r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g',
];
const 모음: string[] = [
    '', 'k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l',
];
const 받침: string[] = [
    '', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg',
    'a', 'q', 'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g',
];
const 특수키: Record<string, string> = {
    ' ': 'Space', '\n': 'Enter', '`': 'Backquote', '-': 'Minus', '=': 'Equal',
    '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash', ';': 'Semicolon',
    "'": 'Quote', ',': 'Comma', '.': 'Period', '/': 'Slash',
};
const 쉬프트기호: Record<string, string> = {
    '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6',
    '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
    '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
};

function 키로(문자: string): 키 {
    const shift = 문자 >= 'A' && 문자 <= 'Z';
    const 기본 = 쉬프트기호[문자] || 문자;
    const code = /^[a-zA-Z]$/.test(기본) ? `Key${기본.toUpperCase()}`
        : /^[0-9]$/.test(기본) ? `Digit${기본}` : 특수키[기본];
    if (!code) { throw new Error(`키 순서를 만들 수 없는 문자: ${문자}`); }
    return { code, shift: shift || 기본 !== 문자 };
}

function 자소키(글자: 글자꼴): Array<[자소, 키[]]> {
    if (!글자.한글) {
        return [[0, [키로(String.fromCodePoint(글자.코드[0]))]]];
    }
    const 결과: Array<[자소, 키[]]> = [
        [0, [...자음[글자.초성]].map(키로)],
        [1, [...모음[글자.중성]].map(키로)],
    ];
    if (글자.종성) { 결과.push([2, [...받침[글자.종성]].map(키로)]); }
    return 결과;
}

/** 지문에 적힌 키를 한 획씩 확인하고, 각 자소의 정오 이력을 보존한다. */
export class 따라그리기틀 {
    private readonly 글자들: Array<{ 위치: 위치틀; 글자: 글자꼴; 상태: 상태[] }> = [];
    private readonly 획들: 획[] = [];
    private readonly 위치별번호 = new Map<string, number>();
    private 획번호 = 0;
    private 맞은타수 = 0;
    private 마지막오타 = false;

    constructor(private readonly 지문: 지문틀) {
        let 위치 = new 위치틀();
        while (!지문.글자(위치).끝) {
            const 글자 = 지문.글자(위치);
            if (글자.코드[0] === 0) { throw new Error('지문 끝글자가 필요합니다.'); }
            const 글자번호 = this.글자들.length;
            this.위치별번호.set(this.위치키(위치), 글자번호);
            this.글자들.push({ 위치, 글자, 상태: ['미입력', '미입력', '미입력'] });
            for (const [자소, 키들] of 자소키(글자)) {
                for (const 키 of 키들) { this.획들.push({ 글자번호, 자소, 키, 틀림: false }); }
            }
            위치 = 글자.다음행 ? 위치.다음행 : 위치.다음;
        }
        if (this.획들.length === 0) { throw new Error('빈 지문입니다.'); }
    }

    public 지문글자(위치: 위치틀): 글자꼴 { return this.지문.글자(위치); }
    public get 위치(): 위치틀 {
        return this.글자들[this.획들[this.획번호]?.글자번호]?.위치 || this.지문.위치;
    }
    public get 끝(): boolean { return this.획번호 === this.획들.length; }
    public get 기대타수(): number { return this.획들.length; }
    public get 유효타수(): number { return this.맞은타수; }
    public get 방금오타(): boolean { return this.마지막오타; }

    public 입력(code: string, shift: boolean): 위치틀[] {
        if (this.끝) { return []; }
        const 획 = this.획들[this.획번호];
        const 현재 = this.글자들[획.글자번호];
        this.마지막오타 = 획.키.code !== code || 획.키.shift !== shift;
        if (this.마지막오타) {
            획.틀림 = true;
            현재.상태[획.자소] = '오타';
            return [현재.위치];
        }
        if (!획.틀림) { this.맞은타수++; }
        const 이전상태 = 현재.상태[획.자소];
        현재.상태[획.자소] = 획.틀림 || 이전상태 === '오타' || 이전상태 === '정정' ? '정정' : '정타';
        this.획번호++;
        return [현재.위치, this.위치];
    }

    public 글자스트림(시작위치 = new 위치틀()): Iterator<색칠할글자> {
        let 번호 = this.위치별번호.get(this.위치키(시작위치)) ?? this.글자들.length;
        return {
            next: () => {
                if (번호 >= this.글자들.length) {
                    return { done: true, value: undefined };
                }
                const { 글자, 상태 } = this.글자들[번호];
                const 색 = 상태.map((값) => {
                    switch (값) {
                        case '정타': return 색상.검정;
                        case '오타': return 색상.빨강;
                        case '정정': return 색상.주황;
                        default: return 색상.밝은회색;
                    }
                });
                const 배경색 = 번호 === this.획들[this.획번호]?.글자번호 ? 색상.파랑 : 색상.흰색;
                번호++;
                return { done: false, value: new 색칠할글자(글자, 색, 배경색) };
            },
        };
    }

    private 위치키(위치: 위치틀): string { return `${위치.행}:${위치.열}`; }
}
