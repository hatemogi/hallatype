export default class Graphic {
    private ctx!: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }
    
    public draw() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgb(200, 0, 0)';
        ctx.strokeStyle = '1px rgb(0, 0, 0)';
        ctx.strokeRect(0, 0, 639, 479);
        ctx.fillRect(10, 10, 50, 50);
    }
}

