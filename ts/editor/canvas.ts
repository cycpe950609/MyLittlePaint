import { CANVAS } from "../editorUI/util/HTMLElement";

class CanvasStyle {
    private target: HTMLCanvasElement;
    constructor(cvs: HTMLCanvasElement) {
        this.target = cvs;
    }
    set touchAction(val: string) { this.target.style.touchAction = val };
    set cursor(val: string) { this.target.style.cursor = val };
}

export class PaintCanvas {
    // @ts-ignore
    private classname: string;
    private render_cvs: HTMLCanvasElement;
    constructor(classname: string) {
        this.classname = classname;
        this.render_cvs = CANVAS(classname);
        this.style = new CanvasStyle(this.render_cvs);
    }

    public set width(val: number) { this.render_cvs.width = val; };
    public set height(val: number) { this.render_cvs.height = val; };

    public toDataURL = () => this.render_cvs.toDataURL();
    public getContext = (ctx: string): PaintContext => {
        switch (ctx) {
            case "2d": {
                let ctx = this.render_cvs.getContext("2d");
                if (ctx === null) throw new Error("INTERNAL_ERROR: Context not exist");
                return new PaintContext(ctx);
            }
            default: {
                throw new Error("Context not supported");
            }
        }
    }

    public get element(): HTMLCanvasElement {
        return this.render_cvs;
    }

    public style: CanvasStyle;
}

export class PaintContext {

    private render_ctx: CanvasRenderingContext2D;
    constructor(ctx: CanvasRenderingContext2D) {
        this.render_ctx = ctx;
    }

    public set strokeStyle(val: string) { this.render_ctx.strokeStyle = val; };
    public set lineWidth(val: number) { this.render_ctx.lineWidth = val; }
    public set lineJoin(val: CanvasLineJoin) { this.render_ctx.lineJoin = val; };
    public set lineCap(val: CanvasLineCap) { this.render_ctx.lineCap = val; };
    public set fillStyle(val: string) { this.render_ctx.fillStyle = val; };;
    public set globalCompositeOperation(val: GlobalCompositeOperation) { this.render_ctx.globalCompositeOperation = val; };

    public clearRect = (x: number, y: number, w: number, h: number) => { this.render_ctx.clearRect(x, y, w, h); };

    public beginPath = () => { this.render_ctx.beginPath(); };
    public moveTo = (x: number, y: number) => { this.render_ctx.moveTo(x, y); };
    public lineTo = (x: number, y: number) => { this.render_ctx.lineTo(x, y); };
    public closePath = () => { this.render_ctx.closePath(); };
    public arc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean) => {
        this.render_ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    };
    public fill = () => { this.render_ctx.fill(); };
    public stroke = () => { this.render_ctx.stroke(); };

    public drawImage(image: CanvasImageSource, x: number, y: number): void;
    public drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
    public drawImage(image: CanvasImageSource, arg1: any, arg2: any, arg3?: any, arg4?: any): void {
        this.render_ctx.drawImage(image, arg1, arg2, arg3, arg4);
    };
}
