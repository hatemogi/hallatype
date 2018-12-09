import { charToBitmap } from './hangul';

export default class Graphic {
    private ctx!: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgb(0, 0, 150)';
        ctx.strokeStyle = '1px rgb(0, 0, 0)';
        ctx.strokeRect(0, 0, 639, 350);
        // ctx.fillRect(0, 0, 50, 50);
        const 검정 = [0, 0, 0, 255];
        this.drawChar(20, 20, '한'.charCodeAt(0), 검정);
        this.drawChar(20 + 16, 20, '글'.charCodeAt(0), 검정);
        this.drawChar(20 + 32, 20, '!'.charCodeAt(0), 검정);
        this.drawText(20, 40, '안녕하세요? Hello, World!!!', 검정);
    }

    private drawChar(x: number, y: number, char: number, rgba: number[]): number {
        const [width, bitmap] = charToBitmap(char);
        const image = this.bitmapToImageData(width, bitmap, rgba);
        this.ctx.putImageData(image, x, y);
        return width;
    }

    private drawText(x: number, y: number, text: string, rgba: number[]) {
        let px = x;
        for (let i of text) {
            px += this.drawChar(px, y, i.charCodeAt(0), rgba);
        }
    }

    private bitmapToImageData(width: number, bitmap: number[], rgba: number[]): ImageData {
        const height = bitmap.length;
        const image = this.ctx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            let bit = 1 << width;
            for (let x = 0; x < width; x++) {
                bit = bit >>> 1;
                const i = (y * width + x) * 4;
                if ((bitmap[y] & bit) > 0) {
                    for (let t = 0; t < 4; t++) {
                        image.data[i + t] = rgba[t];
                    }
                } else {
                    image.data[i + 3] = 0;
                }
            }
        }
        return image;
    }
}

