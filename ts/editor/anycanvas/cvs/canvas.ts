/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  BaseClass of Canvas  
 */

import { BackgroundCanvas } from "./background";
import type { Layer } from "./layer";
import type { ShapeBase } from "./shape";
import type { Point } from "./utils";
import { ViewManager } from "./view";


export class CanvasBase {

    protected View: ViewManager;
    protected container: HTMLDivElement;
    protected backgroundCVS: BackgroundCanvas;

    constructor() {
        this.View = new ViewManager();
        this.container = document.createElement("div");
        this.backgroundCVS = new BackgroundCanvas(48);
        this.container.appendChild(this.backgroundCVS.element);
    }

    public get element(): HTMLDivElement {
        return this.container;
    }

    protected offsetToCanvas(_point: Point): Point {
        throw new Error("CanvasBase.offsetToCanvas")
    }

    public add(layer: Layer) {

    }

    public find(id: string): ShapeBase<any, any>[] {
        let rtv: ShapeBase<any, any>[] = []
        // TODO: find `id` iteratively through all Layers
        return rtv;
    };

    public viewAt(center: Point, rotDeg: number, scale: number) {

    }

    // Properties
    public get viewHeight(): number {
        throw new Error()
    }
    public set viewHeight(height: number) {
        throw new Error()
    }

    public get viewWidth(): number {
        throw new Error()
    }
    public set viewWidth(width: number) {
        throw new Error()
    }

};
