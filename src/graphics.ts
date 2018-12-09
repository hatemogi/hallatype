import { charToBitmap } from './hangul';

export default class Graphic {
    private ctx!: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgb(180, 180, 255)';
        ctx.strokeStyle = '1px rgb(0, 0, 0)';
        ctx.strokeRect(0, 0, 639, 350);
        ctx.fillRect(0, 0, 150, 48);
        const 검정 = [0, 0, 0, 255];
        this.drawChar(20, 20, '한'.charCodeAt(0), 검정);
        this.drawChar(20 + 16, 20, '글'.charCodeAt(0), 검정);
        this.drawChar(20 + 32, 20, '!'.charCodeAt(0), 검정);
        this.drawText(20, 40, '안녕하세요? Hello, World!!!', 검정);
    }

    private drawChar(x: number, y: number, char: number, rgba: number[]): number {
        const [width, bitmap] = charToBitmap(char);
        const image = this.bitmapToImageData(x, y, width, bitmap, rgba);
        this.ctx.putImageData(image, x, y);
        return width;
    }

    private drawText(x: number, y: number, text: string, rgba: number[]) {
        let px = x;
        for (const i of text) {
            px += this.drawChar(px, y, i.charCodeAt(0), rgba);
        }
    }

    private bitmapToImageData(x: number, y: number, width: number, bitmap: number[], rgba: number[]): ImageData {
        const height = bitmap.length;
        const image = this.ctx.getImageData(x, y, width, height);
        for (let py = 0; py < height; py++) {
            let bit = 1 << width;
            for (let px = 0; px < width; px++) {
                bit = bit >>> 1;
                const i = (py * width + px) * 4;
                if ((bitmap[py] & bit) > 0) {
                    for (let t = 0; t < 4; t++) {
                        image.data[i + t] = rgba[t];
                    }
                }
            }
        }
        return image;
    }
}

