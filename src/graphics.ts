import { charToBitmap } from './hangul';
import { 글자위치, 색칠할글자 } from './charactor';
import { 본문그림판 } from './document';
import * as color from './color';

export default class Graphic implements 본문그림판 {
    private ctx!: CanvasRenderingContext2D;

    // 본문의 어느 부분을 보일 것인가?
    private viewPort: [number, number, number, number] = [0, 0, 0, 0];

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw() {
        this.바탕칠하기(new 글자위치(6, 3), true, color.빨강);
        this.drawChar(16, 32, '한'.charCodeAt(0), color.검정);
        this.drawChar(16 + 16, 32, '글'.charCodeAt(0), color.파랑);
        this.drawChar(16 + 32, 32, '!'.charCodeAt(0), color.검정);
        this.drawText(16, 32 + 16, '안녕하세요? Hello, World!!!', color.검정);
    }

    public 글자그리기(위치: 글자위치, 글자: 색칠할글자) {
        // noop yet
        const [x, y] = this.textToGraphic(위치);
        const [w, h] = [글자.자.전각 ? 16 : 8, 16];

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
        return [위치.열 * 8, 위치.행 * 16];
    }

    private drawChar(x: number, y: number, char: number, rgba: color.RGBA): number {
        const [width, bitmap] = charToBitmap(char);
        const image = this.bitmapToImageData(x, y, width, bitmap, rgba);
        this.ctx.putImageData(image, x, y);
        return width;
    }

    private drawText(x: number, y: number, text: string, rgba: color.RGBA) {
        let px = x;
        for (const i of text) {
            px += this.drawChar(px, y, i.charCodeAt(0), rgba);
        }
    }

    private bitmapToImageData(x: number, y: number, width: number, bitmap: number[], rgba: color.RGBA): ImageData {
        const height = bitmap.length;
        const image = this.ctx.getImageData(x, y, width, height);
        for (let py = 0; py < height; py++) {
            let bit = 1 << width;
            for (let px = 0; px < width; px++) {
                bit >>>= 1;
                if ((bitmap[py] & bit) > 0) {
                    image.data.set(rgba, (py * width + px) * 4);
                }
            }
        }
        return image;
    }
}
