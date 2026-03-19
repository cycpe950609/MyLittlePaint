/**
 * Created : 2026/03/19
 * Author  : Ting Fang, Tsai
 * About:
 *  Render background using canvas     
 */



export class BackgroundCanvas {
    private ctx: CanvasRenderingContext2D
    private chessboard_size: number
    constructor(chessboard_size: number) {
        const cvs = document.createElement("canvas");
        cvs.style.position = "fixed";
        cvs.style.left = "0";
        cvs.style.top = "0";

        let ctx = cvs.getContext("2d");
        if (ctx === null) throw new Error("INTERNAL_ERROR: Context not exist");
        this.ctx = ctx;

        this.chessboard_size = chessboard_size;
    }

    get element() {
        return this.ctx.canvas;
    }

    public resize = (width: number, height: number) => {
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        // TODO: Re-render after resize
    }

    public viewAt = (centerX: number, centerY: number, rotDegree: number, scale: number) => {
        const cvs_width = this.ctx.canvas.width;
        const cvs_height = this.ctx.canvas.height;

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.fillStyle = 'black';
        this.ctx.fillText(`(${centerX}, ${centerY}) ${rotDegree}° x${scale}`, cvs_width / 2, cvs_height / 2);
        this.ctx.stroke();

        const boardSz = this.chessboard_size / 2;

        let startYIdx = 0;
        const renderBlockSz = boardSz * scale;
        this.ctx.fillStyle = 'gray';
        while (startYIdx * renderBlockSz < cvs_height) {
            let startXIdx = 0;
            while (startXIdx * renderBlockSz < cvs_width) {

                const startX = startXIdx * renderBlockSz;
                const startY = startYIdx * renderBlockSz;

                if ((startXIdx + startYIdx) % 2 == 0) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(startX + renderBlockSz, startY);
                    this.ctx.lineTo(startX + renderBlockSz, startY + renderBlockSz);
                    this.ctx.lineTo(startX, startY + renderBlockSz);
                    this.ctx.closePath();
                    this.ctx.fill();
                }

                startXIdx += 1;
            }
            startYIdx += 1;
        }


    }
}