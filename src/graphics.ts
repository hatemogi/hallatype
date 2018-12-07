import { dgm } from './fonts';
import { decompose, packs } from './hangul';

function bitmapToImageData(ctx: CanvasRenderingContext2D, width: number,
                           bitmap: number[], rgba: number[]): ImageData {
    const height = bitmap.length;
    const image = ctx.createImageData(width, height);
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

export default class Graphic {
    private ctx!: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgb(0, 0, 150)';
        ctx.strokeStyle = '1px rgb(0, 0, 0)';
        ctx.strokeRect(0, 0, 639, 479);
        // 19*8 21*4 28*4
       // ctx.transform(2, 0, 0, 2, 0, 0);
        // ctx.fillRect(0, 0, 50, 50);
        const [초, 중, 종] = decompose('한'.charCodeAt(0));
        const [초벌, 중벌, 종벌] = packs([초, 중, 종]);
        const 비트맵 = [dgm[초벌 * 19 + 초], dgm[중벌 * 21 + 중 + 19 * 8], dgm[종벌 * 28 + 종 + 21 * 4 + 19 * 8]];
        let bitmap = 비트맵[0].map((line: number, i: number) => line | 비트맵[1][i]);
        if (종 > 0) {
            bitmap = bitmap.map((line: number, i: number) => line | 비트맵[2][i]);
        }
        const image = bitmapToImageData(ctx, 16, bitmap, [0, 0, 0, 255]);
        ctx.putImageData(image, 20, 20);
        ctx.putImageData(image, 20 + 16, 20);
    }
}

