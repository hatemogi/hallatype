import { 벌식 } from './한글';
import { 끝글자, 글자꼴, 색칠할글자 } from './글자';
import { 위치틀 } from './본문';
import * as color from './색상';
import { 한글글꼴, 라틴글꼴, 특수문자 } from './fonts';
import { antialiasBitmap, antialiasFont, FINALS, INITIALS,
    roundedRingAlphaGlyph, smoothSourceAlphaBitmap, upscaleFont } from './font-editor';
import { expandedMask, practiceMasks } from './practice-mask';
import { MaskSet } from './key-mask';
import { 글꼴확대방식, 필사팔레트, 필사팔레트들 } from './practice-settings';

type 비트맵 = number[];
type 글자칸 = { 화면위치: 위치틀; 너비: number };
type 그릴칸 = 글자칸 & { 문서위치: 위치틀; 색자: 색칠할글자; 코드: number; 다음행: boolean };
type 오타효과 = { 위치: 위치틀; 키: string; 시작: number; 진행: number; 흔들림: boolean };
type 그릴본문 = {
    지문글자: (위치: 위치틀) => 글자꼴;
    글자스트림: (시작위치?: 위치틀) => Iterator<색칠할글자>;
};
const 연습글꼴 = upscaleFont(한글글꼴);
const 안티앨리어싱글꼴 = antialiasFont(연습글꼴);
const 윤곽글꼴 = 한글글꼴.map((비트맵, index) => {
    const 초성 = index < 152;
    const 종성 = index >= 236;
    const 자소 = 초성 ? INITIALS[index % 19] : 종성 ? FINALS[(index - 236) % 28 - 1] : undefined;
    if (자소 === 'ㅇ' || 자소 === 'ㅎ') {
        return roundedRingAlphaGlyph(비트맵, 자소 === 'ㅎ');
    }
    return smoothSourceAlphaBitmap(비트맵);
});
const 윤곽확대캐시 = {
    3: new WeakMap<비트맵, 비트맵>(),
    4: new WeakMap<비트맵, 비트맵>(),
};
const 부드러운윤곽캐시 = new WeakMap<비트맵, Uint8Array>();
function 윤곽흐리기(알파: ArrayLike<number>, 너비: number, 높이: number): Uint8Array {
    const 가로 = new Float32Array(너비 * 높이);
    const 결과 = new Uint8Array(너비 * 높이);
    for (let y = 0; y < 높이; y++) {
        for (let x = 0; x < 너비; x++) {
            const i = y * 너비 + x;
            가로[i] = ((x > 0 ? 알파[i - 1] : 0) + 2 * 알파[i] +
                (x + 1 < 너비 ? 알파[i + 1] : 0)) / 4;
        }
    }
    for (let y = 0; y < 높이; y++) {
        for (let x = 0; x < 너비; x++) {
            const i = y * 너비 + x;
            결과[i] = Math.round(((y > 0 ? 가로[i - 너비] : 0) + 2 * 가로[i] +
                (y + 1 < 높이 ? 가로[i + 너비] : 0)) / 4);
        }
    }
    return 결과;
}
function 부드러운윤곽(알파: 비트맵, 너비: number, 높이: number): Uint8Array {
    let 캐시 = 부드러운윤곽캐시.get(알파);
    if (!캐시) {
        캐시 = 윤곽흐리기(알파, 너비, 높이);
        부드러운윤곽캐시.set(알파, 캐시);
    }
    return 캐시;
}
function 윤곽확대글리프(원본: 비트맵 | undefined, 너비: 8 | 16, 배율: 3 | 4, 자소?: string): 비트맵 {
    if (!원본?.length) { return []; }
    const 캐시 = 윤곽확대캐시[배율];
    let 확대 = 캐시.get(원본);
    if (!확대) {
        확대 = 자소 === 'ㅇ' || 자소 === 'ㅎ'
            ? roundedRingAlphaGlyph(원본, 자소 === 'ㅎ', 배율)
            : smoothSourceAlphaBitmap(원본, 너비, 배율);
        캐시.set(원본, 확대);
    }
    return 확대;
}
function 한글윤곽확대비트맵(글자: 색칠할글자, 배율: 3 | 4): 비트맵[] {
    const 원본들 = 한글비트맵(글자, 한글글꼴);
    return 원본들.map((원본, index) => 윤곽확대글리프(원본, 16, 배율,
        index === 0 ? INITIALS[글자.자.초성 - 1] : index === 2 ? FINALS[글자.자.종성 - 1] : undefined));
}
function 두배비트맵(원본: 비트맵, 너비: 8 | 16): 비트맵 {
    const 확대: 비트맵 = [];
    for (const 행 of 원본) {
        let 두배행 = 0;
        for (let x = 0; x < 너비; x++) {
            if (행 & (1 << (너비 - x - 1))) {
                두배행 = (두배행 | (3 << ((너비 - x - 1) * 2))) >>> 0;
            }
        }
        확대.push(두배행, 두배행);
    }
    return 확대;
}
const 라틴연습글꼴 = 라틴글꼴.map((비트맵) => 두배비트맵(비트맵, 8));
const 특수연습글꼴 = 특수문자.map((비트맵) => 두배비트맵(비트맵, 16));
const 라틴안티앨리어싱 = 라틴연습글꼴.map((비트맵) => antialiasBitmap(비트맵, 16));
const 특수안티앨리어싱 = 특수연습글꼴.map((비트맵) => antialiasBitmap(비트맵, 32));
const 라틴윤곽글꼴 = 라틴글꼴.map((비트맵) => smoothSourceAlphaBitmap(비트맵, 8));
const 특수윤곽글꼴 = 특수문자.map((비트맵) => smoothSourceAlphaBitmap(비트맵, 16));
const 픽셀배율 = 2;
function 해상도배율(방식: 글꼴확대방식): number {
    return 방식 === '윤곽64' ? 2 : 방식 === '윤곽48' ? 1.5 : 1;
}
const 기본한줄칸수 = 80;
const 줄끝기호 = ' !,.:;?)]}';

