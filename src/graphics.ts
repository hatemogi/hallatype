import { 분리, 벌식 } from './hangul';
import { 글자종류, 글자위치, 색칠할글자 } from './charactor';
import { 본문그림판 } from './document';
import * as color from './color';
import { 한글글꼴, 라틴글꼴 } from './fonts';

type 비트맵 = number[];

export default class 그림판 implements 본문그림판 {
    private ctx!: CanvasRenderingContext2D;

    // 본문의 어느 부분을 보일 것인가?
    private viewPort: [number, number, number, number] = [0, 0, 0, 0];

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw() {
        this.바탕칠하기(new 글자위치(6, 3), true, color.빨강);
    }

    public 글자그리기(위치: 글자위치, 글자: 색칠할글자) {
        const [x, y] = this.textToGraphic(위치);
        const [w, h] = [글자.자.전각 ? 16 : 8, 16];
        const 종 = 글자.자.종류;
        let 빗맵들: 비트맵[] = [];
        switch (글자.자.종류) {
            case 글자종류.한글:
                빗맵들 = 한글비트맵(글자);
                break;
            case 글자종류.라틴:
                빗맵들 = 라틴비트맵(글자);
                break;
            case 글자종류.모름:
                break;
        }
        빗맵들.forEach((빗맵: 비트맵, i: number) => {
            const 이미지 = this.비트맵을이미지로(x, y, w, 빗맵, 글자.색[i]);
            this.ctx.putImageData(이미지, x, y);
        });
    }

    public 바탕칠하기(위치: 글자위치, 전각: boolean, 배경색: color.RGBA) {
        const [x, y] = this.textToGraphic(위치);
        const [w, h] = [전각 ? 16 : 8, 16];
        const [r, g, b, _] = 배경색;
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(x, y, w, h);
    }

    // 좌표 변환
    private textToGraphic(위치: 글자위치): [number, number] {
        return [위치.열 * 8, 위치.행 * 20];
    }

    private 비트맵을이미지로(x: number, y: number, 너비: number, 빗맵: 비트맵, 색: color.RGBA): ImageData {
        const 높이 = 빗맵.length;
        const 이미지 = this.ctx.getImageData(x, y, 너비, 높이);
        for (let py = 0; py < 높이; py++) {
            let bit = 1 << 너비;
            for (let px = 0; px < 너비; px++) {
                bit >>>= 1;
                if ((빗맵[py] & bit) > 0) {
                    이미지.data.set(색, (py * 너비 + px) * 4);
                }
            }
        }
        return 이미지;
    }
}

// 한글 한 음절을 받아, 기본 글꼴 16x16 비트맵을 반환.
// 초성, 중성, 종성 배열로 반환
function 한글비트맵(글자: 색칠할글자): 비트맵[] {
    const [초, 중, 종] = 글자.자.코드;
    const 벌 = 벌식([초, 중, 종]);
    return [한글글꼴[벌[0] * 19 + 초],
            한글글꼴[벌[1] * 21 + 중 + 19 * 8],
            한글글꼴[벌[2] * 28 + 종 + 21 * 4 + 19 * 8]];
}

// 라틴문자는 비트맵 한 개만 배열에 담아 반환
export function 라틴비트맵(글자: 색칠할글자): 비트맵[] {
    return [라틴글꼴[글자.자.코드[0]]];
}
