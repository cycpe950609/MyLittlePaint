import { v4 as uuidv4 } from "uuid";
import type AnyCanvas from "../editor/anycanvas";

export type PaintEvent = {
    X: number;
    Y: number;
    type: "touch" | "mouse" | "pen";
    pressure: number;
}

export interface CanvasInterface {
    Name: string;
    HistoryName?: string;// undefined if don't want to push into history stack
    Tip?: string;
    ImgName?: string;
    CursorName?: string;
    CanFinishDrawing: boolean;
    PointerDown?: (e: PaintEvent) => void;
    PointerMove?: (e: PaintEvent) => void;
    PointerUp?: (e: PaintEvent) => void;
    PointerOut?: (e: PaintEvent) => void;
    RightPointerDown?: (e: PaintEvent) => void;
    RightPointerUp?: (e: PaintEvent) => void;
    DrawFunction: (
        ctx: AnyCanvas.Layer,
        width: number,
        height: number,
        rotate: number,
    ) => void;
    CompositeOperation: GlobalCompositeOperation;
    Settings?: CanvasInterfaceSettings;
}

export enum CanvasSettingType {
    Number,
    Color,
    Boolean,
}
export type CanvasSettingEntry<DATATYPE> = {
    type: CanvasSettingType;
    label: string;
    info?: any; // Information of the setting, e.g. value range
    value: DATATYPE;
}
export type CanvasInterfaceSettings = {
    Name?: string;
    ImgName?: string;
    Settings?: Map<string, CanvasSettingEntry<any>>;
};

export class DrawBase implements CanvasInterface {
    Name: string = "base";
    private _canFinishDrawing: boolean = true
    public get CanFinishDrawing() { return this._canFinishDrawing; };

    protected LastX = 0;
    protected LastY = 0;
    protected NextX = 0;
    protected NextY = 0;
    protected ifDrawing = false;
    protected ifMouseMove = false;
    protected shapeID!: string;

    public PointerDown(e: PaintEvent) {
        [this.LastX, this.LastY] = [e.X, e.Y];
        [this.NextX, this.NextY] = [e.X, e.Y];
        this.ifDrawing = true;
        this.ifMouseMove = false;
        this._canFinishDrawing = false;
        this.shapeID = uuidv4();
    };
    public PointerMove(e: PaintEvent) {
        if (!this.ifDrawing) return;
        this.ifMouseMove = true;
        [this.NextX, this.NextY] = [e.X, e.Y];
    };
    public PointerUp(_e: PaintEvent) {
        this._canFinishDrawing = true;
        this.ifMouseMove = false;
        this.ifDrawing = false;
    };
    public PointerOut(_e: PaintEvent) {
        this._canFinishDrawing = true;
        this.ifMouseMove = false;
        this.ifDrawing = false;
    };
    protected rotatedDelta(radian: number): [number, number] {
        let OffsetX = this.NextX;
        let OffsetY = this.NextY;
        let dx = OffsetX - this.LastX;
        let dy = OffsetY - this.LastY;
        let new_dx = dx * Math.cos(radian) - dy * Math.sin(-radian);
        let new_dy = dx * Math.sin(-radian) + dy * Math.cos(radian);
        return [new_dx, new_dy];
    }
    protected rotatedPoint(x: number, y: number, radian: number): [number, number] {
        let originX = x;// - this.LastX;
        let originY = y;// - this.LastY;
        let newX = originX * Math.cos(radian) - originY * Math.sin(radian);
        let newY = originX * Math.sin(radian) + originY * Math.cos(radian);
        // return [newX + this.LastX, newY + this.LastY];
        return [newX, newY];
    }
    public DrawFunction(_ctx: AnyCanvas.Layer, _width: number, _height: number, _rotate: number) { };
    public CompositeOperation: GlobalCompositeOperation = "source-over" as GlobalCompositeOperation;
    public set Settings(_setting: CanvasInterfaceSettings) { };
    public get Settings() { return {} as CanvasInterfaceSettings; };
};

