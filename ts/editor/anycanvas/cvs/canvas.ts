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
    protected view_height: number = 0;
    protected view_width: number = 0;

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

    // Viewport
    public viewAt(center: Point, rotDeg: number, scale: number) {
        this.View.viewAt(center, rotDeg, scale);
    }
    public viewCenterAt(center: Point) {
        this.View.viewCenterAt(center);
    }
    public viewRotDegAt(rotDeg: number) {
        this.View.viewRotDegAt(rotDeg);
    }
    public viewScaleAt(scale: number) {
        this.View.viewScaleAt(scale);
    }
    // Move the View along the axis of view
    public viewUp(deltaY: number) {
        this.View.viewUp(deltaY);
    }
    public viewDown(deltaY: number) {
        this.View.viewDown(deltaY);
    }
    public viewRight(deltaX: number) {
        this.View.viewRight(deltaX);
    }
    public viewLeft(deltaX: number) {
        this.View.viewLeft(deltaX);
    }
    // Scale
    public viewZoomIn(scale: number) {
        this.View.viewZoomIn(scale);
    }
    public viewZoomOut(scale: number) {
        this.View.viewZoomOut(scale);
    }
    // Rotation
    public viewRotate(degree: number, rot_center?: Point) {
        this.View.viewRotate(degree, rot_center);
    }

    public get viewHeight(): number {
        return this.view_height
    }
    public set viewHeight(height: number) {
        this.view_height = height;
    }

    public get viewWidth(): number {
        return this.view_width;
    }
    public set viewWidth(width: number) {
        this.view_width = width;
    }

};