function 영어단어길이(본문: 그릴본문, 시작: 위치틀): number {
    let 위치 = 시작;
    let 길이 = 0;
    while (true) {
        const 글자 = 본문.지문글자(위치);
        const 코드 = 글자.코드[0];
        if (!((코드 >= 65 && 코드 <= 90) || (코드 >= 97 && 코드 <= 122))) { return 길이; }
        길이++;
        위치 = 위치.다음;
    }
}

function 줄의공백넓히기(그릴칸들: 그릴칸[], 한줄칸수: number) {
    const 행별칸들 = new Map<number, 그릴칸[]>();
    for (const 칸 of 그릴칸들) {
        const 행 = 칸.화면위치.행;
        if (!행별칸들.has(행)) { 행별칸들.set(행, []); }
        행별칸들.get(행)!.push(칸);
    }

    for (const [행, 칸들] of 행별칸들) {
        // 자동 줄바꿈으로 이어지는 줄만 맞춘다. 문단의 마지막 줄은 그대로 둔다.
        if (!행별칸들.has(행 + 1) || 칸들.some((칸) => 칸.다음행)) { continue; }
        let 마지막글자 = 칸들.length - 1;
        while (마지막글자 >= 0 && 칸들[마지막글자].코드 === 32) { 마지막글자--; }
        if (마지막글자 < 1) { continue; }

        const 끝칸 = 칸들[마지막글자];
        const 남은폭 = 한줄칸수 * 16 - (끝칸.화면위치.열 * 16 + 끝칸.너비);
        if (남은폭 <= 0 || 남은폭 > 64) { continue; }
        const 공백들 = 칸들.flatMap((칸, i) =>
            칸.코드 === 32 && i > 0 && i < 마지막글자 &&
            칸들.slice(0, i).some((앞) => 앞.코드 !== 32) &&
            칸들.slice(i + 1, 마지막글자 + 1).some((뒤) => 뒤.코드 !== 32) ? [i] : []);
        if (공백들.length === 0 || 남은폭 > 공백들.length * 8) { continue; }

        let 지난공백 = 0;
        for (let i = 0; i < 칸들.length; i++) {
            const 칸 = 칸들[i];
            const 이동 = Math.floor(남은폭 * 지난공백 / 공백들.length);
            칸.화면위치 = new 위치틀(행, (칸.화면위치.열 * 16 + 이동) / 16);
            if (칸.코드 === 32 && 공백들.includes(i)) {
                지난공백++;
                칸.너비 += Math.floor(남은폭 * 지난공백 / 공백들.length) - 이동;
            }
        }
    }
}

