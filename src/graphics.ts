import { charToBitmap } from './hangul';
import { TextModel, TextModelListener } from './document';
import * as color from './color';

export default class Graphic {
    private ctx!: CanvasRenderingContext2D;

    // TextModel의 어느 부분을 보일 것인가?
    private viewPort: [number, number, number, number] = [0, 0, 0, 0];

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgb(180, 180, 255)';
        ctx.strokeStyle = '1px rgb(0, 0, 0)';
        ctx.strokeRect(0, 0, 639, 350);
        ctx.fillRect(0, 0, 150, 48);
        this.drawChar(20, 20, '한'.charCodeAt(0), color.검정);
        this.drawChar(20 + 16, 20, '글'.charCodeAt(0), color.파랑);
        this.drawChar(20 + 32, 20, '!'.charCodeAt(0), color.검정);
        this.drawText(20, 40, '안녕하세요? Hello, World!!!', color.검정);
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
