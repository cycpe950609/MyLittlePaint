/**
 * Created : 2026/03/22
 * Author  : Ting Fang, Tsai
 * About:
 *  BaseClass of Canvas  
 */

import Konva from "konva";
import { BackgroundCanvas } from "./background";
import { INTERNAL_LAYER, type Layer } from "./layer";
import type { ShapeBase } from "./shape";
import type { Point, Size } from "./utils";
import { ViewManager } from "./view";
import type { ImageConfig } from "konva/lib/Node";

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

    constructor() {
        this.backgroundCVS = new BackgroundCanvas(48);
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
        let rtv: ShapeBase<any, any>[] = []
        // TODO: find `id` iteratively through all Layers
        return rtv;
    };
    public toDataURL(): string {
        const cvs = this.render.clone()
        cvs.getLayers().map((layer: Konva.Layer) => layer.rotation(0).position({ x: 0, y: 0 }))
        const rect = cvs.getClientRect({ skipTransform: false });
        const cfg: ImageConfig = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            imageSmoothingEnabled: true,
        };
        return this.render.toDataURL(cfg);
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
    }

    public get viewWidth(): number {
        return this.view_width;
    }
    public set viewWidth(width: number) {
        this.render.width(width)
        this.backgroundCVS.viewWidth = width;
        this.view_width = width;
    }

};