/**
 * 그림판 역할:
 * 1) 텍스트 보이기
 * 2) 커서 보이기
 * 3) 엔터표시 보이기
 * 4) 오타 위치 지적하기
 */
export default class 그림판틀 {
    private ctx!: CanvasRenderingContext2D;
    private 본문: 그릴본문;
    private 안티앨리어싱강도 = 50;
    private 글꼴확대방식: 글꼴확대방식;
    private 팔레트: 필사팔레트;
    private 한줄칸수: number;
    private readonly 최소높이: number;
    private 깜빡임허용: boolean;
    private readonly 영문글꼴: boolean;
    private 글자칸들 = new Map<string, 글자칸>();
    private 커서키?: string;
    private 커서보임 = true;
    private 깜빡임타이머 = 0;
    private 오타효과?: 오타효과;
    private 효과프레임 = 0;
    private readonly 마스크들: MaskSet;
    private readonly 키영역들 = new Map<string, 비트맵>();
    private 투명배경 = false;
    private 마지막글줄하단 = 0;
    // 본문의 어느 부분을 보일 것인가?
    private viewPort: [number, number, number, number] = [0, 0, 0, 0];

    constructor(ctx: CanvasRenderingContext2D, 본문: 그릴본문,
                보기: { 팔레트?: 필사팔레트; 한줄칸수?: number; 커서깜빡임?: boolean;
                    안티앨리어싱?: number; 글꼴확대방식?: 글꼴확대방식;
                    영문글꼴?: boolean; 최소높이?: number } = {}) {
        this.ctx = ctx;
        this.본문 = 본문;
        this.팔레트 = 보기.팔레트 ?? 필사팔레트들.한지;
        this.한줄칸수 = 보기.한줄칸수 ?? 기본한줄칸수;
        this.최소높이 = 보기.최소높이 ?? 500;
        this.깜빡임허용 = 보기.커서깜빡임 ?? true;
        this.영문글꼴 = 보기.영문글꼴 ?? false;
        this.안티앨리어싱강도설정(보기.안티앨리어싱 ?? 50);
        this.글꼴확대방식 = 보기.글꼴확대방식 ?? '기존';
        let storage: Storage | undefined;
        try { storage = typeof window === 'undefined' ? undefined : window.localStorage; } catch (_) { /* 저장소 없이 실행 */ }
        this.마스크들 = practiceMasks(storage);
    }

    public 안티앨리어싱강도설정(강도: number) {
        this.안티앨리어싱강도 = Math.max(0, Math.min(150, 강도));
    }

    public 글꼴확대방식설정(방식: 글꼴확대방식) {
        this.글꼴확대방식 = 방식;
    }

    public 투명배경설정(사용: boolean) { this.투명배경 = 사용; }
    public get 글줄하단비율(): number {
        return this.ctx.canvas.height ? this.마지막글줄하단 / this.ctx.canvas.height : 1;
    }
    public 화면가로비율(위치: 위치틀): number {
        const 칸 = this.글자칸들.get(this.위치키(위치));
        return 칸 ? (칸.화면위치.열 * 16 + 칸.너비 / 2) *
            해상도배율(this.글꼴확대방식) / this.ctx.canvas.width : 0.5;
    }
    public 화면세로비율(위치: 위치틀): number {
        const 칸 = this.글자칸들.get(this.위치키(위치));
        return 칸 ? (칸.화면위치.행 * 44 + 22) *
            해상도배율(this.글꼴확대방식) / this.ctx.canvas.height : 0.5;
    }