export class ClickDrawBase implements CanvasInterface {
    Name: string = "base";
    private _canFinishDrawing: boolean = true
    public get CanFinishDrawing() { return this._canFinishDrawing; };

    protected LastX = 0;
    protected LastY = 0;
    protected NextX = 0;
    protected NextY = 0;
    protected ifDrawing = false;
    protected ifMouseMove = false;
    protected isPointOut = false
    protected shapeID!: string;
    protected points: [number, number][] = [];

    public PointerDown(e: PaintEvent) {
        if (this._canFinishDrawing == true) { // First click
            [this.LastX, this.LastY] = [e.X, e.Y];
            [this.NextX, this.NextY] = [e.X, e.Y];
            this.ifDrawing = true;
            this.ifMouseMove = false;
            this._canFinishDrawing = false;
            this.shapeID = uuidv4();
            this.points = [[e.X, e.Y],];
        }

    };
    public PointerMove(e: PaintEvent) {
        if (!this.ifDrawing) return;
        this.isPointOut = false;
        this.ifMouseMove = true;
        [this.NextX, this.NextY] = [e.X, e.Y];
    };
    public PointerUp(e: PaintEvent) {
        this.points.push([e.X, e.Y]);
    };

    public RightPointerUp(_e: PaintEvent) {
        this._canFinishDrawing = true;
        this.ifMouseMove = false;
        this.ifDrawing = false;
    }

    public PointerOut(_e: PaintEvent) {
        this.isPointOut = true;
        // this.points.push([e.X, e.Y]);
        // this._canFinishDrawing = true;
        // this.ifMouseMove = false;
        // this.ifDrawing = false; 
    };
    protected rotatedDelta(radian: number, offsetX?: number, offsetY?: number): [number, number] {
        let OffsetX = offsetX !== undefined ? offsetX : this.NextX;
        let OffsetY = offsetY !== undefined ? offsetY : this.NextY;
        let dx = OffsetX - this.LastX;
        let dy = OffsetY - this.LastY;
        let new_dx = dx * Math.cos(radian) - dy * Math.sin(-radian);
        let new_dy = dx * Math.sin(-radian) + dy * Math.cos(radian);
        return [new_dx, new_dy];
    }
    protected rotatedPoint(x: number, y: number, radian: number): [number, number] {
        let originX = x;// - this.LastX;
        let originY = y;// - this.LastY;
        let newX = originX * Math.cos(radian) - originY * Math.sin(radian);
        let newY = originX * Math.sin(radian) + originY * Math.cos(radian);
        // return [newX + this.LastX, newY + this.LastY];
        return [newX, newY];
    }
    public DrawFunction(_ctx: AnyCanvas.Layer, _width: number, _height: number, _rotate: number) { };
    public CompositeOperation: GlobalCompositeOperation = "source-over";
    public set Settings(_setting: CanvasInterfaceSettings) { };
    public get Settings() { return {} as CanvasInterfaceSettings; };
};

export class NoOPCVSFunc extends DrawBase { };
export interface CanvasBase {
    name: string;
    attachCanvas: (container: HTMLDivElement) => void;
    Function: CanvasInterface;
    resizeCanvas: (e?: UIEvent) => void;
    removeCanvas: () => void;
    render: () => void;
    update?: (time: DOMHighResTimeStamp) => void; //Use in animateion
    settings?: CanvasInterfaceSettings;
    isUpdate: boolean;
}

export class NoOPCanvas implements CanvasBase {
    update?: ((time: number) => void) | undefined;
    name = "NoOPCanvas";
    attachCanvas(_container: HTMLDivElement) {
        // console.log("NoOPCanvas attachCanvas on ");
        // console.log(container);
        // return <Div />;
    }
    set Function(func: CanvasInterface) {
        console.log("setFunction", func);
    }
    resizeCanvas(_e?: UIEvent) {
        // console.log("Resize Canvas Event");
    }
    removeCanvas() {
        // console.log("NoOPCanvas removeCanvas");
    }
    render() {
        // console.log("NoOPCanvas render");
        // return <Div />;
    }
    isUpdate: boolean = false;
}
