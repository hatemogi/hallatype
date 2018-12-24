import { charToBitmap } from './hangul';
import { TextModel, TextModelDrawer, TextCharactor, TextPosition } from './document';
import * as color from './color';

export default class Graphic implements TextModelDrawer {
    private ctx!: CanvasRenderingContext2D;

    // TextModel의 어느 부분을 보일 것인가?
    private viewPort: [number, number, number, number] = [0, 0, 0, 0];

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw() {
        this.onTextFill(new TextPosition(6, 3), true, color.빨강);
        this.drawChar(16, 32, '한'.charCodeAt(0), color.검정);
        this.drawChar(16 + 16, 32, '글'.charCodeAt(0), color.파랑);
        this.drawChar(16 + 32, 32, '!'.charCodeAt(0), color.검정);
        this.drawText(16, 32 + 16, '안녕하세요? Hello, World!!!', color.검정);
    }

    public onTextWrite(pos: TextPosition, char: TextCharactor) {
        // noop yet
        const [x, y] = this.textToGraphic(pos);
        const [w, h] = [char.char.double ? 16 : 8, 16];
    }

    public onTextFill(pos: TextPosition, double: boolean, fill: color.RGBA) {
        const [x, y] = this.textToGraphic(pos);
        const [w, h] = [double ? 16 : 8, 16];
        const [r, g, b, _] = fill;
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(x, y, w, h);
    }

    // 좌표 변환
    private textToGraphic(pos: TextPosition): [number, number] {
        return [pos.column * 8, pos.line * 16];
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