    public 보기설정(팔레트: 필사팔레트, 한줄칸수: number, 커서깜빡임: boolean) {
        this.오타효과중지(false);
        this.팔레트 = 팔레트;
        this.한줄칸수 = 한줄칸수;
        this.깜빡임허용 = 커서깜빡임;
        this.그리기();
    }

    public 오타효과시작(위치: 위치틀) {
        this.오타효과중지(false);
        this.커서깜빡임중지();
        const 효과: 오타효과 = {
            위치, 키: this.위치키(위치), 시작: performance.now(), 진행: 0,
            흔들림: false,
        };
        this.오타효과 = 효과;
        this.변경그리기([위치]);
        const 한프레임 = (시각: number) => {
            if (this.오타효과 !== 효과) { return; }
            효과.진행 = Math.min(1, (시각 - 효과.시작) / 400);
            if (효과.진행 === 1) {
                this.오타효과 = undefined;
                this.효과프레임 = 0;
                this.커서밑줄그리기(효과, false);
                this.커서깜빡임시작();
                return;
            }
            this.커서밑줄그리기(효과, true);
            this.효과프레임 = requestAnimationFrame(한프레임);
        };
        this.효과프레임 = requestAnimationFrame(한프레임);
    }

    public 오타효과중지(다시그리기 = true) {
        if (this.효과프레임) { cancelAnimationFrame(this.효과프레임); }
        this.효과프레임 = 0;
        const 이전위치 = this.오타효과?.위치;
        this.오타효과 = undefined;
        if (이전위치 && 다시그리기) { this.변경그리기([이전위치]); }
    }

    public 종료() {
        this.커서깜빡임중지();
        this.오타효과중지(false);
    }

    public get 커서세로위치(): number | null {
        const 칸 = this.커서키 && this.글자칸들.get(this.커서키);
        return 칸 ? this.textToGraphic(칸.화면위치)[1] + 44 : null;
    }

