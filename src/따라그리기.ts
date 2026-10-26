import { 위치틀, 지문틀 } from './본문';
import { 글자꼴, 글자틀, 색칠할글자 } from './글자';
import * as 색상 from './색상';
import { 필사팔레트, 필사팔레트들 } from './practice-settings';

type 자소 = 0 | 1 | 2;
export type 키 = { code: string; shift: boolean };
type 획 = { 글자번호: number; 자소: 자소; 키번호: number; 키: 키; 틀림: boolean };
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

export function 키로(문자: string): 키 {
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

const 홑자모키: Record<string, string> = {
    ㄱ: 'r', ㄲ: 'R', ㄴ: 's', ㄷ: 'e', ㄸ: 'E', ㄹ: 'f', ㅁ: 'a', ㅂ: 'q', ㅃ: 'Q',
    ㅅ: 't', ㅆ: 'T', ㅇ: 'd', ㅈ: 'w', ㅉ: 'W', ㅊ: 'c', ㅋ: 'z', ㅌ: 'x', ㅍ: 'v', ㅎ: 'g',
    ㄳ: 'rt', ㄵ: 'sw', ㄶ: 'sg', ㄺ: 'fr', ㄻ: 'fa', ㄼ: 'fq', ㄽ: 'ft', ㄾ: 'fx',
    ㄿ: 'fv', ㅀ: 'fg', ㅄ: 'qt',
    ㅏ: 'k', ㅐ: 'o', ㅑ: 'i', ㅒ: 'O', ㅓ: 'j', ㅔ: 'p', ㅕ: 'u', ㅖ: 'P',
    ㅗ: 'h', ㅘ: 'hk', ㅙ: 'ho', ㅚ: 'hl', ㅛ: 'y', ㅜ: 'n', ㅝ: 'nj', ㅞ: 'np',
    ㅟ: 'nl', ㅠ: 'b', ㅡ: 'm', ㅢ: 'ml', ㅣ: 'l',
};

/** 화면 키보드가 전달한 글자를 기존 물리 키 입력 형식으로 펼친다. */
export function 화면문자키(문자: string): 키[] {
    // iOS WebKit은 화면 키보드의 공백을 줄바꿈 없는 공백으로 넣기도 한다.
    if (문자 === '\u00a0') { return [키로(' ')]; }
    const 자모 = 홑자모키[문자];
    if (자모) { return [...자모].map(키로); }
    const 코드 = 문자.codePointAt(0);
    if (코드 !== undefined && 코드 >= 0xac00 && 코드 <= 0xd7a3) {
        return 자소키(글자틀.생성(코드)).flatMap(([, 키들]) => 키들);
    }
    if (/^[\x20-\x7e\n]$/.test(문자)) { return [키로(문자)]; }
    return [];
}

/** 조합 중인 한글 음절이 바뀌어도 아직 보내지 않은 획만 전달한다. */
export function 새화면키(이전: string, 다음: string): 키[] {
    const 이전키 = [...이전].flatMap(화면문자키);
    const 다음키 = [...다음].flatMap(화면문자키);
    let 공통 = 0;
    while (공통 < 이전키.length && 공통 < 다음키.length &&
        이전키[공통].code === 다음키[공통].code &&
        이전키[공통].shift === 다음키[공통].shift) { 공통++; }
    return 다음키.slice(공통);
}

/** textarea의 조합 중간값과 iOS 한글 입력기의 내부 삭제를 타수에서 제외한다. */
export class 화면입력흐름 {
    private 이전 = '';
    private 조합중 = false;

    public get 조합하고있음(): boolean { return this.조합중; }
    public 초기화(): void { this.이전 = ''; this.조합중 = false; }
    public 조합시작(): void { this.조합중 = true; }
    public 조합끝(다음: string): 키[] {
        this.조합중 = false;
        return this.입력(다음);
    }
    public 입력(다음: string, inputType = '', isComposing = false): 키[] {
        if (this.조합중 || isComposing || inputType.startsWith('delete')) { return []; }
        const 키들 = 새화면키(this.이전, 다음);
        this.이전 = 다음;
        return 키들;
    }
}

function 상태색(값: 상태, 팔레트: 필사팔레트): 색상.RGBA {
    switch (값) {
        case '정타': return 팔레트.먹색;
        case '오타': return 팔레트.안내;
        case '정정': return 팔레트.먹색;
        default: return 팔레트.바탕글;
    }
}

/** 지문에 적힌 키를 한 획씩 확인하고, 각 자소의 정오 이력을 보존한다. */
export class 따라그리기틀 {
    private readonly 글자들: Array<{ 위치: 위치틀; 글자: 글자꼴; 상태: 상태[]; 키상태: 상태[][] }> = [];
    private readonly 획들: 획[] = [];
    private readonly 위치별번호 = new Map<string, number>();
    private 획번호 = 0;
    private 누른타수 = 0;
    private 맞은타수 = 0;
    private 건너뛴타수 = 0;
    private 마지막오타 = false;
    private 팔레트: 필사팔레트;

    constructor(private readonly 지문: 지문틀, 팔레트: 필사팔레트 = 필사팔레트들.한지) {
        this.팔레트 = 팔레트;
        let 위치 = new 위치틀();
        while (!지문.글자(위치).끝) {
            const 글자 = 지문.글자(위치);
            if (글자.코드[0] === 0) { throw new Error('지문 끝글자가 필요합니다.'); }
            const 글자번호 = this.글자들.length;
            this.위치별번호.set(this.위치키(위치), 글자번호);
            const 키묶음 = 자소키(글자);
            const 키상태: 상태[][] = [[], [], []];
            this.글자들.push({ 위치, 글자, 상태: ['미입력', '미입력', '미입력'], 키상태 });
            for (const [자소, 키들] of 키묶음) {
                키상태[자소] = 키들.map(() => '미입력');
                키들.forEach((키, 키번호) => this.획들.push({ 글자번호, 자소, 키번호, 키, 틀림: false }));
            }
            위치 = 글자.다음행 ? 위치.다음행 : 위치.다음;
        }
        if (this.획들.length === 0) { throw new Error('빈 지문입니다.'); }
    }

    public 지문글자(위치: 위치틀): 글자꼴 { return this.지문.글자(위치); }
    public 팔레트설정(팔레트: 필사팔레트) { this.팔레트 = 팔레트; }
    public get 위치(): 위치틀 {
        return this.글자들[this.획들[this.획번호]?.글자번호]?.위치 || this.지문.위치;
    }
    public get 끝(): boolean { return this.획번호 === this.획들.length; }
    public get 전체획수(): number { return this.획들.length; }
    public get 진행획수(): number { return this.획번호; }
    public get 기대타수(): number { return this.획들.length - this.건너뛴타수; }
    public get 입력타수(): number { return this.누른타수; }
    public get 유효타수(): number { return this.맞은타수; }
    public get 진행률(): number { return Math.ceil(this.획번호 * 100 / this.획들.length); }
    public get 방금오타(): boolean { return this.마지막오타; }

    public 입력(code: string, shift: boolean): 위치틀[] {
        if (this.끝) { return []; }
        this.누른타수++;
        const 바뀐위치: 위치틀[] = [];
        let 다음번호 = this.획번호;
        while (다음번호 < this.획들.length && this.선택입력(this.획들[다음번호]) &&
            !this.일치(this.획들[다음번호], code, shift)) {
            다음번호++;
        }
        if (다음번호 < this.획들.length && this.일치(this.획들[다음번호], code, shift)) {
            바뀐위치.push(...this.건너뛰기(다음번호));
        }
        const 획 = this.획들[this.획번호];
        const 현재 = this.글자들[획.글자번호];
        this.마지막오타 = !this.일치(획, code, shift);
        if (this.마지막오타) {
            획.틀림 = true;
            현재.상태[획.자소] = '오타';
            현재.키상태[획.자소][획.키번호] = '오타';
            return [현재.위치];
        }
        if (!획.틀림) { this.맞은타수++; }
        const 이전상태 = 현재.상태[획.자소];
        현재.상태[획.자소] = 획.틀림 || 이전상태 === '오타' || 이전상태 === '정정' ? '정정' : '정타';
        현재.키상태[획.자소][획.키번호] = 획.틀림 ? '정정' : '정타';
        this.획번호++;
        바뀐위치.push(현재.위치);
        let 끝번호 = this.획번호;
        while (끝번호 < this.획들.length && this.선택입력(this.획들[끝번호])) { 끝번호++; }
        if (끝번호 === this.획들.length) { 바뀐위치.push(...this.건너뛰기(끝번호)); }
        return [...바뀐위치, this.위치];
    }

    public 글자스트림(시작위치 = new 위치틀()): Iterator<색칠할글자> {
        let 번호 = this.위치별번호.get(this.위치키(시작위치)) ?? this.글자들.length;
        return {
            next: () => {
                if (번호 >= this.글자들.length) {
                    return { done: true, value: undefined };
                }
                const { 글자, 상태, 키상태 } = this.글자들[번호];
                const 색 = 상태.map((값) => 상태색(값, this.팔레트));
                const 키색 = 키상태.map((키들): [색상.RGBA, 색상.RGBA] | undefined =>
                    키들.length === 2 ? [상태색(키들[0], this.팔레트), 상태색(키들[1], this.팔레트)] : undefined);
                const 배경색 = 번호 === this.획들[this.획번호]?.글자번호 ? this.팔레트.커서 : 색상.흰색;
                번호++;
                return { done: false, value: new 색칠할글자(글자, 색, 배경색, 키색) };
            },
        };
    }

    private 위치키(위치: 위치틀): string { return `${위치.행}:${위치.열}`; }

    private 일치(획: 획, code: string, shift: boolean): boolean {
        return 획.키.code === code && 획.키.shift === shift;
    }

    private 선택입력(획: 획): boolean {
        return 획.키.code === 'Space' || 획.키.code === 'Enter';
    }

    private 건너뛰기(끝번호: number): 위치틀[] {
        const 바뀐위치: 위치틀[] = [];
        while (this.획번호 < 끝번호) {
            const 획 = this.획들[this.획번호++];
            const 현재 = this.글자들[획.글자번호];
            const 상태 = 획.틀림 ? '정정' : '정타';
            현재.상태[획.자소] = 상태;
            현재.키상태[획.자소][획.키번호] = 상태;
            this.건너뛴타수++;
            바뀐위치.push(현재.위치);
        }
        return 바뀐위치;
    }
}
