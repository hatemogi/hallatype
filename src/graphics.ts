import { hangulToBitmap, latinToBitmap } from './hangul';

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
        const bitmap = hangulToBitmap('한'.charCodeAt(0));
        const image = this.bitmapToImageData(16, bitmap, [0, 0, 0, 255]);
        ctx.putImageData(image, 20, 20);
        ctx.putImageData(image, 20 + 16, 20);
        const latinBitmap = latinToBitmap('!'.charCodeAt(0));
        const latinImage = this.bitmapToImageData(8, latinBitmap, [0, 0, 0, 255]);
        ctx.putImageData(latinImage, 20 + 32, 20);
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