    public 그리기() {
        this.커서깜빡임중지();
        this.커서키 = undefined;
        this.커서보임 = true;
        let 화면위치 = new 위치틀(0, 0);
        let 문서위치 = new 위치틀(0, 0);
        const 글자스트림 = this.본문.글자스트림();
        const 그릴칸들: 그릴칸[] = [];
        let 마지막행 = 0;
        let 이전코드: number | null = null;
        this.글자칸들.clear();
        while (true) {
            const {value, done} = 글자스트림.next();
            const 색자 = value;
            if (done) {
                break;
            }
            const 지문글자 = this.본문.지문글자(문서위치);
            const 코드 = 지문글자.코드[0];
            const 칸수 = 지문글자.전각 ? 2 : 1;
            const 닫는따옴표 = (코드 === 34 || 코드 === 39) && 이전코드 !== null &&
                이전코드 !== 32 && 이전코드 !== 10;
            const 줄끝에남길글자 = 지문글자.다음행 || 줄끝기호.includes(String.fromCodePoint(코드)) || 닫는따옴표;
            const 영어단어시작 = ((코드 >= 65 && 코드 <= 90) || (코드 >= 97 && 코드 <= 122)) &&
                (이전코드 === null || !((이전코드 >= 65 && 이전코드 <= 90) ||
                    (이전코드 >= 97 && 이전코드 <= 122)));
            // 문서 위치와 원문은 그대로 두고, 그리는 위치에서만 줄바꿈을 조정한다.
            if (!줄끝에남길글자 && (화면위치.열 + 칸수 > this.한줄칸수 ||
                (영어단어시작 && 화면위치.열 > 0 &&
                    화면위치.열 + 영어단어길이(this.본문, 문서위치) > this.한줄칸수))) {
                화면위치 = 화면위치.다음행;
            }
            const 너비 = 지문글자.전각 ? 32 : 16;
            const 키 = this.위치키(문서위치);
            if (색자.배경색 === this.팔레트.커서) { this.커서키 = 키; }
            그릴칸들.push({ 문서위치, 화면위치, 색자, 너비, 코드, 다음행: 지문글자.다음행 });
            마지막행 = Math.max(마지막행, 화면위치.행);
            이전코드 = 코드;
            if (지문글자.다음행) {
                화면위치 = 화면위치.다음행.다음행;
                문서위치 = 문서위치.다음행;
            } else {
                화면위치 = 지문글자.전각 ? 화면위치.다음.다음 : 화면위치.다음;
                문서위치 = 문서위치.다음;
            }
        }
        줄의공백넓히기(그릴칸들, this.한줄칸수);
        let 오른쪽끝 = this.한줄칸수 * 16;
        for (const 칸 of 그릴칸들) {
            this.글자칸들.set(this.위치키(칸.문서위치), { 화면위치: 칸.화면위치, 너비: 칸.너비 });
            오른쪽끝 = Math.max(오른쪽끝, 칸.화면위치.열 * 16 + 칸.너비);
        }
        const 배율 = 해상도배율(this.글꼴확대방식);
        this.ctx.canvas.width = Math.round(Math.max(this.한줄칸수 * 16 + 6, 오른쪽끝 + 6) * 배율);
        this.ctx.canvas.height = Math.round(Math.max(this.최소높이, (마지막행 + 1) * 44) * 배율);
        this.마지막글줄하단 = Math.round((마지막행 + 1) * 44 * 배율);
        this.ctx.setTransform?.(1, 0, 0, 1, 0, 0);
        if (this.투명배경) { this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height); }
        else { this.바탕지우기(this.팔레트.종이); }
        for (const { 화면위치: 위치, 색자, 너비 } of 그릴칸들) {
            this.글자그리기(위치, 색자, 너비);
        }
        this.커서깜빡임시작();
    }

    public 변경그리기(위치들: 위치틀[]) {
        this.커서깜빡임중지();
        this.커서보임 = true;
        const 본위치 = new Set<string>();
        for (const 문서위치 of 위치들) {
            const 키 = this.위치키(문서위치);
            if (본위치.has(키)) { continue; }
            본위치.add(키);
            const 칸 = this.글자칸들.get(키);
            if (!칸) { continue; }
            const [x, y] = this.textToGraphic(칸.화면위치);
            this.영역지우기(x, y, 칸.너비, 44);
            const {value, done} = this.본문.글자스트림(문서위치).next();
            if (done || value.배경색 !== this.팔레트.커서) {
                if (this.커서키 === 키) { this.커서키 = undefined; }
            } else {
                this.커서키 = 키;
            }
            if (!done) { this.글자그리기(칸.화면위치, value, 칸.너비, this.오타효과?.키 === 키); }
        }
        this.커서깜빡임시작();
    }

    private 커서깜빡임중지() {
        if (this.깜빡임타이머) { window.clearInterval(this.깜빡임타이머); }
        this.깜빡임타이머 = 0;
    }

    private 커서깜빡임시작() {
        if (!this.깜빡임허용 || !this.커서키 || this.오타효과 || typeof window === 'undefined' ||
            !window.setInterval || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { return; }
        this.깜빡임타이머 = window.setInterval(() => {
            const 칸 = this.커서키 && this.글자칸들.get(this.커서키);
            if (!칸) { return; }
            const [x, y] = this.textToGraphic(칸.화면위치);
            this.커서보임 = !this.커서보임;
            this.영역지우기(x, y + 32, 칸.너비, 4);
            if (this.커서보임) { this.바탕칠하기(칸.화면위치, 칸.너비, this.팔레트.커서, false); }
        }, 500);
    }

    private 위치키(위치: 위치틀): string {
        return `${위치.행}:${위치.열}`;
    }

    public 글자그리기(위치: 위치틀, 글자: 색칠할글자, 칸너비 = 글자.자.전각 ? 32 : 16, 오타효과 = false) {
        const [x, y] = this.textToGraphic(위치);
        this.바탕칠하기(위치, 칸너비, 글자.배경색, 오타효과);
        if (this.영문글꼴 && !글자.자.한글 && !글자.자.전각) {
            const [r, g, b, a] = 글자.색[0];
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            const 배율 = 해상도배율(this.글꼴확대방식);
            this.ctx.font = `${25 * 배율}px ui-monospace, Menlo, Monaco, Consolas, monospace`;
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(String.fromCodePoint(글자.자.코드[0]),
                Math.round(x * 배율), Math.round((y + 1) * 배율));
            return;
        }
        const 빗맵들: 비트맵[] = 글자.자.한글 ? 한글비트맵(글자) : 그외비트맵(글자);
        const 윤곽 = this.글꼴확대방식 !== '기존';
        const 알파들 = this.안티앨리어싱강도 > 0
            ? 글자.자.한글
                ? this.글꼴확대방식 === '윤곽64' ? 한글윤곽확대비트맵(글자, 4)
                    : this.글꼴확대방식 === '윤곽48' ? 한글윤곽확대비트맵(글자, 3)
                    : 한글비트맵(글자, 윤곽 ? 윤곽글꼴 : 안티앨리어싱글꼴)
                : 그외비트맵(글자, this.글꼴확대방식)
            : [];
        const 원본너비 = 글자.자.한글 || 글자.자.전각 ? 32 : 16;
        // 먼저 입력하는 자소가 겹친 획에서도 보이도록 종성부터 역순으로 쌓는다.
        for (let i = 빗맵들.length - 1; i >= 0; i--) {
            const 빗맵 = 빗맵들[i];
            if (빗맵 && 빗맵.length > 0) {
                const 키색 = 글자.키색[i];
                const 영역 = 키색 ? this.키영역(글자.자, i, 빗맵) : undefined;
                const 이미지 = this.비트맵을이미지로(x, y, 원본너비, 빗맵, 글자.색[i], 알파들[i], 윤곽,
                    키색 && 영역 ? { 색: 키색, 영역 } : undefined);
                const 배율 = 해상도배율(this.글꼴확대방식);
                this.ctx.putImageData(이미지, Math.round(x * 배율), Math.round(y * 배율),
                    0, 0, Math.min(Math.round(칸너비 * 배율), 이미지.width), 이미지.height);
            }
        }
    }

    private 키영역(글자: 글자꼴, 자소: number, 빗맵: 비트맵): 비트맵 | undefined {
        if (!글자.한글 || (자소 !== 1 && 자소 !== 2)) { return undefined; }
        const 벌 = 벌식([글자.초성, 글자.중성, 글자.종성]);
        const key = `${자소 === 1 ? 'jung' : 'jong'}:${벌[자소]}:${자소 === 1 ? 글자.중성 - 1 : 글자.종성 - 1}`;
        const source = this.마스크들[key];
        if (!source) { return undefined; }
        let 영역 = this.키영역들.get(key);
        if (!영역) {
            영역 = expandedMask(source, 빗맵);
            this.키영역들.set(key, 영역);
        }
        return 영역;
    }

    private 바탕지우기(배경색: color.RGBA) {
        const [r, g, b, a] = 배경색;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255.0})`;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    private 종이색(): string {
        if (this.팔레트.종이 === color.흰색) { return '#fff'; }
        const [r, g, b, a] = this.팔레트.종이;
        return `rgba(${r}, ${g}, ${b}, ${a / 255.0})`;
    }

    private 영역지우기(x: number, y: number, 너비: number, 높이: number) {
        if (!this.투명배경) {
            this.ctx.fillStyle = this.종이색();
            this.논리영역칠하기(x, y, 너비, 높이);
            return;
        }
        const 배율 = 해상도배율(this.글꼴확대방식);
        const 왼쪽 = Math.round(x * 배율);
        const 위 = Math.round(y * 배율);
        this.ctx.clearRect(왼쪽, 위, Math.round((x + 너비) * 배율) - 왼쪽,
            Math.round((y + 높이) * 배율) - 위);
    }

    private 바탕칠하기(위치: 위치틀, 너비: number, 배경색: color.RGBA, 오타효과: boolean) {
        if (배경색 === color.흰색) {
            return;
        }
        const [x, y] = this.textToGraphic(위치);
        const 색 = 오타효과 ? this.팔레트.안내 : 배경색;
        const [r, g, b, a] = 색;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255.0})`;
        const 이동 = 오타효과 && this.오타효과?.흔들림
            ? Math.round(Math.sin(this.오타효과.진행 * Math.PI * 8) * 3 * (1 - this.오타효과.진행)) : 0;
        this.논리영역칠하기(x + (오타효과 ? 4 + 이동 : 0), y + 32,
            너비 - (오타효과 ? 8 : 0), 4);
    }

    // 애니메이션 프레임에는 글꼴 비트맵을 다시 만들지 않고 밑줄 4픽셀만 갱신한다.
    private 커서밑줄그리기(효과: 오타효과, 활성: boolean) {
        const 칸 = this.글자칸들.get(효과.키);
        if (!칸) { return; }
        const [x, y] = this.textToGraphic(칸.화면위치);
        this.영역지우기(x, y + 32, 칸.너비, 4);
        this.바탕칠하기(칸.화면위치, 칸.너비, 활성 ? this.팔레트.안내 : this.팔레트.커서, 활성);
    }

    // 좌표 변환
    private textToGraphic(위치: 위치틀): [number, number] {
        return [위치.열 * 8 * 픽셀배율, 위치.행 * 22 * 픽셀배율];
    }

    private 논리영역칠하기(x: number, y: number, 너비: number, 높이: number) {
        const 배율 = 해상도배율(this.글꼴확대방식);
        const 왼쪽 = Math.round(x * 배율);
        const 위 = Math.round(y * 배율);
        this.ctx.fillRect(왼쪽, 위,
            Math.round((x + 너비) * 배율) - 왼쪽,
            Math.round((y + 높이) * 배율) - 위);
    }

    private 비트맵을이미지로(x: number, y: number, 원본너비: number,
                              빗맵: 비트맵, 색: color.RGBA, 알파?: number[],
                              윤곽 = false, 키분리?: { 색: [color.RGBA, color.RGBA]; 영역: 비트맵 }): ImageData {
        const 배율 = 해상도배율(this.글꼴확대방식);
        const 너비 = Math.round(원본너비 * 배율);
        const 높이 = Math.round(빗맵.length * 배율);
        const 이미지 = this.ctx.getImageData(Math.round(x * 배율), Math.round(y * 배율), 너비, 높이);
        const 추가흐림 = 윤곽 && 알파 ? Math.max(0, (this.안티앨리어싱강도 - 100) / 100) : 0;
        // 가장자리만 진하게 더하지 않고, 같은 잉크량을 이웃 픽셀로 나눠 획의 굵기를 지킨다.
        const 흐린윤곽 = 추가흐림 > 0 && 알파 ? 부드러운윤곽(알파, 너비, 높이) : undefined;
        for (let py = 0; py < 높이; py++) {
            for (let px = 0; px < 너비; px++) {
                const 원본행 = Math.floor(py / 배율);
                const 원본열 = Math.floor(px / 배율);
                const 기본 = (빗맵[원본행] & (1 << (원본너비 - 원본열 - 1))) !== 0 ? 255 : 0;
                const 위치 = py * 너비 + px;
                const 덮임 = 알파?.[위치] ?? 0;
                const 불투명도 = 윤곽 && 알파
                    ? 추가흐림 > 0 && 흐린윤곽
                        ? Math.round(덮임 * (1 - 추가흐림) + 흐린윤곽[위치] * 추가흐림)
                        : Math.round(기본 + (덮임 - 기본) * this.안티앨리어싱강도 / 100)
                    : 기본 || Math.min(255, Math.round(덮임 * this.안티앨리어싱강도 / 100));
                if (불투명도 > 0) {
                    const 픽셀색 = 키분리
                        ? 키분리.색[(키분리.영역[원본행] & (1 << (원본너비 - 원본열 - 1))) !== 0 ? 0 : 1]
                        : 색;
                    const 위치 = (py * 너비 + px) * 4;
                    if (this.투명배경) {
                        const 앞알파 = 불투명도 * 픽셀색[3] / (255 * 255);
                        const 뒤알파 = 이미지.data[위치 + 3] / 255;
                        const 합성알파 = 앞알파 + 뒤알파 * (1 - 앞알파);
                        for (let 채널 = 0; 채널 < 3; 채널++) {
                            이미지.data[위치 + 채널] = Math.round((픽셀색[채널] * 앞알파 +
                                이미지.data[위치 + 채널] * 뒤알파 * (1 - 앞알파)) / 합성알파);
                        }
                        이미지.data[위치 + 3] = Math.round(합성알파 * 255);
                    } else if (불투명도 === 255) {
                        이미지.data.set(픽셀색, 위치);
                    } else {
                        const 비율 = 불투명도 / 255;
                        for (let 채널 = 0; 채널 < 3; 채널++) {
                            이미지.data[위치 + 채널] = Math.round(
                                이미지.data[위치 + 채널] * (1 - 비율) + 픽셀색[채널] * 비율,
                            );
                        }
                        이미지.data[위치 + 3] = 255;
                    }
                }
            }
        }
        return 이미지;
    }
}

