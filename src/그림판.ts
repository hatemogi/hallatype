import { 벌식 } from './한글';
import { 끝글자, 색칠할글자 } from './글자';
import { 위치틀, 본문틀 } from './본문';
import * as color from './색상';
import { 한글글꼴, 라틴글꼴, 특수문자 } from './fonts';
import { antialiasFont, upscaleFont } from './font-editor';

type 비트맵 = number[];
const 연습글꼴 = upscaleFont(한글글꼴);
const 안티앨리어싱글꼴 = antialiasFont(연습글꼴);
const 픽셀배율 = 2;

/**
 * 그림판 역할:
 * 1) 텍스트 보이기
 * 2) 커서 보이기
 * 3) 엔터표시 보이기
 * 4) 오타 위치 지적하기
 */
export default class 그림판틀 {
    private ctx!: CanvasRenderingContext2D;
    private 본문: 본문틀;
    private 안티앨리어싱강도 = 100;
    // 본문의 어느 부분을 보일 것인가?
    private viewPort: [number, number, number, number] = [0, 0, 0, 0];

    constructor(ctx: CanvasRenderingContext2D, 본문: 본문틀) {
        this.ctx = ctx;
        this.본문 = 본문;
    }

    public 안티앨리어싱강도설정(강도: number) {
        this.안티앨리어싱강도 = Math.max(0, Math.min(300, 강도));
    }

    public 그리기() {
        let 위치 = new 위치틀(0, 0);
        const 글자스트림 = this.본문.글자스트림(위치);
        this.바탕지우기(color.흰색);
        while (위치.행 < 11) {
            const {value, done} = 글자스트림.next();
            const 색자 = value;
            if (done) {
                break;
            }
            if (색자.자.전각 && 위치.열 === 79) {
                // 한글 그릴 공간이 부족한 경우 다음줄로 이동.
                위치 = 위치.다음행;
            }
            this.글자그리기(위치, 색자);
            if (색자.자.다음행) {
                위치 = 위치.다음행.다음행;
            } else {
                위치 = 색자.자.전각 ? 위치.다음.다음 : 위치.다음;
                위치 = 위치.열 >= 80 ? 위치.다음행 : 위치;
            }
        }
    }

    public 글자그리기(위치: 위치틀, 글자: 색칠할글자) {
        const [x, y] = this.textToGraphic(위치);
        this.바탕칠하기(위치, 글자.자.전각, 글자.배경색);
        const 빗맵들: 비트맵[] = 글자.자.한글 ? 한글비트맵(글자) : 그외비트맵(글자);
        const 알파들 = 글자.자.한글 && this.안티앨리어싱강도 > 0
            ? 한글비트맵(글자, 안티앨리어싱글꼴) : [];
        const 원본너비 = 글자.자.한글 ? 32 : 글자.자.전각 ? 16 : 8;
        const 배율 = 글자.자.한글 ? 1 : 픽셀배율;
        빗맵들.forEach((빗맵: 비트맵, i: number) => {
            if (빗맵 && 빗맵.length > 0) {
                const 이미지 = this.비트맵을이미지로(x, y, 원본너비, 배율, 빗맵, 글자.색[i], 알파들[i]);
                this.ctx.putImageData(이미지, x, y);
            }
        });
    }

    private 바탕지우기(배경색: color.RGBA) {
        const [r, g, b, a] = 배경색;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255.0})`;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    private 바탕칠하기(위치: 위치틀, 전각: boolean, 배경색: color.RGBA) {
        if (배경색 === color.흰색) {
            return;
        }
        const [x, y] = this.textToGraphic(위치);
        const w = 전각 ? 32 : 16;
        const [r, g, b, a] = 배경색;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255.0})`;
        this.ctx.fillRect(x, y + 32, w, 4);
    }

    // 좌표 변환
    private textToGraphic(위치: 위치틀): [number, number] {
        return [위치.열 * 8 * 픽셀배율, 위치.행 * 22 * 픽셀배율];
    }

    private 비트맵을이미지로(x: number, y: number, 원본너비: number, 배율: number,
                              빗맵: 비트맵, 색: color.RGBA, 알파?: number[]): ImageData {
        const 너비 = 원본너비 * 배율;
        const 높이 = 빗맵.length * 배율;
        const 이미지 = this.ctx.getImageData(x, y, 너비, 높이);
        for (let py = 0; py < 빗맵.length; py++) {
            for (let px = 0; px < 원본너비; px++) {
                const 불투명도 = (빗맵[py] & (1 << (원본너비 - px - 1))) !== 0 ? 255
                    : 알파 ? Math.min(255, Math.round(알파[py * 32 + px] * this.안티앨리어싱강도 / 100)) : 0;
                if (불투명도 > 0) {
                    for (let dy = 0; dy < 배율; dy++) {
                        for (let dx = 0; dx < 배율; dx++) {
                            const 위치 = (((py * 배율 + dy) * 너비) + px * 배율 + dx) * 4;
                            if (불투명도 === 255) {
                                이미지.data.set(색, 위치);
                            } else {
                                const 비율 = 불투명도 / 255;
                                for (let 채널 = 0; 채널 < 3; 채널++) {
                                    이미지.data[위치 + 채널] = Math.round(
                                        이미지.data[위치 + 채널] * (1 - 비율) + 색[채널] * 비율,
                                    );
                                }
                                이미지.data[위치 + 3] = 255;
                            }
                        }
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
function 그외비트맵(글자: 색칠할글자): 비트맵[] {
    const 코드 = 글자.자.코드[0] || 0;
    if (글자.자.다음행) {
        return [특수문자[0]];
    } else if (글자.자 === 끝글자) {
        return [특수문자[1]];
    } else {
        return [라틴글꼴[코드]];
    }
}
