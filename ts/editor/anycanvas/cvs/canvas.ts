/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  BaseClass of Canvas  
 */

import Konva from "konva";
import { BackgroundCanvas } from "./background";
import { INTERNAL_LAYER, type Layer } from "./layer";
import { createShape, type ShapeBase } from "./shape";
import type { Point, Size } from "./utils";
import { ViewManager } from "./view";

export class CanvasBase {

    public View: ViewManager;

    protected view_height: number = 0;
    protected view_width: number = 0;

    protected container: HTMLDivElement;
    protected backgroundCVS: BackgroundCanvas;

    protected render: Konva.Stage;
    protected ctx: Konva.Layer;

    protected view_changed_handler = () => {
        // background
        this.backgroundCVS.viewAt(this.View.Center, this.View.RotationDegree, this.View.Scale);
        // konva canvas
        const cvsW = this.ctx.width()
        const cvsH = this.ctx.height()
        this.ctx.offset(this.View.Center);
        this.ctx.position({ x: cvsW / 2, y: cvsH / 2 });
        this.ctx.scale({ x: this.View.Scale, y: this.View.Scale });
        this.ctx.rotation(this.View.RotationDegree);
    }

    constructor(backgroundCVS: BackgroundCanvas) {
        this.backgroundCVS = backgroundCVS;
        this.container = document.createElement("div");
        this.container.appendChild(this.backgroundCVS.element);

        this.View = new ViewManager({ x: 0, y: 0 }, 0, 1.0, this.view_changed_handler);

        const render_container = document.createElement("div");
        this.container.appendChild(render_container);
        this.render = new Konva.Stage({ container: render_container } as Konva.StageConfig);

        this.ctx = new Konva.Layer();
        this.render.add(this.ctx);
    }

    public get element(): HTMLDivElement {
        return this.container;
    }

    protected offsetToCanvas(_point: Point): Point {
        throw new Error("CanvasBase.offsetToCanvas")
    }

    public add(layer: Layer) {
        this.ctx.add(layer[INTERNAL_LAYER]())
    }

    public find(id: string): ShapeBase<any, any>[] {
        const rtv: ShapeBase<any, any>[] = [];
        const selector = `.${id}`;
        const layers = this.ctx.children;
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (!(layer instanceof Konva.Group)) continue;
            const found = layer.find(selector);
            if (found.length === 0) continue;
            for (let j = 0; j < found.length; j++) {
                const node = found[j];
                if (!(node instanceof Konva.Shape))
                    throw new Error(`Unexpected type, should be Konva.Shape, got '${typeof node}'`);
                rtv.push(createShape(node));
            }
        }
        return rtv;
    };

    public toDataURL(): string {
        throw new Error(`${typeof this}.toDataURL not implemented`);
    }

    public get viewSize(): Size {
        return {
            width: this.viewWidth,
            height: this.viewHeight,
        }
    }
    public set viewSize(size: Size) {
        this.viewWidth = size.width;
        this.viewHeight = size.height;
    }

    public get viewHeight(): number {
        return this.view_height
    }
    public set viewHeight(height: number) {
        this.render.height(height);
        this.backgroundCVS.viewHeight = height;
        this.view_height = height;
        this.view_changed_handler();
    }

    public get viewWidth(): number {
        return this.view_width;
    }
    public set viewWidth(width: number) {
        this.render.width(width)
        this.backgroundCVS.viewWidth = width;
        this.view_width = width;
        this.view_changed_handler();
    }

};