// 한글 한 음절을 받아, 계단 틈을 메운 32x32 비트맵을 반환.
// 초성, 중성, 종성 배열로 반환
function 한글비트맵(글자: 색칠할글자, 글꼴들: 비트맵[] = 연습글꼴): 비트맵[] {
    const [초, 중, 종] = [글자.자.초성, 글자.자.중성, 글자.자.종성];
    const 벌 = 벌식([초, 중, 종]);
    const 글꼴 = (초중종: number, 기준점: number) =>
        (초중종 === 0) ? [] : 글꼴들[기준점 + 초중종 - 1];
    return [글꼴(초, 벌[0] * 19),
            글꼴(중, 벌[1] * 21 + 19 * 8),
            글꼴(종, 벌[2] * 28 + 21 * 4 + 19 * 8 + 1)];
}

// 그 외 문자는 비트맵 한 개만 배열에 담아 반환
function 그외비트맵(글자: 색칠할글자, 알파: false | 글꼴확대방식 = false): 비트맵[] {
    const 코드 = 글자.자.코드[0] || 0;
    const 배율 = 알파 === '윤곽64' ? 4 : 알파 === '윤곽48' ? 3 : undefined;
    if (글자.자.다음행) {
        return [배율 ? 윤곽확대글리프(특수문자[0], 16, 배율)
            : 알파 === '윤곽' ? 특수윤곽글꼴[0] : 알파 ? 특수안티앨리어싱[0] : 특수연습글꼴[0]];
    } else if (글자.자 === 끝글자) {
        return [배율 ? 윤곽확대글리프(특수문자[1], 16, 배율)
            : 알파 === '윤곽' ? 특수윤곽글꼴[1] : 알파 ? 특수안티앨리어싱[1] : 특수연습글꼴[1]];
    } else {
        return [배율 ? 윤곽확대글리프(라틴글꼴[코드], 8, 배율)
            : 알파 === '윤곽' ? 라틴윤곽글꼴[코드] : 알파 ? 라틴안티앨리어싱[코드] : 라틴연습글꼴[코드]];
    }
}
